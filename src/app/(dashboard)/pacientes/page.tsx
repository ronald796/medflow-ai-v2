"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Search, UserPlus, ChevronRight, Activity,
  Users, AlertCircle, Filter, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Tipo que devuelve el backend ──────────────────────────────────────────────

interface PacienteDB {
  id: string;
  nombre: string;
  cedula: string | null;
  edad: number;
  telefono: string | null;
  psa_total: number | null;
  psa_libre: number | null;
  indice_psa: number | null;
  diagnostico: string | null;
  motivo_consulta: string;
  antecedentes_ca: string;
  fecha_registro: string;
}

// ── Derivar estado clínico desde los datos ────────────────────────────────────

type Status = "control-psa" | "post-op" | "pendiente-biopsia" | "nuevo" | "alta";

function deriveStatus(p: PacienteDB): Status {
  if (p.indice_psa !== null && p.indice_psa < 15) return "pendiente-biopsia";
  if (p.psa_total !== null && p.psa_total > 4)    return "control-psa";
  if (p.diagnostico?.toLowerCase().includes("post")) return "post-op";
  return "nuevo";
}

const STATUS_CFG: Record<Status, { label: string; className: string }> = {
  "control-psa":       { label: "Control PSA",      className: "bg-urology-blue-light text-urology-blue" },
  "post-op":           { label: "Post-Op",           className: "bg-medflow-emerald-light text-medflow-emerald" },
  "pendiente-biopsia": { label: "Biopsia Pendiente", className: "bg-red-50 text-red-600" },
  nuevo:               { label: "Nuevo",             className: "bg-amber-50 text-amber-600" },
  alta:                { label: "Alta",              className: "bg-slate-100 text-slate-500" },
};

const FILTER_TABS: { label: string; value: Status | "todos" }[] = [
  { label: "Todos",          value: "todos"             },
  { label: "Control PSA",    value: "control-psa"       },
  { label: "Biopsia Pend.",  value: "pendiente-biopsia" },
  { label: "Post-Op",        value: "post-op"           },
  { label: "Nuevos",         value: "nuevo"             },
];

// ── Skeleton row ──────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <li className="grid grid-cols-[1fr_140px_60px_160px_110px_90px_44px] gap-4 items-center px-5 py-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-slate-100 flex-shrink-0" />
        <div className="space-y-1.5 flex-1">
          <div className="h-3 bg-slate-100 rounded w-36" />
          <div className="h-2.5 bg-slate-100 rounded w-24" />
        </div>
      </div>
      {[80, 30, 100, 60, 60].map((w, i) => (
        <div key={i} className={`h-3 bg-slate-100 rounded`} style={{ width: w }} />
      ))}
      <div className="w-4 h-4 bg-slate-100 rounded" />
    </li>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PacientesPage() {
  const [pacientes, setPacientes] = useState<PacienteDB[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "todos">("todos");

  const cargarPacientes = async () => {
    setLoading(true);
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/pacientes`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPacientes(data.pacientes ?? []);
    } catch {
      // Mantener lista anterior si hay un error de red
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarPacientes(); }, []);

  // Filtrar en el cliente sobre los datos del backend
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return pacientes.filter((p) => {
      const matchSearch =
        !q ||
        p.nombre.toLowerCase().includes(q) ||
        (p.cedula ?? "").toLowerCase().includes(q);
      const status = deriveStatus(p);
      const matchStatus = statusFilter === "todos" || status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [pacientes, search, statusFilter]);

  const biopsiaCount = pacientes.filter((p) => deriveStatus(p) === "pendiente-biopsia").length;

  return (
    <div className="max-w-6xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-medflow-slate">Pacientes</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {loading ? "Cargando..." : `${pacientes.length} paciente${pacientes.length !== 1 ? "s" : ""} registrado${pacientes.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={cargarPacientes}
            disabled={loading}
            className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
            title="Recargar lista"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
          <Link href="/pacientes/nuevo">
            <button className="inline-flex items-center gap-2 bg-medflow-emerald text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-medflow-emerald-hover transition-colors shadow-sm">
              <UserPlus className="w-4 h-4" />
              Nuevo Paciente
            </button>
          </Link>
        </div>
      </div>

      {/* Alerta biopsias pendientes */}
      {!loading && biopsiaCount > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-xs text-red-700 font-medium">
            {biopsiaCount} paciente{biopsiaCount > 1 ? "s" : ""} con índice PSA &lt; 15% — biopsia pendiente de evaluación.
          </p>
        </div>
      )}

      {/* Búsqueda + filtros */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus-within:border-medflow-emerald transition-colors">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Buscar por nombre o cédula..."
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

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {/* Cabecera */}
        <div className="grid grid-cols-[1fr_140px_60px_160px_110px_90px_44px] gap-4 px-5 py-3 border-b border-slate-50 bg-slate-50/60">
          {["Paciente", "Cédula", "Edad", "Diagnóstico", "PSA / Índice", "Estado", ""].map((h) => (
            <p key={h} className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{h}</p>
          ))}
        </div>

        {/* Skeletons mientras carga */}
        {loading && (
          <ul className="divide-y divide-slate-50">
            {[1, 2, 3].map((i) => <SkeletonRow key={i} />)}
          </ul>
        )}

        {/* Sin resultados */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16">
            <Users className="w-10 h-10 text-slate-200" />
            <p className="text-sm font-medium text-slate-400">
              {pacientes.length === 0 ? "Aún no hay pacientes registrados" : "No se encontraron pacientes"}
            </p>
            {pacientes.length === 0 && (
              <Link href="/pacientes/nuevo">
                <button className="mt-1 inline-flex items-center gap-2 text-xs font-semibold text-medflow-emerald hover:underline">
                  <UserPlus className="w-3.5 h-3.5" /> Registrar el primer paciente
                </button>
              </Link>
            )}
          </div>
        )}

        {/* Filas reales */}
        {!loading && filtered.length > 0 && (
          <ul className="divide-y divide-slate-50">
            {filtered.map((p) => {
              const status    = deriveStatus(p);
              const statusCfg = STATUS_CFG[status];
              const psaHigh   = p.psa_total !== null && p.psa_total > 4;
              const initials  = p.nombre.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

              return (
                <li key={p.id}>
                  <Link
                    href={`/pacientes/${p.id}`}
                    className="grid grid-cols-[1fr_140px_60px_160px_110px_90px_44px] gap-4 items-center px-5 py-4 hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* Nombre */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-medflow-emerald/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-medflow-emerald">{initials}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-medflow-slate truncate group-hover:text-medflow-emerald transition-colors">
                          {p.nombre}
                        </p>
                        <p className="text-[10px] text-slate-400">{p.telefono ?? "Sin teléfono"}</p>
                      </div>
                    </div>

                    {/* Cédula */}
                    <p className="text-xs text-slate-500 font-mono">{p.cedula ?? "—"}</p>

                    {/* Edad */}
                    <p className="text-sm font-medium text-medflow-slate">{p.edad}</p>

                    {/* Diagnóstico */}
                    <p className="text-xs text-slate-500 truncate">{p.diagnostico ?? p.motivo_consulta}</p>

                    {/* PSA + índice */}
                    <div className="space-y-0.5">
                      {p.psa_total !== null ? (
                        <div className="flex items-center gap-1">
                          <span className={cn("text-sm font-bold", psaHigh ? "text-red-500" : "text-medflow-emerald")}>
                            {p.psa_total.toFixed(1)}
                          </span>
                          <span className="text-[10px] text-slate-400">ng/mL</span>
                          {psaHigh && <Activity className="w-3 h-3 text-red-400" />}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                      {p.indice_psa !== null && (
                        <span className={cn(
                          "text-[10px] font-semibold",
                          p.indice_psa < 15 ? "text-red-500" : p.indice_psa < 20 ? "text-amber-600" : "text-medflow-emerald"
                        )}>
                          L/T: {p.indice_psa.toFixed(1)}%
                        </span>
                      )}
                    </div>

                    {/* Estado */}
                    <span className={cn("inline-flex items-center text-[10px] font-semibold px-2 py-1 rounded-full", statusCfg.className)}>
                      {statusCfg.label}
                    </span>

                    {/* Flecha */}
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-medflow-emerald transition-colors" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        {/* Footer */}
        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-50 text-xs text-slate-400">
            Mostrando {filtered.length} de {pacientes.length} pacientes
          </div>
        )}
      </div>
    </div>
  );
}
