"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  UserPlus,
  ChevronRight,
  Activity,
  Users,
  AlertCircle,
  Filter,
} from "lucide-react";
import { MOCK_PATIENTS } from "@/lib/mock-patients";
import { PatientStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

// ── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<PatientStatus, { label: string; className: string }> = {
  "control-psa":       { label: "Control PSA",       className: "bg-urology-blue-light text-urology-blue" },
  "post-op":           { label: "Post-Op",            className: "bg-medflow-emerald-light text-medflow-emerald" },
  "pendiente-biopsia": { label: "Pendiente Biopsia",  className: "bg-red-50 text-red-600" },
  nuevo:               { label: "Nuevo",              className: "bg-amber-50 text-amber-600" },
  alta:                { label: "Alta",               className: "bg-slate-100 text-slate-500" },
};

const FILTER_TABS: { label: string; value: PatientStatus | "todos" }[] = [
  { label: "Todos",             value: "todos" },
  { label: "Control PSA",       value: "control-psa" },
  { label: "Pendiente Biopsia", value: "pendiente-biopsia" },
  { label: "Post-Op",           value: "post-op" },
  { label: "Nuevos",            value: "nuevo" },
];

// ── Component ────────────────────────────────────────────────────────────────

export default function PacientesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PatientStatus | "todos">("todos");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return MOCK_PATIENTS.filter((p) => {
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.cedula.toLowerCase().includes(q);
      const matchStatus = statusFilter === "todos" || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [search, statusFilter]);

  const biopsiaCount = MOCK_PATIENTS.filter((p) => p.status === "pendiente-biopsia").length;

  return (
    <div className="max-w-6xl mx-auto space-y-5">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-medflow-slate">Pacientes</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {MOCK_PATIENTS.length} pacientes registrados
          </p>
        </div>
        <button className="inline-flex items-center gap-2 bg-medflow-emerald text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-medflow-emerald-hover transition-colors shadow-sm">
          <UserPlus className="w-4 h-4" />
          Nuevo Paciente
        </button>
      </div>

      {/* Alert banner for pending biopsies */}
      {biopsiaCount > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-xs text-red-700 font-medium">
            {biopsiaCount} paciente{biopsiaCount > 1 ? "s" : ""} con biopsia pendiente requieren atención prioritaria.
          </p>
        </div>
      )}

      {/* Search + filters */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
        {/* Search bar */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus-within:border-medflow-emerald transition-colors">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Buscar por nombre o cédula (ej: V-8.542.317)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-sm bg-transparent text-medflow-slate placeholder:text-slate-400 outline-none"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-slate-400 hover:text-slate-600 text-xs font-medium">
              Limpiar
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-slate-400 mr-1" />
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                statusFilter === tab.value
                  ? "bg-medflow-emerald text-white"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_140px_60px_130px_100px_80px_44px] gap-4 px-5 py-3 border-b border-slate-50 bg-slate-50/60">
          {["Paciente", "Cédula", "Edad", "Diagnóstico", "PSA Actual", "Estado", ""].map((h) => (
            <p key={h} className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              {h}
            </p>
          ))}
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <Users className="w-10 h-10 text-slate-200" />
            <p className="text-sm text-slate-400">No se encontraron pacientes</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-50">
            {filtered.map((patient) => {
              const latest = patient.psaHistory[patient.psaHistory.length - 1];
              const statusCfg = STATUS_CONFIG[patient.status];
              const psaHigh = latest?.psaTotal > 4;

              return (
                <li key={patient.id}>
                  <Link
                    href={`/pacientes/${patient.id}`}
                    className="grid grid-cols-[1fr_140px_60px_130px_100px_80px_44px] gap-4 items-center px-5 py-4 hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* Name */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-medflow-emerald/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-medflow-emerald">
                          {patient.name.split(" ")[0][0]}{patient.name.split(" ")[1]?.[0]}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-medflow-slate truncate group-hover:text-medflow-emerald transition-colors">
                          {patient.name}
                        </p>
                        <p className="text-[10px] text-slate-400">{patient.phone}</p>
                      </div>
                    </div>

                    {/* Cedula */}
                    <p className="text-xs text-slate-500 font-mono">{patient.cedula}</p>

                    {/* Age */}
                    <p className="text-sm font-medium text-medflow-slate">{patient.age}</p>

                    {/* Diagnosis */}
                    <p className="text-xs text-slate-500 truncate">{patient.primaryDiagnosis}</p>

                    {/* PSA */}
                    <div className="flex items-center gap-1.5">
                      {latest?.psaTotal != null ? (
                        <>
                          <span className={cn("text-sm font-bold", psaHigh ? "text-red-500" : "text-medflow-emerald")}>
                            {latest.psaTotal.toFixed(1)}
                          </span>
                          <span className="text-[10px] text-slate-400">ng/mL</span>
                          {psaHigh && <Activity className="w-3 h-3 text-red-400" />}
                        </>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </div>

                    {/* Status */}
                    <span className={cn("inline-flex items-center text-[10px] font-semibold px-2 py-1 rounded-full", statusCfg.className)}>
                      {statusCfg.label}
                    </span>

                    {/* Arrow */}
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-medflow-emerald transition-colors" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        {/* Footer count */}
        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-50 text-xs text-slate-400">
            Mostrando {filtered.length} de {MOCK_PATIENTS.length} pacientes
          </div>
        )}
      </div>
    </div>
  );
}
