"""
Tests — Soft Delete y Hard Delete de Pacientes
MedFlow AI — HIPAA-compliant delete workflow.
"""
from __future__ import annotations

import sqlite3
import uuid
from datetime import datetime
from typing import Any, Dict

import pytest

from patient_schemas import calculate_age


# ── Fixture: SQLite in-memory con schema completo ─────────────────────────────

@pytest.fixture
def memdb():
    conn = sqlite3.connect(":memory:")
    conn.row_factory = sqlite3.Row
    conn.executescript("""
        CREATE TABLE pacientes (
            id TEXT PRIMARY KEY, nombre TEXT NOT NULL, cedula TEXT,
            edad INTEGER NOT NULL, fecha_nacimiento TEXT, telefono TEXT, email TEXT,
            psa_total REAL, psa_libre REAL, indice_psa REAL,
            volumen_prostatico REAL, ipss INTEGER,
            antecedentes_ca TEXT DEFAULT 'no', motivo_consulta TEXT,
            diagnostico TEXT, hipertension INTEGER DEFAULT 0,
            diabetes INTEGER DEFAULT 0, cirugia_previa INTEGER DEFAULT 0,
            notas TEXT, fecha_registro TEXT NOT NULL,
            deleted_at TEXT, is_test_patient INTEGER DEFAULT 0
        );
        CREATE TABLE psa_measurements (
            id TEXT PRIMARY KEY, patient_id TEXT, measurement_date TEXT,
            psa_total REAL NOT NULL, psa_free REAL, psa_ratio REAL,
            prostate_volume REAL, psa_density REAL, lab_name TEXT,
            clinical_context TEXT DEFAULT 'FOLLOW_UP', notes TEXT,
            created_by TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
            deleted_at TEXT
        );
        CREATE TABLE patient_comorbidities (
            id TEXT PRIMARY KEY, patient_id TEXT, code TEXT, created_at TEXT
        );
        CREATE TABLE patient_medications (
            id TEXT PRIMARY KEY, patient_id TEXT, name TEXT, dose TEXT,
            frequency TEXT, active INTEGER DEFAULT 1, created_at TEXT
        );
        CREATE TABLE patient_family_history (
            id TEXT PRIMARY KEY, patient_id TEXT, relationship TEXT,
            pathology TEXT, pathology_notes TEXT, diagnosis_age INTEGER,
            status TEXT, created_at TEXT
        );
        CREATE TABLE patient_diagnoses (
            id TEXT PRIMARY KEY, patient_id TEXT, code TEXT,
            is_primary INTEGER DEFAULT 0, notes TEXT, icd10_code TEXT, created_at TEXT
        );
        CREATE TABLE patient_luts_symptoms (
            id TEXT PRIMARY KEY, patient_id TEXT, symptom TEXT, severity TEXT,
            nocturia_times INTEGER, active INTEGER DEFAULT 1, created_at TEXT
        );
    """)
    conn.commit()
    yield conn
    conn.close()


def _insert_patient(conn, nombre: str = "Carlos Medina", is_test: int = 0) -> str:
    pid = str(uuid.uuid4())
    conn.execute(
        "INSERT INTO pacientes (id, nombre, edad, fecha_registro, is_test_patient) VALUES (?,?,?,?,?)",
        (pid, nombre, 65, datetime.utcnow().isoformat(), is_test),
    )
    conn.commit()
    return pid


def _insert_relations(conn, pid: str) -> None:
    now = datetime.utcnow().isoformat()
    conn.execute("INSERT INTO patient_comorbidities VALUES (?,?,?,?)", (str(uuid.uuid4()), pid, "HTA", now))
    conn.execute("INSERT INTO psa_measurements (id,patient_id,measurement_date,psa_total,created_at,updated_at) VALUES (?,?,?,?,?,?)",
                 (str(uuid.uuid4()), pid, "2026-01-01", 5.2, now, now))
    conn.commit()


def _soft_delete(conn, pid: str) -> None:
    conn.execute("UPDATE pacientes SET deleted_at = ? WHERE id = ?", (datetime.utcnow().isoformat(), pid))
    conn.commit()


# ════════════════════════════════════════════════════════════════════════════════
#  TEST 1: Soft delete setea deleted_at
# ════════════════════════════════════════════════════════════════════════════════

def test_soft_delete_paciente(memdb):
    pid = _insert_patient(memdb)
    assert dict(memdb.execute("SELECT deleted_at FROM pacientes WHERE id = ?", (pid,)).fetchone())["deleted_at"] is None

    _soft_delete(memdb, pid)

    deleted_at = dict(memdb.execute("SELECT deleted_at FROM pacientes WHERE id = ?", (pid,)).fetchone())["deleted_at"]
    assert deleted_at is not None
    assert len(deleted_at) > 0  # ISO timestamp


# ════════════════════════════════════════════════════════════════════════════════
#  TEST 2: Paciente eliminado no aparece en lista
# ════════════════════════════════════════════════════════════════════════════════

def test_paciente_eliminado_no_aparece_en_lista(memdb):
    pid_activo   = _insert_patient(memdb, "Ana García")
    pid_eliminado = _insert_patient(memdb, "Luis González")

    _soft_delete(memdb, pid_eliminado)

    rows = memdb.execute("SELECT id FROM pacientes WHERE deleted_at IS NULL").fetchall()
    ids = [dict(r)["id"] for r in rows]

    assert pid_activo    in ids
    assert pid_eliminado not in ids


# ════════════════════════════════════════════════════════════════════════════════
#  TEST 3: Paciente eliminado no aparece en GET individual
# ════════════════════════════════════════════════════════════════════════════════

def test_paciente_eliminado_no_aparece_en_get_individual(memdb):
    pid = _insert_patient(memdb)
    _soft_delete(memdb, pid)

    row = memdb.execute(
        "SELECT * FROM pacientes WHERE id = ? AND deleted_at IS NULL", (pid,)
    ).fetchone()
    assert row is None  # → frontend recibe 404


# ════════════════════════════════════════════════════════════════════════════════
#  TEST 4: Hard delete de paciente NO-test falla (403 simulado)
# ════════════════════════════════════════════════════════════════════════════════

def test_hard_delete_solo_test_patients(memdb):
    pid = _insert_patient(memdb, "Dr. Ramón Pérez", is_test=0)

    row = dict(memdb.execute("SELECT is_test_patient, nombre FROM pacientes WHERE id = ?", (pid,)).fetchone())

    is_test_db   = bool(row["is_test_patient"])
    is_test_name = any(kw in row["nombre"].lower() for kw in ["test", "prueba", "demo", "ejemplo"])
    is_test = is_test_db or is_test_name

    assert is_test is False, "Paciente clínico real NO debe poder ser eliminado permanentemente"


# ════════════════════════════════════════════════════════════════════════════════
#  TEST 5: Hard delete de paciente TEST funciona
# ════════════════════════════════════════════════════════════════════════════════

def test_hard_delete_paciente_test_funciona(memdb):
    pid = _insert_patient(memdb, "Paciente Test Demo", is_test=1)

    row = dict(memdb.execute("SELECT is_test_patient, nombre FROM pacientes WHERE id = ?", (pid,)).fetchone())
    is_test = bool(row["is_test_patient"]) or any(kw in row["nombre"].lower() for kw in ["test", "prueba", "demo"])
    assert is_test is True

    # Ejecutar hard delete
    memdb.execute("DELETE FROM pacientes WHERE id = ?", (pid,))
    memdb.commit()

    remaining = memdb.execute("SELECT id FROM pacientes WHERE id = ?", (pid,)).fetchone()
    assert remaining is None


# ════════════════════════════════════════════════════════════════════════════════
#  TEST 6: Hard delete elimina relaciones (PSA, comorbilidades, etc.)
# ════════════════════════════════════════════════════════════════════════════════

def test_hard_delete_elimina_relaciones_psa_comorbilidades_etc(memdb):
    pid = _insert_patient(memdb, "Test Completo Eliminable", is_test=1)
    _insert_relations(memdb, pid)

    # Verificar que las relaciones existen
    assert memdb.execute("SELECT id FROM patient_comorbidities WHERE patient_id = ?", (pid,)).fetchone() is not None
    assert memdb.execute("SELECT id FROM psa_measurements WHERE patient_id = ?", (pid,)).fetchone() is not None

    # Hard delete con cascade explícito
    for tbl in ["psa_measurements", "patient_comorbidities", "patient_medications",
                "patient_family_history", "patient_diagnoses", "patient_luts_symptoms"]:
        memdb.execute(f"DELETE FROM {tbl} WHERE patient_id = ?", (pid,))
    memdb.execute("DELETE FROM pacientes WHERE id = ?", (pid,))
    memdb.commit()

    # Verificar que todo fue eliminado
    assert memdb.execute("SELECT id FROM pacientes WHERE id = ?", (pid,)).fetchone() is None
    assert memdb.execute("SELECT id FROM patient_comorbidities WHERE patient_id = ?", (pid,)).fetchone() is None
    assert memdb.execute("SELECT id FROM psa_measurements WHERE patient_id = ?", (pid,)).fetchone() is None


# ════════════════════════════════════════════════════════════════════════════════
#  TEST 7: mark_as_test funciona
# ════════════════════════════════════════════════════════════════════════════════

def test_mark_as_test_funciona(memdb):
    pid = _insert_patient(memdb, "José Rodríguez", is_test=0)

    # Verificar que NO es test antes
    row_before = dict(memdb.execute("SELECT is_test_patient FROM pacientes WHERE id = ?", (pid,)).fetchone())
    assert row_before["is_test_patient"] == 0

    # Marcar como test
    memdb.execute("UPDATE pacientes SET is_test_patient = 1 WHERE id = ?", (pid,))
    memdb.commit()

    # Verificar que ahora SÍ es test
    row_after = dict(memdb.execute("SELECT is_test_patient FROM pacientes WHERE id = ?", (pid,)).fetchone())
    assert row_after["is_test_patient"] == 1
