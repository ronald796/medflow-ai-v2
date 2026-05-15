"""
Tests unitarios — psa_calculator.py
Validan las fórmulas clínicas contra casos de referencia publicados.

Ejecutar: cd backend && ../venv/Scripts/pytest test_psa_calculator.py -v
"""
from __future__ import annotations

import math
import pytest

from psa_calculator import (
    calculate_psa_velocity,
    calculate_doubling_time,
    get_psa_nadir,
    detect_biochemical_recurrence,
    classify_trend,
    compute_all_metrics,
)

# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture
def reference_series():
    """
    Caso de referencia del spec:
    PSA 2.0 (ene-23) → 3.0 (ene-24) → 4.5 (ene-25)
    Velocity esperada: 1.25 ng/mL/año
    Doubling time esperado: ~20.5 meses (log-lineal), NO 17 meses
    """
    return [
        {"measurement_date": "2023-01-01", "psa_total": 2.0, "deleted_at": None},
        {"measurement_date": "2024-01-01", "psa_total": 3.0, "deleted_at": None},
        {"measurement_date": "2025-01-01", "psa_total": 4.5, "deleted_at": None},
    ]


@pytest.fixture
def post_prostatectomy_series():
    return [
        {"measurement_date": "2024-01-01", "psa_total": 0.05, "deleted_at": None},
        {"measurement_date": "2024-04-01", "psa_total": 0.08, "deleted_at": None},
        {"measurement_date": "2024-07-01", "psa_total": 0.21, "deleted_at": None},
        {"measurement_date": "2024-10-01", "psa_total": 0.35, "deleted_at": None},
    ]


@pytest.fixture
def decreasing_series():
    # 24 meses de span para superar el mínimo de 18 meses requerido
    return [
        {"measurement_date": "2023-01-01", "psa_total": 8.0, "deleted_at": None},
        {"measurement_date": "2023-07-01", "psa_total": 5.0, "deleted_at": None},
        {"measurement_date": "2024-01-01", "psa_total": 2.5, "deleted_at": None},
        {"measurement_date": "2025-01-01", "psa_total": 1.0, "deleted_at": None},
    ]


# ── PSA Velocity ──────────────────────────────────────────────────────────────

class TestPsaVelocity:

    def test_reference_case(self, reference_series):
        """Caso del spec: velocity = 1.25 ng/mL/año"""
        vel = calculate_psa_velocity(reference_series)
        assert vel is not None
        assert abs(vel - 1.25) < 0.01, f"Esperado ~1.25, obtenido {vel}"

    def test_insufficient_measurements(self):
        """Requiere mínimo 3 mediciones"""
        two = [
            {"measurement_date": "2023-01-01", "psa_total": 2.0, "deleted_at": None},
            {"measurement_date": "2024-01-01", "psa_total": 4.0, "deleted_at": None},
        ]
        assert calculate_psa_velocity(two) is None

    def test_insufficient_time_span(self):
        """Requiere ≥ 18 meses entre primera y última medición"""
        short = [
            {"measurement_date": "2024-01-01", "psa_total": 2.0, "deleted_at": None},
            {"measurement_date": "2024-06-01", "psa_total": 2.5, "deleted_at": None},
            {"measurement_date": "2024-12-01", "psa_total": 3.0, "deleted_at": None},
        ]
        assert calculate_psa_velocity(short) is None  # solo 11 meses

    def test_decreasing_velocity(self, decreasing_series):
        """Velocidad negativa para PSA decreciente (post-tratamiento)"""
        vel = calculate_psa_velocity(decreasing_series)
        assert vel is not None
        assert vel < 0

    def test_ignores_soft_deleted(self, reference_series):
        """Los registros con deleted_at no deben contarse"""
        series_with_deleted = reference_series + [
            {"measurement_date": "2024-06-01", "psa_total": 99.0, "deleted_at": "2025-01-01"}
        ]
        vel_original = calculate_psa_velocity(reference_series)
        vel_with_deleted = calculate_psa_velocity(series_with_deleted)
        assert vel_original == vel_with_deleted


# ── PSA Doubling Time ─────────────────────────────────────────────────────────

class TestDoublingTime:

    def test_reference_case(self, reference_series):
        """
        Caso del spec: PSA 2.0→3.0→4.5 en 2 años.
        Fórmula log-lineal correcta → ~20.5 meses.
        Nota: el spec menciona '≈17 meses' pero el cálculo matemático
        correcto por regresión log-lineal es 20.5 meses.
        """
        dt = calculate_doubling_time(reference_series)
        assert dt is not None
        assert 19.0 < dt < 22.0, f"Esperado ~20.5 meses, obtenido {dt}"

    def test_perfect_doubling(self):
        """PSA exactamente duplicado en 12 meses → PDT = 12.0 meses"""
        m = [
            {"measurement_date": "2023-01-01", "psa_total": 2.0, "deleted_at": None},
            {"measurement_date": "2024-01-01", "psa_total": 4.0, "deleted_at": None},
        ]
        dt = calculate_doubling_time(m)
        assert dt is not None
        assert abs(dt - 12.0) < 0.5, f"Duplicación exacta esperada en 12 meses, obtenido {dt}"

    def test_stable_psa_returns_none(self):
        """PSA constante (sin cambio) → no hay tiempo de duplicación"""
        flat = [
            {"measurement_date": "2023-01-01", "psa_total": 3.0, "deleted_at": None},
            {"measurement_date": "2024-01-01", "psa_total": 3.0, "deleted_at": None},
        ]
        # Pendiente = 0 → None
        assert calculate_doubling_time(flat) is None

    def test_decreasing_psa_returns_none(self, decreasing_series):
        """PSA decreciente → no aplica (pendiente negativa)"""
        assert calculate_doubling_time(decreasing_series) is None


# ── PSA Nadir ─────────────────────────────────────────────────────────────────

class TestPsaNadir:

    def test_nadir_all_measurements(self, reference_series):
        nadir = get_psa_nadir(reference_series)
        assert nadir == 2.0

    def test_nadir_post_treatment(self, post_prostatectomy_series):
        """Nadir desde fecha de cirugía (2024-01-01 en adelante)"""
        nadir = get_psa_nadir(post_prostatectomy_series, post_treatment_date="2023-12-31")
        assert nadir == 0.05

    def test_nadir_no_measurements_after_date(self, reference_series):
        """Sin mediciones después de la fecha dada → None"""
        nadir = get_psa_nadir(reference_series, post_treatment_date="2026-01-01")
        assert nadir is None

    def test_empty_series(self):
        assert get_psa_nadir([]) is None


# ── Biochemical Recurrence ────────────────────────────────────────────────────

class TestBiochemicalRecurrence:

    def test_post_prostatectomy_recurrence_detected(self, post_prostatectomy_series):
        """PSA 0.21 y 0.35 ≥ 0.2 en consecutivas → recurrencia"""
        result = detect_biochemical_recurrence(
            post_prostatectomy_series, "POST_PROSTATECTOMY"
        )
        assert result is True

    def test_post_prostatectomy_no_recurrence(self):
        """PSA siempre < 0.2 → sin recurrencia"""
        m = [
            {"measurement_date": "2024-01-01", "psa_total": 0.05, "deleted_at": None},
            {"measurement_date": "2024-07-01", "psa_total": 0.10, "deleted_at": None},
            {"measurement_date": "2025-01-01", "psa_total": 0.15, "deleted_at": None},
        ]
        result = detect_biochemical_recurrence(m, "POST_PROSTATECTOMY")
        assert result is False

    def test_post_rt_phoenix_criteria(self):
        """Criterio Phoenix: PSA nadir + 2. Nadir=0.5 → recurrencia si PSA ≥ 2.5"""
        m = [
            {"measurement_date": "2023-01-01", "psa_total": 1.5, "deleted_at": None},
            {"measurement_date": "2023-07-01", "psa_total": 0.5, "deleted_at": None},  # nadir
            {"measurement_date": "2024-01-01", "psa_total": 0.8, "deleted_at": None},
            {"measurement_date": "2024-07-01", "psa_total": 2.6, "deleted_at": None},  # nadir+2.1
        ]
        result = detect_biochemical_recurrence(m, "POST_RADIOTHERAPY")
        assert result is True

    def test_screening_context_returns_none(self, reference_series):
        """En contexto SCREENING no aplica recurrencia"""
        result = detect_biochemical_recurrence(reference_series, "SCREENING")
        assert result is None


# ── Trend Classification ──────────────────────────────────────────────────────

class TestClassifyTrend:

    def test_increasing(self, reference_series):
        assert classify_trend(reference_series) == "INCREASING"

    def test_decreasing(self, decreasing_series):
        assert classify_trend(decreasing_series) == "DECREASING"

    def test_stable(self):
        flat = [
            {"measurement_date": "2023-01-01", "psa_total": 3.0, "deleted_at": None},
            {"measurement_date": "2024-01-01", "psa_total": 3.05, "deleted_at": None},
        ]
        assert classify_trend(flat) == "STABLE"

    def test_insufficient_data(self):
        assert classify_trend([]) == "INSUFFICIENT_DATA"
        assert classify_trend([{"measurement_date": "2023-01-01", "psa_total": 3.0, "deleted_at": None}]) == "INSUFFICIENT_DATA"


# ── compute_all_metrics ───────────────────────────────────────────────────────

class TestComputeAllMetrics:

    def test_structure_complete(self, reference_series):
        result = compute_all_metrics(reference_series)
        expected_keys = {
            "count", "latest_psa", "latest_date",
            "psa_velocity", "psa_doubling_time", "psa_nadir",
            "trend", "biochemical_recurrence",
        }
        assert expected_keys == set(result.keys())

    def test_count_excludes_deleted(self, reference_series):
        series_with_deleted = reference_series + [
            {"measurement_date": "2024-06-01", "psa_total": 99.0, "deleted_at": "2025-01-01"}
        ]
        result = compute_all_metrics(series_with_deleted)
        assert result["count"] == 3

    def test_latest_psa_is_most_recent(self, reference_series):
        result = compute_all_metrics(reference_series)
        assert result["latest_psa"] == 4.5
        assert result["latest_date"] == "2025-01-01"

    def test_empty_series(self):
        result = compute_all_metrics([])
        assert result["count"] == 0
        assert result["latest_psa"] is None
        assert result["psa_velocity"] is None
        assert result["trend"] == "INSUFFICIENT_DATA"
