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
import DeletePatientButton from "@/components/pacientes/DeletePatientButton";
import DicomUpload from "@/components/pacientes/DicomUpload";
import MedIAPanel from "@/components/pacientes/MedIAPanel";
import PSAHistoryChart from "@/components/pacientes/PSAHistoryChart";
import PSAMetricsPanel from "@/components/pacientes/PSAMetricsPanel";
import AddPSAMeasurementDialog from "@/components/pacientes/AddPSAMeasurementDialog";
import { usePSAHistory } from "@/hooks/usePSAHistory";
import { deletePsaMeasurement } from "@/lib/api";

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CFG: Record<PatientStatus, { label: string; className: string }> = {
  "control-psa":       { label: "Control PSA",      className: "bg-urology-blue-light text-urology-blue" },
  "post-op":           { label: "Post-Op",           className: "bg-medflow-emerald-light text-medflow-emerald" },
  "pendiente-biopsia": { label: "Biopsia Pendiente", className: "bg-red-50 text-red-600" },
  nuevo:               { label: "Nuevo",             className: "bg-amber-50 text-amber-600" },
  alta:                { label: "Alta",              className: "bg-slate-100 text-slate-500" },
};

// ── Mapear paciente del backend al tipo Patient ───────────────────────────────

interface PacienteDB {
  id: string; nombre: string; cedula: string | null; edad: number;
  fecha_nacimiento: string | null; telefono: string | null; email: string | null;
  psa_total: number | null; psa_libre: number | null; indice_psa: number | null;
  volumen_prostatico: number | null; ipss: number | null;
  antecedentes_ca: string; motivo_consulta: string; diagnostico: string | null;
  hipertension: number; diabetes: number; cirugia_previa: number;
  notas: string | null; fecha_registro: string;
}

function deriveStatus(psa: number | null, indice: number | null): PatientStatus {
  if (indice !== null && indice < 15) return "pendiente-biopsia";
  if (psa !== null && psa > 4)        return "control-psa";
  return "nuevo";
}

function dbToPatient(p: PacienteDB): Patient {
  const psaHistory = p.psa_total !== null
    ? [{ date: p.fecha_registro.slice(0, 10), psaTotal: p.psa_total, psaFree: p.psa_libre ?? 0, label: "Registro inicial" }]
    : [];
  return {
    id: p.id, name: p.nombre, cedula: p.cedula ?? "—", age: p.edad,
    birthDate: p.fecha_nacimiento ?? "", phone: p.telefono ?? "—", email: p.email ?? undefined,
    status: deriveStatus(p.psa_total, p.indice_psa), lastVisit: p.fecha_registro.slice(0, 10),
    primaryDiagnosis: p.diagnostico ?? p.motivo_consulta,
    prostaticVolume: p.volumen_prostatico ?? undefined, ipssScore: p.ipss ?? undefined,
    psaHistory, ecos: [],
    notes: [
      p.antecedentes_ca !== "no" ? `Antec. familiar CA próstata: ${p.antecedentes_ca}` : "",
      p.hipertension ? "HTA" : "", p.diabetes ? "DM" : "",
      p.cirugia_previa ? "Cx urológica previa" : "", p.notas ?? "",
    ].filter(Boolean).join(" · ") || undefined,
  };
}

type Tab = "ficha" | "psa";

// ── MedIA PSA contextual insight ──────────────────────────────────────────────

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

  if (alerts.length === 0) return null;

  return (
    <div className="bg-medflow-slate rounded-2xl p-5">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-medflow-emerald/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Activity className="w-4 h-4 text-medflow-emerald" />
        </div>
        <div>
          <p className="text-white text-sm font-semibold mb-1.5">MedIA — Análisis PSA Longitudinal</p>
          <p className="text-slate-300 text-xs leading-relaxed">
            Se detectaron {alerts.length} hallazgo{alerts.length > 1 ? "s" : ""} clínicamente relevante{alerts.length > 1 ? "s" : ""}:{" "}
            <strong className="text-white">{alerts.join(". ")}.</strong>{" "}
            {alerts.length >= 2
              ? "La combinación de estos factores sugiere considerar biopsia prostática según guías EAU 2025. Se recomienda RM multiparamétrica previa para definir target PI-RADS."
              : "Se recomienda vigilancia activa y nueva medición en 3-6 meses."}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── PSA History Table ─────────────────────────────────────────────────────────

import { PSAMeasurementOut } from "@/lib/api";

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

  if (!measurements || measurements.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-50">
        <h3 className="text-sm font-semibold text-medflow-slate">Historial completo</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50/60">
              {["Fecha", "PSA Total", "PSA Libre", "Índice L/T", "Densidad", "Contexto", ""].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {measurements.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3 font-medium text-medflow-slate">{m.measurement_date}</td>
                <td className={cn("px-4 py-3 font-bold tabular-nums",
                  m.psa_total > 10 ? "text-red-600" : m.psa_total > 4 ? "text-amber-600" : "text-medflow-emerald"
                )}>
                  {m.psa_total.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-slate-500 tabular-nums">
                  {m.psa_free != null ? m.psa_free.toFixed(2) : "—"}
                </td>
                <td className={cn("px-4 py-3 font-semibold tabular-nums",
                  m.psa_ratio == null ? "text-slate-300" :
                  m.psa_ratio < 15 ? "text-red-600" : m.psa_ratio < 20 ? "text-amber-600" : "text-medflow-emerald"
                )}>
                  {m.psa_ratio != null ? `${m.psa_ratio.toFixed(1)}%` : "—"}
                </td>
                <td className={cn("px-4 py-3 tabular-nums",
                  m.psa_density == null ? "text-slate-300" :
                  m.psa_density > 0.15 ? "text-amber-600" : "text-slate-500"
                )}>
                  {m.psa_density != null ? m.psa_density.toFixed(3) : "—"}
                </td>
                <td className="px-4 py-3 text-slate-500">{CONTEXT_ES[m.clinical_context] ?? m.clinical_context}</td>
                <td className="px-4 py-3">
                  <button onClick={() => onDelete(m.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors"
                    title="Eliminar medición">
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function FichaPaciente() {
  const params    = useParams();
  const id        = params.id as string;
  const [patient, setPatient]   = useState<Patient | null>(null);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("ficha");
  const [showDialog, setShowDialog] = useState(false);

  const { data: psaData, loading: psaLoading, error: psaError, refetch: refetchPSA } = usePSAHistory(id);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/pacientes/${id}`,
          { cache: "no-store" }
        );
        if (res.ok) { setPatient(dbToPatient(await res.json())); setLoading(false); return; }
      } catch {}
      const mock = getPatientById(id);
      if (mock) { setPatient(mock); setLoading(false); return; }
      setNotFound(true);
      setLoading(false);
    };
    load();
  }, [id]);

  const handleDeleteMeasurement = async (measurementId: string) => {
    if (!confirm("¿Eliminar esta medición PSA?")) return;
    try {
      await deletePsaMeasurement(id, measurementId);
      refetchPSA();
    } catch {}
  };

  // ── Loading / not found ───────────────────────────────────────────────────

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
      <Link href="/pacientes" className="text-sm font-semibold text-medflow-emerald hover:underline">
        ← Volver a Pacientes
      </Link>
    </div>
  );

  const latest    = patient.psaHistory[patient.psaHistory.length - 1];
  const statusCfg = STATUS_CFG[patient.status];

  return (
    <div className="max-w-7xl mx-auto space-y-5">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link href="/pacientes" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-medflow-slate transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Pacientes
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm font-medium text-medflow-slate truncate">{patient.name}</span>
      </div>

      {/* Header del paciente */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex flex-wrap items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-medflow-emerald/10 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-black text-medflow-emerald">
              {patient.name.split(" ")[0][0]}{patient.name.split(" ")[1]?.[0]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="text-lg font-bold text-medflow-slate">{patient.name}</h1>
              <span className={cn("inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full", statusCfg.className)}>
                {statusCfg.label}
              </span>
            </div>
            <p className="text-sm text-slate-500 mb-3">{patient.primaryDiagnosis}</p>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono font-semibold">{patient.cedula}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {patient.age} años{patient.birthDate ? ` · ${formatDate(patient.birthDate)}` : ""}
              </div>
              {patient.phone !== "—" && (
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> {patient.phone}
                </div>
              )}
              {patient.email && (
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> {patient.email}
                </div>
              )}
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <ClipboardList className="w-3.5 h-3.5 text-slate-400" />
                Registro: {formatDate(patient.lastVisit)}
              </div>
            </div>
          </div>
          {/* Quick stats */}
          <div className="flex gap-3 flex-shrink-0 flex-wrap">
            {psaData?.measurements[0] && (
              <div className="text-center px-4 py-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] text-slate-400 mb-1">PSA Actual</p>
                <p className={cn("text-xl font-black leading-none",
                  psaData.measurements[0].psa_total > 10 ? "text-red-500" :
                  psaData.measurements[0].psa_total > 4  ? "text-amber-500" : "text-medflow-emerald"
                )}>
                  {psaData.measurements[0].psa_total.toFixed(1)}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">ng/mL</p>
              </div>
            )}
            {patient.prostaticVolume !== undefined && (
              <div className="text-center px-4 py-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] text-slate-400 mb-1">Vol. Prostático</p>
                <p className="text-xl font-black text-urology-blue leading-none">{patient.prostaticVolume}</p>
                <p className="text-[10px] text-slate-400 mt-1">cc</p>
              </div>
            )}
            {patient.ipssScore !== undefined && (
              <div className="text-center px-4 py-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] text-slate-400 mb-1">IPSS</p>
                <p className={cn("text-xl font-black leading-none",
                  patient.ipssScore <= 7  ? "text-medflow-emerald" :
                  patient.ipssScore <= 19 ? "text-amber-500" : "text-red-500"
                )}>
                  {patient.ipssScore}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">/ 35</p>
              </div>
            )}
          </div>
        </div>
        {patient.notes && (
          <div className="mt-4 flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
            <Activity className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">{patient.notes}</p>
          </div>
        )}
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 bg-white rounded-2xl border border-slate-100 p-1.5 w-fit">
        {[
          { value: "ficha" as Tab, label: "Ficha Clínica" },
          {
            value: "psa" as Tab,
            label: "Evolución PSA",
            badge: psaData?.measurements.length ?? 0,
          },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all",
              activeTab === tab.value
                ? "bg-medflow-slate text-white shadow-sm"
                : "text-slate-500 hover:text-medflow-slate"
            )}
          >
            {tab.value === "psa" && <FlaskConical className="w-3.5 h-3.5" />}
            {tab.label}
            {"badge" in tab && (tab.badge ?? 0) > 0 && (
              <span className={cn(
                "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                activeTab === tab.value ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
              )}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab: Ficha Clínica ─────────────────────────────────────────── */}
      {activeTab === "ficha" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            {patient.psaHistory.length > 0
              ? <PsaChart history={patient.psaHistory} />
              : (
                <div className="bg-white rounded-2xl border border-slate-100 p-8 flex flex-col items-center gap-2">
                  <Activity className="w-8 h-8 text-slate-200" />
                  <p className="text-sm text-slate-400">Sin historial PSA previo</p>
                  <button onClick={() => setActiveTab("psa")}
                    className="text-xs font-semibold text-medflow-emerald hover:underline">
                    → Ir a Evolución PSA para registrar
                  </button>
                </div>
              )
            }
            {latest && <PsaRatioCard psaTotal={latest.psaTotal} psaFree={latest.psaFree} />}
            <DicomUpload existingFiles={patient.ecos} />
          </div>
          <div className="space-y-4">
            <MedIAPanel patient={patient} />
            {patient.psaHistory.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-urology-blue" />
                  <h3 className="text-sm font-semibold text-medflow-slate">Historial de PSA</h3>
                </div>
                <div className="divide-y divide-slate-50">
                  <div className="grid grid-cols-3 gap-2 px-5 py-2 bg-slate-50 text-[10px] font-semibold text-slate-400">
                    <span>Fecha</span><span className="text-center">PSA Total</span><span className="text-right">PSA Libre</span>
                  </div>
                  {[...patient.psaHistory].reverse().slice(0, 6).map((r) => (
                    <div key={r.date} className="grid grid-cols-3 gap-2 px-5 py-3 text-xs">
                      <span className="text-slate-400">{r.label ?? formatDate(r.date)}</span>
                      <span className={cn("font-bold text-center", r.psaTotal > 4 ? "text-red-500" : "text-medflow-slate")}>
                        {r.psaTotal.toFixed(2)}
                      </span>
                      <span className="text-medflow-emerald font-medium text-right">{r.psaFree.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Evolución PSA ─────────────────────────────────────────── */}
      {activeTab === "psa" && (
        <div className="space-y-5">
          {/* Header de la sección */}
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

          {/* Error state */}
          {psaError && (
            <div className="bg-red-50 border border-red-100 rounded-2xl px-5 py-4 flex items-center gap-3">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{psaError}</p>
            </div>
          )}

          {/* Loading skeleton */}
          {psaLoading && !psaData && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 h-72 animate-pulse" />
              <div className="bg-white rounded-2xl border border-slate-100 h-72 animate-pulse" />
            </div>
          )}

          {/* Contenido principal */}
          {!psaLoading && psaData && (
            <>
              {/* Gráfica + métricas */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2">
                  <PSAHistoryChart measurements={psaData.measurements} />
                </div>
                <div>
                  <PSAMetricsPanel
                    metrics={psaData.metrics}
                    latestMeasurement={psaData.measurements[0] ?? null}
                  />
                </div>
              </div>

              {/* MedIA insight contextual */}
              <MedIAPSAInsight metrics={psaData} />

              {/* Tabla historial */}
              <PSAHistoryTable
                measurements={psaData.measurements}
                onDelete={handleDeleteMeasurement}
              />
            </>
          )}

          {/* Empty state */}
          {!psaLoading && psaData?.measurements.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 p-14 flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-urology-blue-light flex items-center justify-center">
                <FlaskConical className="w-8 h-8 text-urology-blue opacity-60" />
              </div>
              <div>
                <p className="text-base font-bold text-medflow-slate">Sin mediciones PSA registradas</p>
                <p className="text-sm text-slate-400 mt-1 max-w-sm">
                  Registra la primera medición para comenzar a trazar la evolución longitudinal del PSA de este paciente.
                </p>
              </div>
              <button onClick={() => setShowDialog(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-urology-blue text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
                <Plus className="w-4 h-4" /> Registrar primera medición
              </button>
            </div>
          )}
        </div>
      )}

      {/* Zona de Peligro — al final, fuera de las tabs */}
      <DeletePatientButton
        patientId={id}
        patientName={patient.name}
        isTestPatient={!!(patient as unknown as { is_test_patient?: boolean }).is_test_patient}
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
