// Tipo que refleja la respuesta de GET /api/v1/pacientes/{id}/expanded

export interface Comorbidity   { id: string; patient_id: string; code: string; created_at: string }
export interface Medication    { id: string; patient_id: string; name: string; dose: string | null; frequency: string | null; active: number; created_at: string }
export interface FamilyHistory { id: string; patient_id: string; relationship: string; pathology: string; pathology_notes: string | null; diagnosis_age: number | null; status: string | null; created_at: string }
export interface Diagnosis     { id: string; patient_id: string; code: string; is_primary: number; notes: string | null; icd10_code: string | null; created_at: string }
export interface LutsSymptom   { id: string; patient_id: string; symptom: string; severity: string | null; nocturia_times: number | null; active: number; created_at: string }

export interface PatientExpandedDB {
  // Identidad
  id: string;
  nombre: string;
  cedula: string | null;
  edad: number;
  edad_calculada: number | null;
  fecha_nacimiento: string | null;
  sex: string | null;
  marital_status: string | null;
  occupation: string | null;
  blood_type: string | null;
  fecha_registro: string;
  is_test_patient: boolean;

  // Contacto
  telefono: string | null;
  alternative_phone: string | null;
  email: string | null;
  address: string | null;
  insurance_company: string | null;
  insurance_policy: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;

  // Clínico legacy
  psa_total: number | null;
  psa_libre: number | null;
  indice_psa: number | null;
  volumen_prostatico: number | null;
  ipss: number | null;
  testosterone_total: number | null;

  // Signos vitales
  bp_systolic: number | null;
  bp_diastolic: number | null;
  heart_rate: number | null;
  weight_kg: number | null;
  height_cm: number | null;

  // DRE
  dre_performed: number;
  dre_prostate_size: string | null;
  dre_consistency: string | null;
  dre_nodules: number | null;
  dre_nodule_location: string | null;
  dre_painful: number | null;
  dre_notes: string | null;

  // Hábitos y antecedentes
  smoking_status: string | null;
  smoking_pack_years: number | null;
  alcohol_consumption: string | null;
  previous_surgeries: string | null;
  allergies: string | null;
  no_drug_allergies: number;
  antecedentes_ca: string;

  // Textos clínicos
  chief_complaint: string | null;
  motivo_consulta: string | null;
  diagnostico: string | null;
  treatment_plan: string | null;
  next_appointment_date: string | null;
  notas: string | null;

  // Campos calculados del backend
  imc: number | null;
  has_prostate_cancer_family_history: boolean;
  diagnostico_primario: string | null;

  // Relaciones
  comorbidities: Comorbidity[];
  medications: Medication[];
  family_history: FamilyHistory[];
  diagnoses: Diagnosis[];
  luts_symptoms: LutsSymptom[];
}
