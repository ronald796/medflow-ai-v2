"use client";

import { Field, Grid2, inputCls } from "./PF_Shared";
import type { PatientFormState } from "@/types/patient-form";

interface Props {
  form: PatientFormState;
  setField: <K extends keyof PatientFormState>(field: K, value: PatientFormState[K]) => void;
}

export default function Section6Notas({ form, setField }: Props) {
  return (
    <div className="space-y-4">
      <Field label="Notas adicionales">
        <textarea
          rows={3} value={form.notas}
          onChange={e => setField("notas", e.target.value)}
          placeholder="Observaciones clínicas, contexto relevante, hallazgos del examen físico general..."
          className={inputCls}
        />
      </Field>
      <Field label="Plan inicial de manejo">
        <textarea
          rows={3} value={form.treatment_plan}
          onChange={e => setField("treatment_plan", e.target.value)}
          placeholder="Ej: Solicitar biopsia prostática guiada por eco-transrectal. PSA en 3 meses. RM multiparamétrica..."
          className={inputCls}
        />
      </Field>
      <div className="w-64">
        <Field label="Próximo control">
          <input
            type="date" value={form.next_appointment_date}
            min={new Date().toISOString().slice(0, 10)}
            onChange={e => setField("next_appointment_date", e.target.value)}
            className={inputCls}
          />
        </Field>
      </div>
    </div>
  );
}
