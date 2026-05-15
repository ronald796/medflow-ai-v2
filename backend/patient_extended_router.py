"""
MedFlow AI — Router Paciente Expandido (Fase A)
Endpoints para relaciones clínicas del modelo urológico expandido.
Backward-compatible: endpoints legacy en main.py siguen funcionando.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query

from patient_schemas import (
    PacienteCreate, PacienteUpdate,
    ComorbidityCreate, ComorbidityOut,
    MedicationCreate, MedicationOut,
    FamilyHistoryCreate, FamilyHistoryOut,
    DiagnosisCreate, DiagnosisOut, DiagnosisUpdate,
    LutsSymptomCreate, LutsSymptomOut,
    calculate_age, calculate_bmi, has_prostate_cancer_family, get_primary_diagnosis,
)

router = APIRouter(prefix="/api/v1", tags=["Pacientes Expandidos"])

# ── Helpers ───────────────────────────────────────────────────────────────────

def _now() -> str:
    return datetime.utcnow().isoformat()


def _row(r: Any) -> Dict:
    return dict(r) if not isinstance(r, dict) else r


def _check_patient(patient_id: str, conn) -> None:
    row = conn.execute("SELECT id FROM pacientes WHERE id = ?", (patient_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail=f"Paciente {patient_id} no encontrado")


def _load_relations(patient_id: str, conn) -> Dict:
    comorbidities = [_row(r) for r in conn.execute(
        "SELECT * FROM patient_comorbidities WHERE patient_id = ? ORDER BY created_at",
        (patient_id,),
    ).fetchall()]
    medications = [_row(r) for r in conn.execute(
        "SELECT * FROM patient_medications WHERE patient_id = ? ORDER BY created_at",
        (patient_id,),
    ).fetchall()]
    family_history = [_row(r) for r in conn.execute(
        "SELECT * FROM patient_family_history WHERE patient_id = ? ORDER BY created_at",
        (patient_id,),
    ).fetchall()]
    diagnoses = [_row(r) for r in conn.execute(
        "SELECT * FROM patient_diagnoses WHERE patient_id = ? ORDER BY is_primary DESC, created_at",
        (patient_id,),
    ).fetchall()]
    luts_symptoms = [_row(r) for r in conn.execute(
        "SELECT * FROM patient_luts_symptoms WHERE patient_id = ? ORDER BY created_at",
        (patient_id,),
    ).fetchall()]
    return {
        "comorbidities":  comorbidities,
        "medications":    medications,
        "family_history": family_history,
        "diagnoses":      diagnoses,
        "luts_symptoms":  luts_symptoms,
    }


def _build_response(patient_row: Dict, relations: Dict) -> Dict:
    """Construye la respuesta completa con campos calculados."""
    p = dict(patient_row)
    age_from_dob = calculate_age(p.get("fecha_nacimiento"))
    p["edad_calculada"] = age_from_dob if age_from_dob is not None else p.get("edad")
    p["imc"] = calculate_bmi(p.get("weight_kg"), p.get("height_cm"))
    p["has_prostate_cancer_family_history"] = has_prostate_cancer_family(relations["family_history"])
    p["diagnostico_primario"] = get_primary_diagnosis(relations["diagnoses"]) or p.get("diagnostico")
    p.update(relations)
    return p


def _insert_relations(patient_id: str, body: PacienteCreate, conn) -> None:
    """Inserta todas las relaciones anidadas de un PacienteCreate."""
    import uuid as _uuid
    now = _now()

    for c in body.comorbidities:
        conn.execute(
            "INSERT INTO patient_comorbidities (id, patient_id, code, created_at) VALUES (?,?,?,?)",
            (str(_uuid.uuid4()), patient_id, c.code, now),
        )
    for m in body.medications:
        conn.execute(
            "INSERT INTO patient_medications (id, patient_id, name, dose, frequency, active, created_at) VALUES (?,?,?,?,?,?,?)",
            (str(_uuid.uuid4()), patient_id, m.name, m.dose, m.frequency, int(m.active), now),
        )
    for fh in body.family_history:
        conn.execute(
            "INSERT INTO patient_family_history (id, patient_id, relationship, pathology, pathology_notes, diagnosis_age, status, created_at) VALUES (?,?,?,?,?,?,?,?)",
            (str(_uuid.uuid4()), patient_id, fh.relationship, fh.pathology, fh.pathology_notes, fh.diagnosis_age, fh.status, now),
        )
    for d in body.diagnoses:
        conn.execute(
            "INSERT INTO patient_diagnoses (id, patient_id, code, is_primary, notes, icd10_code, created_at) VALUES (?,?,?,?,?,?,?)",
            (str(_uuid.uuid4()), patient_id, d.code, int(d.is_primary), d.notes, d.icd10_code, now),
        )
    for ls in body.luts_symptoms:
        conn.execute(
            "INSERT INTO patient_luts_symptoms (id, patient_id, symptom, severity, nocturia_times, active, created_at) VALUES (?,?,?,?,?,?,?)",
            (str(_uuid.uuid4()), patient_id, ls.symptom, ls.severity, ls.nocturia_times, int(ls.active), now),
        )


# ── Endpoint: Crear paciente con schema expandido ────────────────────────────
# (Coexiste con POST /api/v1/pacientes en main.py; ambos aceptan ambos schemas)

@router.post("/pacientes/expanded", status_code=201)
async def create_patient_expanded(body: PacienteCreate):
    """
    Crea paciente con el schema expandido (Fase A).
    Backward-compatible: también acepta el schema legacy.
    """
    from main import get_db
    import uuid as _uuid

    pid = str(_uuid.uuid4())
    now = _now()

    # Sincronización backward-compat:
    # Si hay diagnoses con is_primary → guardar en campo legacy "diagnostico"
    diagnostico_legacy = (
        body.diagnostico
        or get_primary_diagnosis([d.model_dump() for d in body.diagnoses])
    )
    # Si hay family_history con PROSTATE_CANCER → sync campo legacy "antecedentes_ca"
    antecedentes_ca = body.antecedentes_ca
    if any(fh.pathology == "PROSTATE_CANCER" for fh in body.family_history):
        antecedentes_ca = "padre"  # proxy del campo legacy

    with get_db() as conn:
        conn.execute(
            """INSERT INTO pacientes
               (id, nombre, cedula, edad, fecha_nacimiento, telefono, email,
                psa_total, psa_libre, indice_psa, volumen_prostatico, ipss,
                antecedentes_ca, motivo_consulta, diagnostico,
                hipertension, diabetes, cirugia_previa, notas, fecha_registro,
                sex, marital_status, occupation, blood_type,
                alternative_phone, address, insurance_company, insurance_policy,
                emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
                smoking_status, smoking_pack_years, alcohol_consumption,
                previous_surgeries, allergies, no_drug_allergies,
                chief_complaint, treatment_plan, next_appointment_date,
                bp_systolic, bp_diastolic, heart_rate, weight_kg, height_cm,
                dre_performed, dre_prostate_size, dre_consistency, dre_nodules,
                dre_nodule_location, dre_painful, dre_notes, testosterone_total)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (
                pid, body.nombre, body.cedula, body.resolved_age, body.fecha_nacimiento,
                body.telefono, body.email, body.psa_total, body.psa_libre,
                None, body.volumen_prostatico, body.ipss,
                antecedentes_ca, body.effective_chief_complaint, diagnostico_legacy,
                int(body.hipertension), int(body.diabetes), int(body.cirugia_previa),
                body.notas, now,
                body.sex, body.marital_status, body.occupation, body.blood_type,
                body.alternative_phone, body.address, body.insurance_company, body.insurance_policy,
                body.emergency_contact_name, body.emergency_contact_phone, body.emergency_contact_relationship,
                body.smoking_status, body.smoking_pack_years, body.alcohol_consumption,
                body.previous_surgeries, body.allergies, int(body.no_drug_allergies),
                body.chief_complaint, body.treatment_plan, body.next_appointment_date,
                body.bp_systolic, body.bp_diastolic, body.heart_rate, body.weight_kg, body.height_cm,
                int(body.dre_performed), body.dre_prostate_size, body.dre_consistency,
                (None if body.dre_nodules is None else int(body.dre_nodules)),
                body.dre_nodule_location,
                (None if body.dre_painful is None else int(body.dre_painful)),
                body.dre_notes, body.testosterone_total,
            ),
        )
        _insert_relations(pid, body, conn)
        row = conn.execute("SELECT * FROM pacientes WHERE id = ?", (pid,)).fetchone()
        relations = _load_relations(pid, conn)

    return {"status": "success", "id": pid, **_build_response(dict(row), relations)}


# ── Endpoint: GET paciente expandido ─────────────────────────────────────────

@router.get("/pacientes/{patient_id}/expanded")
async def get_patient_expanded(patient_id: str):
    """
    Retorna el paciente con todas sus relaciones y campos calculados.
    Complementa el GET /api/v1/pacientes/{id} legacy.
    """
    from main import get_db

    with get_db() as conn:
        _check_patient(patient_id, conn)
        row = conn.execute("SELECT * FROM pacientes WHERE id = ?", (patient_id,)).fetchone()
        relations = _load_relations(patient_id, conn)

    return _build_response(dict(row), relations)


# ── Endpoint: PUT paciente (update parcial) ───────────────────────────────────

@router.put("/pacientes/{patient_id}")
async def update_patient(patient_id: str, body: PacienteUpdate):
    """PATCH semántico: actualiza solo los campos enviados."""
    from main import get_db
    import uuid as _uuid

    with get_db() as conn:
        _check_patient(patient_id, conn)
        current = dict(conn.execute("SELECT * FROM pacientes WHERE id = ?", (patient_id,)).fetchone())

        # Construir SET dinámico — solo campos no-None del body
        updates: Dict = {}
        scalar_fields = [
            "nombre", "cedula", "edad", "fecha_nacimiento", "telefono", "email",
            "sex", "marital_status", "occupation", "blood_type",
            "alternative_phone", "address", "insurance_company", "insurance_policy",
            "emergency_contact_name", "emergency_contact_phone", "emergency_contact_relationship",
            "smoking_status", "smoking_pack_years", "alcohol_consumption",
            "previous_surgeries", "allergies", "chief_complaint",
            "treatment_plan", "next_appointment_date",
            "bp_systolic", "bp_diastolic", "heart_rate", "weight_kg", "height_cm",
            "dre_prostate_size", "dre_consistency", "dre_nodule_location", "dre_notes",
            "testosterone_total", "psa_total", "psa_libre", "volumen_prostatico",
            "ipss", "diagnostico", "notas",
        ]
        bool_fields = [
            ("no_drug_allergies", "no_drug_allergies"),
            ("dre_performed", "dre_performed"),
            ("hipertension", "hipertension"),
            ("diabetes", "diabetes"),
            ("cirugia_previa", "cirugia_previa"),
        ]

        for field in scalar_fields:
            val = getattr(body, field, None)
            if val is not None:
                updates[field] = val

        for py_field, db_field in bool_fields:
            val = getattr(body, py_field, None)
            if val is not None:
                updates[db_field] = int(val)

        if body.dre_nodules is not None:
            updates["dre_nodules"] = int(body.dre_nodules)
        if body.dre_painful is not None:
            updates["dre_painful"] = int(body.dre_painful)

        # Sync chief_complaint ↔ motivo_consulta
        if body.motivo_consulta and "chief_complaint" not in updates:
            updates["chief_complaint"] = body.motivo_consulta

        if updates:
            set_clause = ", ".join(f"{k} = ?" for k in updates)
            conn.execute(
                f"UPDATE pacientes SET {set_clause} WHERE id = ?",
                (*updates.values(), patient_id),
            )

        # Actualizar arrays de relaciones (si vienen → replace)
        now = _now()
        if body.comorbidities is not None:
            conn.execute("DELETE FROM patient_comorbidities WHERE patient_id = ?", (patient_id,))
            for c in body.comorbidities:
                conn.execute("INSERT INTO patient_comorbidities (id, patient_id, code, created_at) VALUES (?,?,?,?)",
                             (str(_uuid.uuid4()), patient_id, c.code, now))

        if body.medications is not None:
            conn.execute("DELETE FROM patient_medications WHERE patient_id = ?", (patient_id,))
            for m in body.medications:
                conn.execute("INSERT INTO patient_medications (id, patient_id, name, dose, frequency, active, created_at) VALUES (?,?,?,?,?,?,?)",
                             (str(_uuid.uuid4()), patient_id, m.name, m.dose, m.frequency, int(m.active), now))

        if body.family_history is not None:
            conn.execute("DELETE FROM patient_family_history WHERE patient_id = ?", (patient_id,))
            for fh in body.family_history:
                conn.execute("INSERT INTO patient_family_history (id, patient_id, relationship, pathology, pathology_notes, diagnosis_age, status, created_at) VALUES (?,?,?,?,?,?,?,?)",
                             (str(_uuid.uuid4()), patient_id, fh.relationship, fh.pathology, fh.pathology_notes, fh.diagnosis_age, fh.status, now))

        if body.diagnoses is not None:
            conn.execute("DELETE FROM patient_diagnoses WHERE patient_id = ?", (patient_id,))
            for d in body.diagnoses:
                conn.execute("INSERT INTO patient_diagnoses (id, patient_id, code, is_primary, notes, icd10_code, created_at) VALUES (?,?,?,?,?,?,?)",
                             (str(_uuid.uuid4()), patient_id, d.code, int(d.is_primary), d.notes, d.icd10_code, now))

        if body.luts_symptoms is not None:
            conn.execute("DELETE FROM patient_luts_symptoms WHERE patient_id = ?", (patient_id,))
            for ls in body.luts_symptoms:
                conn.execute("INSERT INTO patient_luts_symptoms (id, patient_id, symptom, severity, nocturia_times, active, created_at) VALUES (?,?,?,?,?,?,?)",
                             (str(_uuid.uuid4()), patient_id, ls.symptom, ls.severity, ls.nocturia_times, int(ls.active), now))

        row = conn.execute("SELECT * FROM pacientes WHERE id = ?", (patient_id,)).fetchone()
        relations = _load_relations(patient_id, conn)

    return _build_response(dict(row), relations)


# ═══════════════════════════════════════════════════════════════════════════════
#  ENDPOINTS GRANULARES DE RELACIONES
# ═══════════════════════════════════════════════════════════════════════════════

# ── Comorbilidades ────────────────────────────────────────────────────────────

@router.post("/pacientes/{patient_id}/comorbidities", status_code=201)
async def add_comorbidity(patient_id: str, body: ComorbidityCreate):
    from main import get_db
    import uuid as _uuid
    cid = str(_uuid.uuid4())
    with get_db() as conn:
        _check_patient(patient_id, conn)
        conn.execute("INSERT INTO patient_comorbidities (id, patient_id, code, created_at) VALUES (?,?,?,?)",
                     (cid, patient_id, body.code, _now()))
    return {"id": cid, "patient_id": patient_id, "code": body.code}


@router.delete("/pacientes/{patient_id}/comorbidities/{cid}", status_code=200)
async def delete_comorbidity(patient_id: str, cid: str):
    from main import get_db
    with get_db() as conn:
        _check_patient(patient_id, conn)
        result = conn.execute("DELETE FROM patient_comorbidities WHERE id = ? AND patient_id = ?", (cid, patient_id))
        if hasattr(result, "rowcount") and result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Comorbilidad no encontrada")
    return {"status": "deleted", "id": cid}


# ── Medicamentos ──────────────────────────────────────────────────────────────

@router.post("/pacientes/{patient_id}/medications", status_code=201)
async def add_medication(patient_id: str, body: MedicationCreate):
    from main import get_db
    import uuid as _uuid
    mid = str(_uuid.uuid4())
    with get_db() as conn:
        _check_patient(patient_id, conn)
        conn.execute("INSERT INTO patient_medications (id, patient_id, name, dose, frequency, active, created_at) VALUES (?,?,?,?,?,?,?)",
                     (mid, patient_id, body.name, body.dose, body.frequency, int(body.active), _now()))
    return {"id": mid, "patient_id": patient_id, **body.model_dump()}


@router.delete("/pacientes/{patient_id}/medications/{mid}", status_code=200)
async def delete_medication(patient_id: str, mid: str):
    from main import get_db
    with get_db() as conn:
        _check_patient(patient_id, conn)
        conn.execute("DELETE FROM patient_medications WHERE id = ? AND patient_id = ?", (mid, patient_id))
    return {"status": "deleted", "id": mid}


# ── Historia familiar ─────────────────────────────────────────────────────────

@router.post("/pacientes/{patient_id}/family-history", status_code=201)
async def add_family_history(patient_id: str, body: FamilyHistoryCreate):
    from main import get_db
    import uuid as _uuid
    fid = str(_uuid.uuid4())
    with get_db() as conn:
        _check_patient(patient_id, conn)
        conn.execute(
            "INSERT INTO patient_family_history (id, patient_id, relationship, pathology, pathology_notes, diagnosis_age, status, created_at) VALUES (?,?,?,?,?,?,?,?)",
            (fid, patient_id, body.relationship, body.pathology, body.pathology_notes, body.diagnosis_age, body.status, _now()),
        )
        # Sync campo legacy si es cáncer de próstata
        if body.pathology == "PROSTATE_CANCER":
            conn.execute("UPDATE pacientes SET antecedentes_ca = 'padre' WHERE id = ? AND antecedentes_ca = 'no'", (patient_id,))
    return {"id": fid, "patient_id": patient_id, **body.model_dump()}


@router.delete("/pacientes/{patient_id}/family-history/{fid}", status_code=200)
async def delete_family_history(patient_id: str, fid: str):
    from main import get_db
    with get_db() as conn:
        _check_patient(patient_id, conn)
        conn.execute("DELETE FROM patient_family_history WHERE id = ? AND patient_id = ?", (fid, patient_id))
    return {"status": "deleted", "id": fid}


# ── Diagnósticos ──────────────────────────────────────────────────────────────

@router.post("/pacientes/{patient_id}/diagnoses", status_code=201)
async def add_diagnosis(patient_id: str, body: DiagnosisCreate):
    from main import get_db
    import uuid as _uuid
    did = str(_uuid.uuid4())
    with get_db() as conn:
        _check_patient(patient_id, conn)
        # Solo uno puede ser primario → desmarcar los anteriores
        if body.is_primary:
            conn.execute("UPDATE patient_diagnoses SET is_primary = 0 WHERE patient_id = ?", (patient_id,))
            conn.execute("UPDATE pacientes SET diagnostico = ? WHERE id = ?", (body.code, patient_id))
        conn.execute(
            "INSERT INTO patient_diagnoses (id, patient_id, code, is_primary, notes, icd10_code, created_at) VALUES (?,?,?,?,?,?,?)",
            (did, patient_id, body.code, int(body.is_primary), body.notes, body.icd10_code, _now()),
        )
    return {"id": did, "patient_id": patient_id, **body.model_dump()}


@router.put("/pacientes/{patient_id}/diagnoses/{did}", status_code=200)
async def update_diagnosis(patient_id: str, did: str, body: DiagnosisUpdate):
    from main import get_db
    with get_db() as conn:
        _check_patient(patient_id, conn)
        if body.is_primary is True:
            conn.execute("UPDATE patient_diagnoses SET is_primary = 0 WHERE patient_id = ?", (patient_id,))
            row = conn.execute("SELECT code FROM patient_diagnoses WHERE id = ?", (did,)).fetchone()
            if row:
                conn.execute("UPDATE pacientes SET diagnostico = ? WHERE id = ?", (dict(row)["code"], patient_id))
        updates: Dict = {}
        if body.is_primary is not None:
            updates["is_primary"] = int(body.is_primary)
        if body.notes is not None:
            updates["notes"] = body.notes
        if updates:
            set_clause = ", ".join(f"{k} = ?" for k in updates)
            conn.execute(f"UPDATE patient_diagnoses SET {set_clause} WHERE id = ? AND patient_id = ?",
                         (*updates.values(), did, patient_id))
    return {"status": "updated", "id": did}


@router.delete("/pacientes/{patient_id}/diagnoses/{did}", status_code=200)
async def delete_diagnosis(patient_id: str, did: str):
    from main import get_db
    with get_db() as conn:
        _check_patient(patient_id, conn)
        conn.execute("DELETE FROM patient_diagnoses WHERE id = ? AND patient_id = ?", (did, patient_id))
    return {"status": "deleted", "id": did}


# ── Síntomas LUTS ─────────────────────────────────────────────────────────────

@router.post("/pacientes/{patient_id}/luts-symptoms", status_code=201)
async def add_luts_symptom(patient_id: str, body: LutsSymptomCreate):
    from main import get_db
    import uuid as _uuid
    sid = str(_uuid.uuid4())
    with get_db() as conn:
        _check_patient(patient_id, conn)
        conn.execute(
            "INSERT INTO patient_luts_symptoms (id, patient_id, symptom, severity, nocturia_times, active, created_at) VALUES (?,?,?,?,?,?,?)",
            (sid, patient_id, body.symptom, body.severity, body.nocturia_times, int(body.active), _now()),
        )
    return {"id": sid, "patient_id": patient_id, **body.model_dump()}


@router.delete("/pacientes/{patient_id}/luts-symptoms/{sid}", status_code=200)
async def delete_luts_symptom(patient_id: str, sid: str):
    from main import get_db
    with get_db() as conn:
        _check_patient(patient_id, conn)
        conn.execute("DELETE FROM patient_luts_symptoms WHERE id = ? AND patient_id = ?", (sid, patient_id))
    return {"status": "deleted", "id": sid}
