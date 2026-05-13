"use client";

import { useState } from "react";
import { X, Smartphone, CheckCircle2 } from "lucide-react";
import { BCV_RATE } from "@/lib/mock-finanzas";
import { cn } from "@/lib/utils";

interface Props {
  onClose: () => void;
}

type Step = "form" | "success";

export default function ZelleModal({ onClose }: Props) {
  const [step, setStep] = useState<Step>("form");
  const [form, setForm] = useState({
    patient: "",
    concept: "",
    amountUsd: "",
    reference: "",
    phone: "",
  });

  const amountUsd = parseFloat(form.amountUsd) || 0;
  const amountBs = amountUsd * BCV_RATE;
  const isValid = form.patient && form.amountUsd && form.reference;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setStep("success");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="h-1.5 bg-gradient-to-r from-urology-blue to-medflow-emerald" />

        <div className="px-6 py-5">
          {step === "form" ? (
            <>
              <div className="flex items-start justify-between mb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-urology-blue-light flex items-center justify-center">
                      <Smartphone className="w-4 h-4 text-urology-blue" />
                    </div>
                    <h2 className="text-base font-bold text-medflow-slate">Registrar Pago Zelle</h2>
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5 ml-10">
                    Tasa BCV: <span className="font-semibold text-medflow-emerald">Bs. {BCV_RATE.toFixed(2)}</span> / $1 USD
                  </p>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Patient */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
                    Paciente
                  </label>
                  <input
                    type="text"
                    value={form.patient}
                    onChange={(e) => setForm({ ...form, patient: e.target.value })}
                    placeholder="Nombre completo del paciente"
                    className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-urology-blue transition-colors text-medflow-slate placeholder:text-slate-300"
                    required
                  />
                </div>

                {/* Concept */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
                    Concepto
                  </label>
                  <input
                    type="text"
                    value={form.concept}
                    onChange={(e) => setForm({ ...form, concept: e.target.value })}
                    placeholder="Ej: Honorarios Cistoscopia"
                    className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-urology-blue transition-colors text-medflow-slate placeholder:text-slate-300"
                  />
                </div>

                {/* Amount + conversion */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
                    Monto USD
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">$</span>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={form.amountUsd}
                      onChange={(e) => setForm({ ...form, amountUsd: e.target.value })}
                      placeholder="0.00"
                      className="w-full pl-7 pr-4 py-2.5 text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-urology-blue transition-colors text-medflow-slate placeholder:text-slate-300"
                      required
                    />
                  </div>
                  {amountUsd > 0 && (
                    <p className="text-[11px] text-medflow-emerald font-semibold mt-1.5 ml-1">
                      ≈ Bs. {new Intl.NumberFormat("es-VE", { minimumFractionDigits: 2 }).format(amountBs)}
                    </p>
                  )}
                </div>

                {/* Reference */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
                    N° de Referencia Zelle
                  </label>
                  <input
                    type="text"
                    value={form.reference}
                    onChange={(e) => setForm({ ...form, reference: e.target.value })}
                    placeholder="ZL-XXXXXX"
                    className="w-full px-3 py-2.5 text-sm font-mono bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-urology-blue transition-colors text-medflow-slate placeholder:text-slate-300"
                    required
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm font-semibold bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors">
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!isValid}
                    className={cn(
                      "flex-1 py-2.5 text-sm font-semibold rounded-xl transition-colors",
                      isValid
                        ? "bg-urology-blue text-white hover:bg-blue-700"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    )}
                  >
                    Registrar Pago
                  </button>
                </div>
              </form>
            </>
          ) : (
            /* Success state */
            <div className="flex flex-col items-center text-center py-6">
              <div className="w-16 h-16 rounded-full bg-medflow-emerald-light flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-medflow-emerald" />
              </div>
              <h2 className="text-base font-bold text-medflow-slate mb-1">¡Pago Registrado!</h2>
              <p className="text-sm text-slate-500 mb-1">{form.patient}</p>
              <p className="text-2xl font-black text-medflow-emerald mb-1">
                ${parseFloat(form.amountUsd).toFixed(2)}
              </p>
              <p className="text-xs text-slate-400 mb-1">Ref: {form.reference}</p>
              <p className="text-xs text-medflow-emerald font-semibold mb-6">
                Bs. {new Intl.NumberFormat("es-VE", { minimumFractionDigits: 2 }).format(amountBs)}
              </p>
              <button
                onClick={onClose}
                className="w-full py-2.5 text-sm font-semibold bg-medflow-emerald text-white rounded-xl hover:bg-medflow-emerald-hover transition-colors"
              >
                Listo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
