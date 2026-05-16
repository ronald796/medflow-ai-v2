"use client";

import { cn } from "@/lib/utils";
import { Field, Grid2, Grid3, ClinicalBadge, RadioGroup, inputCls } from "./PF_Shared";
import type { Signal } from "./PF_Shared";
import type { PatientFormState } from "@/types/patient-form";

interface Props {
  form: PatientFormState;
  setField: <K extends keyof PatientFormState>(field: K, value: PatientFormState[K]) => void;
  ratioLT: number | null;
  densidadPSA: number | null;
  imc: number | null;
}

function ratioSignal(r: number | null): Signal {
  if (r === null) return null;
  if (r < 15) return "red";
  if (r < 20) return "amber";
  return "green";
}

function densitySignal(d: number | null): Signal {
  if (d === null) return null;
  if (d > 0.15) return "red";
  if (d > 0.10) return "amber";
  return "green";
}

function imcSignal(imc: number | null): Signal {
  if (imc === null) return null;
  if (imc < 18.5) return "amber";
  if (imc < 25)   return "green";
  if (imc < 30)   return "amber";
  return "red";
}

function imcLabel(imc: number | null): string {
  if (imc === null) return "—";
  if (imc < 18.5) return `${imc.toFixed(1)} · Bajo peso`;
  if (imc < 25)   return `${imc.toFixed(1)} · Normal`;
  if (imc < 30)   return `${imc.toFixed(1)} · Sobrepeso`;
  return `${imc.toFixed(1)} · Obesidad`;
}

function ipssLabel(score: number): { label: string; signal: Signal } {
  if (score <= 7)  return { label: "Leve",    signal: "green" };
  if (score <= 19) return { label: "Moderado", signal: "amber" };
  return              { label: "Severo",   signal: "red" };
}

const DRE_SIZE_OPTIONS = [
  { value: "GRADE_I",   label: "Grado I — < 25 cc" },
  { value: "GRADE_II",  label: "Grado II — 25-50 cc" },
  { value: "GRADE_III", label: "Grado III — 50-80 cc" },
  { value: "GRADE_IV",  label: "Grado IV — > 80 cc" },
];

const DRE_CONSISTENCY_OPTIONS = [
  { value: "NORMAL",    label: "Normal" },
  { value: "INCREASED", label: "Aumentada" },
  { value: "STONY",     label: "Pétrea" },
];

const DRE_LOCATION_OPTIONS = [
  { value: "RIGHT_LOBE", label: "Lóbulo derecho" },
  { value: "LEFT_LOBE",  label: "Lóbulo izquierdo" },
  { value: "BILATERAL",  label: "Bilateral" },
  { value: "APEX",       label: "Ápex" },
];

export default function Section5Clinicos({ form, setField, ratioLT, densidadPSA, imc }: Props) {
  const ipssNum = parseInt(form.ipss) || 0;
  const ipssInfo = form.ipss ? ipssLabel(ipssNum) : null;

  return (
    <div className="space-y-6">

      {/* Marcadores PSA */}
      <div>
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-3">Marcadores Tumorales (PSA)</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Field label="PSA Total (ng/mL)">
            <input type="number" min={0} step={0.01} value={form.psa_total}
              onChange={e => setField("psa_total", e.target.value)}
              placeholder="0.00" className={`${inputCls} font-mono text-urology-blue`} />
          </Field>
          <Field label="PSA Libre (ng/mL)">
            <input type="number" min={0} step={0.01} value={form.psa_libre}
              onChange={e => setField("psa_libre", e.target.value)}
              placeholder="0.00" className={`${inputCls} font-mono`} />
          </Field>
          <Field label="Vol. Prostático (cc)">
            <input type="number" min={0} step={0.1} value={form.volumen_prostatico}
              onChange={e => setField("volumen_prostatico", e.target.value)}
              placeholder="Ej: 35.5" className={inputCls} />
          </Field>
          <Field label="Testosterona (ng/dL)">
            <input type="number" min={0} step={1} value={form.testosterone_total}
              onChange={e => setField("testosterone_total", e.target.value)}
              placeholder="Opcional" className={inputCls} />
          </Field>
        </div>

        {(ratioLT !== null || densidadPSA !== null) && (
          <div className="grid grid-cols-2 gap-3 mt-3">
            {ratioLT !== null && (
              <ClinicalBadge
                value={`${ratioLT.toFixed(1)}%`}
                label={`Índice L/T — ${ratioLT < 15 ? "Alta sospecha" : ratioLT < 20 ? "Vigilancia" : "HBP probable"}`}
                signal={ratioSignal(ratioLT)}
              />
            )}
            {densidadPSA !== null && (
              <ClinicalBadge
                value={densidadPSA.toFixed(3)}
                label={`Densidad PSA — ${densidadPSA > 0.15 ? "Considerar biopsia" : "Normal"}`}
                signal={densitySignal(densidadPSA)}
              />
            )}
          </div>
        )}
      </div>

      {/* IPSS */}
      <div>
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-3">Score IPSS (0-35)</p>
        <div className="flex items-center gap-3">
          <input type="number" min={0} max={35} value={form.ipss}
            onChange={e => setField("ipss", e.target.value)}
            placeholder="0"
            className={`${inputCls} w-24`}
          />
          {ipssInfo && (
            <span className={cn(
              "text-xs font-bold px-3 py-2 rounded-xl border",
              ipssInfo.signal === "green" ? "bg-medflow-emerald-light text-medflow-emerald border-medflow-emerald/20" :
              ipssInfo.signal === "amber" ? "bg-amber-50 text-amber-700 border-amber-200" :
              "bg-red-50 text-red-700 border-red-200"
            )}>
              {ipssInfo.label}
            </span>
          )}
          <span className="text-xs text-slate-400">0-7 Leve · 8-19 Moderado · 20-35 Severo</span>
        </div>
      </div>

      {/* Exploración física */}
      <div>
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-3">Exploración física y Signos vitales</p>
        <Grid3>
          <Field label="Peso (kg)">
            <input type="number" min={0} step={0.1} value={form.weight_kg}
              onChange={e => setField("weight_kg", e.target.value)}
              placeholder="Ej: 82.5" className={inputCls} />
          </Field>
          <Field label="Talla (cm)">
            <input type="number" min={0} step={0.5} value={form.height_cm}
              onChange={e => setField("height_cm", e.target.value)}
              placeholder="Ej: 174" className={inputCls} />
          </Field>
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">IMC</p>
            <ClinicalBadge value={imcLabel(imc)} label="Índice de Masa Corporal" signal={imcSignal(imc)} />
          </div>
        </Grid3>

        <div className="grid grid-cols-3 gap-3 mt-3">
          <Field label="TA Sistólica (mmHg)">
            <input type="number" min={0} value={form.bp_systolic}
              onChange={e => setField("bp_systolic", e.target.value)}
              placeholder="120" className={inputCls} />
          </Field>
          <Field label="TA Diastólica (mmHg)">
            <input type="number" min={0} value={form.bp_diastolic}
              onChange={e => setField("bp_diastolic", e.target.value)}
              placeholder="80" className={inputCls} />
          </Field>
          <Field label="FC (lpm)">
            <input type="number" min={0} value={form.heart_rate}
              onChange={e => setField("heart_rate", e.target.value)}
              placeholder="72" className={inputCls} />
          </Field>
        </div>
      </div>

      {/* DRE */}
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-medflow-slate">Tacto Rectal (DRE)</p>
            <p className="text-[10px] text-slate-400">Digital Rectal Examination — examen crítico urológico</p>
          </div>
          <button
            type="button"
            onClick={() => setField("dre_performed", !form.dre_performed)}
            className={cn(
              "inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all",
              form.dre_performed
                ? "bg-urology-blue text-white border-transparent"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
            )}
          >
            {form.dre_performed ? "✓ DRE realizado" : "DRE no realizado"}
          </button>
        </div>

        {form.dre_performed && (
          <div className="space-y-4 pt-2 border-t border-slate-200">
            <Grid2>
              <Field label="Tamaño prostático">
                <select value={form.dre_prostate_size}
                  onChange={e => setField("dre_prostate_size", e.target.value as PatientFormState["dre_prostate_size"])}
                  className={inputCls}>
                  <option value="">Seleccionar...</option>
                  {DRE_SIZE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>
              <Field label="Consistencia">
                <select value={form.dre_consistency}
                  onChange={e => setField("dre_consistency", e.target.value as PatientFormState["dre_consistency"])}
                  className={inputCls}>
                  <option value="">Seleccionar...</option>
                  {DRE_CONSISTENCY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>
            </Grid2>

            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <p className="text-xs font-semibold text-slate-500">Nódulos palpables:</p>
                <RadioGroup
                  options={[{ value: "true", label: "Sí" }, { value: "false", label: "No" }]}
                  value={form.dre_nodules ? "true" : "false"}
                  onChange={v => setField("dre_nodules", v === "true")}
                />
              </div>
              {form.dre_nodules && (
                <Field label="Localización">
                  <select value={form.dre_nodule_location}
                    onChange={e => setField("dre_nodule_location", e.target.value as PatientFormState["dre_nodule_location"])}
                    className={inputCls}>
                    <option value="">Seleccionar...</option>
                    {DRE_LOCATION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </Field>
              )}
              <div className="flex items-center gap-4">
                <p className="text-xs font-semibold text-slate-500">¿Doloroso?</p>
                <RadioGroup
                  options={[{ value: "true", label: "Sí" }, { value: "false", label: "No" }]}
                  value={form.dre_painful ? "true" : "false"}
                  onChange={v => setField("dre_painful", v === "true")}
                />
              </div>
            </div>

            <Field label="Hallazgos adicionales">
              <textarea rows={2} value={form.dre_notes}
                onChange={e => setField("dre_notes", e.target.value)}
                placeholder="Ej: Lóbulo derecho indurado, sulco interlobular borrado..."
                className={inputCls}
              />
            </Field>
          </div>
        )}
      </div>
    </div>
  );
}
