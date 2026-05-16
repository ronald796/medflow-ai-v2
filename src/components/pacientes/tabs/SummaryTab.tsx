"use client";

import { cn } from "@/lib/utils";
import type { PatientExpandedDB } from "@/lib/patient-expanded-types";
import {
  COMORBIDITY_LABELS, COMORBIDITY_ICONS, DIAGNOSIS_LABELS, LUTS_LABELS,
  LUTS_SEVERITY_LABELS, DRE_SIZE_LABELS, DRE_CONSISTENCY_LABELS, DRE_LOCATION_LABELS,
  psaTotalSignal, ratioLTSignal, densitySignal, ipssSignal, ipssLabel,
  bmiSignal, bmiLabel, lutsSeveritySignal,
  signalBadgeClass, signalEmoji, val,
} from "@/lib/clinical-translations";

// ── Mini-card de métrica ──────────────────────────────────────────────────────

function MetricCard({
  label, value, unit, signal, sublabel,
}: {
  label: string; value: string; unit?: string;
  signal: "green" | "amber" | "red" | null;
  sublabel?: string;
}) {
  const bg = signal === "green" ? "bg-medflow-emerald-light" :
             signal === "amber" ? "bg-amber-50" :
             signal === "red"   ? "bg-red-50" : "bg-slate-50";
  const text = signal === "green" ? "text-medflow-emerald" :
               signal === "amber" ? "text-amber-700" :
               signal === "red"   ? "text-red-700" : "text-slate-500";

  return (
    <div className={cn("rounded-xl p-3.5 border", bg,
      signal === "green" ? "border-medflow-emerald/20" :
      signal === "amber" ? "border-amber-200" :
      signal === "red"   ? "border-red-200" : "border-slate-200"
    )}>
      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className={cn("text-xl font-black leading-none", text)}>
          {value === "—" ? <span className="text-slate-300 font-normal text-sm">—</span> : value}
        </span>
        {unit && value !== "—" && <span className="text-[10px] text-slate-400">{unit}</span>}
      </div>
      {sublabel && value !== "—" && (
        <p className={cn("text-[10px] font-medium mt-0.5", text)}>{sublabel}</p>
      )}
    </div>
  );
}

// ── Card genérica ─────────────────────────────────────────────────────────────

function Card({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
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

// ── Fila de dato ──────────────────────────────────────────────────────────────

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-slate-50 last:border-0">
      <span className="text-xs text-slate-400 flex-shrink-0">{label}</span>
      <span className={cn("text-xs font-medium text-right", value === "—" ? "text-slate-300" : "text-medflow-slate")}>
        {value}
      </span>
    </div>
  );
}

// ── Tab Resumen ───────────────────────────────────────────────────────────────

interface Props { patient: PatientExpandedDB }

export default function SummaryTab({ patient: p }: Props) {
  const ratio   = p.indice_psa;
  const density = (p.psa_total && p.volumen_prostatico)
    ? p.psa_total / p.volumen_prostatico : null;
  const activeLuts = p.luts_symptoms.filter(l => l.active);
  const primaryDx  = p.diagnoses.find(d => d.is_primary === 1) ?? p.diagnoses[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

      {/* ── Columna izquierda (2/3) ─────────────────────────────────────── */}
      <div className="lg:col-span-2 space-y-4">

        {/* Métricas clave */}
        <Card title="Métricas Clínicas Clave" icon="📊">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <MetricCard
              label="PSA Total" unit="ng/mL"
              value={p.psa_total != null ? p.psa_total.toFixed(2) : "—"}
              signal={psaTotalSignal(p.psa_total)}
            />
            <MetricCard
              label="Índice L/T" unit="%"
              value={ratio != null ? ratio.toFixed(1) : "—"}
              signal={ratioLTSignal(ratio)}
              sublabel={ratio != null ? (ratio < 15 ? "Alta sospecha" : ratio < 20 ? "Zona gris" : "HBP probable") : undefined}
            />
            <MetricCard
              label="Densidad PSA"
              value={density != null ? density.toFixed(3) : "—"}
              signal={densitySignal(density)}
              sublabel={density != null && density > 0.15 ? "Biopsia sugerida" : undefined}
            />
            <MetricCard
              label="IMC" unit="kg/m²"
              value={p.imc != null ? p.imc.toFixed(1) : "—"}
              signal={bmiSignal(p.imc)}
              sublabel={bmiLabel(p.imc) !== "—" ? bmiLabel(p.imc) : undefined}
            />
            <MetricCard
              label="IPSS" unit="/35"
              value={p.ipss != null ? String(p.ipss) : "—"}
              signal={ipssSignal(p.ipss)}
              sublabel={ipssLabel(p.ipss) !== "—" ? ipssLabel(p.ipss) : undefined}
            />
            <MetricCard
              label="Vol. Prostático" unit="cc"
              value={p.volumen_prostatico != null ? p.volumen_prostatico.toFixed(0) : "—"}
              signal={null}
            />
          </div>
        </Card>

        {/* Diagnósticos */}
        {p.diagnoses.length > 0 && (
          <Card title="Diagnósticos Activos" icon="📋">
            <div className="space-y-2">
              {p.diagnoses.map(d => (
                <div key={d.id} className="flex items-center gap-2 flex-wrap">
                  {d.is_primary === 1 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-urology-blue-light text-urology-blue border border-blue-100">
                      Principal
                    </span>
                  )}
                  <span className="text-sm font-medium text-medflow-slate">
                    {DIAGNOSIS_LABELS[d.code] ?? d.code}
                  </span>
                  {d.icd10_code && (
                    <span className="text-[10px] font-mono text-slate-400">{d.icd10_code}</span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* LUTS activos */}
        {activeLuts.length > 0 && (
          <Card title="Síntomas LUTS Activos" icon="🚿">
            <div className="space-y-2">
              {activeLuts.map(l => (
                <div key={l.id} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-medflow-slate">{LUTS_LABELS[l.symptom] ?? l.symptom}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {l.symptom === "NOCTURIA" && l.nocturia_times != null && (
                      <span className="text-xs text-slate-500">{l.nocturia_times}×/noche</span>
                    )}
                    {l.severity && (
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", signalBadgeClass(lutsSeveritySignal(l.severity)))}>
                        {LUTS_SEVERITY_LABELS[l.severity] ?? l.severity}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* DRE */}
        <Card title="Tacto Rectal (DRE)" icon="🔬">
          {!p.dre_performed ? (
            <p className="text-sm text-slate-400 italic">DRE no realizado en este registro</p>
          ) : (
            <div className="space-y-2">
              {p.dre_prostate_size && (
                <DataRow label="Tamaño" value={DRE_SIZE_LABELS[p.dre_prostate_size] ?? p.dre_prostate_size} />
              )}
              {p.dre_consistency && (
                <DataRow label="Consistencia" value={DRE_CONSISTENCY_LABELS[p.dre_consistency] ?? p.dre_consistency} />
              )}
              <DataRow
                label="Nódulos"
                value={p.dre_nodules === 1 ? "⚠️ Sí — nódulo palpable" : p.dre_nodules === 0 ? "No" : "—"}
              />
              {p.dre_nodule_location && (
                <DataRow label="Localización" value={DRE_LOCATION_LABELS[p.dre_nodule_location] ?? p.dre_nodule_location} />
              )}
              {p.dre_notes && (
                <div className="pt-2">
                  <p className="text-[10px] text-slate-400 mb-1">Hallazgos adicionales</p>
                  <p className="text-xs text-medflow-slate leading-relaxed">{p.dre_notes}</p>
                </div>
              )}
              {p.dre_nodules === 1 && (
                <div className="mt-2 flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                  <span>⚠️</span>
                  <p className="text-xs text-red-700 font-semibold">Nódulo detectado — correlacionar con PSA y ecografía</p>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Plan de tratamiento */}
        {(p.treatment_plan || p.next_appointment_date) && (
          <Card title="Plan de Tratamiento" icon="📝">
            {p.treatment_plan && (
              <p className="text-sm text-medflow-slate leading-relaxed mb-3">{p.treatment_plan}</p>
            )}
            {p.next_appointment_date && (
              <div className="flex items-center gap-2 bg-urology-blue-light border border-blue-100 rounded-xl px-3 py-2.5">
                <span>📅</span>
                <p className="text-xs font-semibold text-urology-blue">
                  Próximo control: {p.next_appointment_date}
                </p>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* ── Columna derecha (1/3) ────────────────────────────────────────── */}
      <div className="space-y-4">

        {/* Medicación */}
        {p.medications.length > 0 && (
          <Card title="Medicación Actual" icon="💊">
            <div className="space-y-2.5">
              {p.medications.filter(m => m.active).map(m => (
                <div key={m.id} className="text-xs">
                  <p className="font-semibold text-medflow-slate">{m.name}</p>
                  {(m.dose || m.frequency) && (
                    <p className="text-slate-400">{[m.dose, m.frequency].filter(Boolean).join(" · ")}</p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Datos de contacto */}
        <Card title="Datos de Contacto" icon="📞">
          <div>
            <DataRow label="Teléfono" value={val(p.telefono)} />
            <DataRow label="Alt." value={val(p.alternative_phone)} />
            <DataRow label="Email" value={val(p.email)} />
            <DataRow label="Seguro" value={val(p.insurance_company)} />
            {p.insurance_policy && (
              <DataRow label="Póliza" value={p.insurance_policy} />
            )}
          </div>
        </Card>

        {/* Contacto de emergencia */}
        {p.emergency_contact_name && (
          <Card title="Contacto de Emergencia" icon="🚨">
            <div>
              <DataRow label="Nombre" value={val(p.emergency_contact_name)} />
              <DataRow label="Parentesco" value={val(p.emergency_contact_relationship)} />
              <DataRow label="Teléfono" value={val(p.emergency_contact_phone)} />
            </div>
          </Card>
        )}

        {/* Comorbilidades — resumen */}
        {p.comorbidities.length > 0 && (
          <Card title="Comorbilidades" icon="🏥">
            <div className="flex flex-wrap gap-1.5">
              {p.comorbidities.map(c => (
                <span key={c.id} className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                  {COMORBIDITY_ICONS[c.code] ?? "●"} {COMORBIDITY_LABELS[c.code] ?? c.code}
                </span>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
