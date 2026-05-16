"use client";

import { cn } from "@/lib/utils";
import { Field, inputCls } from "./PF_Shared";
import type { PatientFormState, DiagnosisCode, LutsSymptom, LutsSeverity } from "@/types/patient-form";

interface Props {
  form: PatientFormState;
  setField: <K extends keyof PatientFormState>(field: K, value: PatientFormState[K]) => void;
  errors: { chief_complaint?: string };
  toggleDiagnosis: (code: DiagnosisCode) => void;
  setPrimaryDiagnosis: (code: DiagnosisCode) => void;
  toggleLutsSymptom: (symptom: LutsSymptom) => void;
  updateLutsEntry: (symptom: LutsSymptom, field: keyof import("@/types/patient-form").LutsEntry, value: string | boolean) => void;
}

const DIAGNOSIS_GROUPS: { title: string; emoji: string; items: { code: DiagnosisCode; label: string }[] }[] = [
  {
    title: "Próstata", emoji: "🔬",
    items: [
      { code: "BPH",             label: "HBP — Hiperplasia Benigna" },
      { code: "PSA_ELEVATION",   label: "Elevación PSA / Sospecha CaP" },
      { code: "PROSTATE_CANCER", label: "Cáncer de Próstata confirmado" },
      { code: "PROSTATITIS",     label: "Prostatitis" },
    ],
  },
  {
    title: "Uro-oncología", emoji: "🎗",
    items: [
      { code: "BLADDER_CANCER",   label: "Cáncer de Vejiga" },
      { code: "KIDNEY_CANCER",    label: "Cáncer Renal" },
      { code: "TESTICULAR_CANCER", label: "Cáncer Testicular" },
    ],
  },
  {
    title: "Litiasis", emoji: "💎",
    items: [
      { code: "RENAL_STONES",   label: "Litiasis Renal" },
      { code: "URETERAL_STONES", label: "Litiasis Ureteral" },
      { code: "BLADDER_STONES", label: "Litiasis Vesical" },
      { code: "RECURRENT_UTI",  label: "ITU Recurrente" },
    ],
  },
  {
    title: "Andrología", emoji: "⚕",
    items: [
      { code: "ERECTILE_DYSFUNCTION", label: "Disfunción Eréctil" },
      { code: "HYPOGONADISM",         label: "Hipogonadismo" },
      { code: "MALE_INFERTILITY",     label: "Infertilidad masculina" },
      { code: "VARICOCELE",           label: "Varicocele" },
      { code: "HYDROCELE",            label: "Hidrocele" },
      { code: "PHIMOSIS",             label: "Fimosis" },
    ],
  },
  {
    title: "Funcional / Seguimiento", emoji: "📋",
    items: [
      { code: "URINARY_INCONTINENCE", label: "Incontinencia urinaria" },
      { code: "OVERACTIVE_BLADDER",   label: "Vejiga hiperactiva" },
      { code: "POST_OP_FOLLOWUP",     label: "Control post-operatorio" },
      { code: "OTHER",                label: "Otro" },
    ],
  },
];

const LUTS_ITEMS: { symptom: LutsSymptom; label: string }[] = [
  { symptom: "NOCTURIA",            label: "Nicturia" },
  { symptom: "INCREASED_FREQUENCY", label: "Frecuencia diurna ↑" },
  { symptom: "URGENCY",             label: "Urgencia miccional" },
  { symptom: "WEAK_STREAM",         label: "Chorro débil" },
  { symptom: "INCOMPLETE_EMPTYING", label: "Vaciado incompleto" },
  { symptom: "TERMINAL_DRIPPING",   label: "Goteo terminal" },
  { symptom: "DYSURIA",             label: "Disuria" },
  { symptom: "HEMATURIA",           label: "Hematuria" },
  { symptom: "PELVIC_PAIN",         label: "Dolor pélvico/perineal" },
];

export default function Section4Urologico({
  form, setField, errors, toggleDiagnosis, setPrimaryDiagnosis,
  toggleLutsSymptom, updateLutsEntry,
}: Props) {
  const selectedDiagnoses = form.diagnoses;

  return (
    <div className="space-y-6">

      {/* Motivo de consulta */}
      <Field label="Motivo de consulta" required error={errors.chief_complaint}>
        <textarea
          rows={4} value={form.chief_complaint}
          onChange={e => setField("chief_complaint", e.target.value)}
          placeholder="Ej: Paciente masculino de 65 años que consulta por dificultad miccional progresiva de 6 meses de evolución, chorro débil y nocturia 3 veces por noche..."
          className={errors.chief_complaint
            ? "w-full px-3 py-2.5 text-sm bg-red-50 border border-red-300 rounded-xl outline-none focus:border-red-400 text-medflow-slate placeholder:text-red-200"
            : inputCls}
        />
      </Field>

      {/* Diagnósticos */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Diagnósticos</p>
          {selectedDiagnoses.length > 0 && (
            <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {selectedDiagnoses.length} seleccionado{selectedDiagnoses.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="space-y-4">
          {DIAGNOSIS_GROUPS.map(group => (
            <div key={group.title}>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">
                {group.emoji} {group.title}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {group.items.map(({ code, label }) => {
                  const entry = selectedDiagnoses.find(d => d.code === code);
                  const isSelected = !!entry;
                  return (
                    <div key={code} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleDiagnosis(code)}
                        className={cn(
                          "flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all text-left",
                          isSelected
                            ? "border-urology-blue bg-urology-blue-light"
                            : "border-slate-200 bg-slate-50 hover:border-slate-300"
                        )}
                      >
                        <div className={cn(
                          "w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center",
                          isSelected ? "bg-urology-blue border-urology-blue" : "border-slate-300"
                        )}>
                          {isSelected && <span className="text-white text-[9px] font-black">✓</span>}
                        </div>
                        <span className={isSelected ? "text-medflow-slate font-semibold" : "text-slate-600"}>
                          {label}
                        </span>
                      </button>
                      {isSelected && (
                        <button
                          type="button"
                          onClick={() => setPrimaryDiagnosis(code)}
                          className={cn(
                            "text-[9px] font-bold px-2 py-1.5 rounded-lg border transition-all flex-shrink-0",
                            entry.is_primary
                              ? "bg-medflow-emerald text-white border-transparent"
                              : "bg-slate-100 text-slate-400 border-slate-200 hover:border-slate-300"
                          )}
                          title="Marcar como diagnóstico principal"
                        >
                          {entry.is_primary ? "PRINCIPAL" : "Principal"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Síntomas LUTS */}
      <div>
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Síntomas del Tracto Urinario Inferior (LUTS)
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {LUTS_ITEMS.map(({ symptom, label }) => {
            const entry = form.luts_symptoms.find(l => l.symptom === symptom);
            const isActive = !!entry;
            return (
              <div key={symptom} className={cn(
                "rounded-xl border p-3 transition-all",
                isActive ? "border-urology-blue bg-urology-blue-light" : "border-slate-200 bg-slate-50"
              )}>
                <button
                  type="button"
                  onClick={() => toggleLutsSymptom(symptom)}
                  className="flex items-center gap-2 w-full text-left"
                >
                  <div className={cn(
                    "w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center",
                    isActive ? "bg-urology-blue border-urology-blue" : "border-slate-300"
                  )}>
                    {isActive && <span className="text-white text-[9px] font-black">✓</span>}
                  </div>
                  <span className={cn("text-xs font-semibold", isActive ? "text-medflow-slate" : "text-slate-600")}>
                    {label}
                  </span>
                </button>

                {isActive && (
                  <div className="mt-2 space-y-1.5">
                    <select
                      value={entry.severity}
                      onChange={e => updateLutsEntry(symptom, "severity", e.target.value)}
                      className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-urology-blue"
                    >
                      <option value="">Severidad...</option>
                      <option value="MILD">Leve</option>
                      <option value="MODERATE">Moderada</option>
                      <option value="SEVERE">Severa</option>
                    </select>
                    {symptom === "NOCTURIA" && (
                      <input
                        type="number" min={0} max={30}
                        value={entry.nocturia_times}
                        onChange={e => updateLutsEntry(symptom, "nocturia_times", e.target.value)}
                        placeholder="Veces/noche"
                        className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-urology-blue"
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
