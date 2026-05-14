"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  User, Phone, Mail, CreditCard, Calendar,
  Activity, AlertTriangle, FileText, ChevronLeft,
  Loader2, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FormData {
  // Datos personales
  nombre: string;
  cedula: string;
  edad: string;
  fechaNacimiento: string;
  telefono: string;
  email: string;
  // Perfil urológico
  psaTotal: string;
  psaLibre: string;
  volumenProstatico: string;
  ipss: string;
  antecedentesFA: string;
  motivoConsulta: string;
  diagnosticoPrincipal: string;
  // Antecedentes
  hipertension: boolean;
  diabetes: boolean;
  cirugiaPrevia: boolean;
  notasAdicionales: string;
}

const EMPTY: FormData = {
  nombre: "", cedula: "", edad: "", fechaNacimiento: "",
  telefono: "", email: "",
  psaTotal: "", psaLibre: "", volumenProstatico: "", ipss: "",
  antecedentesFA: "no", motivoConsulta: "", diagnosticoPrincipal: "",
  hipertension: false, diabetes: false, cirugiaPrevia: false,
  notasAdicionales: "",
};

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-medflow-emerald focus:bg-white transition-colors text-medflow-slate placeholder:text-slate-300";

export default function NuevoPaciente() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const set = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const toggle = (field: keyof FormData) => () =>
    setForm((p) => ({ ...p, [field]: !p[field as keyof FormData] }));

  // Ratio PSA Libre/Total en tiempo real
  const psaTotalNum = parseFloat(form.psaTotal) || 0;
  const psaLibreNum = parseFloat(form.psaLibre) || 0;
  const ratio = psaTotalNum > 0 && psaLibreNum > 0
    ? (psaLibreNum / psaTotalNum * 100).toFixed(1)
    : null;
  const ratioCls = ratio
    ? parseFloat(ratio) < 15
      ? "text-red-500 bg-red-50 border-red-100"
      : parseFloat(ratio) < 20
      ? "text-amber-600 bg-amber-50 border-amber-100"
      : "text-medflow-emerald bg-medflow-emerald-light border-medflow-emerald/20"
    : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: conectar a POST /api/v1/patients en el backend
    await new Promise((r) => setTimeout(r, 800));
    setDone(true);
    setTimeout(() => router.push("/pacientes"), 1500);
  };

  if (done) {
    return (
      <div className="max-w-xl mx-auto mt-20 flex flex-col items-center gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-medflow-emerald-light flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-medflow-emerald" />
        </div>
        <h2 className="text-lg font-bold text-medflow-slate">Paciente registrado con éxito</h2>
        <p className="text-sm text-slate-400">Redirigiendo a la lista de pacientes...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-medflow-slate">Nuevo Paciente Urológico</h1>
          <p className="text-sm text-slate-400 mt-0.5">Completa el perfil clínico inicial</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* ── Datos personales ─────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-medflow-emerald" />
            <h2 className="text-sm font-bold text-medflow-slate">Datos Personales</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Nombre completo" required>
              <input type="text" value={form.nombre} onChange={set("nombre")} required
                placeholder="Ej: Carlos Eduardo Medina" className={inputCls} />
            </Field>
            <Field label="Cédula de Identidad">
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input type="text" value={form.cedula} onChange={set("cedula")}
                  placeholder="V-12345678" className={cn(inputCls, "pl-9")} />
              </div>
            </Field>
            <Field label="Edad" required>
              <input type="number" min={1} max={120} value={form.edad} onChange={set("edad")} required
                placeholder="Ej: 65" className={inputCls} />
            </Field>
            <Field label="Fecha de Nacimiento">
              <input type="date" value={form.fechaNacimiento} onChange={set("fechaNacimiento")}
                className={inputCls} />
            </Field>
            <Field label="Teléfono">
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input type="tel" value={form.telefono} onChange={set("telefono")}
                  placeholder="+58 412-0000000" className={cn(inputCls, "pl-9")} />
              </div>
            </Field>
            <Field label="Correo electrónico">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input type="email" value={form.email} onChange={set("email")}
                  placeholder="paciente@email.com" className={cn(inputCls, "pl-9")} />
              </div>
            </Field>
          </div>
        </div>

        {/* ── Perfil Urológico ─────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-urology-blue" />
            <h2 className="text-sm font-bold text-medflow-slate">Perfil Urológico</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="PSA Total (ng/mL)">
              <input type="number" step="0.01" min={0} value={form.psaTotal} onChange={set("psaTotal")}
                placeholder="0.00" className={cn(inputCls, "font-mono text-urology-blue")} />
            </Field>
            <Field label="PSA Libre (ng/mL)">
              <input type="number" step="0.01" min={0} value={form.psaLibre} onChange={set("psaLibre")}
                placeholder="0.00" className={cn(inputCls, "font-mono text-urology-blue")} />
            </Field>

            {/* Calculadora ratio en tiempo real */}
            {ratio && (
              <div className={cn("md:col-span-2 rounded-xl border px-4 py-3 flex items-center justify-between", ratioCls)}>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide opacity-70">Índice PSA Libre / Total</p>
                  <p className="text-2xl font-black">{ratio}%</p>
                </div>
                <p className="text-xs font-semibold max-w-[200px] text-right">
                  {parseFloat(ratio) < 15
                    ? "⚠️ Sospechoso de malignidad — considerar biopsia"
                    : parseFloat(ratio) < 20
                    ? "Zona gris — seguimiento estrecho"
                    : "✓ Compatible con HBP benigna"}
                </p>
              </div>
            )}

            <Field label="Volumen Prostático (cc)">
              <input type="number" step="0.1" min={0} value={form.volumenProstatico} onChange={set("volumenProstatico")}
                placeholder="Ej: 35.5" className={inputCls} />
            </Field>
            <Field label="Score IPSS (0-35)">
              <input type="number" min={0} max={35} value={form.ipss} onChange={set("ipss")}
                placeholder="0 = sin síntomas · 35 = muy severo" className={inputCls} />
            </Field>
            <Field label="Antecedentes Familiares (CA Próstata)">
              <select value={form.antecedentesFA} onChange={set("antecedentesFA")} className={inputCls}>
                <option value="no">No</option>
                <option value="padre">Sí — Padre</option>
                <option value="hermano">Sí — Hermano(s)</option>
                <option value="ambos">Sí — Padre y Hermanos</option>
              </select>
            </Field>
            <Field label="Diagnóstico Principal">
              <select value={form.diagnosticoPrincipal} onChange={set("diagnosticoPrincipal")} className={inputCls}>
                <option value="">Seleccionar...</option>
                <option value="HBP">HBP (Hiperplasia Benigna)</option>
                <option value="PSA elevado">PSA Elevado en estudio</option>
                <option value="Litiasis renal">Litiasis Renal</option>
                <option value="CA próstata">CA Próstata</option>
                <option value="ITU recurrente">ITU Recurrente</option>
                <option value="Disfunción eréctil">Disfunción Eréctil</option>
                <option value="Control post-op">Control Post-Operatorio</option>
                <option value="Otro">Otro</option>
              </select>
            </Field>
            <div className="md:col-span-2">
              <Field label="Motivo de Consulta" required>
                <textarea value={form.motivoConsulta} onChange={set("motivoConsulta")} required
                  rows={2} placeholder="Ej: Síntomas obstructivos del tracto urinario inferior, chorro débil..."
                  className={inputCls} />
              </Field>
            </div>
          </div>
        </div>

        {/* ── Antecedentes ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-bold text-medflow-slate">Antecedentes Patológicos</h2>
          </div>
          <div className="flex flex-wrap gap-3 mb-4">
            {[
              { field: "hipertension" as const, label: "Hipertensión Arterial" },
              { field: "diabetes" as const, label: "Diabetes Mellitus" },
              { field: "cirugiaPrevia" as const, label: "Cirugía Urológica Previa" },
            ].map(({ field, label }) => (
              <button key={field} type="button" onClick={toggle(field)}
                className={cn(
                  "inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-all",
                  form[field]
                    ? "bg-medflow-slate text-white border-transparent"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300"
                )}>
                <span className={cn("w-3 h-3 rounded-full border-2 flex-shrink-0",
                  form[field] ? "bg-medflow-emerald border-medflow-emerald" : "border-slate-300")} />
                {label}
              </button>
            ))}
          </div>
          <Field label="Notas adicionales">
            <textarea value={form.notasAdicionales} onChange={set("notasAdicionales")}
              rows={2} placeholder="Medicación actual, alergias, observaciones relevantes..."
              className={inputCls} />
          </Field>
        </div>

        {/* ── Actions ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3 pb-6">
          <button type="button" onClick={() => router.back()}
            className="px-5 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold bg-medflow-emerald text-white rounded-xl hover:bg-medflow-emerald-hover shadow-sm hover:shadow-md transition-all disabled:opacity-50">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : "Registrar Paciente"}
          </button>
        </div>

      </form>
    </div>
  );
}
