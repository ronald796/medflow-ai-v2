"use client";

import { useEffect, useState } from "react";
import {
  Users, CalendarClock, Activity, DollarSign,
  TrendingUp, TrendingDown, ChevronRight,
  AlertCircle, CheckCircle2, Clock, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface DashStats {
  pacientes_hoy: number;
  total_pacientes: number;
  total_alertas: number;
  alertas: { nombre: string; edad: number; psa: number; indice: number | null; prioridad: string }[];
  caja: { total_usd: number; total_bs: number };
  fecha: string;
}

interface SurgeryItem {
  id: string; patient: string; procedure: string;
  hour: string; status: "confirmada" | "en-curso" | "completada" | "pendiente";
}

// ── Datos estáticos de agenda (hasta conectar módulo quirúrgico al backend) ───

const surgeries: SurgeryItem[] = [
  { id: "1", patient: "Carlos Medina R.", procedure: "Litotripsia extracorpórea", hour: "09:30", status: "confirmada" },
  { id: "2", patient: "José L. Torrealba", procedure: "Prostatectomía radical",    hour: "11:00", status: "en-curso"  },
  { id: "3", patient: "Luis F. Gutiérrez", procedure: "Ureteroscopía + extracción", hour: "14:30", status: "pendiente" },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function KpiSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 animate-pulse space-y-3">
      <div className="flex justify-between">
        <div className="w-10 h-10 rounded-xl bg-slate-100" />
        <div className="w-20 h-5 rounded-full bg-slate-100" />
      </div>
      <div className="w-16 h-7 rounded bg-slate-100" />
      <div className="w-32 h-3 rounded bg-slate-100" />
    </div>
  );
}

const surgeryStatusCfg = {
  confirmada: { label: "Confirmada", cls: "bg-blue-50 text-blue-600",               Icon: CheckCircle2 },
  "en-curso": { label: "En curso",   cls: "bg-amber-50 text-amber-600",             Icon: Clock        },
  completada: { label: "Completada", cls: "bg-medflow-emerald-light text-medflow-emerald", Icon: CheckCircle2 },
  pendiente:  { label: "Pendiente",  cls: "bg-slate-100 text-slate-500",            Icon: Clock        },
};

const psaPriorityCfg = {
  alta:  { dot: "bg-red-500",            text: "text-red-600",          bg: "bg-red-50",                 label: "Alta"   },
  media: { dot: "bg-amber-500",          text: "text-amber-600",        bg: "bg-amber-50",               label: "Media"  },
  baja:  { dot: "bg-medflow-emerald",    text: "text-medflow-emerald",  bg: "bg-medflow-emerald-light",  label: "Normal" },
};

function fmt(n: number) {
  return new Intl.NumberFormat("es-VE", { minimumFractionDigits: 2 }).format(n);
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [stats, setStats]     = useState<DashStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState("");

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/dashboard/stats`,
        { cache: "no-store" }
      );
      if (res.ok) {
        const data: DashStats = await res.json();
        setStats(data);
        setLastFetch(new Date().toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" }));
      }
    } catch {
      // Mantener últimos datos si falla la red
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const id = setInterval(fetchStats, 5 * 60 * 1000); // refresca cada 5 min
    return () => clearInterval(id);
  }, []);

  const today = new Intl.DateTimeFormat("es-VE", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  }).format(new Date());

  // KPIs dinámicos
  const kpis = [
    {
      label: "Pacientes Hoy",
      value: stats?.pacientes_hoy ?? "—",
      sublabel: stats ? `${stats.total_pacientes} en sistema` : "Cargando...",
      icon: Users,
      accent: "text-urology-blue",
      iconBg: "bg-urology-blue-light",
      trend: stats?.pacientes_hoy !== undefined
        ? { value: `${stats.pacientes_hoy} nuevos hoy`, up: stats.pacientes_hoy > 0 }
        : undefined,
    },
    {
      label: "Cirugías Programadas",
      value: surgeries.length,
      sublabel: `Próxima: ${surgeries[0]?.hour} hrs`,
      icon: CalendarClock,
      accent: "text-medflow-emerald",
      iconBg: "bg-medflow-emerald-light",
      trend: { value: "Ver agenda", up: true },
    },
    {
      label: "Alertas PSA",
      value: stats?.total_alertas ?? "—",
      sublabel: stats?.total_alertas
        ? `${stats.alertas.filter(a => a.prioridad === "alta").length} críticas`
        : "Sin alertas activas",
      icon: Activity,
      accent: "text-amber-600",
      iconBg: "bg-amber-50",
      trend: stats?.total_alertas
        ? { value: `${stats.total_alertas} pacientes`, up: false }
        : undefined,
    },
    {
      label: "Caja del Día",
      value: stats ? `$${fmt(stats.caja.total_usd)}` : "—",
      sublabel: stats ? `Bs. ${fmt(stats.caja.total_bs)}` : "Cargando...",
      icon: DollarSign,
      accent: "text-medflow-emerald",
      iconBg: "bg-medflow-emerald-light",
      trend: stats?.caja.total_usd
        ? { value: "Ver caja", up: true }
        : undefined,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-medflow-slate">Control de Mando</h1>
          <p className="text-sm text-slate-400 capitalize mt-0.5">{today}</p>
        </div>
        <div className="flex items-center gap-3">
          {lastFetch && (
            <span className="text-[10px] text-slate-400 hidden sm:block">
              Actualizado {lastFetch}
            </span>
          )}
          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-medflow-slate px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            Actualizar
          </button>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-100 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-medflow-emerald animate-pulse" />
            <span className="text-xs font-medium text-medflow-slate">Sistema activo</span>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading && !stats
          ? Array(4).fill(0).map((_, i) => <KpiSkeleton key={i} />)
          : kpis.map((kpi) => {
              const Icon = kpi.icon;
              return (
                <div key={kpi.label} className="bg-white rounded-2xl p-5 border border-slate-100 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className={cn("p-2.5 rounded-xl", kpi.iconBg)}>
                      <Icon className={cn("w-5 h-5", kpi.accent)} />
                    </div>
                    {kpi.trend && (
                      <span className={cn(
                        "inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full",
                        kpi.trend.up
                          ? "text-medflow-emerald bg-medflow-emerald-light"
                          : "text-red-500 bg-red-50"
                      )}>
                        {kpi.trend.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {kpi.trend.value}
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-medflow-slate mb-1">{kpi.value}</p>
                  <p className="text-xs font-medium text-medflow-slate mb-0.5">{kpi.label}</p>
                  <p className="text-[11px] text-slate-400">{kpi.sublabel}</p>
                </div>
              );
            })
        }
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Agenda quirúrgica */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
            <div className="flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-medflow-emerald" />
              <h2 className="text-sm font-semibold text-medflow-slate">Agenda Quirúrgica — Hoy</h2>
            </div>
            <button className="flex items-center gap-1 text-xs text-medflow-emerald font-medium hover:underline">
              Ver todo <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {surgeries.map((s) => {
              const cfg = surgeryStatusCfg[s.status];
              const SIcon = cfg.Icon;
              return (
                <div key={s.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/50 transition-colors">
                  <div className="w-14 flex-shrink-0 text-center">
                    <p className="text-base font-bold text-medflow-slate">{s.hour}</p>
                    <p className="text-[10px] text-slate-400">hrs</p>
                  </div>
                  <div className="w-px h-8 bg-slate-100 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-medflow-slate truncate">{s.patient}</p>
                    <p className="text-xs text-slate-400 truncate">{s.procedure}</p>
                  </div>
                  <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full flex-shrink-0", cfg.cls)}>
                    <SIcon className="w-3 h-3" />{cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Alertas PSA — reales desde backend */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-semibold text-medflow-slate">Alertas PSA</h2>
            </div>
            {stats && stats.total_alertas > 0 && (
              <span className="w-5 h-5 text-[10px] font-bold bg-red-500 text-white rounded-full flex items-center justify-center">
                {stats.alertas.filter(a => a.prioridad === "alta").length}
              </span>
            )}
          </div>

          {loading && !stats ? (
            <div className="p-5 space-y-3 animate-pulse">
              {[1,2,3].map(i => (
                <div key={i} className="flex gap-3">
                  <div className="flex-1 h-10 bg-slate-100 rounded-xl" />
                </div>
              ))}
            </div>
          ) : stats?.alertas.length === 0 ? (
            <div className="p-8 flex flex-col items-center gap-2">
              <CheckCircle2 className="w-8 h-8 text-medflow-emerald opacity-40" />
              <p className="text-sm text-slate-400 text-center">Sin alertas PSA activas</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {(stats?.alertas ?? []).map((a, i) => {
                const cfg = psaPriorityCfg[a.prioridad as keyof typeof psaPriorityCfg] ?? psaPriorityCfg.baja;
                return (
                  <div key={i} className="px-5 py-4 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-sm font-semibold text-medflow-slate leading-tight">{a.nombre}</p>
                      <span className={cn("inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ml-2 flex-shrink-0", cfg.bg, cfg.text)}>
                        <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
                        {cfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400">{a.edad} años</span>
                      <span className="text-[10px] text-slate-300">·</span>
                      <span className="text-xs font-bold text-medflow-slate">PSA: {a.psa?.toFixed(1)} ng/mL</span>
                      {a.indice !== null && (
                        <span className={cn("text-[11px] font-semibold", a.indice < 15 ? "text-red-500" : "text-amber-500")}>
                          L/T: {a.indice?.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && stats?.total_alertas === 0 && (
            <div className="px-5 py-3 bg-medflow-emerald-light/50 border-t border-medflow-emerald/10">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-medflow-emerald flex-shrink-0" />
                <p className="text-[11px] text-medflow-emerald font-medium">Todos los pacientes bajo control</p>
              </div>
            </div>
          )}
          {!loading && stats && stats.total_alertas > 0 && (
            <div className="px-5 py-3 bg-amber-50/50 border-t border-amber-100/50">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                <p className="text-[11px] text-amber-700">{stats.total_alertas} paciente(s) requieren atención</p>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Flujo de Caja dinámico */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-4 h-4 text-medflow-emerald" />
          <h2 className="text-sm font-semibold text-medflow-slate">Flujo de Caja del Día</h2>
          <span className="ml-auto text-[11px] text-slate-400">
            {stats ? `Total: Bs. ${fmt(stats.caja.total_bs)}` : "Cargando..."}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "USD Total",   value: stats ? `$${fmt(stats.caja.total_usd)}` : "—",  sub: stats ? `Bs. ${fmt(stats.caja.total_bs)}` : "", color: "text-medflow-emerald" },
            { label: "Bs. Total",   value: stats ? `Bs. ${fmt(stats.caja.total_bs)}` : "—", sub: stats ? `$${fmt(stats.caja.total_usd)} equiv.` : "", color: "text-urology-blue" },
            { label: "Pacientes hoy", value: stats?.pacientes_hoy ?? "—", sub: "registrados", color: "text-medflow-slate" },
            { label: "Alertas PSA", value: stats?.total_alertas ?? "—", sub: "requieren atención", color: stats?.total_alertas ? "text-amber-600" : "text-medflow-emerald" },
          ].map((item) => (
            <div key={item.label} className="rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-[11px] text-slate-400 mb-1">{item.label}</p>
              <p className={cn("text-base font-bold", item.color)}>{item.value}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{item.sub}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
