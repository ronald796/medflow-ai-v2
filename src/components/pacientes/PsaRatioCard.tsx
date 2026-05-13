"use client";

import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  psaTotal: number;
  psaFree: number;
}

interface RatioLevel {
  label: string;
  description: string;
  recommendation: string;
  color: string;
  bg: string;
  border: string;
  icon: React.ElementType;
}

function getRatioLevel(ratio: number): RatioLevel {
  if (ratio < 10)
    return {
      label: "Riesgo Alto",
      description: "Índice < 10% — Sospecha de carcinoma",
      recommendation: "Biopsia de próstata indicada con urgencia.",
      color: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-200",
      icon: AlertTriangle,
    };
  if (ratio < 15)
    return {
      label: "Riesgo Elevado",
      description: "Índice 10–15% — Zona de alto riesgo",
      recommendation: "Considerar biopsia. Correlacionar con RM multiparamétrica.",
      color: "text-orange-600",
      bg: "bg-orange-50",
      border: "border-orange-200",
      icon: AlertTriangle,
    };
  if (ratio < 20)
    return {
      label: "Zona Gris",
      description: "Índice 15–20% — Indeterminado",
      recommendation: "Control cada 3 meses + eco transrectal recomendada.",
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-200",
      icon: Info,
    };
  return {
    label: "Menor Riesgo",
    description: "Índice > 20% — Perfil benigno",
    recommendation: "Probable HBP. Mantener control semestral de PSA.",
    color: "text-medflow-emerald",
    bg: "bg-medflow-emerald-light",
    border: "border-medflow-emerald/30",
    icon: CheckCircle2,
  };
}

export default function PsaRatioCard({ psaTotal, psaFree }: Props) {
  if (psaTotal <= 4) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h3 className="text-sm font-semibold text-medflow-slate mb-1">
          Calculadora PSA Libre/Total
        </h3>
        <p className="text-xs text-slate-400">
          El índice se activa automáticamente cuando PSA Total {">"} 4 ng/mL.
          PSA actual:{" "}
          <span className="font-semibold text-medflow-emerald">{psaTotal} ng/mL</span>
        </p>
      </div>
    );
  }

  const ratio = (psaFree / psaTotal) * 100;
  const level = getRatioLevel(ratio);
  const Icon = level.icon;

  // Arc fill percentage for the visual gauge (0-100 maps to 0-180deg)
  const fillPct = Math.min(ratio, 30) / 30; // normalize to 0-1 up to 30%

  return (
    <div className={cn("rounded-2xl border p-5", level.bg, level.border)}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-medflow-slate">Índice PSA Libre/Total</h3>
          <p className="text-xs text-slate-500 mt-0.5">Calculado automáticamente</p>
        </div>
        <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-white/80", level.color)}>
          <Icon className="w-3.5 h-3.5" />
          {level.label}
        </span>
      </div>

      {/* Big ratio number */}
      <div className="flex items-end gap-4 mb-4">
        <div>
          <p className={cn("text-5xl font-black tabular-nums leading-none", level.color)}>
            {ratio.toFixed(1)}
            <span className="text-2xl font-bold">%</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">
            PSA Libre: <b>{psaFree.toFixed(2)}</b> ÷ PSA Total: <b>{psaTotal.toFixed(2)}</b>
          </p>
        </div>

        {/* Mini bar gauge */}
        <div className="flex-1 mb-2">
          <div className="h-3 rounded-full bg-white/70 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(ratio / 30 * 100, 100)}%`,
                background:
                  ratio < 10 ? "#ef4444" :
                  ratio < 15 ? "#f97316" :
                  ratio < 20 ? "#f59e0b" : "#10b981",
              }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-slate-400 mt-1 px-0.5">
            <span>0%</span>
            <span>10%</span>
            <span>15%</span>
            <span>20%</span>
            <span>30%</span>
          </div>
        </div>
      </div>

      <p className={cn("text-xs font-medium mb-1", level.color)}>{level.description}</p>
      <p className="text-xs text-slate-600 bg-white/60 rounded-lg px-3 py-2">
        <span className="font-semibold">Sugerencia clínica:</span> {level.recommendation}
      </p>
    </div>
  );
}
