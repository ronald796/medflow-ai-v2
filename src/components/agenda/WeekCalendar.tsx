"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  User,
  Clock,
  Stethoscope,
  X,
  DollarSign,
  FileText,
} from "lucide-react";
import {
  Surgery,
  SurgeryStatus,
  getWeekStart,
  formatWeekLabel,
  getSurgeriesForDay,
  getSurgeriesForWeek,
} from "@/lib/mock-agenda";
import { cn, formatCurrency } from "@/lib/utils";

// ── Status config ────────────────────────────────────────────────────────────

const STATUS_CFG: Record<
  SurgeryStatus,
  { label: string; bar: string; bg: string; text: string; badge: string; dot?: string }
> = {
  programada: {
    label: "Programada",
    bar: "bg-urology-blue",
    bg: "bg-urology-blue-light/60",
    text: "text-urology-blue",
    badge: "bg-urology-blue-light text-urology-blue",
  },
  "en-pabellon": {
    label: "En Pabellón",
    bar: "bg-amber-500",
    bg: "bg-amber-50",
    text: "text-amber-700",
    badge: "bg-amber-100 text-amber-700",
    dot: "animate-pulse",
  },
  recuperacion: {
    label: "Recuperación",
    bar: "bg-purple-500",
    bg: "bg-purple-50",
    text: "text-purple-700",
    badge: "bg-purple-100 text-purple-700",
  },
  finalizada: {
    label: "Finalizada",
    bar: "bg-medflow-emerald",
    bg: "bg-medflow-emerald-light/50",
    text: "text-medflow-emerald",
    badge: "bg-medflow-emerald-light text-medflow-emerald",
  },
  cancelada: {
    label: "Cancelada",
    bar: "bg-slate-300",
    bg: "bg-slate-50",
    text: "text-slate-400",
    badge: "bg-slate-100 text-slate-400",
  },
};

const DAY_NAMES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

// ── Surgery Card ─────────────────────────────────────────────────────────────

function SurgeryCard({
  surgery,
  onClick,
}: {
  surgery: Surgery;
  onClick: (s: Surgery) => void;
}) {
  const cfg = STATUS_CFG[surgery.status];
  return (
    <button
      onClick={() => onClick(surgery)}
      className={cn(
        "w-full text-left rounded-xl overflow-hidden border border-slate-100 hover:shadow-md transition-all duration-150 hover:-translate-y-0.5",
        cfg.bg
      )}
    >
      {/* Colored top bar */}
      <div className={cn("h-1 w-full", cfg.bar)} />
      <div className="px-3 py-2.5">
        {/* Time + status */}
        <div className="flex items-center justify-between mb-1.5">
          <span className="flex items-center gap-1 text-[10px] font-bold text-medflow-slate">
            <Clock className="w-3 h-3 text-slate-400" />
            {surgery.startTime}
          </span>
          <span className={cn("inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full", cfg.badge)}>
            {cfg.dot && <span className={cn("w-1.5 h-1.5 rounded-full bg-amber-500", cfg.dot)} />}
            {cfg.label}
          </span>
        </div>

        {/* Procedure */}
        <p className="text-xs font-semibold text-medflow-slate leading-tight line-clamp-2 mb-1.5">
          {surgery.procedure}
        </p>

        {/* Patient */}
        <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-1">
          <User className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{surgery.patientName}</span>
        </div>

        {/* Quirofano */}
        <div className="flex items-center gap-1 text-[10px] text-slate-400">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{surgery.quirofano}</span>
        </div>
      </div>
    </button>
  );
}

// ── Detail Modal ──────────────────────────────────────────────────────────────

function SurgeryModal({
  surgery,
  onClose,
}: {
  surgery: Surgery;
  onClose: () => void;
}) {
  const cfg = STATUS_CFG[surgery.status];
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className={cn("h-1.5 w-full", cfg.bar)} />
        <div className="px-6 py-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-medflow-slate">{surgery.procedure}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{surgery.date} · {surgery.startTime} hrs</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {[
              { icon: User,        label: "Paciente",        value: surgery.patientName },
              { icon: MapPin,      label: "Quirófano",       value: surgery.quirofano },
              { icon: Stethoscope, label: "Anestesiólogo",   value: surgery.anesthesiologist },
              { icon: Clock,       label: "Duración",        value: `${surgery.duration} min` },
              { icon: DollarSign,  label: "Honorarios",      value: formatCurrency(surgery.honorarios) },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">{label}</p>
                  <p className="text-sm font-semibold text-medflow-slate">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {surgery.notes && (
            <div className="mt-4 flex items-start gap-2 bg-amber-50 rounded-xl px-3 py-2.5">
              <FileText className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">{surgery.notes}</p>
            </div>
          )}

          <div className="mt-5 flex gap-2">
            {surgery.patientId && (
              <Link
                href={`/pacientes/${surgery.patientId}`}
                className="flex-1 py-2.5 text-xs font-semibold text-center bg-urology-blue-light text-urology-blue rounded-xl hover:bg-urology-blue hover:text-white transition-colors"
              >
                Ver ficha del paciente
              </Link>
            )}
            <button
              onClick={onClose}
              className="flex-1 py-2.5 text-xs font-semibold bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Calendar ─────────────────────────────────────────────────────────────

export default function WeekCalendar() {
  const todayStr = new Date().toISOString().split("T")[0];
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [selectedSurgery, setSelectedSurgery] = useState<Surgery | null>(null);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const navigateWeek = (dir: 1 | -1) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + dir * 7);
    setWeekStart(d);
  };

  const goToday = () => setWeekStart(getWeekStart(new Date()));
  const isCurrentWeek = weekStart.toISOString().split("T")[0] === getWeekStart(new Date()).toISOString().split("T")[0];

  const allSurgeries = getSurgeriesForWeek(weekStart);
  const activeCount = allSurgeries.filter((s) => s.status === "en-pabellon").length;
  const programadaCount = allSurgeries.filter((s) => s.status === "programada").length;
  const finalizadaCount = allSurgeries.filter((s) => s.status === "finalizada").length;

  return (
    <>
      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: "Total semana", value: allSurgeries.length, color: "text-medflow-slate" },
          { label: "En Pabellón", value: activeCount, color: "text-amber-600" },
          { label: "Programadas", value: programadaCount, color: "text-urology-blue" },
          { label: "Finalizadas", value: finalizadaCount, color: "text-medflow-emerald" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-slate-100 px-4 py-3">
            <p className="text-[10px] text-slate-400 mb-1">{stat.label}</p>
            <p className={cn("text-2xl font-black leading-none", stat.color)}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Calendar card */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {/* Week nav */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-50">
          <button
            onClick={() => navigateWeek(-1)}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className="flex-1 text-sm font-semibold text-medflow-slate capitalize text-center">
            {formatWeekLabel(weekStart)}
          </h2>
          <button
            onClick={() => navigateWeek(1)}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          {!isCurrentWeek && (
            <button
              onClick={goToday}
              className="text-xs font-semibold text-medflow-emerald hover:underline ml-1"
            >
              Hoy
            </button>
          )}
        </div>

        {/* Day columns */}
        <div className="grid grid-cols-7 divide-x divide-slate-50 min-h-[420px]">
          {weekDays.map((day, i) => {
            const dateStr = day.toISOString().split("T")[0];
            const isToday = dateStr === todayStr;
            const daySurgeries = getSurgeriesForDay(dateStr);

            return (
              <div key={dateStr} className={cn("flex flex-col", isToday && "bg-urology-blue-light/20")}>
                {/* Day header */}
                <div className={cn("px-2 py-3 text-center border-b border-slate-50", isToday && "bg-urology-blue-light/30")}>
                  <p className={cn("text-[10px] font-semibold uppercase tracking-wider", isToday ? "text-urology-blue" : "text-slate-400")}>
                    {DAY_NAMES[i]}
                  </p>
                  <p className={cn(
                    "text-lg font-black leading-none mt-0.5",
                    isToday
                      ? "text-urology-blue bg-urology-blue text-white w-7 h-7 rounded-full flex items-center justify-center mx-auto text-sm"
                      : "text-medflow-slate"
                  )}>
                    {day.getDate()}
                  </p>
                </div>

                {/* Surgeries */}
                <div className="flex-1 p-1.5 space-y-1.5 overflow-y-auto">
                  {daySurgeries.length === 0 ? (
                    <div className="flex items-center justify-center h-full py-6">
                      <p className="text-[10px] text-slate-300 rotate-0">—</p>
                    </div>
                  ) : (
                    daySurgeries.map((s) => (
                      <SurgeryCard key={s.id} surgery={s} onClick={setSelectedSurgery} />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail modal */}
      {selectedSurgery && (
        <SurgeryModal surgery={selectedSurgery} onClose={() => setSelectedSurgery(null)} />
      )}
    </>
  );
}
