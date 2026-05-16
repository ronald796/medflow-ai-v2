"use client";

import { cn } from "@/lib/utils";
import type { PatientExpandedDB } from "@/lib/patient-expanded-types";
import {
  DIAGNOSIS_LABELS, LUTS_LABELS, LUTS_SEVERITY_LABELS,
  DRE_SIZE_LABELS, DRE_CONSISTENCY_LABELS, DRE_LOCATION_LABELS,
  psaTotalSignal, ratioLTSignal, densitySignal, ipssSignal, ipssLabel,
  bmiSignal, bmiLabel, lutsSeveritySignal, signalBadgeClass, signalEmoji, val,
} from "@/lib/clinical-translations";

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-50 flex items-center gap-2">
        <span className="text-base">{icon}</span>
        <h3 className="text-sm font-semibold text-medflow-slate">{title}</h3>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-slate-50 last:border-0">
      <span className="text-xs text-slate-400">{label}</span>
      <span className={cn("text-xs font-medium", value === "—" ? "text-slate-300" : "text-medflow-slate")}>{value}</span>
    </div>
  );
}

function MarkerRow({ label, value, unit, signal, interpretation }: {
  label: string; value: string; unit?: string;
  signal: "green" | "amber" | "red" | null;
  interpretation?: string;
}) {
  return (
    <tr className="hover:bg-slate-50/50">
      <td className="px-4 py-3 text-xs font-medium text-medflow-slate whitespace-nowrap">{label}</td>
      <td className={cn("px-4 py-3 text-sm font-bold tabular-nums",
        signal === "green" ? "text-medflow-emerald" :
        signal === "amber" ? "text-amber-600" :
        signal === "red"   ? "text-red-600" : "text-slate-500"
      )}>
        {value}{unit && value !== "—" ? ` ${unit}` : ""}
      </td>
      <td className="px-4 py-3">
        {signal && (
          <span className={cn("inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border", signalBadgeClass(signal))}>
            {signalEmoji(signal)} {interpretation}
          </span>
        )}
      </td>
    </tr>
  );
}

interface Props { patient: PatientExpandedDB }

export default function UrologicoTab({ patient: p }: Props) {
  const ratio   = p.indice_psa;
  const density = (p.psa_total && p.volumen_prostatico) ? p.psa_total / p.volumen_prostatico : null;
  const activeLuts = p.luts_symptoms.filter(l => l.active);

  return (
    <div className="space-y-4">

      {/* Motivo de consulta */}
      {(p.chief_complaint || p.motivo_consulta) && (
        <Section title="Motivo de Consulta" icon="💬">
          <blockquote className="border-l-4 border-urology-blue pl-4 py-1">
            <p className="text-sm text-medflow-slate leading-relaxed italic">
              "{p.chief_complaint ?? p.motivo_consulta}"
            </p>
          </blockquote>
        </Section>
      )}

      {/* Diagnósticos */}
      {p.diagnoses.length > 0 && (
        <Section title="Diagnósticos" icon="📋">
          <div className="space-y-2.5">
            {p.diagnoses.map(d => (
              <div key={d.id} className={cn(
                "flex items-start gap-3 px-3 py-2.5 rounded-xl border",
                d.is_primary === 1
                  ? "bg-urology-blue-light border-blue-100"
                  : "bg-slate-50 border-slate-100"
              )}>
                {d.is_primary === 1 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-urology-blue text-white flex-shrink-0 mt-0.5">DX</span>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-medflow-slate">{DIAGNOSIS_LABELS[d.code] ?? d.code}</p>
                  {d.icd10_code && <p className="text-[10px] font-mono text-slate-400 mt-0.5">CIE-10: {d.icd10_code}</p>}
                  {d.notes && <p className="text-xs text-slate-500 mt-0.5">{d.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Síntomas LUTS */}
      <Section title="Síntomas LUTS" icon="🚿">
        {activeLuts.length === 0 ? (
          <p className="text-sm text-slate-400 italic">Sin síntomas LUTS registrados</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50">
                  {["Síntoma", "Severidad", "Detalle"].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {activeLuts.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50/50">
                    <td className="px-3 py-3 font-medium text-medflow-slate">{LUTS_LABELS[l.symptom] ?? l.symptom}</td>
                    <td className="px-3 py-3">
                      {l.severity ? (
                        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border", signalBadgeClass(lutsSeveritySignal(l.severity)))}>
                          {LUTS_SEVERITY_LABELS[l.severity] ?? l.severity}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-3 py-3 text-slate-500">
                      {l.symptom === "NOCTURIA" && l.nocturia_times ? `${l.nocturia_times} veces/noche` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* Exploración física */}
      <Section title="Exploración Física" icon="🩺">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: "TA", value: (p.bp_systolic && p.bp_diastolic) ? `${p.bp_systolic}/${p.bp_diastolic} mmHg` : "—" },
            { label: "FC", value: p.heart_rate ? `${p.heart_rate} lpm` : "—" },
            { label: "Peso", value: p.weight_kg ? `${p.weight_kg} kg` : "—" },
            { label: "Talla", value: p.height_cm ? `${p.height_cm} cm` : "—" },
          ].map(item => (
            <div key={item.label} className="bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">{item.label}</p>
              <p className={cn("text-sm font-bold mt-0.5", item.value === "—" ? "text-slate-300" : "text-medflow-slate")}>{item.value}</p>
            </div>
          ))}
          {p.imc != null && (
            <div className={cn("rounded-xl px-3 py-2.5 border",
              bmiSignal(p.imc) === "green" ? "bg-medflow-emerald-light border-medflow-emerald/20" :
              bmiSignal(p.imc) === "amber" ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200"
            )}>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">IMC</p>
              <p className={cn("text-sm font-bold mt-0.5",
                bmiSignal(p.imc) === "green" ? "text-medflow-emerald" :
                bmiSignal(p.imc) === "amber" ? "text-amber-700" : "text-red-700"
              )}>
                {p.imc.toFixed(1)} — {bmiLabel(p.imc)}
              </p>
            </div>
          )}
        </div>
      </Section>

      {/* DRE destacado */}
      <div className={cn("rounded-2xl border-2 overflow-hidden",
        p.dre_nodules === 1 ? "border-red-300" : p.dre_performed ? "border-urology-blue/30" : "border-slate-200"
      )}>
        <div className={cn("px-5 py-3.5 flex items-center gap-2",
          p.dre_nodules === 1 ? "bg-red-50" : p.dre_performed ? "bg-urology-blue-light" : "bg-slate-50"
        )}>
          <span className="text-base">🔬</span>
          <h3 className="text-sm font-bold text-medflow-slate">Tacto Rectal (DRE)</h3>
          {p.dre_nodules === 1 && (
            <span className="ml-auto text-xs font-bold px-2.5 py-1 rounded-full bg-red-500 text-white">
              ⚠️ Nódulo detectado
            </span>
          )}
        </div>
        <div className="px-5 py-4 bg-white">
          {!p.dre_performed ? (
            <p className="text-sm text-slate-400 italic">DRE no realizado en este registro</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <DataRow label="Tamaño prostático" value={p.dre_prostate_size ? DRE_SIZE_LABELS[p.dre_prostate_size] ?? p.dre_prostate_size : "—"} />
              <DataRow label="Consistencia" value={p.dre_consistency ? DRE_CONSISTENCY_LABELS[p.dre_consistency] ?? p.dre_consistency : "—"} />
              <DataRow label="Nódulos" value={p.dre_nodules === 1 ? "Sí — palpable" : p.dre_nodules === 0 ? "No" : "—"} />
              <DataRow label="Localización" value={p.dre_nodule_location ? DRE_LOCATION_LABELS[p.dre_nodule_location] ?? p.dre_nodule_location : "—"} />
              <DataRow label="Doloroso" value={p.dre_painful === 1 ? "Sí" : p.dre_painful === 0 ? "No" : "—"} />
              {p.dre_notes && (
                <div className="sm:col-span-2">
                  <p className="text-[10px] text-slate-400 mb-1">Hallazgos adicionales</p>
                  <p className="text-xs text-medflow-slate leading-relaxed">{p.dre_notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Marcadores tumorales */}
      <Section title="Marcadores Tumorales" icon="🧪">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50">
                {["Marcador", "Valor", "Interpretación"].map(h => (
                  <th key={h} className="px-4 py-2 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <MarkerRow label="PSA Total" value={p.psa_total != null ? p.psa_total.toFixed(2) : "—"} unit="ng/mL" signal={psaTotalSignal(p.psa_total)} interpretation={p.psa_total != null ? (p.psa_total > 10 ? "Elevado" : p.psa_total > 4 ? "Zona gris" : "Normal") : undefined} />
              <MarkerRow label="PSA Libre" value={p.psa_libre != null ? p.psa_libre.toFixed(2) : "—"} unit="ng/mL" signal={null} />
              <MarkerRow label="Índice L/T" value={ratio != null ? ratio.toFixed(1) : "—"} unit="%" signal={ratioLTSignal(ratio)} interpretation={ratio != null ? (ratio < 15 ? "Alta sospecha" : ratio < 20 ? "Zona gris" : "HBP probable") : undefined} />
              <MarkerRow label="Densidad PSA" value={density != null ? density.toFixed(3) : "—"} signal={densitySignal(density)} interpretation={density != null ? (density > 0.15 ? "Biopsia sugerida" : "Normal") : undefined} />
              {p.testosterone_total != null && (
                <MarkerRow label="Testosterona total" value={p.testosterone_total.toFixed(0)} unit="ng/dL" signal={p.testosterone_total < 300 ? "red" : p.testosterone_total < 400 ? "amber" : "green"} interpretation={p.testosterone_total < 300 ? "Déficit" : p.testosterone_total < 400 ? "Límite bajo" : "Normal"} />
              )}
            </tbody>
          </table>
        </div>
      </Section>

      {/* IPSS */}
      {p.ipss != null && (
        <Section title="Score IPSS" icon="📏">
          <div className={cn("rounded-xl px-4 py-3 border flex items-center justify-between",
            ipssSignal(p.ipss) === "green" ? "bg-medflow-emerald-light border-medflow-emerald/20" :
            ipssSignal(p.ipss) === "amber" ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200"
          )}>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wide">International Prostate Symptom Score</p>
              <p className={cn("text-sm font-semibold mt-0.5",
                ipssSignal(p.ipss) === "green" ? "text-medflow-emerald" :
                ipssSignal(p.ipss) === "amber" ? "text-amber-700" : "text-red-700"
              )}>
                {ipssLabel(p.ipss)} — {p.ipss}/35 puntos
              </p>
            </div>
            <span className={cn("text-4xl font-black",
              ipssSignal(p.ipss) === "green" ? "text-medflow-emerald" :
              ipssSignal(p.ipss) === "amber" ? "text-amber-500" : "text-red-500"
            )}>
              {p.ipss}
            </span>
          </div>
        </Section>
      )}

      {/* Plan + notas */}
      {(p.treatment_plan || p.notas) && (
        <Section title="Plan y Notas Clínicas" icon="📝">
          {p.treatment_plan && (
            <div className="mb-4">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1.5">Plan de tratamiento</p>
              <p className="text-sm text-medflow-slate leading-relaxed">{p.treatment_plan}</p>
            </div>
          )}
          {p.next_appointment_date && (
            <div className="mb-4 flex items-center gap-2 bg-urology-blue-light border border-blue-100 rounded-xl px-3 py-2.5">
              <span>📅</span>
              <p className="text-xs font-semibold text-urology-blue">Próximo control: {p.next_appointment_date}</p>
            </div>
          )}
          {p.notas && (
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1.5">Notas adicionales</p>
              <p className="text-sm text-medflow-slate leading-relaxed">{p.notas}</p>
            </div>
          )}
        </Section>
      )}
    </div>
  );
}
