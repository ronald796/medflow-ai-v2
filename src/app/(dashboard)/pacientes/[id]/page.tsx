"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Phone, Mail, Calendar, Activity,
  Ruler, ClipboardList, User, Loader2, AlertCircle,
  Plus, Trash2, RefreshCw, FlaskConical,
} from "lucide-react";
import { getPatientById } from "@/lib/mock-patients";
import { Patient, PatientStatus } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";
import PsaChart from "@/components/pacientes/PsaChart";
import PsaRatioCard from "@/components/pacientes/PsaRatioCard";
import DicomUpload from "@/components/pacientes/DicomUpload";
import MedIAPanel from "@/components/pacientes/MedIAPanel";
import PSAHistoryChart from "@/components/pacientes/PSAHistoryChart";
import PSAMetricsPanel from "@/components/pacientes/PSAMetricsPanel";
import AddPSAMeasurementDialog from "@/components/pacientes/AddPSAMeasurementDialog";
import DeletePatientButton from "@/components/pacientes/DeletePatientButton";
import SummaryTab from "@/components/pacientes/tabs/SummaryTab";
import AntecedentesTab from "@/components/pacientes/tabs/AntecedentesTab";
import UrologicoTab from "@/components/pacientes/tabs/UrologicoTab";
import { usePSAHistory } from "@/hooks/usePSAHistory";
import { deletePsaMeasurement, getPatientExpanded } from "@/lib/api";
import type { PatientExpandedDB } from "@/lib/patient-expanded-types";
import {
  DIAGNOSIS_LABELS, BLOOD_TYPE_LABELS, SEX_LABELS,
  psaTotalSignal, signalBadgeClass,
} from "@/lib/clinical-translations";
import { PSAMeasurementOut } from "@/lib/api";

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CFG: Record<PatientStatus, { label: string; className: string }> = {
  "control-psa":       { label: "Control PSA",      className: "bg-urology-blue-light text-urology-blue" },
  "post-op":           { label: "Post-Op",           className: "bg-medflow-emerald-light text-medflow-emerald" },
  "pendiente-biopsia": { label: "Biopsia Pendiente", className: "bg-red-50 text-red-600" },
  nuevo:               { label: "Nuevo",             className: "bg-amber-50 text-amber-600" },
  alta:                { label: "Alta",              className: "bg-slate-100 text-slate-500" },
};

type Tab = "resumen" | "antecedentes" | "urologico" | "psa" | "facturacion";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "resumen",       label: "Resumen",          icon: "📊" },
  { id: "antecedentes",  label: "Antecedentes",     icon: "🏥" },
  { id: "urologico",     label: "Perfil Urológico",  icon: "🩺" },
  { id: "psa",           label: "Evolución PSA",     icon: "📈" },
  { id: "facturacion",   label: "Facturación",       icon: "💰" },
];

// ── Mapeo desde backend expandido → Patient (para componentes legacy) ─────────

function dbToPatient(p: PatientExpandedDB): Patient {
  const psaHistory = p.psa_total !== null
    ? [{ date: p.fecha_registro.slice(0, 10), psaTotal: p.psa_total, psaFree: p.psa_libre ?? 0, label: "Registro inicial" }]
    : [];
  const antCa = p.antecedentes_ca || "no";
  const notes = [
    antCa !== "no" ? `Antec. familiar CA próstata: ${antCa}` : "",
    p.previous_surgeries ?? "", p.notas ?? "",
  ].filter(Boolean).join(" · ") || undefined;

  return {
    id: p.id, name: p.nombre, cedula: p.cedula ?? "—", age: p.edad_calculada ?? p.edad,
    birthDate: p.fecha_nacimiento ?? "", phone: p.telefono ?? "—",
    email: p.email ?? undefined,
    status: (p.indice_psa && p.indice_psa < 15) ? "pendiente-biopsia"
          : (p.psa_total && p.psa_total > 4)     ? "control-psa"
          : "nuevo",
    lastVisit: p.fecha_registro.slice(0, 10),
    primaryDiagnosis: p.diagnostico_primario
      ? (DIAGNOSIS_LABELS[p.diagnostico_primario] ?? p.diagnostico_primario)
      : (p.motivo_consulta ?? p.chief_complaint ?? "Sin diagnóstico registrado"),
    prostaticVolume: p.volumen_prostatico ?? undefined,
    ipssScore: p.ipss ?? undefined,
    psaHistory, ecos: [], notes,
  };
}

// ── PSA history table ─────────────────────────────────────────────────────────

function PSAHistoryTable({
  measurements, onDelete,
}: {
  measurements: PSAMeasurementOut[] | undefined;
  onDelete: (id: string) => void;
}) {
  const CONTEXT_ES: Record<string, string> = {
    FOLLOW_UP: "Seguimiento", SCREENING: "Tamizaje", ACTIVE_SURVEILLANCE: "Vigilancia",
    POST_BIOPSY: "Post-biopsia", POST_RTU: "Post-RTU", POST_PROSTATECTOMY: "Post-prostatectomía",
    POST_RADIOTHERAPY: "Post-radioterapia", POST_HORMONOTHERAPY: "Post-hormonoterapia",
  };
  if (!measurements?.length) return null;
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-50">
        <h3 className="text-sm font-semibold text-medflow-slate">Historial completo</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50/60">
              {["Fecha","PSA Total","PSA Libre","Índice L/T","Densidad","Contexto",""].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {measurements.map(m => (
              <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3 font-medium text-medflow-slate">{m.measurement_date}</td>
                <td className={cn("px-4 py-3 font-bold tabular-nums",
                  m.psa_total > 10 ? "text-red-600" : m.psa_total > 4 ? "text-amber-600" : "text-medflow-emerald"
                )}>{m.psa_total.toFixed(2)}</td>
                <td className="px-4 py-3 text-slate-500 tabular-nums">{m.psa_free != null ? m.psa_free.toFixed(2) : "—"}</td>
                <td className={cn("px-4 py-3 font-semibold tabular-nums",
                  m.psa_ratio == null ? "text-slate-300" :
                  m.psa_ratio < 15 ? "text-red-600" : m.psa_ratio < 20 ? "text-amber-600" : "text-medflow-emerald"
                )}>{m.psa_ratio != null ? `${m.psa_ratio.toFixed(1)}%` : "—"}</td>
                <td className={cn("px-4 py-3 tabular-nums",
                  m.psa_density == null ? "text-slate-300" : m.psa_density > 0.15 ? "text-amber-600" : "text-slate-500"
                )}>{m.psa_density != null ? m.psa_density.toFixed(3) : "—"}</td>
                <td className="px-4 py-3 text-slate-500">{CONTEXT_ES[m.clinical_context] ?? m.clinical_context}</td>
                <td className="px-4 py-3">
                  <button onClick={() => onDelete(m.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── MedIA PSA insight ─────────────────────────────────────────────────────────

function MedIAPSAInsight({ metrics }: { metrics: ReturnType<typeof usePSAHistory>["data"] }) {
  if (!metrics) return null;
  const m = metrics.metrics;
  const last = metrics.measurements[0];
  if (!last) return null;
  const alerts: string[] = [];
  if (m.psa_velocity !== null && m.psa_velocity > 0.75) alerts.push(`PSA Velocity ${m.psa_velocity.toFixed(2)} ng/mL/año > 0.75 (EAU 2025)`);
  if (last.psa_density !== null && last.psa_density > 0.15) alerts.push(`Densidad PSA ${last.psa_density.toFixed(3)} > 0.15 (considerar biopsia)`);
  if (last.psa_ratio !== null && last.psa_ratio < 15) alerts.push(`Índice L/T ${last.psa_ratio.toFixed(1)}% < 15% (alta sospecha)`);
  if (m.biochemical_recurrence) alerts.push("Criterio de recurrencia bioquímica positivo (AUA/Phoenix)");
  if (!alerts.length) return null;
  return (
    <div className="bg-medflow-slate rounded-2xl p-5">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-medflow-emerald/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Activity className="w-4 h-4 text-medflow-emerald" />
        </div>
        <div>
          <p className="text-white text-sm font-semibold mb-1.5">MedIA — Análisis PSA Longitudinal</p>
          <p className="text-slate-300 text-xs leading-relaxed">
            {alerts.length} hallazgo{alerts.length > 1 ? "s" : ""} relevante{alerts.length > 1 ? "s" : ""}:{" "}
            <strong className="text-white">{alerts.join(". ")}.</strong>{" "}
            {alerts.length >= 2 ? "Considerar biopsia prostática según guías EAU 2025. RM multiparamétrica recomendada." : "Vigilancia activa y nueva medición en 3-6 meses."}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function FichaPaciente() {
  const params  = useParams();
  const id      = params.id as string;

  const [patient, setPatient]       = useState<Patient | null>(null);
  const [expanded, setExpanded]     = useState<PatientExpandedDB | null>(null);
  const [loading, setLoading]       = useState(true);
  const [notFound, setNotFound]     = useState(false);
  const [activeTab, setActiveTab]   = useState<Tab>("resumen");
  const [showDialog, setShowDialog] = useState(false);

  const { data: psaData, loading: psaLoading, error: psaError, refetch: refetchPSA } = usePSAHistory(id);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      // Intentar datos expandidos primero (pacientes reales con UUID)
      try {
        const data = await getPatientExpanded(id) as unknown as PatientExpandedDB;
        setExpanded(data);
        setPatient(dbToPatient(data));
        setLoading(false);
        return;
      } catch {}
      // Fallback a mocks (demos)
      const mock = getPatientById(id);
      if (mock) { setPatient(mock); setLoading(false); return; }
      setNotFound(true);
      setLoading(false);
    };
    load();
  }, [id]);

  const handleDeleteMeasurement = async (measurementId: string) => {
    if (!confirm("¿Eliminar esta medición PSA?")) return;
    try { await deletePsaMeasurement(id, measurementId); refetchPSA(); } catch {}
  };

  // ── States ────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="max-w-7xl mx-auto flex flex-col items-center gap-4 py-24">
      <Loader2 className="w-8 h-8 text-medflow-emerald animate-spin" />
      <p className="text-sm text-slate-400">Cargando historia médica...</p>
    </div>
  );

  if (notFound || !patient) return (
    <div className="max-w-7xl mx-auto flex flex-col items-center gap-4 py-24">
      <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
        <AlertCircle className="w-7 h-7 text-red-400" />
      </div>
      <h2 className="text-lg font-bold text-medflow-slate">Paciente no encontrado</h2>
      <Link href="/pacientes" className="text-sm font-semibold text-medflow-emerald hover:underline">← Volver</Link>
    </div>
  );

  const statusCfg = STATUS_CFG[patient.status];
  const primaryDiagLabel = expanded?.diagnostico_primario
    ? (DIAGNOSIS_LABELS[expanded.diagnostico_primario] ?? expanded.diagnostico_primario)
    : patient.primaryDiagnosis;

  // PSA header from expanded or PSA history
  const latestPSA = psaData?.measurements[0]?.psa_total ?? expanded?.psa_total;

  return (
    <div className="max-w-7xl mx-auto space-y-4">

      {/* ── Breadcrumb ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <Link href="/pacientes" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-medflow-slate transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Pacientes
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm font-medium text-medflow-slate truncate">{patient.name}</span>
      </div>

      {/* ── Header del paciente (siempre visible) ─────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex flex-wrap items-start gap-4">

          {/* Avatar */}
          <div className="w-14 h-14 rounded-2xl bg-medflow-emerald/10 flex items-center justify-center flex-shrink-0">
            <span className="text-xl font-black text-medflow-emerald">
              {patient.name.split(" ")[0][0]}{patient.name.split(" ")[1]?.[0]}
            </span>
          </div>

          {/* Info principal */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-lg font-bold text-medflow-slate">{patient.name}</h1>
              <span className={cn("inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full", statusCfg.className)}>
                {statusCfg.label}
              </span>
              {expanded?.is_test_patient && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">
                  Paciente de prueba
                </span>
              )}
            </div>

            {/* Diagnóstico principal */}
            <p className="text-sm text-slate-500 mb-2">{primaryDiagLabel}</p>

            {/* Otros diagnósticos como chips */}
            {expanded && expanded.diagnoses.filter(d => !d.is_primary).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {expanded.diagnoses.filter(d => !d.is_primary).map(d => (
                  <span key={d.id} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                    {DIAGNOSIS_LABELS[d.code] ?? d.code}
                  </span>
                ))}
              </div>
            )}

            {/* Pills de datos rápidos */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <User className="w-3 h-3 text-slate-400" />
                <span className="font-mono font-semibold">{patient.cedula}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <Calendar className="w-3 h-3 text-slate-400" />
                {patient.age} años
                {expanded?.sex && <span className="text-slate-400">· {SEX_LABELS[expanded.sex] ?? expanded.sex}</span>}
              </div>
              {patient.phone !== "—" && (
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <Phone className="w-3 h-3 text-slate-400" /> {patient.phone}
                </div>
              )}
              {expanded?.blood_type && (
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <span className="text-red-400">🩸</span>
                  {BLOOD_TYPE_LABELS[expanded.blood_type] ?? expanded.blood_type}
                </div>
              )}
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <ClipboardList className="w-3 h-3 text-slate-400" />
                Registro: {formatDate(patient.lastVisit)}
              </div>
            </div>
          </div>

          {/* Mini-stats derecha */}
          <div className="flex gap-2 flex-shrink-0 flex-wrap">
            {latestPSA != null && (
              <div className={cn("text-center px-3 py-2.5 rounded-xl border",
                psaTotalSignal(latestPSA) === "red"   ? "bg-red-50 border-red-100" :
                psaTotalSignal(latestPSA) === "amber" ? "bg-amber-50 border-amber-100" :
                "bg-medflow-emerald-light border-medflow-emerald/20"
              )}>
                <p className="text-[10px] text-slate-400 mb-0.5">PSA Total</p>
                <p className={cn("text-lg font-black leading-none",
                  psaTotalSignal(latestPSA) === "red"   ? "text-red-600" :
                  psaTotalSignal(latestPSA) === "amber" ? "text-amber-600" : "text-medflow-emerald"
                )}>
                  {latestPSA.toFixed(1)}
                </p>
                <p className="text-[10px] text-slate-400">ng/mL</p>
              </div>
            )}
            {expanded?.volumen_prostatico != null && (
              <div className="text-center px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] text-slate-400 mb-0.5">Vol. Prostático</p>
                <p className="text-lg font-black text-urology-blue leading-none">{expanded.volumen_prostatico}</p>
                <p className="text-[10px] text-slate-400">cc</p>
              </div>
            )}
            {expanded?.ipss != null && (
              <div className="text-center px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] text-slate-400 mb-0.5">IPSS</p>
                <p className="text-lg font-black text-medflow-slate leading-none">{expanded.ipss}</p>
                <p className="text-[10px] text-slate-400">/35</p>
              </div>
            )}
          </div>
        </div>

        {/* Alerta si hay nódulo DRE */}
        {expanded?.dre_nodules === 1 && (
          <div className="mt-3 flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
            <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
            <p className="text-xs text-red-700 font-semibold">⚠️ Nódulo prostático detectado al DRE — correlacionar con PSA y ecografía transrectal</p>
          </div>
        )}

        {/* Alerta antecedente familiar CaP */}
        {expanded?.has_prostate_cancer_family_history && (
          <div className="mt-2 flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <p className="text-xs text-amber-700 font-semibold">Antecedente familiar de CA Próstata — Screening anual recomendado desde los 40 años</p>
          </div>
        )}
      </div>

      {/* ── Sistema de 5 Tabs ────────────────────────────────────────────── */}
      <div className="flex items-center gap-0.5 bg-white rounded-2xl border border-slate-100 p-1.5 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all",
              activeTab === tab.id
                ? "bg-medflow-slate text-white shadow-sm"
                : "text-slate-500 hover:text-medflow-slate hover:bg-slate-50"
            )}
          >
            <span className="text-sm">{tab.icon}</span>
            {tab.label}
            {tab.id === "psa" && (psaData?.measurements?.length ?? 0) > 0 && (
              <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                activeTab === tab.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
              )}>
                {psaData?.measurements?.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab: Resumen ─────────────────────────────────────────────────── */}
      {activeTab === "resumen" && (
        expanded
          ? <SummaryTab patient={expanded} />
          : (
            <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
              <p className="text-sm text-slate-400">
                Vista resumida disponible para pacientes con datos clínicos completos.
                Este paciente es un caso de demostración.
              </p>
            </div>
          )
      )}

      {/* ── Tab: Antecedentes ────────────────────────────────────────────── */}
      {activeTab === "antecedentes" && (
        expanded
          ? <AntecedentesTab patient={expanded} />
          : (
            <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
              <p className="text-sm text-slate-400">Antecedentes disponibles para pacientes registrados con el formulario completo.</p>
            </div>
          )
      )}

      {/* ── Tab: Perfil Urológico ────────────────────────────────────────── */}
      {activeTab === "urologico" && (
        expanded
          ? <UrologicoTab patient={expanded} />
          : (
            <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
              <p className="text-sm text-slate-400">Perfil urológico disponible para pacientes registrados con el formulario completo.</p>
            </div>
          )
      )}

      {/* ── Tab: Evolución PSA ───────────────────────────────────────────── */}
      {activeTab === "psa" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-medflow-slate">Trayectoria PSA Longitudinal</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {psaData?.measurements.length ?? 0} medición{(psaData?.measurements.length ?? 0) !== 1 ? "es" : ""} registrada{(psaData?.measurements.length ?? 0) !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={refetchPSA} disabled={psaLoading}
                className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-400">
                <RefreshCw className={cn("w-4 h-4", psaLoading && "animate-spin")} />
              </button>
              <button onClick={() => setShowDialog(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold bg-urology-blue text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
                <Plus className="w-4 h-4" /> Nueva medición
              </button>
            </div>
          </div>

          {psaError && (
            <div className="bg-red-50 border border-red-100 rounded-2xl px-5 py-4 flex items-center gap-3">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{psaError}</p>
            </div>
          )}

          {psaLoading && !psaData && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 h-72 animate-pulse" />
              <div className="bg-white rounded-2xl border border-slate-100 h-72 animate-pulse" />
            </div>
          )}

          {!psaLoading && psaData && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2"><PSAHistoryChart measurements={psaData.measurements} /></div>
                <PSAMetricsPanel metrics={psaData.metrics} latestMeasurement={psaData.measurements[0] ?? null} />
              </div>
              <MedIAPSAInsight metrics={psaData} />
              <PSAHistoryTable measurements={psaData.measurements} onDelete={handleDeleteMeasurement} />
            </>
          )}

          {!psaLoading && psaData?.measurements.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 p-14 flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-urology-blue-light flex items-center justify-center">
                <FlaskConical className="w-8 h-8 text-urology-blue opacity-60" />
              </div>
              <div>
                <p className="text-base font-bold text-medflow-slate">Sin mediciones PSA registradas</p>
                <p className="text-sm text-slate-400 mt-1 max-w-sm">Registra la primera medición para trazar la evolución longitudinal.</p>
              </div>
              <button onClick={() => setShowDialog(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-urology-blue text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
                <Plus className="w-4 h-4" /> Registrar primera medición
              </button>
            </div>
          )}

          {/* Ficha clínica legacy para pacientes mock */}
          {!expanded && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-2">
              <div className="lg:col-span-2 space-y-5">
                {patient.psaHistory.length > 0 && <PsaChart history={patient.psaHistory} />}
                {patient.psaHistory[patient.psaHistory.length - 1] && (
                  <PsaRatioCard psaTotal={patient.psaHistory[patient.psaHistory.length - 1].psaTotal} psaFree={patient.psaHistory[patient.psaHistory.length - 1].psaFree} />
                )}
                <DicomUpload existingFiles={patient.ecos} />
              </div>
              <div>
                <MedIAPanel patient={patient} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Facturación (placeholder) ──────────────────────────────── */}
      {activeTab === "facturacion" && (
        <div className="bg-white rounded-2xl border border-slate-100 p-14 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-medflow-emerald-light flex items-center justify-center">
            <span className="text-3xl">💰</span>
          </div>
          <div>
            <p className="text-base font-bold text-medflow-slate">Módulo de Facturación</p>
            <p className="text-sm text-slate-400 mt-1 max-w-sm">
              Próximamente: honorarios, pagos Zelle/Pago Móvil, historial de transacciones por paciente.
            </p>
          </div>
        </div>
      )}

      {/* ── Zona de Peligro ──────────────────────────────────────────────── */}
      <DeletePatientButton
        patientId={id}
        patientName={patient.name}
        isTestPatient={!!(expanded?.is_test_patient)}
      />

      {/* Dialog nueva medición */}
      {showDialog && (
        <AddPSAMeasurementDialog
          patientId={id}
          patientName={patient.name}
          onClose={() => setShowDialog(false)}
          onSuccess={() => { setShowDialog(false); refetchPSA(); }}
        />
      )}
    </div>
  );
}
