"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DollarSign, Banknote, Smartphone, CreditCard,
  CheckCircle2, TrendingUp, Hash, FileText, AlertCircle, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Moneda, MetodoPago, Transaccion, METODOS_POR_MONEDA,
} from "@/lib/types";
import { saveTransaction } from "@/lib/api";

// ── Config visual ──────────────────────────────────────────────────────────────

const MONEDA_CFG: Record<Moneda, {
  label: string; symbol: string;
  bg: string; text: string; border: string; activeBg: string;
}> = {
  USD: {
    label: "Dólar",   symbol: "$",
    bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-300",
    activeBg: "bg-emerald-600",
  },
  VES: {
    label: "Bolívar", symbol: "Bs.",
    bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-300",
    activeBg: "bg-blue-600",
  },
  EUR: {
    label: "Euro",    symbol: "€",
    bg: "bg-purple-50",  text: "text-purple-700",  border: "border-purple-300",
    activeBg: "bg-purple-600",
  },
};

const METODO_CFG: Record<MetodoPago, { icon: React.ElementType; label: string }> = {
  Zelle:          { icon: Smartphone,  label: "Zelle" },
  Efectivo:       { icon: Banknote,    label: "Efectivo" },
  "Pago Movil":   { icon: Smartphone,  label: "Pago Móvil" },
  Transferencia:  { icon: CreditCard,  label: "Transferencia" },
  Punto:          { icon: CreditCard,  label: "Punto" },
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function calcularBs(monto: number, moneda: Moneda, tasa: number): number {
  if (moneda === "VES") return monto;
  return monto * tasa; // USD y EUR → multiplica por tasa
}

function formatBs(n: number) {
  return new Intl.NumberFormat("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

// ── Props ──────────────────────────────────────────────────────────────────────

interface Props {
  onRegistrar: (t: Transaccion) => void;
  bcvRate?: number; // si ya viene del padre; si no, lo fetcha el componente
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function RegistroIngreso({ onRegistrar, bcvRate: propRate }: Props) {
  const [moneda, setMoneda]     = useState<Moneda>("USD");
  const [metodo, setMetodo]     = useState<MetodoPago>("Zelle");
  const [monto, setMonto]       = useState("");
  const [concepto, setConcepto] = useState("");
  const [referencia, setRef]    = useState("");
  const [tasa, setTasa]           = useState<number>(propRate ?? 0);
  const [tasaLoading, setTasaLoading] = useState(!propRate);
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Fetch tasa BCV si no vino como prop
  const fetchTasa = useCallback(async () => {
    if (propRate) { setTasa(propRate); return; }
    setTasaLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/bcv`);
      const json = await res.json();
      if (json.rate) setTasa(json.rate);
    } catch {
      // fallback silencioso — se mostrará aviso en el form
    } finally {
      setTasaLoading(false);
    }
  }, [propRate]);

  useEffect(() => { fetchTasa(); }, [fetchTasa]);

  // Al cambiar moneda, resetear método al primero disponible
  useEffect(() => {
    const metodos = METODOS_POR_MONEDA[moneda];
    if (!metodos.includes(metodo)) setMetodo(metodos[0]);
  }, [moneda]); // eslint-disable-line react-hooks/exhaustive-deps

  const montoNum = parseFloat(monto) || 0;
  const montoCalculadoBs = calcularBs(montoNum, moneda, tasa);
  const mCfg = MONEDA_CFG[moneda];
  const metodosDisponibles = METODOS_POR_MONEDA[moneda];
  const puedeEnviar = montoNum > 0 && concepto.trim().length > 3 && tasa > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!puedeEnviar || saving) return;

    const nueva: Transaccion = {
      id: `T${Date.now()}`,
      monto: montoNum,
      moneda,
      metodo,
      tasaReferencia: tasa,
      montoCalculadoBs,
      concepto: concepto.trim(),
      fecha: new Date().toISOString(),
      referencia: referencia.trim() || undefined,
    };

    setSaving(true);
    setSaveError(null);

    // Actualizar UI inmediatamente (optimistic update)
    onRegistrar(nueva);

    // Persistir en backend en segundo plano
    try {
      await saveTransaction({
        id: nueva.id,
        monto: nueva.monto,
        moneda: nueva.moneda,
        metodo: nueva.metodo,
        tasaReferencia: nueva.tasaReferencia,
        montoCalculadoBs: nueva.montoCalculadoBs,
        concepto: nueva.concepto,
        referencia: nueva.referencia,
        fecha: nueva.fecha,
      });
    } catch {
      // No revertir la UI — el registro local es válido.
      // Se puede reintentar o sincronizar después.
      setSaveError("Guardado local OK · Backend no disponible");
    } finally {
      setSaving(false);
    }

    setSubmitted(true);
    setTimeout(() => {
      setMonto("");
      setConcepto("");
      setRef("");
      setSaveError(null);
      setSubmitted(false);
    }, 2000);
  };

  if (submitted) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-8 flex flex-col items-center gap-3 text-center">
        <div className="w-14 h-14 rounded-full bg-medflow-emerald-light flex items-center justify-center">
          <CheckCircle2 className="w-7 h-7 text-medflow-emerald" />
        </div>
        <p className="text-base font-bold text-medflow-slate">¡Ingreso registrado!</p>
        <p className="text-sm text-slate-500">{concepto}</p>
        <p className="text-2xl font-black text-medflow-emerald">
          {MONEDA_CFG[moneda].symbol}{formatBs(montoNum)}
        </p>
        {moneda !== "VES" && (
          <p className="text-xs text-slate-400">
            Bs. {formatBs(montoCalculadoBs)} · Tasa sellada: {formatBs(tasa)}
          </p>
        )}
        {saveError ? (
          <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full">
            {saveError}
          </span>
        ) : (
          <span className="text-[10px] text-medflow-emerald bg-medflow-emerald-light px-2.5 py-1 rounded-full">
            ✓ Guardado en Libro Mayor
          </span>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 p-5 space-y-5">

      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-medflow-emerald-light flex items-center justify-center">
          <DollarSign className="w-4 h-4 text-medflow-emerald" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-medflow-slate">Registrar Ingreso</h3>
          <p className="text-[10px] text-slate-400">Tasa BCV fijada al momento del pago</p>
        </div>
      </div>

      {/* Concepto */}
      <div>
        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
          Concepto
        </label>
        <div className="relative">
          <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={concepto}
            onChange={(e) => setConcepto(e.target.value)}
            placeholder="Ej: Consulta Urología — Carlos Medina"
            className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-medflow-emerald transition-colors text-medflow-slate placeholder:text-slate-300"
            required
          />
        </div>
      </div>

      {/* Moneda */}
      <div>
        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
          Moneda
        </label>
        <div className="flex gap-2">
          {(["USD", "VES", "EUR"] as Moneda[]).map((m) => {
            const cfg = MONEDA_CFG[m];
            const active = moneda === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setMoneda(m)}
                className={cn(
                  "flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all",
                  active
                    ? `${cfg.activeBg} text-white border-transparent shadow-sm`
                    : `${cfg.bg} ${cfg.text} ${cfg.border} hover:opacity-80`
                )}
              >
                {cfg.symbol} {m}
              </button>
            );
          })}
        </div>
      </div>

      {/* Método de pago */}
      <div>
        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
          Método de Pago
        </label>
        <div className="flex flex-wrap gap-2">
          {metodosDisponibles.map((m) => {
            const cfg = METODO_CFG[m];
            const Icon = cfg.icon;
            const active = metodo === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setMetodo(m)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all",
                  active
                    ? "bg-medflow-slate text-white border-transparent"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {cfg.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Monto */}
      <div>
        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
          Monto
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-bold text-slate-400">
            {MONEDA_CFG[moneda].symbol}
          </span>
          <input
            type="number"
            min={0}
            step={0.01}
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            placeholder="0.00"
            className="w-full pl-12 pr-4 py-3.5 text-2xl font-black bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-medflow-emerald transition-colors text-medflow-slate placeholder:text-slate-200"
            required
          />
        </div>
      </div>

      {/* Sello BCV — el corazón del módulo venezolano */}
      <div className={cn(
        "rounded-xl px-4 py-3 border",
        tasa > 0
          ? "bg-medflow-emerald-light border-medflow-emerald/20"
          : "bg-amber-50 border-amber-200"
      )}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <TrendingUp className={cn("w-3.5 h-3.5", tasa > 0 ? "text-medflow-emerald" : "text-amber-500")} />
            <span className={cn("text-[10px] font-bold uppercase tracking-wider", tasa > 0 ? "text-medflow-emerald" : "text-amber-600")}>
              Tasa BCV al momento
            </span>
          </div>
          {tasaLoading ? (
            <span className="text-[10px] text-slate-400 animate-pulse">Consultando BCV...</span>
          ) : tasa > 0 ? (
            <span className="text-sm font-black text-medflow-emerald">
              Bs. {formatBs(tasa)} / $1
            </span>
          ) : (
            <div className="flex items-center gap-1 text-[10px] text-amber-600">
              <AlertCircle className="w-3 h-3" />
              Backend no conectado
            </div>
          )}
        </div>

        {moneda !== "VES" && montoNum > 0 && tasa > 0 && (
          <div className="flex items-baseline justify-between pt-1 border-t border-medflow-emerald/10 mt-1">
            <span className="text-[10px] text-slate-500">Equivalente en Bolívares</span>
            <span className="text-lg font-black text-medflow-slate">
              Bs. {formatBs(montoCalculadoBs)}
            </span>
          </div>
        )}

        {moneda === "VES" && (
          <p className="text-[10px] text-slate-400 mt-0.5">
            Pago directo en Bs. — no requiere conversión.
          </p>
        )}
      </div>

      {/* Referencia (opcional para Zelle/Transferencia) */}
      {(metodo === "Zelle" || metodo === "Transferencia") && (
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
            N° Referencia <span className="normal-case font-normal text-slate-400">(opcional)</span>
          </label>
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={referencia}
              onChange={(e) => setRef(e.target.value)}
              placeholder={metodo === "Zelle" ? "ZL-XXXXXX" : "Nro. de confirmación"}
              className="w-full pl-9 pr-3 py-2.5 text-sm font-mono bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-medflow-emerald transition-colors text-medflow-slate placeholder:text-slate-300"
            />
          </div>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={!puedeEnviar || saving}
        className={cn(
          "w-full py-3.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2",
          puedeEnviar && !saving
            ? "bg-medflow-emerald text-white hover:bg-medflow-emerald-hover shadow-sm hover:shadow-md"
            : "bg-slate-100 text-slate-400 cursor-not-allowed"
        )}
      >
        {saving ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Guardando en Libro Mayor...
          </>
        ) : puedeEnviar ? (
          `Registrar ${MONEDA_CFG[moneda].symbol}${montoNum > 0 ? montoNum.toFixed(2) : ""} — ${metodo}`
        ) : (
          "Completa los campos para continuar"
        )}
      </button>
    </form>
  );
}
