"use client";

import { Plus, X, Users } from "lucide-react";
import { inputCls } from "./PF_Shared";
import type { PatientFormState, FamilyHistoryEntry } from "@/types/patient-form";

interface Props {
  form: PatientFormState;
  addFamilyHistory: () => void;
  updateFamilyHistory: (i: number, field: keyof FamilyHistoryEntry, value: string) => void;
  removeFamilyHistory: (i: number) => void;
}

const RELATIONSHIP_ES: Record<string, string> = {
  FATHER: "Padre", MOTHER: "Madre", BROTHER: "Hermano",
  SISTER: "Hermana", GRANDFATHER: "Abuelo", GRANDMOTHER: "Abuela",
  UNCLE: "Tío", AUNT: "Tía", OTHER: "Otro",
};

const PATHOLOGY_ES: Record<string, string> = {
  PROSTATE_CANCER: "Cáncer de Próstata",
  BLADDER_CANCER: "Cáncer de Vejiga",
  KIDNEY_CANCER: "Cáncer Renal",
  TESTICULAR_CANCER: "Cáncer Testicular",
  UROLITHIASIS: "Litiasis Urinaria",
  BPH: "Hiperplasia Prostática",
  OTHER: "Otra patología",
};

export default function Section3Familiares({ form, addFamilyHistory, updateFamilyHistory, removeFamilyHistory }: Props) {
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
        <p className="text-xs text-blue-700 leading-relaxed">
          <strong>Importancia clínica:</strong> La agregación familiar es factor de riesgo crítico en uro-oncología.
          Registra antecedentes relevantes para cáncer de próstata, vejiga, riñón y litiasis urinaria.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
          Antecedentes familiares ({form.family_history.length})
        </p>
        <button
          type="button" onClick={addFamilyHistory}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-urology-blue hover:underline"
        >
          <Plus className="w-3.5 h-3.5" /> Agregar antecedente
        </button>
      </div>

      {form.family_history.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10 border border-dashed border-slate-200 rounded-2xl">
          <Users className="w-10 h-10 text-slate-200" />
          <p className="text-sm text-slate-400">Sin antecedentes familiares registrados</p>
        </div>
      ) : (
        <div className="space-y-3">
          {form.family_history.map((fh, i) => (
            <div key={i} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_80px_90px_36px] gap-2 items-end">

                <div>
                  {i === 0 && <p className="text-[10px] text-slate-400 mb-1">Parentesco</p>}
                  <select
                    value={fh.relationship}
                    onChange={e => updateFamilyHistory(i, "relationship", e.target.value)}
                    className={inputCls}
                  >
                    <option value="">Seleccionar...</option>
                    {Object.entries(RELATIONSHIP_ES).map(([v, l]) =>
                      <option key={v} value={v}>{l}</option>
                    )}
                  </select>
                </div>

                <div>
                  {i === 0 && <p className="text-[10px] text-slate-400 mb-1">Patología</p>}
                  <select
                    value={fh.pathology}
                    onChange={e => updateFamilyHistory(i, "pathology", e.target.value)}
                    className={inputCls}
                  >
                    <option value="">Seleccionar...</option>
                    {Object.entries(PATHOLOGY_ES).map(([v, l]) =>
                      <option key={v} value={v}>{l}</option>
                    )}
                  </select>
                </div>

                <div>
                  {i === 0 && <p className="text-[10px] text-slate-400 mb-1">Edad Dx</p>}
                  <input
                    type="number" min={0} max={120}
                    value={fh.diagnosis_age}
                    onChange={e => updateFamilyHistory(i, "diagnosis_age", e.target.value)}
                    placeholder="años"
                    className={inputCls}
                  />
                </div>

                <div>
                  {i === 0 && <p className="text-[10px] text-slate-400 mb-1">Estado</p>}
                  <select
                    value={fh.status}
                    onChange={e => updateFamilyHistory(i, "status", e.target.value)}
                    className={inputCls}
                  >
                    <option value="">—</option>
                    <option value="ALIVE">Vivo</option>
                    <option value="DECEASED">Fallecido</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => removeFamilyHistory(i)}
                  className="p-2 rounded-xl hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
