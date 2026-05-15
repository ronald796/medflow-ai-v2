"use client";

import { TrendingUp, TrendingDown, Minus, Activity, AlertTriangle } from "lucide-react";
import { PSAMetrics, PSAMeasurementOut } from "@/lib/api";
import { cn } from "@/lib/utils";

// ── Semáforo clínico ──────────────────────────────────────────────────────────

type Signal = "green" | "amber" | "red" | "neutral";

const SIGNAL_CLS: Record<Signal, string> = {
  green:   "bg-medflow-emerald-light text-medflow-emerald border-medflow-emerald/20",
  amber:   "bg-amber-50 text-amber-700 border-amber-100",
  red:     "bg-red-50 text-red-700 border-red-100",
  neutral: "bg-slate-100 text-slate-500 border-slate-100",
};

function Badge({ signal, label }: { signal: Signal; label: string }) {
  return (
    <span className={cn("inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border", SIGNAL_CLS[signal])}>
      {label}
    </span>
  );
}

// ── Señales clínicas según umbrales EAU 2025 ─────────────────────────────────

function velocitySignal(v: number | null): Signal {
  if (v === null) return "neutral";
  if (v > 0.75)  return "red";
  if (v > 0.35)  return "amber";
  return "green";
}

function doublingTimeSignal(dt: number | null): Signal {
  if (dt === null) return "neutral";
  if (dt < 12)  return "red";
  if (dt < 36)  return "amber";
  return "green";
}

function densitySignal(d: number | null): Signal {
  if (d === null) return "neutral";
  if (d > 0.15)  return "red";
  if (d > 0.10)  return "amber";
  return "green";
}

function ratioSignal(r: number | null): Signal {
  if (r === null) return "neutral";
  if (r < 15)  return "red";
  if (r < 20)  return "amber";
  return "green";
}

function trendSignal(t: string): Signal {
  if (t === "INCREASING")       return "red";
  if (t === "INSUFFICIENT_DATA") return "neutral";
  if (t === "STABLE")            return "amber";
  return "green";
}

// ── Fila de métrica ───────────────────────────────────────────────────────────

function MetricRow({
  label, value, unit, badge, hint,
}: {
  label: string;
  value: string;
  unit?: string;
  badge?: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-3 border-b border-slate-50 last:border-0">
      <div className="min-w-0">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
        {hint && <p className="text-[9px] text-slate-400 mt-0.5 leading-tight">{hint}</p>}
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className="text-sm font-bold text-medflow-slate tabular-nums">
          {value}{unit && <span className="text-[10px] font-normal text-slate-400 ml-0.5">{unit}</span>}
        </span>
        {badge}
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  metrics: PSAMetrics;
  latestMeasurement: PSAMeasurementOut | null;
}

export default function PSAMetricsPanel({ metrics, latestMeasurement }: Props) {
  const TrendIcon =
    metrics.trend === "INCREASING" ? TrendingUp :
    metrics.trend === "DECREASING" ? TrendingDown : Minus;

  const trendLabel =
    metrics.trend === "INCREASING"        ? "INCREMENTANDO"   :
    metrics.trend === "DECREASING"        ? "DISMINUYENDO"    :
    metrics.trend === "STABLE"            ? "ESTABLE"         :
    "INSUF. DATOS";

  const trendColor =
    metrics.trend === "INCREASING" ? "text-red-500" :
    metrics.trend === "DECREASING" ? "text-medflow-emerald" :
    "text-amber-500";

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-50">
        <Activity className="w-4 h-4 text-urology-blue" />
        <h3 className="text-sm font-semibold text-medflow-slate">Métricas Longitudinales</h3>
      </div>

      <div className="px-5 py-1">
        {/* Última medición */}
        {latestMeasurement && (
          <MetricRow
            label="Última medición"
            value={latestMeasurement.psa_total.toFixed(2)}
            unit="ng/mL"
            badge={
              <Badge
                signal={
                  latestMeasurement.psa_total > 10 ? "red" :
                  latestMeasurement.psa_total > 4  ? "amber" : "green"
                }
                label={
                  latestMeasurement.psa_total > 10 ? "Elevado" :
                  latestMeasurement.psa_total > 4  ? "Zona gris" : "Normal"
                }
              />
            }
            hint={latestMeasurement.measurement_date}
          />
        )}

        {/* Tendencia */}
        <div className="flex items-start justify-between gap-3 py-3 border-b border-slate-50">
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Tendencia</p>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendIcon className={cn("w-4 h-4", trendColor)} />
            <span className={cn("text-xs font-bold", trendColor)}>{trendLabel}</span>
          </div>
        </div>

        {/* PSA Velocity */}
        <MetricRow
          label="PSA Velocity"
          value={metrics.psa_velocity !== null ? metrics.psa_velocity.toFixed(2) : "N/D"}
          unit={metrics.psa_velocity !== null ? "ng/mL/año" : undefined}
          badge={<Badge signal={velocitySignal(metrics.psa_velocity)} label={
            metrics.psa_velocity === null ? "Sin datos" :
            metrics.psa_velocity > 0.75 ? "⚠ Alto" :
            metrics.psa_velocity > 0.35 ? "Moderado" : "Normal"
          } />}
          hint="> 0.75 ng/mL/año sugiere malignidad (EAU 2025)"
        />

        {/* Doubling Time */}
        <MetricRow
          label="Doubling Time (PSADT)"
          value={metrics.psa_doubling_time !== null ? metrics.psa_doubling_time.toFixed(1) : "N/D"}
          unit={metrics.psa_doubling_time !== null ? "meses" : undefined}
          badge={<Badge signal={doublingTimeSignal(metrics.psa_doubling_time)} label={
            metrics.psa_doubling_time === null ? "Sin datos" :
            metrics.psa_doubling_time < 12 ? "⚠ Rápido" :
            metrics.psa_doubling_time < 36 ? "Moderado" : "Lento"
          } />}
          hint="< 3 años es preocupante en vigilancia activa"
        />

        {/* Índice L/T */}
        <MetricRow
          label="Índice PSA Libre/Total"
          value={latestMeasurement?.psa_ratio != null ? latestMeasurement.psa_ratio.toFixed(1) : "N/D"}
          unit={latestMeasurement?.psa_ratio != null ? "%" : undefined}
          badge={<Badge signal={ratioSignal(latestMeasurement?.psa_ratio ?? null)} label={
            latestMeasurement?.psa_ratio == null ? "Sin datos" :
            latestMeasurement.psa_ratio < 15 ? "🔴 Alta sospecha" :
            latestMeasurement.psa_ratio < 20 ? "Zona gris" : "Normal"
          } />}
          hint="< 15% alta sospecha de malignidad"
        />

        {/* Densidad PSA */}
        <MetricRow
          label="Densidad PSA"
          value={latestMeasurement?.psa_density != null ? latestMeasurement.psa_density.toFixed(3) : "N/D"}
          badge={<Badge signal={densitySignal(latestMeasurement?.psa_density ?? null)} label={
            latestMeasurement?.psa_density == null ? "Requiere vol." :
            latestMeasurement.psa_density > 0.15 ? "⚠ Biopsia" : "Normal"
          } />}
          hint="> 0.15 ng/mL/cc sugiere biopsia"
        />

        {/* PSA Nadir */}
        {metrics.psa_nadir !== null && (
          <MetricRow
            label="PSA Nadir"
            value={metrics.psa_nadir.toFixed(2)}
            unit="ng/mL"
            hint="Valor mínimo post-tratamiento"
          />
        )}

        {/* Recurrencia bioquímica */}
        {metrics.biochemical_recurrence !== null && (
          <div className={cn(
            "mt-3 mb-1 rounded-xl px-3 py-2.5 flex items-center gap-2",
            metrics.biochemical_recurrence
              ? "bg-red-50 border border-red-100"
              : "bg-medflow-emerald-light border border-medflow-emerald/20"
          )}>
            <AlertTriangle className={cn("w-4 h-4 flex-shrink-0",
              metrics.biochemical_recurrence ? "text-red-500" : "text-medflow-emerald"
            )} />
            <p className={cn("text-xs font-semibold",
              metrics.biochemical_recurrence ? "text-red-700" : "text-medflow-emerald"
            )}>
              {metrics.biochemical_recurrence
                ? "Recurrencia bioquímica detectada (criterio AUA)"
                : "Sin evidencia de recurrencia bioquímica"}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-50">
        <p className="text-[9px] text-slate-400 leading-relaxed">
          Umbrales: EAU 2025 · AUA 2023 · Criterio Phoenix (post-RT)
        </p>
      </div>
    </div>
  );
}
