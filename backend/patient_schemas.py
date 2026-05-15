"""
MedFlow AI — Schemas Pydantic v2 para Paciente Expandido
Estándar clínico urológico EAU 2025 + Johns Hopkins.
"""
from __future__ import annotations

import re
from datetime import date, datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, field_validator, model_validator

# ── Valores permitidos (TEXT con CHECK en BD) ─────────────────────────────────

SEX_VALUES              = {"MALE", "FEMALE", "OTHER"}
MARITAL_VALUES          = {"SINGLE", "MARRIED", "DIVORCED", "WIDOWED"}
BLOOD_TYPE_VALUES       = {"A_POS", "A_NEG", "B_POS", "B_NEG", "AB_POS", "AB_NEG", "O_POS", "O_NEG"}
SMOKING_VALUES          = {"NEVER", "EX_SMOKER", "ACTIVE"}
ALCOHOL_VALUES          = {"NEVER", "SOCIAL", "MODERATE", "EXCESSIVE"}
DRE_SIZE_VALUES         = {"GRADE_I", "GRADE_II", "GRADE_III", "GRADE_IV"}
DRE_CONSISTENCY_VALUES  = {"NORMAL", "INCREASED", "STONY"}
DRE_LOCATION_VALUES     = {"RIGHT_LOBE", "LEFT_LOBE", "BILATERAL", "APEX"}

COMORBIDITY_CODES  = {"HTA", "DM2", "DYSLIPIDEMIA", "ISCHEMIC_HEART", "CKD", "COPD_ASTHMA", "LIVER_DISEASE", "THYROID", "OBESITY"}
FAMILY_REL_VALUES  = {"FATHER", "MOTHER", "BROTHER", "SISTER", "GRANDFATHER", "GRANDMOTHER", "UNCLE", "AUNT", "OTHER"}
FAMILY_PATH_VALUES = {"PROSTATE_CANCER", "BLADDER_CANCER", "KIDNEY_CANCER", "TESTICULAR_CANCER", "UROLITHIASIS", "BPH", "OTHER"}
FAMILY_STATUS_VALUES = {"ALIVE", "DECEASED"}

DIAGNOSIS_CODES = {
    "BPH", "PSA_ELEVATION", "PROSTATE_CANCER", "BLADDER_CANCER", "KIDNEY_CANCER",
    "TESTICULAR_CANCER", "RENAL_STONES", "URETERAL_STONES", "BLADDER_STONES",
    "RECURRENT_UTI", "PROSTATITIS", "ERECTILE_DYSFUNCTION", "HYPOGONADISM",
    "MALE_INFERTILITY", "VARICOCELE", "HYDROCELE", "PHIMOSIS",
    "URINARY_INCONTINENCE", "OVERACTIVE_BLADDER", "POST_OP_FOLLOWUP", "OTHER",
}

LUTS_SYMPTOM_VALUES = {
    "NOCTURIA", "INCREASED_FREQUENCY", "URGENCY", "WEAK_STREAM",
    "INCOMPLETE_EMPTYING", "TERMINAL_DRIPPING", "DYSURIA", "HEMATURIA", "PELVIC_PAIN",
}
LUTS_SEVERITY_VALUES = {"MILD", "MODERATE", "SEVERE"}


# ── Funciones de cálculo ──────────────────────────────────────────────────────

def calculate_age(fecha_nacimiento: Optional[str]) -> Optional[int]:
    """Edad en años desde fecha_nacimiento (ISO date string)."""
    if not fecha_nacimiento:
        return None
    try:
        born  = date.fromisoformat(str(fecha_nacimiento)[:10])
        today = date.today()
        return today.year - born.year - ((today.month, today.day) < (born.month, born.day))
    except ValueError:
        return None


def calculate_bmi(weight_kg: Optional[float], height_cm: Optional[float]) -> Optional[float]:
    """Índice de Masa Corporal (kg/m²)."""
    if weight_kg and height_cm and height_cm > 0:
        return round(weight_kg / (height_cm / 100) ** 2, 1)
    return None


def has_prostate_cancer_family(family_history: List[Dict]) -> bool:
    """True si hay algún familiar con PROSTATE_CANCER."""
    return any(fh.get("pathology") == "PROSTATE_CANCER" for fh in family_history)


def get_primary_diagnosis(diagnoses: List[Dict]) -> Optional[str]:
    """Retorna el código del diagnóstico marcado como primario."""
    primary = next((d for d in diagnoses if d.get("is_primary")), None)
    return primary["code"] if primary else (diagnoses[0]["code"] if diagnoses else None)


# ── Sub-schemas: relaciones ───────────────────────────────────────────────────

class ComorbidityCreate(BaseModel):
    code: str

    @field_validator("code")
    @classmethod
    def valid_code(cls, v: str) -> str:
        if v not in COMORBIDITY_CODES:
            raise ValueError(f"code debe ser uno de: {sorted(COMORBIDITY_CODES)}")
        return v


class ComorbidityOut(ComorbidityCreate):
    id: str
    patient_id: str
    created_at: str


class MedicationCreate(BaseModel):
    name: str = Field(..., max_length=200)
    dose: Optional[str] = Field(None, max_length=100)
    frequency: Optional[str] = Field(None, max_length=100)
    active: bool = True


class MedicationOut(MedicationCreate):
    id: str
    patient_id: str
    created_at: str


class FamilyHistoryCreate(BaseModel):
    relationship: str
    pathology: str
    pathology_notes: Optional[str] = Field(None, max_length=200)
    diagnosis_age: Optional[int] = Field(None, ge=0, le=120)
    status: Optional[str] = None

    @field_validator("relationship")
    @classmethod
    def valid_relationship(cls, v: str) -> str:
        if v not in FAMILY_REL_VALUES:
            raise ValueError(f"relationship inválido: {v}")
        return v

    @field_validator("pathology")
    @classmethod
    def valid_pathology(cls, v: str) -> str:
        if v not in FAMILY_PATH_VALUES:
            raise ValueError(f"pathology inválido: {v}")
        return v

    @field_validator("status")
    @classmethod
    def valid_status(cls, v: Optional[str]) -> Optional[str]:
        if v and v not in FAMILY_STATUS_VALUES:
            raise ValueError(f"status inválido: {v}")
        return v


class FamilyHistoryOut(FamilyHistoryCreate):
    id: str
    patient_id: str
    created_at: str


class DiagnosisCreate(BaseModel):
    code: str
    is_primary: bool = False
    notes: Optional[str] = Field(None, max_length=200)
    icd10_code: Optional[str] = Field(None, max_length=10)

    @field_validator("code")
    @classmethod
    def valid_code(cls, v: str) -> str:
        if v not in DIAGNOSIS_CODES:
            raise ValueError(f"code inválido: {v}")
        return v


class DiagnosisOut(DiagnosisCreate):
    id: str
    patient_id: str
    created_at: str


class DiagnosisUpdate(BaseModel):
    is_primary: Optional[bool] = None
    notes: Optional[str] = None


class LutsSymptomCreate(BaseModel):
    symptom: str
    severity: Optional[str] = None
    nocturia_times: Optional[int] = Field(None, ge=0, le=30)
    active: bool = True

    @field_validator("symptom")
    @classmethod
    def valid_symptom(cls, v: str) -> str:
        if v not in LUTS_SYMPTOM_VALUES:
            raise ValueError(f"symptom inválido: {v}")
        return v

    @field_validator("severity")
    @classmethod
    def valid_severity(cls, v: Optional[str]) -> Optional[str]:
        if v and v not in LUTS_SEVERITY_VALUES:
            raise ValueError(f"severity debe ser MILD, MODERATE o SEVERE")
        return v


class LutsSymptomOut(LutsSymptomCreate):
    id: str
    patient_id: str
    created_at: str


# ── Schema principal: PacienteCreate (superset del schema legacy) ─────────────

class PacienteCreate(BaseModel):
    """
    Superset del PacienteIn legacy.
    Campos legacy (nombre, edad, motivo_consulta) siguen aceptados.
    Campos nuevos todos opcionales → backward compatible.
    """
    # ── Legacy (mantener funcionamiento existente) ──────────────────────────
    nombre: str = Field(..., min_length=2, max_length=200)
    cedula: Optional[str] = None
    edad: Optional[int] = Field(None, ge=0, le=130)
    fecha_nacimiento: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    motivo_consulta: Optional[str] = None      # alias chief_complaint
    diagnostico: Optional[str] = None
    antecedentes_ca: str = "no"
    hipertension: bool = False
    diabetes: bool = False
    cirugia_previa: bool = False
    notas: Optional[str] = None
    psa_total: Optional[float] = None
    psa_libre: Optional[float] = None
    volumen_prostatico: Optional[float] = None
    ipss: Optional[int] = None

    # ── Datos demográficos extendidos ───────────────────────────────────────
    sex: Optional[str] = None
    marital_status: Optional[str] = None
    occupation: Optional[str] = Field(None, max_length=200)
    blood_type: Optional[str] = None
    alternative_phone: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = None
    insurance_company: Optional[str] = Field(None, max_length=200)
    insurance_policy: Optional[str] = Field(None, max_length=100)
    emergency_contact_name: Optional[str] = Field(None, max_length=200)
    emergency_contact_phone: Optional[str] = Field(None, max_length=50)
    emergency_contact_relationship: Optional[str] = Field(None, max_length=100)

    # ── Hábitos ────────────────────────────────────────────────────────────
    smoking_status: Optional[str] = None
    smoking_pack_years: Optional[float] = Field(None, ge=0)
    alcohol_consumption: Optional[str] = None
    previous_surgeries: Optional[str] = None
    allergies: Optional[str] = None
    no_drug_allergies: bool = False

    # ── Datos clínicos generales ───────────────────────────────────────────
    chief_complaint: Optional[str] = None
    treatment_plan: Optional[str] = None
    next_appointment_date: Optional[str] = None

    # ── Signos vitales y antropometría ─────────────────────────────────────
    bp_systolic: Optional[int] = Field(None, ge=50, le=300)
    bp_diastolic: Optional[int] = Field(None, ge=30, le=200)
    heart_rate: Optional[int] = Field(None, ge=20, le=300)
    weight_kg: Optional[float] = Field(None, ge=1, le=500)
    height_cm: Optional[float] = Field(None, ge=50, le=250)

    # ── Tacto Rectal (DRE) ─────────────────────────────────────────────────
    dre_performed: bool = False
    dre_prostate_size: Optional[str] = None
    dre_consistency: Optional[str] = None
    dre_nodules: Optional[bool] = None
    dre_nodule_location: Optional[str] = None
    dre_painful: Optional[bool] = None
    dre_notes: Optional[str] = None

    # ── Marcadores hormonales ──────────────────────────────────────────────
    testosterone_total: Optional[float] = Field(None, ge=0)

    # ── Relaciones (arrays anidados, opcionales) ───────────────────────────
    comorbidities: List[ComorbidityCreate] = []
    medications: List[MedicationCreate] = []
    family_history: List[FamilyHistoryCreate] = []
    diagnoses: List[DiagnosisCreate] = []
    luts_symptoms: List[LutsSymptomCreate] = []

    # ── Validadores ─────────────────────────────────────────────────────────

    @field_validator("cedula")
    @classmethod
    def validate_cedula(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip().upper()
        if not re.match(r'^[VE]-?\d{5,9}$', v):
            raise ValueError("Cédula debe ser formato V-XXXXXXXX o E-XXXXXXXX")
        return v

    @field_validator("sex")
    @classmethod
    def valid_sex(cls, v: Optional[str]) -> Optional[str]:
        if v and v not in SEX_VALUES:
            raise ValueError(f"sex debe ser {SEX_VALUES}")
        return v

    @field_validator("blood_type")
    @classmethod
    def valid_blood_type(cls, v: Optional[str]) -> Optional[str]:
        if v and v not in BLOOD_TYPE_VALUES:
            raise ValueError(f"blood_type inválido: {v}")
        return v

    @field_validator("smoking_status")
    @classmethod
    def valid_smoking(cls, v: Optional[str]) -> Optional[str]:
        if v and v not in SMOKING_VALUES:
            raise ValueError(f"smoking_status inválido: {v}")
        return v

    @field_validator("alcohol_consumption")
    @classmethod
    def valid_alcohol(cls, v: Optional[str]) -> Optional[str]:
        if v and v not in ALCOHOL_VALUES:
            raise ValueError(f"alcohol_consumption inválido: {v}")
        return v

    @field_validator("dre_prostate_size")
    @classmethod
    def valid_dre_size(cls, v: Optional[str]) -> Optional[str]:
        if v and v not in DRE_SIZE_VALUES:
            raise ValueError(f"dre_prostate_size inválido: {v}")
        return v

    @field_validator("dre_consistency")
    @classmethod
    def valid_dre_consistency(cls, v: Optional[str]) -> Optional[str]:
        if v and v not in DRE_CONSISTENCY_VALUES:
            raise ValueError(f"dre_consistency inválido: {v}")
        return v

    @model_validator(mode="after")
    def ensure_age_or_dob(self) -> "PacienteCreate":
        """Al menos edad o fecha_nacimiento debe estar presente."""
        if self.edad is None and not self.fecha_nacimiento:
            raise ValueError("Se requiere 'edad' o 'fecha_nacimiento'")
        return self

    @property
    def resolved_age(self) -> int:
        """Edad calculada desde fecha_nacimiento, o la almacenada."""
        from_dob = calculate_age(self.fecha_nacimiento)
        return from_dob if from_dob is not None else (self.edad or 0)

    @property
    def effective_chief_complaint(self) -> Optional[str]:
        """Normaliza chief_complaint / motivo_consulta."""
        return self.chief_complaint or self.motivo_consulta


class PacienteUpdate(BaseModel):
    """Todos los campos opcionales para PATCH parcial."""
    nombre: Optional[str] = None
    cedula: Optional[str] = None
    edad: Optional[int] = None
    fecha_nacimiento: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    sex: Optional[str] = None
    marital_status: Optional[str] = None
    occupation: Optional[str] = None
    blood_type: Optional[str] = None
    address: Optional[str] = None
    insurance_company: Optional[str] = None
    insurance_policy: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relationship: Optional[str] = None
    smoking_status: Optional[str] = None
    smoking_pack_years: Optional[float] = None
    alcohol_consumption: Optional[str] = None
    previous_surgeries: Optional[str] = None
    allergies: Optional[str] = None
    no_drug_allergies: Optional[bool] = None
    chief_complaint: Optional[str] = None
    motivo_consulta: Optional[str] = None
    treatment_plan: Optional[str] = None
    next_appointment_date: Optional[str] = None
    bp_systolic: Optional[int] = None
    bp_diastolic: Optional[int] = None
    heart_rate: Optional[int] = None
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    dre_performed: Optional[bool] = None
    dre_prostate_size: Optional[str] = None
    dre_consistency: Optional[str] = None
    dre_nodules: Optional[bool] = None
    dre_nodule_location: Optional[str] = None
    dre_painful: Optional[bool] = None
    dre_notes: Optional[str] = None
    testosterone_total: Optional[float] = None
    psa_total: Optional[float] = None
    psa_libre: Optional[float] = None
    volumen_prostatico: Optional[float] = None
    ipss: Optional[int] = None
    diagnostico: Optional[str] = None
    notas: Optional[str] = None
    hipertension: Optional[bool] = None
    diabetes: Optional[bool] = None
    cirugia_previa: Optional[bool] = None
    # Arrays de relaciones: si vienen → replace; si no vienen → mantener
    comorbidities: Optional[List[ComorbidityCreate]] = None
    medications: Optional[List[MedicationCreate]] = None
    family_history: Optional[List[FamilyHistoryCreate]] = None
    diagnoses: Optional[List[DiagnosisCreate]] = None
    luts_symptoms: Optional[List[LutsSymptomCreate]] = None
