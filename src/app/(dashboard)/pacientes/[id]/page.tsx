"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Phone, Mail, Calendar, Activity,
  Ruler, ClipboardList, User, Loader2, AlertCircle,
} from "lucide-react";
import { getPatientById } from "@/lib/mock-patients";
import { Patient, PatientStatus } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";
import PsaChart from "@/components/pacientes/PsaChart";
import PsaRatioCard from "@/components/pacientes/PsaRatioCard";
import DicomUpload from "@/components/pacientes/DicomUpload";
import MedIAPanel from "@/components/pacientes/MedIAPanel";

// ── Status helper ─────────────────────────────────────────────────────────────

const STATUS_CFG: Record<PatientStatus, { label: string; className: string }> = {
  "control-psa":       { label: "Control PSA",      className: "bg-urology-blue-light text-urology-blue" },
  "post-op":           { label: "Post-Op",           className: "bg-medflow-emerald-light text-medflow-emerald" },
  "pendiente-biopsia": { label: "Biopsia Pendiente", className: "bg-red-50 text-red-600" },
  nuevo:               { label: "Nuevo",             className: "bg-amber-50 text-amber-600" },
  alta:                { label: "Alta",              className: "bg-slate-100 text-slate-500" },
};

function deriveStatus(psa: number | null, indice: number | null): PatientStatus {
  if (indice !== null && indice < 15) return "pendiente-biopsia";
  if (psa !== null && psa > 4)        return "control-psa";
  return "nuevo";
}

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

function dbToPatient(p: PacienteDB): Patient {
  const psaHistory = p.psa_total !== null
    ? [{
        date: p.fecha_registro.slice(0, 10),
        psaTotal: p.psa_total,
        psaFree: p.psa_libre ?? 0,
        label: "Registro inicial",
      }]
    : [];

  return {
    id: p.id,
    name: p.nombre,
    cedula: p.cedula ?? "—",
    age: p.edad,
    birthDate: p.fecha_nacimiento ?? "",
    phone: p.telefono ?? "—",
    email: p.email ?? undefined,
    status: deriveStatus(p.psa_total, p.indice_psa),
    lastVisit: p.fecha_registro.slice(0, 10),
    primaryDiagnosis: p.diagnostico ?? p.motivo_consulta,
    prostaticVolume: p.volumen_prostatico ?? undefined,
    ipssScore: p.ipss ?? undefined,
    psaHistory,
    ecos: [],
    notes: [
      p.antecedentes_ca !== "no" ? `Antec. familiar CA próstata: ${p.antecedentes_ca}` : "",
      p.hipertension ? "HTA" : "",
      p.diabetes ? "DM" : "",
      p.cirugia_previa ? "Cx urológica previa" : "",
      p.notas ?? "",
    ].filter(Boolean).join(" · ") || undefined,
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function FichaPaciente() {
  const params  = useParams();
  const id      = params.id as string;

  const [patient, setPatient]   = useState<Patient | null>(null);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      // 1. Intentar backend real (pacientes con UUID)
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/pacientes/${id}`,
          { cache: "no-store" }
        );
        if (res.ok) {
          const data: PacienteDB = await res.json();
          setPatient(dbToPatient(data));
          setLoading(false);
          return;
        }
      } catch {}

      // 2. Fallback: mocks (pacientes de demo con IDs numéricos)
      const mock = getPatientById(id);
      if (mock) {
        setPatient(mock);
        setLoading(false);
        return;
      }

      setNotFound(true);
      setLoading(false);
    };

    load();
  }, [id]);

  // ── Estados de carga / error ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center gap-4 py-24">
          <Loader2 className="w-8 h-8 text-medflow-emerald animate-spin" />
          <p className="text-sm text-slate-400">Cargando historia médica...</p>
        </div>
      </div>
    );
  }

  if (notFound || !patient) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center gap-4 py-24">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-red-400" />
          </div>
          <h2 className="text-lg font-bold text-medflow-slate">Paciente no encontrado</h2>
          <p className="text-sm text-slate-400">El ID <span className="font-mono">{id}</span> no existe en la base de datos.</p>
          <Link href="/pacientes" className="text-sm font-semibold text-medflow-emerald hover:underline">
            ← Volver a Pacientes
          </Link>
        </div>
      </div>
    );
  }

  // ── Ficha completa ──────────────────────────────────────────────────────────

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

          {/* Stats rápidas */}
          <div className="flex gap-3 flex-shrink-0 flex-wrap">
            {latest && (
              <div className="text-center px-4 py-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] text-slate-400 mb-1">PSA Total</p>
                <p className={cn("text-xl font-black leading-none", latest.psaTotal > 4 ? "text-red-500" : "text-medflow-emerald")}>
                  {latest.psaTotal.toFixed(1)}
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
                  patient.ipssScore <= 7 ? "text-medflow-emerald" :
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

      {/* Contenido principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {patient.psaHistory.length > 0 ? (
            <PsaChart history={patient.psaHistory} />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 p-8 flex flex-col items-center gap-2">
              <Activity className="w-8 h-8 text-slate-200" />
              <p className="text-sm text-slate-400">Sin historial PSA previo registrado</p>
              <p className="text-xs text-slate-300">Las próximas consultas construirán la gráfica de evolución</p>
            </div>
          )}
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
                  <span>Fecha</span>
                  <span className="text-center">PSA Total</span>
                  <span className="text-right">PSA Libre</span>
                </div>
                {[...patient.psaHistory].reverse().slice(0, 6).map((r) => (
                  <div key={r.date} className="grid grid-cols-3 gap-2 px-5 py-3 text-xs">
                    <span className="text-slate-400">{r.label ?? formatDate(r.date)}</span>
                    <span className={cn("font-bold text-center", r.psaTotal > 4 ? "text-red-500" : "text-medflow-slate")}>
                      {r.psaTotal.toFixed(2)}
                    </span>
                    <span className="text-medflow-emerald font-medium text-right">
                      {r.psaFree.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
