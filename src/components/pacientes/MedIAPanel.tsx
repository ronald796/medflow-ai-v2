"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Sparkles, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Clock, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Patient } from "@/lib/types";
import { analyzePatient } from "@/lib/api";

interface Props {
  patient: Patient;
}

interface Insight {
  type: "warning" | "success" | "info";
  text: string;
}

function buildInsights(patient: Patient): { summary: string; velocity: string; insights: Insight[] } {
  const history = patient.psaHistory;
  const latest = history[history.length - 1];
  const prev = history.length >= 2 ? history[history.length - 2] : null;

  let velocity = 0;
  if (prev && latest) {
    const years =
      (new Date(latest.date).getTime() - new Date(prev.date).getTime()) /
      (1000 * 60 * 60 * 24 * 365);
    velocity = years > 0 ? (latest.psaTotal - prev.psaTotal) / years : 0;
  }

  const ratio = latest ? (latest.psaFree / latest.psaTotal) * 100 : 100;
  const insights: Insight[] = [];

  if (velocity > 2)
    insights.push({
      type: "warning",
      text: `Velocidad de PSA de ${velocity.toFixed(1)} ng/mL/año. Supera el umbral de riesgo (>2). Sugiero considerar Biopsia por fusión de imágenes.`,
    });
  else if (velocity > 0.75)
    insights.push({
      type: "warning",
      text: `PSA en ascenso sostenido (${velocity.toFixed(2)} ng/mL/año). Monitoreo trimestral recomendado.`,
    });
  else
    insights.push({
      type: "success",
      text: `Velocidad de PSA estable (${velocity.toFixed(2)} ng/mL/año). Seguimiento semestral apropiado.`,
    });

  if (latest?.psaTotal > 4 && ratio < 15)
    insights.push({
      type: "warning",
      text: `Índice PSA Libre/Total de ${ratio.toFixed(1)}% (< 15%). Alta probabilidad de carcinoma. Correlacionar con RM multiparamétrica.`,
    });
  else if (latest?.psaTotal > 4 && ratio < 20)
    insights.push({
      type: "info",
      text: `Índice PSA Libre/Total en zona gris (${ratio.toFixed(1)}%). Considerar eco transrectal.`,
    });

  if (patient.prostaticVolume && patient.prostaticVolume > 50)
    insights.push({
      type: "info",
      text: `Volumen prostático ${patient.prostaticVolume} cc. Paciente candidato a evaluación de IPSS y considerar terapia médica (Alpha-bloqueante).`,
    });

  if (patient.status === "post-op" && latest?.psaTotal > 0.2)
    insights.push({
      type: "warning",
      text: `PSA postoperatorio de ${latest?.psaTotal} ng/mL. Verificar criterios de recurrencia bioquímica (> 0.2 ng/mL).`,
    });

  const summary =
    patient.status === "pendiente-biopsia"
      ? `Doctor, el perfil de ${patient.name.split(" ")[0]} requiere acción pronta. El patrón de PSA es consistente con proceso maligno de bajo a moderado volumen.`
      : patient.status === "post-op"
      ? `Seguimiento post-prostatectomía en curso. PSA nadir alcanzado. Monitoreo para recurrencia bioquímica activo.`
      : `Caso en seguimiento. Parámetros dentro del rango de vigilancia activa.`;

  return {
    summary,
    velocity: velocity.toFixed(2),
    insights,
  };
}

const iconMap = {
  warning: AlertTriangle,
  success: CheckCircle2,
  info: Clock,
};

const colorMap = {
  warning: "text-amber-600 bg-amber-50 border-amber-100",
  success: "text-medflow-emerald bg-medflow-emerald-light border-medflow-emerald/20",
  info: "text-urology-blue bg-urology-blue-light border-blue-100",
};

export default function MedIAPanel({ patient }: Props) {
  const [expanded, setExpanded] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(false);

  const { summary, velocity, insights } = buildInsights(patient);

  const latest = patient.psaHistory[patient.psaHistory.length - 1];

  const runAiAnalysis = useCallback(async () => {
    setAiLoading(true);
    setAiError(false);
    try {
      const result = await analyzePatient({
        name: patient.name,
        age: patient.age,
        psa_total: latest?.psaTotal ?? 0,
        psa_free: latest?.psaFree,
        prostate_volume: patient.prostaticVolume,
        psa_history: patient.psaHistory.map((r) => ({
          date: r.date,
          psa_total: r.psaTotal,
        })),
        observations: patient.notes ?? patient.primaryDiagnosis,
      });
      setAiAnalysis(result.analysis);
    } catch {
      setAiError(true);
    } finally {
      setAiLoading(false);
    }
  }, [patient, latest]);

  return (
    <div className="bg-medflow-slate rounded-2xl overflow-hidden shadow-lg">
      {/* Header */}
      <div className="px-5 py-4 flex items-center gap-3">
        <div className="relative w-8 h-8 flex-shrink-0">
          <Image src="/logo-medflow.png" alt="MedIA" fill className="object-contain" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-white text-sm font-semibold">MedIA</p>
            {aiLoading ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
                <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                Consultando IA...
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-medflow-emerald/20 text-medflow-emerald px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-medflow-emerald animate-pulse" />
                {aiAnalysis ? "Análisis listo" : "Análisis local"}
              </span>
            )}
          </div>
          <p className="text-slate-400 text-[10px] mt-0.5">Inteligencia Urológica · Groq / Llama 3.3</p>
        </div>
        <button onClick={() => setExpanded(!expanded)} className="text-slate-400 hover:text-white transition-colors">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="px-5 pb-5 space-y-4">

          {/* AI Analysis block (Groq) or local fallback */}
          <div className="bg-white/8 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-medflow-emerald flex-shrink-0 mt-0.5" />
              {aiLoading ? (
                <div className="space-y-2 flex-1">
                  <div className="h-2.5 bg-white/10 rounded animate-pulse w-full" />
                  <div className="h-2.5 bg-white/10 rounded animate-pulse w-4/5" />
                  <div className="h-2.5 bg-white/10 rounded animate-pulse w-3/5" />
                </div>
              ) : (
                <p className="text-slate-200 text-xs leading-relaxed">
                  {aiAnalysis ?? summary}
                </p>
              )}
            </div>
          </div>

          {/* Local rule-based insights */}
          <div className="space-y-2">
            {insights.map((insight, idx) => {
              const Icon = iconMap[insight.type];
              return (
                <div key={idx} className={cn("rounded-xl border px-3 py-3 flex items-start gap-2.5", colorMap[insight.type])}>
                  <Icon className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed">{insight.text}</p>
                </div>
              );
            })}
          </div>

          {/* Groq analysis button */}
          {!aiAnalysis && !aiLoading && (
            <button
              onClick={runAiAnalysis}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold bg-medflow-emerald/20 text-medflow-emerald rounded-xl hover:bg-medflow-emerald/30 transition-colors border border-medflow-emerald/20"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Analizar con Groq / Llama 3.3
            </button>
          )}

          {aiError && (
            <p className="text-[10px] text-red-400 text-center">
              Backend no disponible. Verifica que FastAPI esté corriendo en :8000
            </p>
          )}

          {aiAnalysis && (
            <button onClick={runAiAnalysis} className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[10px] text-slate-500 hover:text-slate-300 transition-colors">
              <RefreshCw className="w-3 h-3" />
              Regenerar análisis
            </button>
          )}

          <p className="text-[10px] text-slate-500 text-center leading-relaxed">
            MedIA es apoyo clínico. La decisión es responsabilidad del médico tratante.
          </p>
        </div>
      )}
    </div>
  );
}
