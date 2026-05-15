"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Activity, AlertCircle, CheckCircle2, TrendingUp, ChevronRight, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface PsaPatient {
  id: string;
  nombre: string;
  edad: number;
  psa_total: number | null;
  psa_libre: number | null;
  indice_psa: number | null;
  diagnostico: string | null;
  fecha_registro: string;
}

function PsaLevel({ psa }: { psa: number | null }) {
  if (psa === null) return <span className="text-xs text-slate-300">—</span>;
  const color = psa > 10 ? "text-red-600" : psa > 4 ? "text-amber-600" : "text-medflow-emerald";
  return (
    <span className={cn("text-sm font-black tabular-nums", color)}>
      {psa.toFixed(1)} <span className="text-[10px] font-normal text-slate-400">ng/mL</span>
    </span>
  );
}

function IndiceLabel({ indice }: { indice: number | null }) {
  if (indice === null) return <span className="text-xs text-slate-300">—</span>;
  const cfg =
    indice < 15 ? { bg: "bg-red-50 text-red-600 border-red-100",         label: `${indice.toFixed(1)}% ⚠` } :
    indice < 20 ? { bg: "bg-amber-50 text-amber-600 border-amber-100",   label: `${indice.toFixed(1)}%` }    :
                  { bg: "bg-medflow-emerald-light text-medflow-emerald border-medflow-emerald/20", label: `${indice.toFixed(1)}%` };
  return (
    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", cfg.bg)}>
      {cfg.label}
    </span>
  );
}

export default function PsaControlPage() {
  const [pacientes, setPacientes] = useState<PsaPatient[]>([]);
  const [loading, setLoading]     = useState(true);

  const cargar = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/pacientes`, { cache: "no-store" });
      const data = await res.json();
      // Solo mostrar pacientes con PSA registrado
      setPacientes((data.pacientes ?? []).filter((p: PsaPatient) => p.psa_total !== null));
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  const criticos = pacientes.filter((p) => p.indice_psa !== null && p.indice_psa < 15);
  const elevados  = pacientes.filter((p) => p.psa_total !== null && p.psa_total > 4 && (p.indice_psa === null || p.indice_psa >= 15));
  const normales  = pacientes.filter((p) => p.psa_total !== null && p.psa_total <= 4);

  return (
    <div className="max-w-5xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-medflow-slate">Control PSA</h1>
          <p className="text-sm text-slate-400 mt-0.5">Monitoreo de antígeno prostático específico</p>
        </div>
        <button onClick={cargar} disabled={loading}
          className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-400">
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
        </button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Críticos (L/T < 15%)", value: criticos.length, color: "text-red-600",         bg: "bg-red-50",                icon: AlertCircle   },
          { label: "PSA Elevado (> 4)",    value: elevados.length, color: "text-amber-600",        bg: "bg-amber-50",              icon: TrendingUp    },
          { label: "PSA Normal (≤ 4)",     value: normales.length, color: "text-medflow-emerald",  bg: "bg-medflow-emerald-light", icon: CheckCircle2  },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", item.bg)}>
                <Icon className={cn("w-5 h-5", item.color)} />
              </div>
              <div>
                <p className={cn("text-2xl font-black leading-none", item.color)}>{item.value}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{item.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabla PSA */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="grid grid-cols-[1fr_80px_110px_110px_120px_40px] gap-4 px-5 py-3 border-b border-slate-50 bg-slate-50/60">
          {["Paciente", "Edad", "PSA Total", "Índice L/T", "Diagnóstico", ""].map((h) => (
            <p key={h} className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{h}</p>
          ))}
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 py-12">
            <RefreshCw className="w-4 h-4 text-slate-400 animate-spin" />
            <span className="text-sm text-slate-400">Cargando datos PSA...</span>
          </div>
        )}

        {!loading && pacientes.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-14">
            <Activity className="w-10 h-10 text-slate-200" />
            <p className="text-sm text-slate-400">No hay pacientes con PSA registrado</p>
            <Link href="/pacientes/nuevo" className="text-xs font-semibold text-medflow-emerald hover:underline">
              + Registrar primer paciente
            </Link>
          </div>
        )}

        {!loading && pacientes.length > 0 && (
          <ul className="divide-y divide-slate-50">
            {pacientes.map((p) => (
              <li key={p.id}>
                <Link href={`/pacientes/${p.id}`}
                  className="grid grid-cols-[1fr_80px_110px_110px_120px_40px] gap-4 items-center px-5 py-4 hover:bg-slate-50/70 transition-colors group">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-medflow-slate truncate group-hover:text-medflow-emerald transition-colors">
                      {p.nombre}
                    </p>
                    <p className="text-[10px] text-slate-400">{new Date(p.fecha_registro).toLocaleDateString("es-VE")}</p>
                  </div>
                  <p className="text-sm text-medflow-slate">{p.edad} años</p>
                  <PsaLevel psa={p.psa_total} />
                  <IndiceLabel indice={p.indice_psa} />
                  <p className="text-xs text-slate-500 truncate">{p.diagnostico ?? "—"}</p>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-medflow-emerald transition-colors" />
                </Link>
              </li>
            ))}
          </ul>
        )}

        {!loading && pacientes.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-50 text-xs text-slate-400">
            {pacientes.length} paciente{pacientes.length !== 1 ? "s" : ""} con PSA registrado
          </div>
        )}
      </div>
    </div>
  );
}
