"use client";

import { CalendarClock, Plus, Stethoscope } from "lucide-react";
import WeekCalendar from "@/components/agenda/WeekCalendar";

const UROLOGY_PROCEDURES = [
  "RTU de Próstata",
  "Litotricia Láser",
  "Cistoscopia Diagnóstica",
  "Prostatectomía Radical",
  "Nefrolitotomía Percutánea",
  "Varicocelectomía",
  "Ureteroscopía + Extracción",
  "Litotripsia Extracorpórea",
  "Biopsia de Próstata",
  "Resección Transuretral Vejiga",
];

export default function AgendaPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-5">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-medflow-slate">Agenda Quirúrgica</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Pabellones · Programación semanal de Urología
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-slate-100">
            <Stethoscope className="w-3.5 h-3.5 text-urology-blue" />
            <span className="text-xs text-slate-500">
              {UROLOGY_PROCEDURES.length} procedimientos disponibles
            </span>
          </div>
          <button className="inline-flex items-center gap-2 bg-urology-blue text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            Nueva Cirugía
          </button>
        </div>
      </div>

      {/* Procedure quick-reference pills */}
      <div className="flex flex-wrap gap-2">
        {UROLOGY_PROCEDURES.map((p) => (
          <span
            key={p}
            className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-urology-blue-light text-urology-blue border border-urology-blue/10"
          >
            {p}
          </span>
        ))}
      </div>

      {/* Calendar */}
      <WeekCalendar />

    </div>
  );
}
