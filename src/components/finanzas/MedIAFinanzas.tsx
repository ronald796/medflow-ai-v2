"use client";

import { useState } from "react";
import Image from "next/image";
import { Sparkles, AlertCircle, CheckCircle2, ChevronRight } from "lucide-react";
import { PENDING_INVOICES } from "@/lib/mock-finanzas";
import { cn } from "@/lib/utils";

export default function MedIAFinanzas() {
  const [dismissed, setDismissed] = useState(false);
  const [sent, setSent] = useState(false);

  if (dismissed) return null;

  const pendingTotal = PENDING_INVOICES.reduce((s, i) => s + i.amountUsd, 0);

  return (
    <div className="bg-medflow-slate rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 flex items-center gap-3 border-b border-white/10">
        <div className="relative w-8 h-8 flex-shrink-0">
          <Image src="/logo-medflow.png" alt="MedIA" fill className="object-contain" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-white text-sm font-semibold">MedIA</p>
            <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
              <AlertCircle className="w-3 h-3" />
              Alerta financiera
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-3">
        <div className="bg-white/8 rounded-xl p-4">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-slate-200 text-xs leading-relaxed">
              Doctor, tiene{" "}
              <span className="text-amber-400 font-bold">{PENDING_INVOICES.length} facturas de honorarios</span>{" "}
              de cirugías de la semana pasada pendientes por cobrar, por un total de{" "}
              <span className="text-medflow-emerald font-bold">${pendingTotal.toLocaleString()}</span>.
              {!sent && " ¿Desea que envíe un recordatorio a la administración?"}
            </p>
          </div>
        </div>

        {/* Invoice list */}
        <div className="space-y-1.5">
          {PENDING_INVOICES.map((inv) => (
            <div key={inv.id} className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-xl",
              sent ? "bg-medflow-emerald/10" : "bg-white/6"
            )}>
              {sent
                ? <CheckCircle2 className="w-3.5 h-3.5 text-medflow-emerald flex-shrink-0" />
                : <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              }
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{inv.patientName}</p>
                <p className="text-[10px] text-slate-400 truncate">{inv.procedure} · {inv.date}</p>
              </div>
              <span className={cn("text-xs font-bold flex-shrink-0", sent ? "text-medflow-emerald" : "text-amber-400")}>
                ${inv.amountUsd}
              </span>
            </div>
          ))}
        </div>

        {/* Actions */}
        {!sent ? (
          <div className="flex gap-2">
            <button
              onClick={() => setSent(true)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Sí, enviar recordatorio
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="px-4 py-2.5 text-xs font-semibold bg-white/10 text-slate-300 rounded-xl hover:bg-white/20 transition-colors"
            >
              Ignorar
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2.5 bg-medflow-emerald/15 rounded-xl">
            <CheckCircle2 className="w-4 h-4 text-medflow-emerald flex-shrink-0" />
            <p className="text-xs text-medflow-emerald font-semibold">
              Recordatorio enviado a administración ✓
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
