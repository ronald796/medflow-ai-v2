"use client";

import { cn } from "@/lib/utils";
import type { PatientExpandedDB } from "@/lib/patient-expanded-types";
import {
  COMORBIDITY_LABELS, COMORBIDITY_ICONS,
  FAMILY_RELATIONSHIP_LABELS, FAMILY_PATHOLOGY_LABELS, FAMILY_STATUS_LABELS,
  SMOKING_LABELS, ALCOHOL_LABELS, signalBadgeClass, val,
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

function EmptyState({ text }: { text: string }) {
  return <p className="text-sm text-slate-400 italic">{text}</p>;
}

interface Props { patient: PatientExpandedDB }

export default function AntecedentesTab({ patient: p }: Props) {
  const hasFirstDegreeCaP = p.family_history.some(
    fh => fh.pathology === "PROSTATE_CANCER" && ["FATHER", "BROTHER"].includes(fh.relationship)
  );

  return (
    <div className="space-y-4">

      {/* Comorbilidades */}
      <Section title="Comorbilidades" icon="🏥">
        {p.comorbidities.length === 0 ? (
          <EmptyState text="Sin comorbilidades registradas" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {p.comorbidities.map(c => (
              <div key={c.id} className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-lg flex-shrink-0">{COMORBIDITY_ICONS[c.code] ?? "●"}</span>
                <span className="text-xs font-medium text-medflow-slate">{COMORBIDITY_LABELS[c.code] ?? c.code}</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Antecedentes familiares */}
      <Section title="Antecedentes Familiares Urológicos" icon="👨‍👩‍👧‍👦">
        {p.family_history.length === 0 ? (
          <EmptyState text="Sin antecedentes familiares registrados" />
        ) : (
          <div className="space-y-3">
            {hasFirstDegreeCaP && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5">
                <span>⚠️</span>
                <p className="text-xs font-semibold text-amber-800">
                  Antecedente familiar de 1° grado de CA Próstata — Riesgo aumentado (EAU 2025)
                </p>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50">
                    {["Parentesco", "Patología", "Edad Dx", "Estado"].map(h => (
                      <th key={h} className="px-3 py-2 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {p.family_history.map(fh => (
                    <tr key={fh.id} className="hover:bg-slate-50/50">
                      <td className="px-3 py-3 font-medium text-medflow-slate">
                        {FAMILY_RELATIONSHIP_LABELS[fh.relationship] ?? fh.relationship}
                      </td>
                      <td className="px-3 py-3 text-medflow-slate">
                        <div className="flex items-center gap-1.5">
                          {fh.pathology === "PROSTATE_CANCER" && <span>🔴</span>}
                          {FAMILY_PATHOLOGY_LABELS[fh.pathology] ?? fh.pathology}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-slate-500">{fh.diagnosis_age ? `${fh.diagnosis_age} años` : "—"}</td>
                      <td className="px-3 py-3">
                        {fh.status ? (
                          <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold",
                            fh.status === "DECEASED" ? "bg-slate-100 text-slate-600" : "bg-medflow-emerald-light text-medflow-emerald"
                          )}>
                            {FAMILY_STATUS_LABELS[fh.status] ?? fh.status}
                          </span>
                        ) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Section>

      {/* Alergias */}
      <Section title="Alergias" icon="⚠️">
        {p.no_drug_allergies ? (
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-medflow-emerald-light border border-medflow-emerald/20">
            <span>✅</span>
            <span className="text-xs font-semibold text-medflow-emerald">NKDA — Sin alergias conocidas</span>
          </div>
        ) : p.allergies ? (
          <p className="text-sm text-medflow-slate leading-relaxed">{p.allergies}</p>
        ) : (
          <EmptyState text="Sin información de alergias registrada" />
        )}
      </Section>

      {/* Cirugías previas */}
      <Section title="Cirugías Previas" icon="🏥">
        {p.previous_surgeries ? (
          <p className="text-sm text-medflow-slate leading-relaxed">{p.previous_surgeries}</p>
        ) : (
          <EmptyState text="Sin cirugías previas registradas" />
        )}
      </Section>

      {/* Hábitos */}
      <Section title="Hábitos" icon="🧬">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-xl">🚬</span>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold mb-0.5">Tabaquismo</p>
              <p className="text-sm font-medium text-medflow-slate">
                {p.smoking_status ? SMOKING_LABELS[p.smoking_status] : "—"}
              </p>
              {p.smoking_pack_years && p.smoking_status !== "NEVER" && (
                <p className="text-xs text-slate-500 mt-0.5">{p.smoking_pack_years} paquetes/año</p>
              )}
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-xl">🍷</span>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold mb-0.5">Alcohol</p>
              <p className="text-sm font-medium text-medflow-slate">
                {p.alcohol_consumption ? ALCOHOL_LABELS[p.alcohol_consumption] : "—"}
              </p>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
