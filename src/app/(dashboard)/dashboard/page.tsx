import {
  Users,
  CalendarClock,
  Activity,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

interface KpiCard {
  label: string;
  value: string | number;
  sublabel: string;
  icon: React.ElementType;
  trend?: { value: string; up: boolean };
  accent: string;
  iconBg: string;
}

interface SurgeryItem {
  id: string;
  patient: string;
  procedure: string;
  hour: string;
  status: "confirmada" | "en-curso" | "completada" | "pendiente";
  surgeon: string;
}

interface PsaAlert {
  id: string;
  patient: string;
  age: number;
  psa: number;
  variation: number;
  priority: "alta" | "media" | "baja";
}

// ── Mock Data ────────────────────────────────────────────────────────────────

const kpiCards: KpiCard[] = [
  {
    label: "Pacientes Hoy",
    value: 14,
    sublabel: "3 en sala de espera",
    icon: Users,
    trend: { value: "+2 vs ayer", up: true },
    accent: "text-urology-blue",
    iconBg: "bg-urology-blue-light",
  },
  {
    label: "Cirugías Programadas",
    value: 3,
    sublabel: "Próxima: 09:30 AM",
    icon: CalendarClock,
    trend: { value: "Sin cambios", up: true },
    accent: "text-medflow-emerald",
    iconBg: "bg-medflow-emerald-light",
  },
  {
    label: "PSA Pendientes",
    value: 7,
    sublabel: "2 con alerta crítica",
    icon: Activity,
    trend: { value: "+3 nuevos", up: false },
    accent: "text-amber-600",
    iconBg: "bg-amber-50",
  },
  {
    label: "Caja del Día",
    value: "$1,840",
    sublabel: "Bs. 170,108 · Tasa 92.45",
    icon: DollarSign,
    trend: { value: "+12% vs ayer", up: true },
    accent: "text-medflow-emerald",
    iconBg: "bg-medflow-emerald-light",
  },
];

const surgeries: SurgeryItem[] = [
  {
    id: "1",
    patient: "Carlos Medina R.",
    procedure: "Litotripsia extracorpórea",
    hour: "09:30",
    status: "confirmada",
    surgeon: "Dr. Ramírez",
  },
  {
    id: "2",
    patient: "José L. Torrealba",
    procedure: "Prostatectomía radical",
    hour: "11:00",
    status: "en-curso",
    surgeon: "Dr. Ramírez",
  },
  {
    id: "3",
    patient: "Luis F. Gutiérrez",
    procedure: "Ureteroscopía + extracción",
    hour: "14:30",
    status: "pendiente",
    surgeon: "Dr. Ramírez",
  },
];

const psaAlerts: PsaAlert[] = [
  { id: "1", patient: "Miguel A. Soto", age: 68, psa: 12.4, variation: 4.2, priority: "alta" },
  { id: "2", patient: "Ramón Pérez C.", age: 71, psa: 8.7, variation: 2.1, priority: "media" },
  { id: "3", patient: "Antonio Flores", age: 59, psa: 5.2, variation: 1.8, priority: "baja" },
];

// ── Sub-components ───────────────────────────────────────────────────────────

function KpiCardComp({ card }: { card: KpiCard }) {
  const Icon = card.icon;
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className={cn("p-2.5 rounded-xl", card.iconBg)}>
          <Icon className={cn("w-5 h-5", card.accent)} />
        </div>
        {card.trend && (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full",
              card.trend.up
                ? "text-medflow-emerald bg-medflow-emerald-light"
                : "text-red-500 bg-red-50"
            )}
          >
            {card.trend.up ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {card.trend.value}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-medflow-slate mb-1">{card.value}</p>
      <p className="text-xs font-medium text-medflow-slate mb-0.5">{card.label}</p>
      <p className="text-[11px] text-slate-400">{card.sublabel}</p>
    </div>
  );
}

const surgeryStatusConfig = {
  confirmada: { label: "Confirmada", className: "bg-blue-50 text-blue-600", icon: CheckCircle2 },
  "en-curso": { label: "En curso", className: "bg-amber-50 text-amber-600", icon: Clock },
  completada: { label: "Completada", className: "bg-medflow-emerald-light text-medflow-emerald", icon: CheckCircle2 },
  pendiente: { label: "Pendiente", className: "bg-slate-100 text-slate-500", icon: Clock },
};

const psaPriorityConfig = {
  alta: { label: "Alta", dot: "bg-red-500", text: "text-red-600", bg: "bg-red-50" },
  media: { label: "Media", dot: "bg-amber-500", text: "text-amber-600", bg: "bg-amber-50" },
  baja: { label: "Normal", dot: "bg-medflow-emerald", text: "text-medflow-emerald", bg: "bg-medflow-emerald-light" },
};

// ── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const today = new Intl.DateTimeFormat("es-VE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-medflow-slate">Control de Mando</h1>
          <p className="text-sm text-slate-400 capitalize mt-0.5">{today}</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-100 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-medflow-emerald animate-pulse" />
          <span className="text-xs font-medium text-medflow-slate">Sistema activo</span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <KpiCardComp key={card.label} card={card} />
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Agenda Quirúrgica del Día — 2/3 */}
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
            {surgeries.map((surgery) => {
              const cfg = surgeryStatusConfig[surgery.status];
              const StatusIcon = cfg.icon;
              return (
                <div key={surgery.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex-shrink-0 text-center w-14">
                    <p className="text-base font-bold text-medflow-slate">{surgery.hour}</p>
                    <p className="text-[10px] text-slate-400">hrs</p>
                  </div>
                  <div className="w-px h-8 bg-slate-100 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-medflow-slate truncate">{surgery.patient}</p>
                    <p className="text-xs text-slate-400 truncate">{surgery.procedure}</p>
                  </div>
                  <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full flex-shrink-0", cfg.className)}>
                    <StatusIcon className="w-3 h-3" />
                    {cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Alertas PSA — 1/3 */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-semibold text-medflow-slate">Alertas PSA</h2>
            </div>
            <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-red-500 text-white rounded-full">
              {psaAlerts.filter((a) => a.priority === "alta").length}
            </span>
          </div>
          <div className="divide-y divide-slate-50">
            {psaAlerts.map((alert) => {
              const cfg = psaPriorityConfig[alert.priority];
              return (
                <div key={alert.id} className="px-5 py-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-start justify-between mb-1.5">
                    <p className="text-sm font-semibold text-medflow-slate leading-tight">{alert.patient}</p>
                    <span className={cn("inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ml-2", cfg.bg, cfg.text)}>
                      <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
                      {cfg.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">{alert.age} años</span>
                    <span className="text-[10px] text-slate-300">·</span>
                    <span className="text-xs font-bold text-medflow-slate">PSA: {alert.psa} ng/mL</span>
                    <span className={cn("text-[11px] font-semibold", alert.variation > 3 ? "text-red-500" : "text-amber-500")}>
                      +{alert.variation}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="px-5 py-3 bg-amber-50/50 border-t border-amber-100/50">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              <p className="text-[11px] text-amber-700">1 caso requiere biopsia urgente</p>
            </div>
          </div>
        </div>

      </div>

      {/* Cash Flow Summary */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-4 h-4 text-medflow-emerald" />
          <h2 className="text-sm font-semibold text-medflow-slate">Flujo de Caja Bimonetario</h2>
          <span className="ml-auto text-[11px] text-slate-400">Tasa BCV: Bs. 92.45 / USD</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Efectivo USD", value: "$420.00", sub: "Bs. 38,829", color: "text-urology-blue" },
            { label: "Zelle", value: "$980.00", sub: "Bs. 90,601", color: "text-medflow-emerald" },
            { label: "Pago Móvil", value: "Bs. 25,400", sub: "$274.73 USD", color: "text-purple-600" },
            { label: "Efectivo Bs.", value: "Bs. 15,278", sub: "$165.24 USD", color: "text-amber-600" },
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
