"use client";

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  Activity,
  Ruler,
  ClipboardList,
  User,
} from "lucide-react";
import { getPatientById } from "@/lib/mock-patients";
import { PatientStatus } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";
import PsaChart from "@/components/pacientes/PsaChart";
import PsaRatioCard from "@/components/pacientes/PsaRatioCard";
import DicomUpload from "@/components/pacientes/DicomUpload";
import MedIAPanel from "@/components/pacientes/MedIAPanel";

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<PatientStatus, { label: string; className: string }> = {
  "control-psa":       { label: "Control PSA",       className: "bg-urology-blue-light text-urology-blue" },
  "post-op":           { label: "Post-Op",            className: "bg-medflow-emerald-light text-medflow-emerald" },
  "pendiente-biopsia": { label: "Pendiente Biopsia",  className: "bg-red-50 text-red-600" },
  nuevo:               { label: "Nuevo",              className: "bg-amber-50 text-amber-600" },
  alta:                { label: "Alta",               className: "bg-slate-100 text-slate-500" },
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const patient = getPatientById(id);

  if (!patient) notFound();

  const latest = patient.psaHistory[patient.psaHistory.length - 1];
  const statusCfg = STATUS_CONFIG[patient.status];

  return (
    <div className="max-w-7xl mx-auto space-y-5">

      {/* Back + breadcrumb */}
      <div className="flex items-center gap-2">
        <Link
          href="/pacientes"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-medflow-slate transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Pacientes
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm font-medium text-medflow-slate truncate">{patient.name}</span>
      </div>

      {/* Patient profile header */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex flex-wrap items-start gap-5">

          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl bg-medflow-emerald/10 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-black text-medflow-emerald">
              {patient.name.split(" ")[0][0]}{patient.name.split(" ")[1]?.[0]}
            </span>
          </div>

          {/* Main info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="text-lg font-bold text-medflow-slate">{patient.name}</h1>
              <span className={cn("inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full", statusCfg.className)}>
                {statusCfg.label}
              </span>
            </div>
            <p className="text-sm text-slate-500 mb-3">{patient.primaryDiagnosis}</p>

            {/* Quick data pills */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono font-semibold">{patient.cedula}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {patient.age} años · {formatDate(patient.birthDate)}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {patient.phone}
              </div>
              {patient.email && (
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {patient.email}
                </div>
              )}
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <ClipboardList className="w-3.5 h-3.5 text-slate-400" />
                Última visita: {formatDate(patient.lastVisit)}
              </div>
            </div>
          </div>

          {/* Right stats */}
          <div className="flex gap-3 flex-shrink-0">
            {latest && (
              <div className="text-center px-4 py-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] text-slate-400 mb-1">PSA Actual</p>
                <p className={cn("text-xl font-black leading-none", latest.psaTotal > 4 ? "text-red-500" : "text-medflow-emerald")}>
                  {latest.psaTotal.toFixed(1)}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">ng/mL</p>
              </div>
            )}
            {patient.prostaticVolume !== undefined && (
              <div className="text-center px-4 py-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] text-slate-400 mb-1">Vol. Prostático</p>
                <p className="text-xl font-black text-urology-blue leading-none">
                  {patient.prostaticVolume}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">cc</p>
              </div>
            )}
            {patient.ipssScore !== undefined && (
              <div className="text-center px-4 py-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] text-slate-400 mb-1">IPSS</p>
                <p className={cn(
                  "text-xl font-black leading-none",
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

        {/* Clinical notes */}
        {patient.notes && (
          <div className="mt-4 flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
            <Activity className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">{patient.notes}</p>
          </div>
        )}
      </div>

      {/* Main grid: left content + right MedIA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left: charts + tools — 2/3 */}
        <div className="lg:col-span-2 space-y-5">

          {/* PSA Evolution Chart */}
          <PsaChart history={patient.psaHistory} />

          {/* PSA Ratio Calculator */}
          {latest && (
            <PsaRatioCard psaTotal={latest.psaTotal} psaFree={latest.psaFree} />
          )}

          {/* DICOM Upload */}
          <DicomUpload existingFiles={patient.ecos} />

        </div>

        {/* Right: MedIA panel — 1/3 */}
        <div className="space-y-4">
          <MedIAPanel patient={patient} />

          {/* PSA History Table */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2">
              <Ruler className="w-4 h-4 text-urology-blue" />
              <h3 className="text-sm font-semibold text-medflow-slate">Historial de PSA</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {[...patient.psaHistory].reverse().slice(0, 6).map((record) => (
                <div key={record.date} className="grid grid-cols-3 gap-2 px-5 py-3 text-xs">
                  <span className="text-slate-400">{record.label ?? formatDate(record.date)}</span>
                  <span className={cn("font-bold text-center", record.psaTotal > 4 ? "text-red-500" : "text-medflow-slate")}>
                    {record.psaTotal.toFixed(2)}
                  </span>
                  <span className="text-medflow-emerald font-medium text-right">
                    {record.psaFree.toFixed(2)}
                  </span>
                </div>
              ))}
              <div className="grid grid-cols-3 gap-2 px-5 py-2 bg-slate-50 text-[10px] font-semibold text-slate-400">
                <span>Fecha</span>
                <span className="text-center">PSA Total</span>
                <span className="text-right">PSA Libre</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
