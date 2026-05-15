"use client";

import { useState, useMemo } from "react";
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ReferenceArea, Dot,
} from "recharts";
import { TrendingUp, BarChart2 } from "lucide-react";
import { PSAMeasurementOut } from "@/lib/api";
import { cn } from "@/lib/utils";

// ── Helpers ───────────────────────────────────────────────────────────────────

const CONTEXT_ES: Record<string, string> = {
  SCREENING: "Tamizaje",
  POST_BIOPSY: "Post-biopsia",
  POST_RTU: "Post-RTU",
  POST_PROSTATECTOMY: "Post-prostatectomía",
  POST_RADIOTHERAPY: "Post-radioterapia",
  POST_HORMONOTHERAPY: "Post-hormonoterapia",
  ACTIVE_SURVEILLANCE: "Vigilancia activa",
  FOLLOW_UP: "Seguimiento",
};

function fmtDate(iso: string): string {
  const [y, m] = iso.split("-");
  const months = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  return `${months[parseInt(m) - 1]} '${y.slice(2)}`;
}

function dotColor(psa: number): string {
  if (psa > 10) return "#ef4444";
  if (psa > 4)  return "#f59e0b";
  return "#10b981";
}

// ── Custom Tooltip ────────────────────────────────────────────────────────────

function PSATooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-lg p-3 text-xs min-w-[170px]">
      <p className="font-bold text-medflow-slate mb-2">{fmtDate(d.date)}</p>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">PSA Total</span>
          <span className={cn("font-bold tabular-nums", d.psa > 10 ? "text-red-600" : d.psa > 4 ? "text-amber-600" : "text-medflow-emerald")}>
            {d.psa.toFixed(2)} ng/mL
          </span>
        </div>
        {d.psaFree != null && (
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">PSA Libre</span>
            <span className="font-semibold tabular-nums text-medflow-slate">{d.psaFree.toFixed(2)}</span>
          </div>
        )}
        {d.ratio != null && (
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Índice L/T</span>
            <span className={cn("font-bold tabular-nums", d.ratio < 15 ? "text-red-600" : d.ratio < 20 ? "text-amber-600" : "text-medflow-emerald")}>
              {d.ratio.toFixed(1)}%
            </span>
          </div>
        )}
        {d.density != null && (
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Densidad</span>
            <span className={cn("font-semibold tabular-nums", d.density > 0.15 ? "text-amber-600" : "text-medflow-slate")}>
              {d.density.toFixed(3)}
            </span>
          </div>
        )}
        <div className="pt-1 border-t border-slate-100">
          <span className="text-slate-400">{CONTEXT_ES[d.context] ?? d.context}</span>
        </div>
      </div>
    </div>
  );
}

// ── Custom Dot ────────────────────────────────────────────────────────────────

function ColoredDot(props: any) {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null) return null;
  return (
    <circle
      key={`dot-${cx}-${cy}`}
      cx={cx} cy={cy} r={5}
      fill={dotColor(payload.psa)}
      stroke="white" strokeWidth={2}
    />
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  measurements: PSAMeasurementOut[];
}

export default function PSAHistoryChart({ measurements }: Props) {
  const [scale, setScale] = useState<"linear" | "log">("linear");

  const hasProstatectomy = measurements.some(
    (m) => m.clinical_context === "POST_PROSTATECTOMY"
  );

  const chartData = useMemo(() =>
    [...measurements]
      .sort((a, b) => a.measurement_date.localeCompare(b.measurement_date))
      .map((m) => ({
        date:     m.measurement_date,
        label:    fmtDate(m.measurement_date),
        psa:      m.psa_total,
        psaFree:  m.psa_free ?? null,
        ratio:    m.psa_ratio ?? null,
        density:  m.psa_density ?? null,
        context:  m.clinical_context,
      })),
  [measurements]);

  const maxPSA = Math.max(...chartData.map((d) => d.psa), 12);
  const yDomain: [number | "auto", number | "auto"] =
    scale === "log"
      ? [0.05, Math.max(maxPSA * 1.5, 15)]
      : [0, Math.max(maxPSA * 1.2, 12)];

  if (measurements.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-10 flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
          <TrendingUp className="w-6 h-6 text-slate-300" />
        </div>
        <p className="text-sm font-medium text-slate-400">Sin mediciones PSA registradas</p>
        <p className="text-xs text-slate-300 text-center max-w-xs">
          Agrega la primera medición para comenzar a trazar la evolución longitudinal
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-urology-blue" />
          <h3 className="text-sm font-semibold text-medflow-slate">Trayectoria PSA</h3>
          <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            {chartData.length} medición{chartData.length !== 1 ? "es" : ""}
          </span>
        </div>
        <button
          onClick={() => setScale((s) => s === "linear" ? "log" : "linear")}
          className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors text-slate-600"
        >
          <BarChart2 className="w-3 h-3" />
          {scale === "linear" ? "Escala logarítmica" : "Escala lineal"}
        </button>
      </div>

      {/* Leyenda de zonas */}
      <div className="flex items-center gap-4 px-5 py-2 border-b border-slate-50 bg-slate-50/40">
        {[
          { color: "bg-medflow-emerald", label: "Normal (< 4 ng/mL)" },
          { color: "bg-amber-400",       label: "Zona gris (4–10)" },
          { color: "bg-red-400",         label: "Elevado (> 10)" },
        ].map((z) => (
          <div key={z.label} className="flex items-center gap-1.5">
            <span className={cn("w-2.5 h-2.5 rounded-full opacity-70", z.color)} />
            <span className="text-[10px] text-slate-500">{z.label}</span>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="px-2 py-4">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 8, right: 24, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />

            {/* Zonas de fondo */}
            <ReferenceArea y1={0}  y2={4}   fill="#10b981" fillOpacity={0.06} />
            <ReferenceArea y1={4}  y2={10}  fill="#f59e0b" fillOpacity={0.07} />
            <ReferenceArea y1={10} y2={200} fill="#ef4444" fillOpacity={0.05} />

            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              scale={scale}
              domain={yDomain}
              allowDataOverflow={false}
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `${v}`}
              width={36}
            />

            <Tooltip content={<PSATooltip />} />

            {/* Líneas de referencia clínicas */}
            <ReferenceLine
              y={4} stroke="#f59e0b" strokeDasharray="5 3" strokeWidth={1.5}
              label={{ value: "4.0", position: "right", fontSize: 9, fill: "#f59e0b" }}
            />
            <ReferenceLine
              y={10} stroke="#ef4444" strokeDasharray="5 3" strokeWidth={1.5}
              label={{ value: "10.0", position: "right", fontSize: 9, fill: "#ef4444" }}
            />
            {hasProstatectomy && (
              <ReferenceLine
                y={0.2} stroke="#dc2626" strokeDasharray="3 3" strokeWidth={1.5}
                label={{ value: "0.2 Rec. BQ", position: "right", fontSize: 9, fill: "#dc2626" }}
              />
            )}

            {/* Línea PSA Total */}
            <Line
              type="monotone"
              dataKey="psa"
              stroke="#2563eb"
              strokeWidth={2.5}
              dot={<ColoredDot />}
              activeDot={{ r: 7, stroke: "white", strokeWidth: 2 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
