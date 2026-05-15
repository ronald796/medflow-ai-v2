"""
MedFlow AI — Servicio de Cálculos Clínicos de PSA
Basado en guías EAU 2025, AUA 2023 y literatura validada.

Fórmulas de referencia:
- PSA Velocity: Carter et al., JNCI 1992
- PSA Doubling Time: Pound et al., JAMA 1999 (regresión log-lineal)
- Biochemical recurrence: Roach criteria (post-RT), AUA 2007 (post-RP)
"""
from __future__ import annotations

import math
from datetime import date
from typing import Any, Dict, List, Optional

# ── Tipos de datos para los cálculos ─────────────────────────────────────────
# Se usan dicts genéricos para no acoplar al ORM o driver de BD.
# Clave esperada: "measurement_date" (str YYYY-MM-DD) y "psa_total" (float).

MeasurementDict = Dict[str, Any]


# ── Helpers de fecha ──────────────────────────────────────────────────────────

def _to_date(d: str | date) -> date:
    if isinstance(d, date):
        return d
    return date.fromisoformat(str(d)[:10])


def _years_between(d1: str | date, d2: str | date) -> float:
    return (_to_date(str(d2)) - _to_date(str(d1))).days / 365.25


def _months_between(d1: str | date, d2: str | date) -> float:
    return (_to_date(str(d2)) - _to_date(str(d1))).days / 30.4375


def _sorted_active(measurements: List[MeasurementDict]) -> List[MeasurementDict]:
    """Filtra soft-deleted y ordena por fecha ascendente."""
    return sorted(
        [m for m in measurements if not m.get("deleted_at")],
        key=lambda m: str(m["measurement_date"]),
    )


# ── Regresión lineal simple ───────────────────────────────────────────────────

def _linear_slope(x: List[float], y: List[float]) -> Optional[float]:
    """Pendiente de regresión OLS. Retorna None si no hay varianza en x."""
    n = len(x)
    if n < 2:
        return None
    x_mean = sum(x) / n
    y_mean = sum(y) / n
    num = sum((x[i] - x_mean) * (y[i] - y_mean) for i in range(n))
    den = sum((x[i] - x_mean) ** 2 for i in range(n))
    if den == 0:
        return None
    return num / den


# ── Funciones públicas ────────────────────────────────────────────────────────

def calculate_psa_velocity(measurements: List[MeasurementDict]) -> Optional[float]:
    """
    Velocidad de PSA en ng/mL/año.

    Método: regresión lineal (PSA vs tiempo) sobre todas las mediciones.
    Requiere ≥ 3 mediciones con ≥ 18 meses entre primera y última.
    EAU 2025: valor preocupante si > 0.75 ng/mL/año (PSA < 4 ng/mL).

    Caso de prueba: PSA 2.0 (ene-23) → 3.0 (ene-24) → 4.5 (ene-25)
    → velocity = 1.25 ng/mL/año
    """
    m = _sorted_active(measurements)
    if len(m) < 3:
        return None

    first_date = str(m[0]["measurement_date"])
    last_date  = str(m[-1]["measurement_date"])

    if _months_between(first_date, last_date) < 18:
        return None

    x = [_years_between(first_date, str(mi["measurement_date"])) for mi in m]
    y = [float(mi["psa_total"]) for mi in m]

    slope = _linear_slope(x, y)
    return round(slope, 3) if slope is not None else None


def calculate_doubling_time(measurements: List[MeasurementDict]) -> Optional[float]:
    """
    Tiempo de duplicación del PSA (PSADT) en meses.

    Método: regresión lineal sobre log(PSA) vs tiempo en meses.
    PDT = ln(2) / pendiente_mensual

    Requiere ≥ 2 mediciones con PSA > 0.
    Retorna None si la tendencia es decreciente (pendiente ≤ 0).

    Caso de prueba: 2.0 (ene-23) → 3.0 (ene-24) → 4.5 (ene-25) → ≈ 20.5 meses
    Nota: la formulación log-lineal da 20.5 meses para este dataset.
    """
    m = _sorted_active(measurements)
    valid = [mi for mi in m if float(mi["psa_total"]) > 0]

    if len(valid) < 2:
        return None

    first_date = str(valid[0]["measurement_date"])
    x = [_months_between(first_date, str(mi["measurement_date"])) for mi in valid]
    log_y = [math.log(float(mi["psa_total"])) for mi in valid]

    slope = _linear_slope(x, log_y)
    if slope is None or slope <= 0:
        return None

    return round(math.log(2) / slope, 1)


def get_psa_nadir(
    measurements: List[MeasurementDict],
    post_treatment_date: Optional[str] = None,
) -> Optional[float]:
    """
    Valor nadir (mínimo) del PSA post-tratamiento.
    Si post_treatment_date es None, calcula sobre todas las mediciones.

    Relevante para: POST_PROSTATECTOMY, POST_RADIOTHERAPY, POST_HORMONOTHERAPY.
    """
    m = _sorted_active(measurements)
    if post_treatment_date:
        m = [mi for mi in m if str(mi["measurement_date"]) > post_treatment_date]
    if not m:
        return None
    return min(float(mi["psa_total"]) for mi in m)


def detect_biochemical_recurrence(
    measurements: List[MeasurementDict],
    clinical_context: str = "POST_PROSTATECTOMY",
) -> Optional[bool]:
    """
    Recurrencia bioquímica según criterio según contexto clínico.

    POST_PROSTATECTOMY: PSA ≥ 0.2 ng/mL en ≥ 2 mediciones consecutivas (AUA 2007).
    POST_RADIOTHERAPY:  PSA ≥ nadir + 2.0 ng/mL (criterio Phoenix/ASTRO).
    Otros contextos: None (no aplica).

    Referencia:
    - Cookson et al., J Urol 2007;177:540-545
    - Roach et al., Int J Radiat Oncol Biol Phys 2006;65:965-974
    """
    m = _sorted_active(measurements)
    if len(m) < 2:
        return None

    if clinical_context == "POST_PROSTATECTOMY":
        threshold = 0.2
        consecutive = 0
        for mi in m:
            if float(mi["psa_total"]) >= threshold:
                consecutive += 1
                if consecutive >= 2:
                    return True
            else:
                consecutive = 0
        return False

    if clinical_context == "POST_RADIOTHERAPY":
        nadir = min(float(mi["psa_total"]) for mi in m)
        latest = float(m[-1]["psa_total"])
        return latest >= nadir + 2.0

    return None


def classify_trend(measurements: List[MeasurementDict]) -> str:
    """
    Clasificación de la tendencia del PSA.

    INCREASING   : pendiente de regresión > +0.1 ng/mL/año
    DECREASING   : pendiente de regresión < -0.1 ng/mL/año
    STABLE       : pendiente entre -0.1 y +0.1
    INSUFFICIENT_DATA: < 2 mediciones

    El umbral ±0.1 evita clasificar variaciones analíticas normales como tendencias.
    """
    m = _sorted_active(measurements)
    if len(m) < 2:
        return "INSUFFICIENT_DATA"

    first_date = str(m[0]["measurement_date"])
    x = [_years_between(first_date, str(mi["measurement_date"])) for mi in m]
    y = [float(mi["psa_total"]) for mi in m]

    slope = _linear_slope(x, y)
    if slope is None:
        return "STABLE"

    if slope > 0.1:
        return "INCREASING"
    if slope < -0.1:
        return "DECREASING"
    return "STABLE"


def compute_all_metrics(
    measurements: List[MeasurementDict],
    clinical_context: str = "FOLLOW_UP",
    post_treatment_date: Optional[str] = None,
) -> dict:
    """
    Calcula todas las métricas derivadas de la serie PSA de un paciente.
    Retorna un dict listo para serializar a JSON.
    """
    active = _sorted_active(measurements)
    latest = active[-1] if active else None

    return {
        "count":                    len(active),
        "latest_psa":               float(latest["psa_total"]) if latest else None,
        "latest_date":              str(latest["measurement_date"]) if latest else None,
        "psa_velocity":             calculate_psa_velocity(measurements),
        "psa_doubling_time":        calculate_doubling_time(measurements),
        "psa_nadir":                get_psa_nadir(measurements, post_treatment_date),
        "trend":                    classify_trend(measurements),
        "biochemical_recurrence":   detect_biochemical_recurrence(measurements, clinical_context),
    }
