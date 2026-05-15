"""
Tests — Fase A: Modelo Paciente Expandido
11 tests unitarios + de integración (SQLite in-memory).
"""
from __future__ import annotations

import sqlite3
import uuid
from datetime import date, timedelta
from typing import Any, Dict, List

import pytest

from patient_schemas import (
    PacienteCreate, PacienteUpdate,
    ComorbidityCreate, MedicationCreate,
    FamilyHistoryCreate, DiagnosisCreate, LutsSymptomCreate,
    calculate_age, calculate_bmi, has_prostate_cancer_family,
    get_primary_diagnosis,
)


# ── Fixture: SQLite in-memory DB con schema completo ─────────────────────────

@pytest.fixture
def memdb():
    """Base de datos SQLite en memoria con todas las tablas de MedFlow AI."""
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
            sex TEXT, marital_status TEXT, occupation TEXT, blood_type TEXT,
            alternative_phone TEXT, address TEXT, insurance_company TEXT,
            insurance_policy TEXT, emergency_contact_name TEXT,
            emergency_contact_phone TEXT, emergency_contact_relationship TEXT,
            smoking_status TEXT, smoking_pack_years REAL, alcohol_consumption TEXT,
            previous_surgeries TEXT, allergies TEXT, no_drug_allergies INTEGER DEFAULT 0,
            chief_complaint TEXT, treatment_plan TEXT, next_appointment_date TEXT,
            bp_systolic INTEGER, bp_diastolic INTEGER, heart_rate INTEGER,
            weight_kg REAL, height_cm REAL, dre_performed INTEGER DEFAULT 0,
            dre_prostate_size TEXT, dre_consistency TEXT, dre_nodules INTEGER,
            dre_nodule_location TEXT, dre_painful INTEGER, dre_notes TEXT,
            testosterone_total REAL
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


def _insert_patient(conn, **kwargs) -> str:
    """Helper: inserta un paciente en la BD de prueba."""
    pid = str(uuid.uuid4())
    base: Dict[str, Any] = {
        "id": pid, "nombre": "Test Paciente", "cedula": "V-12345678",
        "edad": 65, "fecha_registro": "2026-01-01",
        # fecha_nacimiento NO se incluye por defecto → permite probar el caso legacy
    }
    base.update(kwargs)
    cols = ", ".join(base.keys())
    placeholders = ", ".join("?" * len(base))
    conn.execute(f"INSERT INTO pacientes ({cols}) VALUES ({placeholders})", list(base.values()))
    conn.commit()
    return pid


# ════════════════════════════════════════════════════════════════════════════════
#  TEST 1: Crear paciente con campos mínimos (schema Pydantic)
# ════════════════════════════════════════════════════════════════════════════════

def test_create_paciente_minimal():
    """Solo campos obligatorios — debe pasar validación Pydantic."""
    p = PacienteCreate(nombre="Juan Pérez", edad=60, motivo_consulta="Control PSA")
    assert p.nombre == "Juan Pérez"
    assert p.resolved_age == 60
    assert p.effective_chief_complaint == "Control PSA"
    assert p.comorbidities == []
    assert p.sex is None


# ════════════════════════════════════════════════════════════════════════════════
#  TEST 2: Crear paciente con todos los campos
# ════════════════════════════════════════════════════════════════════════════════

def test_create_paciente_complete():
    """Schema completo — todos los campos opcionales."""
    p = PacienteCreate(
        nombre="Carlos Medina Rodríguez",
        cedula="V-12345678",
        fecha_nacimiento="1958-06-15",
        telefono="+58 424-1234567",
        email="carlos@email.com",
        sex="MALE",
        marital_status="MARRIED",
        blood_type="A_POS",
        smoking_status="EX_SMOKER",
        smoking_pack_years=20.0,
        alcohol_consumption="SOCIAL",
        weight_kg=82.5,
        height_cm=174.0,
        bp_systolic=130,
        bp_diastolic=85,
        heart_rate=72,
        dre_performed=True,
        dre_prostate_size="GRADE_II",
        dre_consistency="INCREASED",
        dre_nodules=False,
        chief_complaint="Dificultad miccional progresiva",
        psa_total=6.8,
        psa_libre=0.9,
        volumen_prostatico=45.0,
        ipss=18,
        testosterone_total=380.0,
    )
    assert p.sex == "MALE"
    assert p.blood_type == "A_POS"
    assert p.dre_performed is True
    bmi = calculate_bmi(p.weight_kg, p.height_cm)
    assert bmi is not None
    assert 27.0 < bmi < 28.0  # 82.5 / 1.74² ≈ 27.24


# ════════════════════════════════════════════════════════════════════════════════
#  TEST 3: Crear paciente con relaciones anidadas
# ════════════════════════════════════════════════════════════════════════════════

def test_create_paciente_with_relations():
    """Arrays de relaciones se aceptan y se parsean correctamente."""
    p = PacienteCreate(
        nombre="Roberto Hernández",
        edad=70,
        motivo_consulta="PSA elevado",
        comorbidities=[ComorbidityCreate(code="HTA"), ComorbidityCreate(code="DM2")],
        medications=[MedicationCreate(name="Tamsulosina", dose="0.4 mg", frequency="Diaria")],
        family_history=[FamilyHistoryCreate(relationship="FATHER", pathology="PROSTATE_CANCER", diagnosis_age=72)],
        diagnoses=[DiagnosisCreate(code="PSA_ELEVATION", is_primary=True, icd10_code="R97.2")],
        luts_symptoms=[
            LutsSymptomCreate(symptom="NOCTURIA", severity="MODERATE", nocturia_times=3),
            LutsSymptomCreate(symptom="WEAK_STREAM", severity="MILD"),
        ],
    )
    assert len(p.comorbidities) == 2
    assert len(p.medications) == 1
    assert len(p.family_history) == 1
    assert p.family_history[0].pathology == "PROSTATE_CANCER"
    assert len(p.diagnoses) == 1
    assert p.diagnoses[0].is_primary is True
    assert len(p.luts_symptoms) == 2


# ════════════════════════════════════════════════════════════════════════════════
#  TEST 4: Update parcial (Pydantic PacienteUpdate)
# ════════════════════════════════════════════════════════════════════════════════

def test_update_paciente_partial():
    """PacienteUpdate: todos los campos opcionales, solo los enviados se aplican."""
    u = PacienteUpdate(weight_kg=85.0, smoking_status="EX_SMOKER")
    assert u.weight_kg == 85.0
    assert u.smoking_status == "EX_SMOKER"
    assert u.nombre is None           # no enviado → None
    assert u.comorbidities is None    # no enviado → None (mantener existentes)


# ════════════════════════════════════════════════════════════════════════════════
#  TEST 5: GET paciente incluye relaciones (integración SQLite)
# ════════════════════════════════════════════════════════════════════════════════

def test_get_paciente_includes_relations(memdb):
    """GET expandido retorna relaciones."""
    from patient_extended_router import _load_relations, _build_response

    pid = _insert_patient(memdb)
    now = "2026-01-01T10:00:00"

    memdb.execute("INSERT INTO patient_comorbidities VALUES (?,?,?,?)", (str(uuid.uuid4()), pid, "HTA", now))
    memdb.execute("INSERT INTO patient_diagnoses VALUES (?,?,?,?,?,?,?)", (str(uuid.uuid4()), pid, "BPH", 1, None, "N40.0", now))
    memdb.commit()

    row = dict(memdb.execute("SELECT * FROM pacientes WHERE id = ?", (pid,)).fetchone())

    # Simular _load_relations con la memdb (wrapper manual)
    comorbidities = [dict(r) for r in memdb.execute("SELECT * FROM patient_comorbidities WHERE patient_id = ?", (pid,)).fetchall()]
    medications   = []
    family_history = []
    diagnoses     = [dict(r) for r in memdb.execute("SELECT * FROM patient_diagnoses WHERE patient_id = ?", (pid,)).fetchall()]
    luts_symptoms = []

    relations = {
        "comorbidities": comorbidities, "medications": medications,
        "family_history": family_history, "diagnoses": diagnoses,
        "luts_symptoms": luts_symptoms,
    }
    response = _build_response(row, relations)

    assert len(response["comorbidities"]) == 1
    assert response["comorbidities"][0]["code"] == "HTA"
    assert len(response["diagnoses"]) == 1
    assert response["diagnostico_primario"] == "BPH"


# ════════════════════════════════════════════════════════════════════════════════
#  TEST 6: Cálculo IMC
# ════════════════════════════════════════════════════════════════════════════════

def test_paciente_imc_calculation():
    assert calculate_bmi(None, 175) is None
    assert calculate_bmi(80, None) is None
    assert calculate_bmi(80, 175) == pytest.approx(26.1, abs=0.1)  # 80/1.75²
    assert calculate_bmi(100, 170) == pytest.approx(34.6, abs=0.1)


# ════════════════════════════════════════════════════════════════════════════════
#  TEST 7: Cálculo de edad
# ════════════════════════════════════════════════════════════════════════════════

def test_paciente_age_calculation():
    today = date.today()
    # Cumpleaños ayer → ya cumplió este año
    dob_65 = date(today.year - 65, today.month, today.day - 1) if today.day > 1 \
             else date(today.year - 65, today.month, 1)
    assert calculate_age(dob_65.isoformat()) == 65

    assert calculate_age(None) is None
    assert calculate_age("invalid-date") is None
    assert calculate_age("1958-03-15") is not None


# ════════════════════════════════════════════════════════════════════════════════
#  TEST 8: Lógica de diagnóstico primario
# ════════════════════════════════════════════════════════════════════════════════

def test_diagnosis_primary_flag_logic():
    diagnoses = [
        {"code": "BPH", "is_primary": 0},
        {"code": "PSA_ELEVATION", "is_primary": 1},
        {"code": "PROSTATITIS", "is_primary": 0},
    ]
    assert get_primary_diagnosis(diagnoses) == "PSA_ELEVATION"

    no_primary = [{"code": "BPH", "is_primary": 0}]
    assert get_primary_diagnosis(no_primary) == "BPH"  # primer elemento como fallback

    assert get_primary_diagnosis([]) is None


# ════════════════════════════════════════════════════════════════════════════════
#  TEST 9: Sincronización boolean familiar CaP
# ════════════════════════════════════════════════════════════════════════════════

def test_family_history_prostate_cancer_boolean_sync():
    family_with_cap = [
        {"pathology": "BPH"},
        {"pathology": "PROSTATE_CANCER"},
    ]
    assert has_prostate_cancer_family(family_with_cap) is True

    family_without_cap = [{"pathology": "BPH"}, {"pathology": "UROLITHIASIS"}]
    assert has_prostate_cancer_family(family_without_cap) is False

    assert has_prostate_cancer_family([]) is False


# ════════════════════════════════════════════════════════════════════════════════
#  TEST 10: Compatibilidad legacy (schema viejo funciona)
# ════════════════════════════════════════════════════════════════════════════════

def test_legacy_compatibility():
    """Schema viejo (sin campos nuevos) sigue parseándose correctamente."""
    legacy_data = {
        "nombre": "Ana García",
        "edad": 55,
        "motivo_consulta": "Hematuria",
        "cedula": "V-8765432",
        "psa_total": 1.2,
        "hipertension": True,
        "diabetes": False,
        "antecedentes_ca": "no",
    }
    p = PacienteCreate(**legacy_data)
    assert p.nombre == "Ana García"
    assert p.sex is None          # campo nuevo → None
    assert p.dre_performed is False
    assert p.comorbidities == []  # no se enviaron → lista vacía
    assert p.resolved_age == 55


# ════════════════════════════════════════════════════════════════════════════════
#  TEST 11: Migración no rompe pacientes existentes (integración SQLite)
# ════════════════════════════════════════════════════════════════════════════════

def test_migration_does_not_break_existing_patients(memdb):
    """
    Pacientes creados ANTES de la migración (sin campos nuevos) siguen
    siendo accesibles y no fallan al leer.
    """
    # Insertar paciente legacy (sin los nuevos campos → quedarán NULL)
    legacy_pid = _insert_patient(
        memdb,
        nombre="Pedro Legacy",
        edad=72,
        diagnostico="HBP",
        hipertension=1,
    )

    # Leer paciente — no debe lanzar excepción
    row = memdb.execute("SELECT * FROM pacientes WHERE id = ?", (legacy_pid,)).fetchone()
    assert row is not None

    d = dict(row)
    assert d["nombre"] == "Pedro Legacy"
    assert d["edad"] == 72
    # Campos nuevos → None (NULL en BD)
    assert d["sex"] is None
    assert d["dre_performed"] == 0   # DEFAULT 0

    # Calcular IMC → None (sin peso ni altura)
    assert calculate_bmi(d.get("weight_kg"), d.get("height_cm")) is None

    # Calcular edad desde fecha_nacimiento → None (no tiene DOB)
    assert calculate_age(d.get("fecha_nacimiento")) is None
    # Usar edad almacenada como fallback
    assert d["edad"] == 72
