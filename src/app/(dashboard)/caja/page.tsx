"use client";

import { useState } from "react";
import {
  DollarSign,
  Smartphone,
  Banknote,
  CreditCard,
  TrendingUp,
  ArrowUpRight,
  Plus,
} from "lucide-react";
import {
  TODAY_TRANSACTIONS,
  BCV_RATE,
  computeDailySummary,
  PaymentMethod,
} from "@/lib/mock-finanzas";
import { cn } from "@/lib/utils";
import BcvConverter from "@/components/finanzas/BcvConverter";
import ZelleModal from "@/components/finanzas/ZelleModal";
import MedIAFinanzas from "@/components/finanzas/MedIAFinanzas";

// ── Method config ─────────────────────────────────────────────────────────────

const METHOD_CFG: Record<PaymentMethod, { label: string; icon: React.ElementType; className: string; dotColor: string }> = {
  zelle:             { label: "Zelle",          icon: Smartphone,  className: "bg-urology-blue-light text-urology-blue",     dotColor: "bg-urology-blue" },
  "efectivo-usd":    { label: "Efectivo USD",   icon: DollarSign,  className: "bg-medflow-emerald-light text-medflow-emerald", dotColor: "bg-medflow-emerald" },
  "efectivo-bs":     { label: "Efectivo Bs.",   icon: Banknote,    className: "bg-amber-50 text-amber-600",                   dotColor: "bg-amber-500" },
  "pago-movil":      { label: "Pago Móvil",     icon: Smartphone,  className: "bg-purple-50 text-purple-600",                 dotColor: "bg-purple-500" },
  "transferencia-bs":{ label: "Transferencia",  icon: CreditCard,  className: "bg-slate-100 text-slate-600",                  dotColor: "bg-slate-400" },
};

// ── Balance Card ──────────────────────────────────────────────────────────────

function BalanceCard({
  label, value, sub, icon: Icon, accent, bg,
}: {
  label: string; value: string; sub: string;
  icon: React.ElementType; accent: string; bg: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-shadow">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", bg)}>
        <Icon className={cn("w-5 h-5", accent)} />
      </div>
      <p className={cn("text-2xl font-black leading-none mb-1", accent)}>{value}</p>
      <p className="text-xs font-semibold text-medflow-slate mb-0.5">{label}</p>
      <p className="text-[10px] text-slate-400">{sub}</p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CajaPage() {
  const [showZelle, setShowZelle] = useState(false);
  const summary = computeDailySummary(TODAY_TRANSACTIONS);

  const today = new Intl.DateTimeFormat("es-VE", {
    weekday: "long", day: "numeric", month: "long",
  }).format(new Date());

  return (
    <div className="max-w-7xl mx-auto space-y-5">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-medflow-slate">Caja y Finanzas</h1>
          <p className="text-sm text-slate-400 mt-0.5 capitalize">{today}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-medflow-emerald-light border border-medflow-emerald/20">
            <TrendingUp className="w-3.5 h-3.5 text-medflow-emerald" />
            <span className="text-xs font-semibold text-medflow-slate">
              BCV: <span className="text-medflow-emerald">Bs. {BCV_RATE.toFixed(2)}</span> / $1
            </span>
          </div>
          <button
            onClick={() => setShowZelle(true)}
            className="inline-flex items-center gap-2 bg-urology-blue text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Smartphone className="w-4 h-4" />
            Registrar Zelle
          </button>
          <button className="inline-flex items-center gap-2 bg-medflow-emerald text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-medflow-emerald-hover transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            Nuevo Pago
          </button>
        </div>
      </div>

      {/* Grand total banner */}
      <div className="bg-medflow-slate rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-slate-400 text-xs font-medium mb-1">Total del día</p>
          <p className="text-4xl font-black text-white leading-none">
            ${summary.totalUsd.toFixed(2)}
            <span className="text-base font-semibold text-slate-400 ml-2">USD</span>
          </p>
          <p className="text-medflow-emerald text-sm font-semibold mt-1">
            ≈ Bs. {new Intl.NumberFormat("es-VE", { minimumFractionDigits: 2 }).format(summary.totalUsd * BCV_RATE)}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2.5 bg-white/10 rounded-xl">
          <ArrowUpRight className="w-4 h-4 text-medflow-emerald" />
          <span className="text-sm text-white font-semibold">
            {TODAY_TRANSACTIONS.length} transacciones
          </span>
        </div>
      </div>

      {/* Balance cards grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <BalanceCard
          label="Zelle"
          value={`$${summary.zelleUsd.toFixed(0)}`}
          sub={`Bs. ${new Intl.NumberFormat("es-VE").format(summary.zelleUsd * BCV_RATE)}`}
          icon={Smartphone}
          accent="text-urology-blue"
          bg="bg-urology-blue-light"
        />
        <BalanceCard
          label="Efectivo USD"
          value={`$${summary.efectivoUsd.toFixed(0)}`}
          sub={`Bs. ${new Intl.NumberFormat("es-VE").format(summary.efectivoUsd * BCV_RATE)}`}
          icon={DollarSign}
          accent="text-medflow-emerald"
          bg="bg-medflow-emerald-light"
        />
        <BalanceCard
          label="Pago Móvil"
          value={`Bs. ${new Intl.NumberFormat("es-VE").format(summary.pagoMovilBs)}`}
          sub={`$${(summary.pagoMovilBs / BCV_RATE).toFixed(2)} USD`}
          icon={Smartphone}
          accent="text-purple-600"
          bg="bg-purple-50"
        />
        <BalanceCard
          label="Transferencia Bs."
          value={`Bs. ${new Intl.NumberFormat("es-VE").format(summary.transferenciaBs)}`}
          sub={`$${(summary.transferenciaBs / BCV_RATE).toFixed(2)} USD`}
          icon={CreditCard}
          accent="text-amber-600"
          bg="bg-amber-50"
        />
        <BalanceCard
          label="Efectivo Bs."
          value={`Bs. ${new Intl.NumberFormat("es-VE").format(summary.efectivoBs)}`}
          sub={`$${(summary.efectivoBs / BCV_RATE).toFixed(2)} USD`}
          icon={Banknote}
          accent="text-slate-600"
          bg="bg-slate-100"
        />
      </div>

      {/* Main 2-col layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Transaction history — 2/3 */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-50">
            <DollarSign className="w-4 h-4 text-medflow-emerald" />
            <h2 className="text-sm font-semibold text-medflow-slate">Transacciones del Día</h2>
            <span className="ml-auto text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {TODAY_TRANSACTIONS.length} registros
            </span>
          </div>

          {/* Table header */}
          <div className="grid grid-cols-[auto_1fr_120px_110px] gap-4 px-5 py-2.5 border-b border-slate-50 bg-slate-50/50">
            {["Hora", "Concepto / Paciente", "Método", "Monto"].map((h) => (
              <p key={h} className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{h}</p>
            ))}
          </div>

          <ul className="divide-y divide-slate-50">
            {TODAY_TRANSACTIONS.map((tx) => {
              const cfg = METHOD_CFG[tx.method];
              const Icon = cfg.icon;
              const amount = tx.amountUsd
                ? `$${tx.amountUsd.toFixed(2)}`
                : `Bs. ${new Intl.NumberFormat("es-VE").format(tx.amountBs ?? 0)}`;
              const amountColor = tx.amountUsd ? "text-medflow-emerald" : "text-urology-blue";

              return (
                <li key={tx.id} className="grid grid-cols-[auto_1fr_120px_110px] gap-4 items-center px-5 py-3.5 hover:bg-slate-50/50 transition-colors">
                  <span className="text-xs font-mono text-slate-400 w-12">{tx.time}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-medflow-slate truncate">{tx.concept}</p>
                    <p className="text-[10px] text-slate-400 truncate">{tx.patientName}{tx.reference && ` · ${tx.reference}`}</p>
                  </div>
                  <span className={cn("inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded-full w-fit", cfg.className)}>
                    <Icon className="w-3 h-3" />
                    {cfg.label}
                  </span>
                  <span className={cn("text-sm font-bold text-right tabular-nums", amountColor)}>
                    {amount}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Right col: Converter + MedIA — 1/3 */}
        <div className="space-y-4">
          <BcvConverter />
          <MedIAFinanzas />
        </div>
      </div>

      {/* Zelle modal */}
      {showZelle && <ZelleModal onClose={() => setShowZelle(false)} />}

    </div>
  );
}
