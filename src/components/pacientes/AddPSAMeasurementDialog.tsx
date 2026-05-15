"use client";

import { useState } from "react";
import { X, Loader2, CheckCircle2, FlaskConical } from "lucide-react";
import { createPsaMeasurement, ClinicalContext } from "@/lib/api";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface FormState {
  measurement_date: string;
  psa_total: string;
  psa_free: string;
  prostate_volume: string;
  lab_name: string;
  clinical_context: ClinicalContext;
  notes: string;
}

interface Errors {
  psa_total?: string;
  measurement_date?: string;
}

const CONTEXT_OPTIONS: { value: ClinicalContext; label: string }[] = [
  { value: "FOLLOW_UP",           label: "Seguimiento / Control" },
  { value: "SCREENING",           label: "Tamizaje / Screening" },
  { value: "ACTIVE_SURVEILLANCE", label: "Vigilancia activa" },
  { value: "POST_BIOPSY",         label: "Post-biopsia" },
  { value: "POST_RTU",            label: "Post-RTU próstata" },
  { value: "POST_PROSTATECTOMY",  label: "Post-prostatectomía" },
  { value: "POST_RADIOTHERAPY",   label: "Post-radioterapia" },
  { value: "POST_HORMONOTHERAPY", label: "Post-hormonoterapia" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const inputCls = "w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-medflow-emerald focus:bg-white transition-colors text-medflow-slate placeholder:text-slate-300";

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  patientId: string;
  patientName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddPSAMeasurementDialog({
  patientId, patientName, onClose, onSuccess,
}: Props) {
  const [form, setForm] = useState<FormState>({
    measurement_date: today(),
    psa_total: "",
    psa_free: "",
    prostate_volume: "",
    lab_name: "",
    clinical_context: "FOLLOW_UP",
    notes: "",
  });
  const [errors, setErrors]   = useState<Errors>({});
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const set = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [field]: e.target.value }));

  // Live-calculated ratio preview
  const psaTotal = parseFloat(form.psa_total) || 0;
  const psaFree  = parseFloat(form.psa_free)  || 0;
  const ratioPreview = psaTotal > 0 && psaFree > 0
    ? ((psaFree / psaTotal) * 100).toFixed(1)
    : null;

  const validate = (): boolean => {
    const e: Errors = {};
    if (!form.measurement_date) e.measurement_date = "Fecha requerida";
    if (!form.psa_total || psaTotal <= 0) e.psa_total = "PSA Total debe ser > 0";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setApiError(null);
    try {
      await createPsaMeasurement(patientId, {
        measurement_date:  form.measurement_date,
        psa_total:         psaTotal,
        psa_free:          psaFree > 0 ? psaFree : undefined,
        prostate_volume:   parseFloat(form.prostate_volume) || undefined,
        lab_name:          form.lab_name.trim() || undefined,
        clinical_context:  form.clinical_context,
        notes:             form.notes.trim() || undefined,
      });
      setSaved(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    // Overlay
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-medflow-slate/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-4 border-b border-slate-100 rounded-t-2xl z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-urology-blue-light flex items-center justify-center">
              <FlaskConical className="w-4 h-4 text-urology-blue" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-medflow-slate">Nueva Medición PSA</h2>
              <p className="text-[10px] text-slate-400">{patientName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success state */}
        {saved ? (
          <div className="flex flex-col items-center gap-3 py-12 px-5 text-center">
            <div className="w-14 h-14 rounded-full bg-medflow-emerald-light flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-medflow-emerald" />
            </div>
            <p className="text-base font-bold text-medflow-slate">Medición registrada</p>
            <p className="text-sm text-slate-400">
              PSA {psaTotal.toFixed(2)} ng/mL — {form.measurement_date}
            </p>
            {ratioPreview && (
              <span className={cn(
                "text-xs font-bold px-3 py-1 rounded-full",
                parseFloat(ratioPreview) < 15
                  ? "bg-red-50 text-red-600"
                  : parseFloat(ratioPreview) < 20
                  ? "bg-amber-50 text-amber-600"
                  : "bg-medflow-emerald-light text-medflow-emerald"
              )}>
                Índice L/T: {ratioPreview}%
              </span>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">

            {/* Fecha + Contexto */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Fecha de extracción <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={form.measurement_date}
                  onChange={set("measurement_date")}
                  max={today()}
                  className={cn(inputCls, errors.measurement_date && "border-red-300")}
                />
                {errors.measurement_date && (
                  <p className="text-[10px] text-red-500 mt-1">{errors.measurement_date}</p>
                )}
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Contexto clínico
                </label>
                <select value={form.clinical_context} onChange={set("clinical_context")} className={inputCls}>
                  {CONTEXT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* PSA Total + Libre */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  PSA Total (ng/mL) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number" min={0} step={0.01}
                  value={form.psa_total}
                  onChange={set("psa_total")}
                  placeholder="0.00"
                  className={cn(inputCls, "font-mono text-urology-blue", errors.psa_total && "border-red-300")}
                />
                {errors.psa_total && (
                  <p className="text-[10px] text-red-500 mt-1">{errors.psa_total}</p>
                )}
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  PSA Libre (ng/mL)
                </label>
                <input
                  type="number" min={0} step={0.01}
                  value={form.psa_free}
                  onChange={set("psa_free")}
                  placeholder="Opcional"
                  className={cn(inputCls, "font-mono")}
                />
              </div>
            </div>

            {/* Ratio preview en tiempo real */}
            {ratioPreview && (
              <div className={cn(
                "rounded-xl px-3 py-2.5 border flex items-center justify-between",
                parseFloat(ratioPreview) < 15
                  ? "bg-red-50 border-red-100"
                  : parseFloat(ratioPreview) < 20
                  ? "bg-amber-50 border-amber-100"
                  : "bg-medflow-emerald-light border-medflow-emerald/20"
              )}>
                <span className="text-[10px] font-semibold text-slate-500 uppercase">Índice Libre/Total calculado</span>
                <span className={cn(
                  "text-lg font-black",
                  parseFloat(ratioPreview) < 15 ? "text-red-600" :
                  parseFloat(ratioPreview) < 20 ? "text-amber-700" : "text-medflow-emerald"
                )}>
                  {ratioPreview}%
                </span>
              </div>
            )}

            {/* Volumen + Laboratorio */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Volumen prostático (cc)
                </label>
                <input
                  type="number" min={0} step={0.1}
                  value={form.prostate_volume}
                  onChange={set("prostate_volume")}
                  placeholder="Ej: 35.5"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Laboratorio
                </label>
                <input
                  type="text"
                  value={form.lab_name}
                  onChange={set("lab_name")}
                  placeholder="Ej: Laboratorio Central"
                  className={inputCls}
                />
              </div>
            </div>

            {/* Notas */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Notas clínicas
              </label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={set("notes")}
                placeholder="Observaciones, medicación activa, contexto relevante..."
                className={inputCls}
              />
            </div>

            {/* Error API */}
            {apiError && (
              <div className="rounded-xl bg-red-50 border border-red-100 px-3 py-2.5 text-xs text-red-700">
                {apiError}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 text-sm font-bold bg-urology-blue text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : "Registrar medición"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
