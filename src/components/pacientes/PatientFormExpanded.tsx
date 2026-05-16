"use client";

import { useState, useMemo } from "react";
import { Loader2, AlertCircle, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePatientForm } from "@/hooks/usePatientForm";
import { SectionWrapper } from "./PF_Shared";
import Section1Personales from "./PF_Section1";
import Section2Antecedentes from "./PF_Section2";
import Section3Familiares from "./PF_Section3";
import Section4Urologico from "./PF_Section4";
import Section5Clinicos from "./PF_Section5";
import Section6Notas from "./PF_Section6";

// ── Contador de completitud por sección ───────────────────────────────────────

function countFilled(values: (string | boolean | unknown[])[]): number {
  return values.filter(v => {
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === "boolean") return v;
    return v !== "" && v !== undefined && v !== null;
  }).length;
}

export default function PatientFormExpanded() {
  const {
    form, setField, errors, submitting, submitError,
    toggleComorbidity,
    addMedication, updateMedication, removeMedication,
    addFamilyHistory, updateFamilyHistory, removeFamilyHistory,
    toggleDiagnosis, setPrimaryDiagnosis,
    toggleLutsSymptom, updateLutsEntry,
    submit,
    edad, ratioLT, densidadPSA, imc,
  } = usePatientForm();

  const [openSections, setOpenSections] = useState<boolean[]>([true, false, false, false, false, false]);

  const toggle = (i: number) => setOpenSections(prev => prev.map((v, idx) => idx === i ? !v : v));

  // ── Contadores por sección ────────────────────────────────────────────────
  const counts = useMemo(() => [
    // S1: Datos personales (requeridos: nombre, cedula, sex, fecha_nacimiento, telefono)
    {
      filled: countFilled([form.nombre, form.cedula, form.sex, form.fecha_nacimiento, form.telefono,
        form.marital_status, form.occupation, form.blood_type, form.alternative_phone, form.email,
        form.address, form.insurance_company, form.insurance_policy,
        form.emergency_contact_name, form.emergency_contact_phone, form.emergency_contact_relationship]),
      total: 16,
    },
    // S2: Antecedentes
    {
      filled: countFilled([form.comorbidities, form.smoking_status, form.alcohol_consumption,
        form.previous_surgeries, form.allergies, form.medications]),
      total: 6,
    },
    // S3: Familiares
    { filled: form.family_history.length, total: Math.max(form.family_history.length, 1) },
    // S4: Urológico (requerido: chief_complaint)
    {
      filled: countFilled([form.chief_complaint, form.diagnoses, form.luts_symptoms]),
      total: 3,
    },
    // S5: Clínicos
    {
      filled: countFilled([form.psa_total, form.psa_libre, form.volumen_prostatico,
        form.ipss, form.weight_kg, form.height_cm, form.bp_systolic, form.dre_performed]),
      total: 8,
    },
    // S6: Notas
    {
      filled: countFilled([form.notas, form.treatment_plan, form.next_appointment_date]),
      total: 3,
    },
  ], [form]);

  const globalFilled  = counts.reduce((s, c) => s + c.filled, 0);
  const globalTotal   = counts.reduce((s, c) => s + c.total, 0);
  const globalPct     = Math.round((globalFilled / globalTotal) * 100);
  const hasErrors     = Object.keys(errors).length > 0;

  const sections = [
    { title: "Datos Personales",       icon: "👤", required: true },
    { title: "Antecedentes Médicos",   icon: "📋", required: false },
    { title: "Antecedentes Familiares", icon: "👨‍👩‍👦", required: false },
    { title: "Perfil Urológico",       icon: "🔬", required: true },
    { title: "Datos Clínicos Iniciales", icon: "⚕️", required: false },
    { title: "Notas y Plan",           icon: "📝", required: false },
  ];

  return (
    <div className="max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <Link href="/pacientes" className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-medflow-slate">Nuevo Paciente Urológico</h1>
          <p className="text-sm text-slate-400 mt-0.5">Formulario clínico expandido — EAU 2025</p>
        </div>
      </div>

      {/* Sticky progress bar */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-sm border-b border-slate-100 -mx-6 px-6 py-3 mb-5">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-500">Completitud del formulario</span>
              <span className={cn("text-xs font-bold",
                globalPct >= 80 ? "text-medflow-emerald" :
                globalPct >= 40 ? "text-amber-600" : "text-slate-400"
              )}>
                {globalPct}%
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-500",
                  globalPct >= 80 ? "bg-medflow-emerald" :
                  globalPct >= 40 ? "bg-amber-400" : "bg-urology-blue"
                )}
                style={{ width: `${globalPct}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {hasErrors && (
              <span className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {Object.keys(errors).length} error{Object.keys(errors).length !== 1 ? "es" : ""}
              </span>
            )}
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-medflow-emerald text-white rounded-xl hover:bg-medflow-emerald-hover shadow-sm transition-all disabled:opacity-50"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
              ) : "Crear Paciente"}
            </button>
          </div>
        </div>
      </div>

      {/* Error de API */}
      {submitError && (
        <div className="mb-4 flex items-start gap-3 bg-red-50 border border-red-100 rounded-2xl px-5 py-4">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700">Error al crear el paciente</p>
            <p className="text-xs text-red-600 mt-0.5">{submitError}</p>
          </div>
        </div>
      )}

      {/* Secciones */}
      <form onSubmit={e => { e.preventDefault(); submit(); }} className="space-y-3">
        {sections.map((sec, i) => (
          <SectionWrapper
            key={sec.title}
            title={sec.title}
            icon={sec.icon}
            isOpen={openSections[i]}
            onToggle={() => toggle(i)}
            required={sec.required}
            completedFields={counts[i].filled}
            totalFields={counts[i].total}
          >
            {i === 0 && (
              <Section1Personales form={form} setField={setField} errors={errors} edad={edad} />
            )}
            {i === 1 && (
              <Section2Antecedentes
                form={form} setField={setField}
                toggleComorbidity={toggleComorbidity}
                addMedication={addMedication} updateMedication={updateMedication} removeMedication={removeMedication}
              />
            )}
            {i === 2 && (
              <Section3Familiares
                form={form}
                addFamilyHistory={addFamilyHistory} updateFamilyHistory={updateFamilyHistory} removeFamilyHistory={removeFamilyHistory}
              />
            )}
            {i === 3 && (
              <Section4Urologico
                form={form} setField={setField} errors={errors}
                toggleDiagnosis={toggleDiagnosis} setPrimaryDiagnosis={setPrimaryDiagnosis}
                toggleLutsSymptom={toggleLutsSymptom} updateLutsEntry={updateLutsEntry}
              />
            )}
            {i === 4 && (
              <Section5Clinicos form={form} setField={setField} ratioLT={ratioLT} densidadPSA={densidadPSA} imc={imc} />
            )}
            {i === 5 && (
              <Section6Notas form={form} setField={setField} />
            )}
          </SectionWrapper>
        ))}

        {/* Submit footer */}
        <div className="flex justify-end gap-3 pt-2 pb-8">
          <Link href="/pacientes">
            <button type="button" className="px-5 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">
              Cancelar
            </button>
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold bg-medflow-emerald text-white rounded-xl hover:bg-medflow-emerald-hover shadow-sm transition-all disabled:opacity-50"
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
            ) : "Crear Paciente"}
          </button>
        </div>
      </form>
    </div>
  );
}
