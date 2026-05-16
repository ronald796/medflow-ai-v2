"use client";

import { Plus, X } from "lucide-react";
import { CheckboxCard, RadioGroup, Field, Grid2, inputCls } from "./PF_Shared";
import type { PatientFormState, ComorbidityCode, MedicationEntry } from "@/types/patient-form";

interface Props {
  form: PatientFormState;
  setField: <K extends keyof PatientFormState>(field: K, value: PatientFormState[K]) => void;
  toggleComorbidity: (c: ComorbidityCode) => void;
  addMedication: () => void;
  updateMedication: (i: number, field: keyof MedicationEntry, value: string) => void;
  removeMedication: (i: number) => void;
}

const COMORBIDITIES: { code: ComorbidityCode; label: string }[] = [
  { code: "HTA",           label: "Hipertensión Arterial" },
  { code: "DM2",           label: "Diabetes Mellitus tipo 2" },
  { code: "DYSLIPIDEMIA",  label: "Dislipidemia" },
  { code: "ISCHEMIC_HEART", label: "Cardiopatía isquémica" },
  { code: "CKD",           label: "Insuf. Renal Crónica" },
  { code: "COPD_ASTHMA",   label: "EPOC / Asma" },
  { code: "LIVER_DISEASE", label: "Hepatopatía crónica" },
  { code: "THYROID",       label: "Tiroides" },
  { code: "OBESITY",       label: "Obesidad" },
];

const SMOKING_OPTS = [
  { value: "NEVER",     label: "Nunca" },
  { value: "EX_SMOKER", label: "Ex-fumador" },
  { value: "ACTIVE",    label: "Activo" },
];

const ALCOHOL_OPTS = [
  { value: "NEVER",    label: "Nunca" },
  { value: "SOCIAL",   label: "Social" },
  { value: "MODERATE", label: "Moderado" },
  { value: "EXCESSIVE", label: "Excesivo" },
];

export default function Section2Antecedentes({
  form, setField, toggleComorbidity,
  addMedication, updateMedication, removeMedication,
}: Props) {
  return (
    <div className="space-y-5">

      {/* Comorbilidades */}
      <div>
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-3">Comorbilidades</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {COMORBIDITIES.map(c => (
            <CheckboxCard
              key={c.code}
              label={c.label}
              checked={form.comorbidities.includes(c.code)}
              onChange={() => toggleComorbidity(c.code)}
            />
          ))}
        </div>
      </div>

      {/* Tabaquismo */}
      <div className="space-y-3">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Tabaquismo</p>
        <RadioGroup
          options={SMOKING_OPTS}
          value={form.smoking_status}
          onChange={v => setField("smoking_status", v as PatientFormState["smoking_status"])}
        />
        {(form.smoking_status === "EX_SMOKER" || form.smoking_status === "ACTIVE") && (
          <div className="w-48">
            <Field label="Paquetes/año">
              <input
                type="number" min={0} step={0.5}
                value={form.smoking_pack_years}
                onChange={e => setField("smoking_pack_years", e.target.value)}
                placeholder="Ej: 20"
                className={inputCls}
              />
            </Field>
          </div>
        )}
      </div>

      {/* Alcohol */}
      <div className="space-y-2">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Consumo de alcohol</p>
        <RadioGroup
          options={ALCOHOL_OPTS}
          value={form.alcohol_consumption}
          onChange={v => setField("alcohol_consumption", v as PatientFormState["alcohol_consumption"])}
        />
      </div>

      {/* Cirugías + Alergias */}
      <Grid2>
        <Field label="Cirugías previas">
          <textarea
            rows={3} value={form.previous_surgeries}
            onChange={e => setField("previous_surgeries", e.target.value)}
            placeholder="Ej: Apendicectomía 2010, Hernia inguinal 2015..."
            className={inputCls}
          />
        </Field>
        <div className="space-y-3">
          <Field label="Alergias">
            <textarea
              rows={2} value={form.allergies}
              onChange={e => setField("allergies", e.target.value)}
              placeholder="Penicilina, AINEs, Látex..."
              className={inputCls}
              disabled={form.no_drug_allergies}
            />
          </Field>
          <button
            type="button"
            onClick={() => {
              setField("no_drug_allergies", !form.no_drug_allergies);
              if (!form.no_drug_allergies) setField("allergies", "");
            }}
            className={`flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl border transition-all ${
              form.no_drug_allergies
                ? "border-medflow-emerald bg-medflow-emerald-light text-medflow-emerald"
                : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"
            }`}
          >
            <span className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
              form.no_drug_allergies ? "bg-medflow-emerald border-medflow-emerald" : "border-slate-300"
            }`}>
              {form.no_drug_allergies && <span className="text-white text-[10px] font-black">✓</span>}
            </span>
            NKDA — Sin alergias conocidas
          </button>
        </div>
      </Grid2>

      {/* Medicación actual */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Medicación actual</p>
          <button
            type="button" onClick={addMedication}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-urology-blue hover:underline"
          >
            <Plus className="w-3.5 h-3.5" /> Agregar medicamento
          </button>
        </div>

        {form.medications.length === 0 ? (
          <p className="text-xs text-slate-400 italic text-center py-4 border border-dashed border-slate-200 rounded-xl">
            Sin medicamentos registrados
          </p>
        ) : (
          <div className="space-y-2">
            {form.medications.map((med, i) => (
              <div key={i} className="grid grid-cols-[1fr_100px_120px_36px] gap-2 items-end">
                <div>
                  {i === 0 && <p className="text-[10px] text-slate-400 mb-1">Nombre</p>}
                  <input
                    type="text" value={med.name}
                    onChange={e => updateMedication(i, "name", e.target.value)}
                    placeholder="Ej: Tamsulosina"
                    className={inputCls}
                  />
                </div>
                <div>
                  {i === 0 && <p className="text-[10px] text-slate-400 mb-1">Dosis</p>}
                  <input
                    type="text" value={med.dose}
                    onChange={e => updateMedication(i, "dose", e.target.value)}
                    placeholder="0.4 mg"
                    className={inputCls}
                  />
                </div>
                <div>
                  {i === 0 && <p className="text-[10px] text-slate-400 mb-1">Frecuencia</p>}
                  <input
                    type="text" value={med.frequency}
                    onChange={e => updateMedication(i, "frequency", e.target.value)}
                    placeholder="1 vez/día"
                    className={inputCls}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeMedication(i)}
                  className="p-2 rounded-xl hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
