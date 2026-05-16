"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import type {
  PatientFormState, FormErrors, PatientExpandedPayload,
  ComorbidityCode, DiagnosisCode, LutsSymptom, LutsSeverity,
  FamilyHistoryEntry, MedicationEntry, DiagnosisEntry, LutsEntry,
} from "@/types/patient-form";
import { createPatientExpanded } from "@/lib/api";

// ── Estado inicial ─────────────────────────────────────────────────────────────

const INITIAL_STATE: PatientFormState = {
  nombre: "", cedula: "", sex: "", fecha_nacimiento: "",
  marital_status: "", occupation: "", blood_type: "",
  telefono: "", alternative_phone: "", email: "", address: "",
  insurance_company: "", insurance_policy: "",
  emergency_contact_name: "", emergency_contact_phone: "", emergency_contact_relationship: "",
  comorbidities: [], smoking_status: "", smoking_pack_years: "",
  alcohol_consumption: "", previous_surgeries: "", allergies: "",
  no_drug_allergies: false, medications: [],
  family_history: [],
  chief_complaint: "", diagnoses: [], luts_symptoms: [],
  psa_total: "", psa_libre: "", volumen_prostatico: "", testosterone_total: "",
  ipss: "", bp_systolic: "", bp_diastolic: "", heart_rate: "",
  weight_kg: "", height_cm: "",
  dre_performed: false, dre_prostate_size: "", dre_consistency: "",
  dre_nodules: false, dre_nodule_location: "", dre_painful: false, dre_notes: "",
  notas: "", treatment_plan: "", next_appointment_date: "",
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function calcAge(dob: string): number | null {
  if (!dob) return null;
  try {
    const born = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - born.getFullYear();
    if (today.getMonth() < born.getMonth() ||
        (today.getMonth() === born.getMonth() && today.getDate() < born.getDate())) age--;
    return age >= 0 ? age : null;
  } catch { return null; }
}

function numOr(s: string): number | undefined {
  const n = parseFloat(s);
  return isNaN(n) ? undefined : n;
}

// ── Validación ────────────────────────────────────────────────────────────────

function validate(form: PatientFormState): FormErrors {
  const e: FormErrors = {};
  if (!form.nombre.trim()) e.nombre = "Nombre requerido";
  if (!form.sex) e.sex = "Sexo requerido";
  if (!form.fecha_nacimiento) e.fecha_nacimiento = "Fecha de nacimiento requerida";
  if (!form.telefono.trim()) e.telefono = "Teléfono requerido";
  if (!form.chief_complaint.trim()) e.chief_complaint = "Motivo de consulta requerido";
  if (form.cedula && !/^[VEve]-?\d{5,9}$/.test(form.cedula.trim()))
    e.cedula = "Formato: V-XXXXXXXX o E-XXXXXXXX";
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    e.email = "Correo inválido";
  return e;
}

// ── Hook principal ────────────────────────────────────────────────────────────

export function usePatientForm() {
  const router = useRouter();
  const [form, setFormState] = useState<PatientFormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Advertir al salir con cambios sin guardar
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const setField = useCallback(<K extends keyof PatientFormState>(
    field: K, value: PatientFormState[K]
  ) => {
    setFormState(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    // Limpiar error del campo
    setErrors(prev => { const next = { ...prev }; delete next[field]; return next; });
  }, []);

  // ── Comorbilidades ────────────────────────────────────────────────────────
  const toggleComorbidity = useCallback((code: ComorbidityCode) => {
    setFormState(prev => ({
      ...prev,
      comorbidities: prev.comorbidities.includes(code)
        ? prev.comorbidities.filter(c => c !== code)
        : [...prev.comorbidities, code],
    }));
    setIsDirty(true);
  }, []);

  // ── Medicamentos ──────────────────────────────────────────────────────────
  const addMedication = useCallback(() =>
    setFormState(prev => ({ ...prev, medications: [...prev.medications, { name: "", dose: "", frequency: "" }] })), []);

  const updateMedication = useCallback((i: number, field: keyof MedicationEntry, value: string) =>
    setFormState(prev => {
      const meds = [...prev.medications];
      meds[i] = { ...meds[i], [field]: value };
      return { ...prev, medications: meds };
    }), []);

  const removeMedication = useCallback((i: number) =>
    setFormState(prev => ({ ...prev, medications: prev.medications.filter((_, idx) => idx !== i) })), []);

  // ── Historia familiar ─────────────────────────────────────────────────────
  const addFamilyHistory = useCallback(() =>
    setFormState(prev => ({
      ...prev,
      family_history: [...prev.family_history, { relationship: "", pathology: "", diagnosis_age: "", status: "" }],
    })), []);

  const updateFamilyHistory = useCallback((i: number, field: keyof FamilyHistoryEntry, value: string) =>
    setFormState(prev => {
      const fh = [...prev.family_history];
      fh[i] = { ...fh[i], [field]: value } as FamilyHistoryEntry;
      return { ...prev, family_history: fh };
    }), []);

  const removeFamilyHistory = useCallback((i: number) =>
    setFormState(prev => ({ ...prev, family_history: prev.family_history.filter((_, idx) => idx !== i) })), []);

  // ── Diagnósticos ──────────────────────────────────────────────────────────
  const toggleDiagnosis = useCallback((code: DiagnosisCode) => {
    setFormState(prev => {
      const exists = prev.diagnoses.find(d => d.code === code);
      if (exists) {
        const remaining = prev.diagnoses.filter(d => d.code !== code);
        // Si se quita el primario, hacer primario al primero restante
        if (exists.is_primary && remaining.length > 0)
          remaining[0] = { ...remaining[0], is_primary: true };
        return { ...prev, diagnoses: remaining };
      }
      // Agregar: si es el primero, marcarlo como primario
      const newDiag: DiagnosisEntry = { code, is_primary: prev.diagnoses.length === 0 };
      return { ...prev, diagnoses: [...prev.diagnoses, newDiag] };
    });
    setIsDirty(true);
  }, []);

  const setPrimaryDiagnosis = useCallback((code: DiagnosisCode) => {
    setFormState(prev => ({
      ...prev,
      diagnoses: prev.diagnoses.map(d => ({ ...d, is_primary: d.code === code })),
    }));
  }, []);

  // ── LUTS ─────────────────────────────────────────────────────────────────
  const toggleLutsSymptom = useCallback((symptom: LutsSymptom) => {
    setFormState(prev => {
      const exists = prev.luts_symptoms.find(l => l.symptom === symptom);
      if (exists) {
        return { ...prev, luts_symptoms: prev.luts_symptoms.filter(l => l.symptom !== symptom) };
      }
      return {
        ...prev,
        luts_symptoms: [...prev.luts_symptoms, { symptom, active: true, severity: "", nocturia_times: "" }],
      };
    });
    setIsDirty(true);
  }, []);

  const updateLutsEntry = useCallback((symptom: LutsSymptom, field: keyof LutsEntry, value: string | boolean) => {
    setFormState(prev => ({
      ...prev,
      luts_symptoms: prev.luts_symptoms.map(l =>
        l.symptom === symptom ? { ...l, [field]: value } : l
      ),
    }));
  }, []);

  // ── Submit ────────────────────────────────────────────────────────────────
  const submit = useCallback(async () => {
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSubmitting(true);
    setSubmitError(null);

    const payload: PatientExpandedPayload = {
      nombre: form.nombre.trim(),
      cedula:          form.cedula.trim()          || undefined,
      sex:             form.sex                    || undefined,
      fecha_nacimiento: form.fecha_nacimiento       || undefined,
      marital_status:  form.marital_status          || undefined,
      occupation:      form.occupation.trim()       || undefined,
      blood_type:      form.blood_type              || undefined,
      telefono:        form.telefono.trim()         || undefined,
      alternative_phone: form.alternative_phone.trim() || undefined,
      email:           form.email.trim()            || undefined,
      address:         form.address.trim()          || undefined,
      insurance_company:  form.insurance_company.trim()  || undefined,
      insurance_policy:   form.insurance_policy.trim()   || undefined,
      emergency_contact_name:  form.emergency_contact_name.trim()  || undefined,
      emergency_contact_phone: form.emergency_contact_phone.trim() || undefined,
      emergency_contact_relationship: form.emergency_contact_relationship.trim() || undefined,
      smoking_status:   form.smoking_status  || undefined,
      smoking_pack_years: numOr(form.smoking_pack_years),
      alcohol_consumption: form.alcohol_consumption || undefined,
      previous_surgeries: form.previous_surgeries.trim() || undefined,
      allergies:       form.allergies.trim()        || undefined,
      no_drug_allergies: form.no_drug_allergies,
      medications:     form.medications.filter(m => m.name.trim()),
      comorbidities:   form.comorbidities.map(code => ({ code })),
      family_history:  form.family_history
        .filter(fh => fh.relationship && fh.pathology)
        .map(fh => ({
          relationship: fh.relationship,
          pathology:    fh.pathology,
          diagnosis_age: numOr(fh.diagnosis_age),
          status:       fh.status || undefined,
        })),
      chief_complaint: form.chief_complaint.trim() || undefined,
      motivo_consulta: form.chief_complaint.trim() || undefined,
      diagnoses:       form.diagnoses,
      luts_symptoms:   form.luts_symptoms.map(l => ({
        symptom:        l.symptom,
        severity:       l.severity || undefined,
        nocturia_times: numOr(l.nocturia_times),
        active:         l.active,
      })),
      psa_total:         numOr(form.psa_total),
      psa_libre:         numOr(form.psa_libre),
      volumen_prostatico: numOr(form.volumen_prostatico),
      testosterone_total: numOr(form.testosterone_total),
      ipss:              numOr(form.ipss),
      bp_systolic:       numOr(form.bp_systolic),
      bp_diastolic:      numOr(form.bp_diastolic),
      heart_rate:        numOr(form.heart_rate),
      weight_kg:         numOr(form.weight_kg),
      height_cm:         numOr(form.height_cm),
      dre_performed:     form.dre_performed,
      dre_prostate_size: form.dre_prostate_size || undefined,
      dre_consistency:   form.dre_consistency   || undefined,
      dre_nodules:       form.dre_performed ? form.dre_nodules : undefined,
      dre_nodule_location: form.dre_nodule_location || undefined,
      dre_painful:       form.dre_performed ? form.dre_painful : undefined,
      dre_notes:         form.dre_notes.trim()  || undefined,
      notas:             form.notas.trim()       || undefined,
      treatment_plan:    form.treatment_plan.trim() || undefined,
      next_appointment_date: form.next_appointment_date || undefined,
    };

    try {
      const result = await createPatientExpanded(payload);
      setIsDirty(false);
      router.push(`/pacientes/${result.id}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSubmitting(false);
    }
  }, [form, router]);

  // ── Valores calculados ────────────────────────────────────────────────────
  const edad           = calcAge(form.fecha_nacimiento);
  const psaTotal       = parseFloat(form.psa_total)  || 0;
  const psaLibre       = parseFloat(form.psa_libre)  || 0;
  const volProst       = parseFloat(form.volumen_prostatico) || 0;
  const weightKg       = parseFloat(form.weight_kg)  || 0;
  const heightCm       = parseFloat(form.height_cm)  || 0;
  const ratioLT        = psaTotal > 0 && psaLibre > 0 ? (psaLibre / psaTotal * 100) : null;
  const densidadPSA    = psaTotal > 0 && volProst > 0 ? psaTotal / volProst : null;
  const imc            = weightKg > 0 && heightCm > 0 ? weightKg / ((heightCm / 100) ** 2) : null;

  return {
    form, setField, errors, submitting, submitError,
    toggleComorbidity,
    addMedication, updateMedication, removeMedication,
    addFamilyHistory, updateFamilyHistory, removeFamilyHistory,
    toggleDiagnosis, setPrimaryDiagnosis,
    toggleLutsSymptom, updateLutsEntry,
    submit,
    // Calculados
    edad, ratioLT, densidadPSA, imc,
  };
}