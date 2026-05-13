"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import { PsaRecord } from "@/lib/types";
import { filterPsaHistory } from "@/lib/mock-patients";
import { cn } from "@/lib/utils";

interface Props {
  history: PsaRecord[];
}

type Range = "6m" | "1y" | "2y";

const RANGES: { label: string; value: Range }[] = [
  { label: "6 meses", value: "6m" },
  { label: "1 año",   value: "1y" },
  { label: "2 años",  value: "2y" },
];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-lg px-4 py-3 text-xs">
      <p className="font-semibold text-medflow-slate mb-2">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-slate-500">{entry.name}:</span>
          <span className="font-bold" style={{ color: entry.color }}>
            {entry.value?.toFixed(2)} ng/mL
          </span>
        </div>
      ))}
    </div>
  );
}

export default function PsaChart({ history }: Props) {
  const [range, setRange] = useState<Range>("1y");
  const data = filterPsaHistory(history, range);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-medflow-slate">Evolución de PSA</h3>
          <p className="text-xs text-slate-400 mt-0.5">PSA Total vs PSA Libre — ng/mL</p>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                range === r.value
                  ? "bg-white text-medflow-slate shadow-sm"
                  : "text-slate-400 hover:text-medflow-slate"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            domain={["auto", "auto"]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 11, paddingTop: 12, color: "#64748b" }}
          />
          {/* Reference line at PSA 4 (clinical threshold) */}
          <ReferenceLine
            y={4}
            stroke="#f59e0b"
            strokeDasharray="4 4"
            strokeWidth={1.5}
            label={{ value: "Umbral 4", position: "right", fontSize: 10, fill: "#f59e0b" }}
          />
          <Line
            type="monotone"
            dataKey="psaTotal"
            name="PSA Total"
            stroke="#2563eb"
            strokeWidth={2.5}
            dot={{ fill: "#2563eb", r: 4, strokeWidth: 2, stroke: "#fff" }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="psaFree"
            name="PSA Libre"
            stroke="#10b981"
            strokeWidth={2}
            strokeDasharray="5 3"
            dot={{ fill: "#10b981", r: 3, strokeWidth: 2, stroke: "#fff" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* PSA Velocity badge */}
      {data.length >= 2 && (() => {
        const first = data[0];
        const last = data[data.length - 1];
        const years =
          (new Date(last.date).getTime() - new Date(first.date).getTime()) /
          (1000 * 60 * 60 * 24 * 365);
        const velocity = ((last.psaTotal - first.psaTotal) / years).toFixed(2);
        const isHigh = parseFloat(velocity) > 0.75;
        return (
          <div className={cn(
            "mt-4 flex items-center gap-2 px-3 py-2 rounded-lg text-xs",
            isHigh ? "bg-red-50 text-red-700" : "bg-medflow-emerald-light text-medflow-emerald"
          )}>
            <span className="font-semibold">Velocidad PSA:</span>
            <span className="font-bold">{velocity} ng/mL/año</span>
            <span className="opacity-70">({isHigh ? "Velocidad elevada — seguimiento estrecho" : "Velocidad dentro de rango aceptable"})</span>
          </div>
        );
      })()}
    </div>
  );
}
