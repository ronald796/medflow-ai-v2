"use client";

import { Smartphone, Banknote, CreditCard, TrendingUp, Receipt } from "lucide-react";
import { Transaccion, Moneda, MetodoPago } from "@/lib/types";
import { cn } from "@/lib/utils";

// ── Config visual ──────────────────────────────────────────────────────────────

const MONEDA_COLOR: Record<Moneda, string> = {
  USD: "text-emerald-600",
  VES: "text-blue-600",
  EUR: "text-purple-600",
};

const MONEDA_BADGE: Record<Moneda, string> = {
  USD: "bg-emerald-50 text-emerald-700 border-emerald-100",
  VES: "bg-blue-50 text-blue-700 border-blue-100",
  EUR: "bg-purple-50 text-purple-700 border-purple-100",
};

const METODO_ICON: Record<MetodoPago, React.ElementType> = {
  Zelle:         Smartphone,
  Efectivo:      Banknote,
  "Pago Movil":  Smartphone,
  Transferencia: CreditCard,
  Punto:         CreditCard,
};

const METODO_COLOR: Record<MetodoPago, string> = {
  Zelle:         "bg-urology-blue-light text-urology-blue",
  Efectivo:      "bg-medflow-emerald-light text-medflow-emerald",
  "Pago Movil":  "bg-purple-50 text-purple-600",
  Transferencia: "bg-amber-50 text-amber-600",
  Punto:         "bg-slate-100 text-slate-600",
};

function formatBs(n: number) {
  return new Intl.NumberFormat("es-VE", { minimumFractionDigits: 2 }).format(n);
}

function formatHora(isoDate: string) {
  return new Intl.DateTimeFormat("es-VE", {
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(isoDate));
}

// ── Resumen de totales ────────────────────────────────────────────────────────

function ResumenTotales({ transacciones }: { transacciones: Transaccion[] }) {
  const totalBs = transacciones.reduce((s, t) => s + t.montoCalculadoBs, 0);
  const totalUsd = transacciones
    .filter((t) => t.moneda === "USD")
    .reduce((s, t) => s + t.monto, 0);
  const totalVes = transacciones
    .filter((t) => t.moneda === "VES")
    .reduce((s, t) => s + t.monto, 0);

  return (
    <div className="grid grid-cols-3 gap-3 mb-4">
      <div className="bg-medflow-emerald-light rounded-xl px-3 py-2.5 text-center border border-medflow-emerald/20">
        <p className="text-[10px] text-medflow-emerald font-semibold mb-0.5">Total USD</p>
        <p className="text-base font-black text-medflow-slate">${formatBs(totalUsd)}</p>
      </div>
      <div className="bg-blue-50 rounded-xl px-3 py-2.5 text-center border border-blue-100">
        <p className="text-[10px] text-blue-600 font-semibold mb-0.5">Total Bs.</p>
        <p className="text-base font-black text-medflow-slate">{formatBs(totalVes)}</p>
      </div>
      <div className="bg-slate-50 rounded-xl px-3 py-2.5 text-center border border-slate-200">
        <p className="text-[10px] text-slate-500 font-semibold mb-0.5">Equiv. Bs. Total</p>
        <p className="text-base font-black text-medflow-slate">{formatBs(totalBs)}</p>
      </div>
    </div>
  );
}

// ── Fila de transacción ───────────────────────────────────────────────────────

function FilaTransaccion({ t }: { t: Transaccion }) {
  const MetodoIcon = METODO_ICON[t.metodo];
  const monto = t.moneda === "VES"
    ? `Bs. ${formatBs(t.monto)}`
    : t.moneda === "EUR"
    ? `€${formatBs(t.monto)}`
    : `$${formatBs(t.monto)}`;

  return (
    <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/60 transition-colors group">
      {/* Hora */}
      <span className="text-xs font-mono text-slate-400 w-11 flex-shrink-0">
        {formatHora(t.fecha)}
      </span>

      {/* Concepto */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-medflow-slate truncate">{t.concepto}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {t.referencia && (
            <span className="text-[10px] font-mono text-slate-400">{t.referencia}</span>
          )}
          {t.moneda !== "VES" && (
            <span className="inline-flex items-center gap-0.5 text-[9px] text-slate-400">
              <TrendingUp className="w-2.5 h-2.5" />
              Tasa {formatBs(t.tasaReferencia)}
            </span>
          )}
        </div>
      </div>

      {/* Método */}
      <span className={cn(
        "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0",
        METODO_COLOR[t.metodo]
      )}>
        <MetodoIcon className="w-3 h-3" />
        {t.metodo}
      </span>

      {/* Moneda badge */}
      <span className={cn(
        "text-[10px] font-bold px-1.5 py-0.5 rounded border flex-shrink-0",
        MONEDA_BADGE[t.moneda]
      )}>
        {t.moneda}
      </span>

      {/* Monto original */}
      <span className={cn("text-sm font-bold flex-shrink-0 w-20 text-right tabular-nums", MONEDA_COLOR[t.moneda])}>
        {monto}
      </span>

      {/* Equivalente Bs */}
      {t.moneda !== "VES" && (
        <span className="text-[11px] text-slate-400 flex-shrink-0 w-24 text-right tabular-nums hidden lg:block">
          Bs. {formatBs(t.montoCalculadoBs)}
        </span>
      )}
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────

interface Props {
  transacciones: Transaccion[];
}

export default function TransaccionList({ transacciones }: Props) {
  if (transacciones.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-10 flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
          <Receipt className="w-6 h-6 text-slate-300" />
        </div>
        <p className="text-sm text-slate-400 font-medium">Aún no hay transacciones registradas hoy</p>
        <p className="text-xs text-slate-300">Usa el formulario para registrar el primer ingreso</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-50">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-medflow-slate">Transacciones del Día</h3>
          <span className="text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            {transacciones.length} {transacciones.length === 1 ? "registro" : "registros"}
          </span>
        </div>
        <ResumenTotales transacciones={transacciones} />
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[44px_1fr_90px_44px_76px_96px] gap-3 px-5 py-2.5 bg-slate-50/50 border-b border-slate-50">
        {["Hora", "Concepto", "Método", "Mon.", "Monto", "Equiv. Bs."].map((h) => (
          <p key={h} className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider last:hidden lg:last:block">
            {h}
          </p>
        ))}
      </div>

      <div className="divide-y divide-slate-50">
        {[...transacciones].reverse().map((t) => (
          <FilaTransaccion key={t.id} t={t} />
        ))}
      </div>
    </div>
  );
}
