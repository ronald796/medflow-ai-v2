"""
MedFlow AI — Router PSA Longitudinal
Endpoints para historial de mediciones de PSA por paciente.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, field_validator

from psa_calculator import compute_all_metrics

# Importación diferida del get_db para no crear dependencia circular con main
import importlib

def _db():
    return importlib.import_module("main").get_db

# ── Constantes clínicas ───────────────────────────────────────────────────────

VALID_CONTEXTS = {
    "SCREENING", "POST_BIOPSY", "POST_RTU", "POST_PROSTATECTOMY",
    "POST_RADIOTHERAPY", "POST_HORMONOTHERAPY", "ACTIVE_SURVEILLANCE", "FOLLOW_UP",
}

router = APIRouter(prefix="/api/v1/pacientes", tags=["PSA Longitudinal"])


# ── Schemas Pydantic v2 ───────────────────────────────────────────────────────

class PSAMeasurementCreate(BaseModel):
    measurement_date: str = Field(..., description="Fecha de extracción (YYYY-MM-DD)")
    psa_total: float = Field(..., gt=0, description="PSA Total en ng/mL")
    psa_free: Optional[float] = Field(None, ge=0)
    prostate_volume: Optional[float] = Field(None, gt=0, description="Volumen prostático en cc")
    lab_name: Optional[str] = Field(None, max_length=100)
    clinical_context: str = Field("FOLLOW_UP")
    notes: Optional[str] = None
    created_by: str = Field("system", max_length=80)

    @field_validator("clinical_context")
    @classmethod
    def valid_context(cls, v: str) -> str:
        if v not in VALID_CONTEXTS:
            raise ValueError(f"clinical_context debe ser uno de: {sorted(VALID_CONTEXTS)}")
        return v

    @field_validator("measurement_date")
    @classmethod
    def valid_date(cls, v: str) -> str:
        try:
            from datetime import date as _date
            _date.fromisoformat(v)
        except ValueError:
            raise ValueError("measurement_date debe ser YYYY-MM-DD")
        return v


class PSAMeasurementUpdate(BaseModel):
    measurement_date: Optional[str] = None
    psa_total: Optional[float] = Field(None, gt=0)
    psa_free: Optional[float] = Field(None, ge=0)
    prostate_volume: Optional[float] = Field(None, gt=0)
    lab_name: Optional[str] = None
    clinical_context: Optional[str] = None
    notes: Optional[str] = None

    @field_validator("clinical_context")
    @classmethod
    def valid_context(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in VALID_CONTEXTS:
            raise ValueError(f"clinical_context inválido: {v}")
        return v


class PSAMetrics(BaseModel):
    count: int
    latest_psa: Optional[float]
    latest_date: Optional[str]
    psa_velocity: Optional[float]
    psa_doubling_time: Optional[float]
    psa_nadir: Optional[float]
    trend: str
    biochemical_recurrence: Optional[bool]


class PSAMeasurementOut(BaseModel):
    id: str
    patient_id: str
    measurement_date: str
    psa_total: float
    psa_free: Optional[float]
    psa_ratio: Optional[float]
    prostate_volume: Optional[float]
    psa_density: Optional[float]
    lab_name: Optional[str]
    clinical_context: str
    notes: Optional[str]
    created_by: str
    created_at: str
    updated_at: str


class PSAHistoryResponse(BaseModel):
    patient_id: str
    measurements: List[PSAMeasurementOut]
    metrics: PSAMetrics


# ── Helpers ───────────────────────────────────────────────────────────────────

def _now() -> str:
    return datetime.utcnow().isoformat()


def _row_to_dict(row: Any) -> Dict:
    return dict(row) if not isinstance(row, dict) else row


def _calc_ratio(psa_total: float, psa_free: Optional[float]) -> Optional[float]:
    if psa_free is None or psa_total <= 0:
        return None
    return round(psa_free / psa_total * 100, 2)


def _calc_density(psa_total: float, prostate_volume: Optional[float]) -> Optional[float]:
    if prostate_volume is None or prostate_volume <= 0:
        return None
    return round(psa_total / prostate_volume, 3)


def _verify_patient_exists(patient_id: str, conn) -> None:
    row = conn.execute(
        "SELECT id FROM pacientes WHERE id = ?", (patient_id,)
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail=f"Paciente {patient_id} no encontrado")


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/{patient_id}/psa", status_code=201)
async def create_psa_measurement(patient_id: str, body: PSAMeasurementCreate):
    """Registra una nueva medición de PSA para el paciente."""
    from main import get_db
    import uuid as _uuid

    psa_ratio   = _calc_ratio(body.psa_total, body.psa_free)
    psa_density = _calc_density(body.psa_total, body.prostate_volume)
    mid = str(_uuid.uuid4())
    now = _now()

    with get_db() as conn:
        _verify_patient_exists(patient_id, conn)

        conn.execute(
            """INSERT INTO psa_measurements
               (id, patient_id, measurement_date, psa_total, psa_free, psa_ratio,
                prostate_volume, psa_density, lab_name, clinical_context,
                notes, created_by, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                mid, patient_id, body.measurement_date,
                body.psa_total, body.psa_free, psa_ratio,
                body.prostate_volume, psa_density, body.lab_name,
                body.clinical_context, body.notes, body.created_by, now, now,
            ),
        )

        # Actualizar caché en tabla pacientes (última medición)
        conn.execute(
            """UPDATE pacientes
               SET psa_total = ?, psa_libre = ?, indice_psa = ?, volumen_prostatico = ?
               WHERE id = ?""",
            (
                body.psa_total,
                body.psa_free,
                psa_ratio,
                body.prostate_volume,
                patient_id,
            ),
        )

    return {
        "id":               mid,
        "patient_id":       patient_id,
        "measurement_date": body.measurement_date,
        "psa_total":        body.psa_total,
        "psa_free":         body.psa_free,
        "psa_ratio":        psa_ratio,
        "prostate_volume":  body.prostate_volume,
        "psa_density":      psa_density,
        "lab_name":         body.lab_name,
        "clinical_context": body.clinical_context,
        "notes":            body.notes,
        "created_by":       body.created_by,
        "created_at":       now,
        "updated_at":       now,
    }


@router.get("/{patient_id}/psa", response_model=PSAHistoryResponse)
async def get_psa_history(patient_id: str):
    """
    Historial completo de PSA con métricas clínicas calculadas:
    velocidad, tiempo de duplicación, nadir, tendencia y recurrencia bioquímica.
    """
    from main import get_db

    with get_db() as conn:
        _verify_patient_exists(patient_id, conn)

        rows = conn.execute(
            """SELECT * FROM psa_measurements
               WHERE patient_id = ? AND deleted_at IS NULL
               ORDER BY measurement_date DESC""",
            (patient_id,),
        ).fetchall()

    measurements = [_row_to_dict(r) for r in rows]

    # Detectar el contexto clínico más reciente para las métricas
    latest_context = measurements[0]["clinical_context"] if measurements else "FOLLOW_UP"

    metrics_raw = compute_all_metrics(
        measurements=measurements,
        clinical_context=latest_context,
    )

    return PSAHistoryResponse(
        patient_id=patient_id,
        measurements=[PSAMeasurementOut(**m) for m in measurements],
        metrics=PSAMetrics(**metrics_raw),
    )


@router.get("/{patient_id}/psa/{measurement_id}", response_model=PSAMeasurementOut)
async def get_psa_measurement(patient_id: str, measurement_id: str):
    """Obtiene una medición específica."""
    from main import get_db

    with get_db() as conn:
        _verify_patient_exists(patient_id, conn)
        row = conn.execute(
            """SELECT * FROM psa_measurements
               WHERE id = ? AND patient_id = ? AND deleted_at IS NULL""",
            (measurement_id, patient_id),
        ).fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Medición PSA no encontrada")

    return PSAMeasurementOut(**_row_to_dict(row))


@router.put("/{patient_id}/psa/{measurement_id}", response_model=PSAMeasurementOut)
async def update_psa_measurement(
    patient_id: str, measurement_id: str, body: PSAMeasurementUpdate
):
    """Actualiza campos de una medición existente (con auditoría de updated_at)."""
    from main import get_db

    with get_db() as conn:
        _verify_patient_exists(patient_id, conn)
        row = conn.execute(
            "SELECT * FROM psa_measurements WHERE id = ? AND patient_id = ? AND deleted_at IS NULL",
            (measurement_id, patient_id),
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Medición PSA no encontrada")

        current = _row_to_dict(row)

        # Aplicar solo los campos enviados
        updated = {
            "psa_total":        body.psa_total        if body.psa_total        is not None else current["psa_total"],
            "psa_free":         body.psa_free          if body.psa_free         is not None else current["psa_free"],
            "prostate_volume":  body.prostate_volume   if body.prostate_volume  is not None else current["prostate_volume"],
            "lab_name":         body.lab_name          if body.lab_name         is not None else current["lab_name"],
            "clinical_context": body.clinical_context  if body.clinical_context is not None else current["clinical_context"],
            "notes":            body.notes             if body.notes            is not None else current["notes"],
            "measurement_date": body.measurement_date  if body.measurement_date is not None else current["measurement_date"],
        }

        updated["psa_ratio"]   = _calc_ratio(updated["psa_total"], updated["psa_free"])
        updated["psa_density"] = _calc_density(updated["psa_total"], updated["prostate_volume"])
        updated["updated_at"]  = _now()

        conn.execute(
            """UPDATE psa_measurements
               SET psa_total=?, psa_free=?, psa_ratio=?, prostate_volume=?, psa_density=?,
                   lab_name=?, clinical_context=?, notes=?, measurement_date=?, updated_at=?
               WHERE id = ?""",
            (
                updated["psa_total"], updated["psa_free"], updated["psa_ratio"],
                updated["prostate_volume"], updated["psa_density"],
                updated["lab_name"], updated["clinical_context"], updated["notes"],
                updated["measurement_date"], updated["updated_at"],
                measurement_id,
            ),
        )

    return PSAMeasurementOut(
        id=measurement_id,
        patient_id=patient_id,
        created_by=current["created_by"],
        created_at=current["created_at"],
        **updated,
    )


@router.delete("/{patient_id}/psa/{measurement_id}", status_code=200)
async def delete_psa_measurement(patient_id: str, measurement_id: str):
    """Soft-delete: marca deleted_at sin eliminar el registro."""
    from main import get_db

    with get_db() as conn:
        _verify_patient_exists(patient_id, conn)
        result = conn.execute(
            """UPDATE psa_measurements
               SET deleted_at = ?
               WHERE id = ? AND patient_id = ? AND deleted_at IS NULL""",
            (_now(), measurement_id, patient_id),
        )
        # psycopg2 rowcount works; sqlite3 also supports it
        affected = result.rowcount if hasattr(result, "rowcount") else 1

    if affected == 0:
        raise HTTPException(status_code=404, detail="Medición no encontrada o ya eliminada")

    return {"status": "deleted", "id": measurement_id}
