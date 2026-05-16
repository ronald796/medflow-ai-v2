// MedFlow AI — Tipos TypeScript para Formulario de Paciente Expandido
// Espejo del schema Pydantic backend (patient_schemas.py)

export type Sex            = "MALE" | "FEMALE" | "OTHER";
export type MaritalStatus  = "SINGLE" | "MARRIED" | "DIVORCED" | "WIDOWED";
export type BloodType      = "A_POS" | "A_NEG" | "B_POS" | "B_NEG" | "AB_POS" | "AB_NEG" | "O_POS" | "O_NEG";
export type SmokingStatus  = "NEVER" | "EX_SMOKER" | "ACTIVE";
export type AlcoholStatus  = "NEVER" | "SOCIAL" | "MODERATE" | "EXCESSIVE";
export type DRESize        = "GRADE_I" | "GRADE_II" | "GRADE_III" | "GRADE_IV";
export type DREConsistency = "NORMAL" | "INCREASED" | "STONY";
export type DRELocation    = "RIGHT_LOBE" | "LEFT_LOBE" | "BILATERAL" | "APEX";

export type ComorbidityCode =
  | "HTA" | "DM2" | "DYSLIPIDEMIA" | "ISCHEMIC_HEART"
  | "CKD" | "COPD_ASTHMA" | "LIVER_DISEASE" | "THYROID" | "OBESITY";

export type FamilyRelationship =
  | "FATHER" | "MOTHER" | "BROTHER" | "SISTER"
  | "GRANDFATHER" | "GRANDMOTHER" | "UNCLE" | "AUNT" | "OTHER";

export type FamilyPathology =
  | "PROSTATE_CANCER" | "BLADDER_CANCER" | "KIDNEY_CANCER"
  | "TESTICULAR_CANCER" | "UROLITHIASIS" | "BPH" | "OTHER";

export type DiagnosisCode =
  | "BPH" | "PSA_ELEVATION" | "PROSTATE_CANCER" | "BLADDER_CANCER"
  | "KIDNEY_CANCER" | "TESTICULAR_CANCER" | "RENAL_STONES" | "URETERAL_STONES"
  | "BLADDER_STONES" | "RECURRENT_UTI" | "PROSTATITIS" | "ERECTILE_DYSFUNCTION"
  | "HYPOGONADISM" | "MALE_INFERTILITY" | "VARICOCELE" | "HYDROCELE"
  | "PHIMOSIS" | "URINARY_INCONTINENCE" | "OVERACTIVE_BLADDER"
  | "POST_OP_FOLLOWUP" | "OTHER";

export type LutsSymptom =
  | "NOCTURIA" | "INCREASED_FREQUENCY" | "URGENCY" | "WEAK_STREAM"
  | "INCOMPLETE_EMPTYING" | "TERMINAL_DRIPPING" | "DYSURIA"
  | "HEMATURIA" | "PELVIC_PAIN";

export type LutsSeverity = "MILD" | "MODERATE" | "SEVERE";

// ── Sub-tipos dinámicos ───────────────────────────────────────────────────────

export interface MedicationEntry {
  name: string;
  dose: string;
  frequency: string;
}

export interface FamilyHistoryEntry {
  relationship: FamilyRelationship | "";
  pathology: FamilyPathology | "";
  diagnosis_age: string;
  status: "ALIVE" | "DECEASED" | "";
}

export interface DiagnosisEntry {
  code: DiagnosisCode;
  is_primary: boolean;
}

export interface LutsEntry {
  symptom: LutsSymptom;
  active: boolean;
  severity: LutsSeverity | "";
  nocturia_times: string;
}

// ── Estado completo del formulario ────────────────────────────────────────────

export interface PatientFormState {
  // Sección 1: Datos personales
  nombre: string;
  cedula: string;
  sex: Sex | "";
  fecha_nacimiento: string;
  marital_status: MaritalStatus | "";
  occupation: string;
  blood_type: BloodType | "";
  telefono: string;
  alternative_phone: string;
  email: string;
  address: string;
  insurance_company: string;
  insurance_policy: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;

  // Sección 2: Antecedentes
  comorbidities: ComorbidityCode[];
  smoking_status: SmokingStatus | "";
  smoking_pack_years: string;
  alcohol_consumption: AlcoholStatus | "";
  previous_surgeries: string;
  allergies: string;
  no_drug_allergies: boolean;
  medications: MedicationEntry[];

  // Sección 3: Familiares
  family_history: FamilyHistoryEntry[];

  // Sección 4: Perfil urológico
  chief_complaint: string;
  diagnoses: DiagnosisEntry[];
  luts_symptoms: LutsEntry[];

  // Sección 5: Clínicos
  psa_total: string;
  psa_libre: string;
  volumen_prostatico: string;
  testosterone_total: string;
  ipss: string;
  bp_systolic: string;
  bp_diastolic: string;
  heart_rate: string;
  weight_kg: string;
  height_cm: string;
  dre_performed: boolean;
  dre_prostate_size: DRESize | "";
  dre_consistency: DREConsistency | "";
  dre_nodules: boolean;
  dre_nodule_location: DRELocation | "";
  dre_painful: boolean;
  dre_notes: string;

  // Sección 6: Notas
  notas: string;
  treatment_plan: string;
  next_appointment_date: string;
}

// ── Errores de validación ─────────────────────────────────────────────────────

export type FormErrors = Partial<Record<keyof PatientFormState, string>>;

// ── Payload para el backend ───────────────────────────────────────────────────

export interface PatientExpandedPayload {
  nombre: string;
  cedula?: string;
  sex?: string;
  fecha_nacimiento?: string;
  marital_status?: string;
  occupation?: string;
  blood_type?: string;
  telefono?: string;
  alternative_phone?: string;
  email?: string;
  address?: string;
  insurance_company?: string;
  insurance_policy?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  smoking_status?: string;
  smoking_pack_years?: number;
  alcohol_consumption?: string;
  previous_surgeries?: string;
  allergies?: string;
  no_drug_allergies?: boolean;
  medications?: MedicationEntry[];
  comorbidities?: { code: string }[];
  family_history?: { relationship: string; pathology: string; diagnosis_age?: number; status?: string }[];
  chief_complaint?: string;
  motivo_consulta?: string;
  diagnoses?: { code: string; is_primary: boolean }[];
  luts_symptoms?: { symptom: string; severity?: string; nocturia_times?: number; active: boolean }[];
  psa_total?: number;
  psa_libre?: number;
  volumen_prostatico?: number;
  testosterone_total?: number;
  ipss?: number;
  bp_systolic?: number;
  bp_diastolic?: number;
  heart_rate?: number;
  weight_kg?: number;
  height_cm?: number;
  dre_performed?: boolean;
  dre_prostate_size?: string;
  dre_consistency?: string;
  dre_nodules?: boolean;
  dre_nodule_location?: string;
  dre_painful?: boolean;
  dre_notes?: string;
  notas?: string;
  treatment_plan?: string;
  next_appointment_date?: string;
}
