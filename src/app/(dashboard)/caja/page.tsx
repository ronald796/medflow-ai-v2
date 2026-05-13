"use client";

import { useState, useEffect, useCallback } from "react";
import { DollarSign, TrendingUp, RefreshCw } from "lucide-react";
import { Transaccion, Moneda, MetodoPago } from "@/lib/types";
import { getTransactions, TransaccionDB } from "@/lib/api";
import RegistroIngreso from "@/components/finanzas/RegistroIngreso";
import TransaccionList from "@/components/finanzas/TransaccionList";
import BcvConverter from "@/components/finanzas/BcvConverter";
import MedIAFinanzas from "@/components/finanzas/MedIAFinanzas";

// Mapea la fila de SQLite al tipo frontend Transaccion
function dbRowToTransaccion(r: TransaccionDB): Transaccion {
  return {
    id: r.id,
    monto: r.monto,
    moneda: r.moneda as Moneda,
    metodo: r.metodo as MetodoPago,
    tasaReferencia: r.tasa_ref,
    montoCalculadoBs: r.monto_bs,
    concepto: r.concepto,
    fecha: r.fecha,
    referencia: r.referencia ?? undefined,
  };
}

export default function CajaPage() {
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [backendOk, setBackendOk] = useState(true);

  const today = new Intl.DateTimeFormat("es-VE", {
    weekday: "long", day: "numeric", month: "long",
  }).format(new Date());

  const todayIso = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  // Cargar historial del día desde SQLite al montar
  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const data = await getTransactions(todayIso);
      setTransacciones(data.transactions.map(dbRowToTransaccion));
      setBackendOk(true);
    } catch {
      setBackendOk(false);
    } finally {
      setLoadingHistory(false);
    }
  }, [todayIso]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  // Optimistic update: se agrega localmente, el form persiste en backend
  const handleRegistrar = (t: Transaccion) => {
    setTransacciones((prev) => [...prev, t]);
  };

  const totalBs  = transacciones.reduce((s, t) => s + t.montoCalculadoBs, 0);
  const totalUsd = transacciones.filter((t) => t.moneda === "USD").reduce((s, t) => s + t.monto, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-5">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-medflow-slate">Caja y Finanzas</h1>
          <p className="text-sm text-slate-400 mt-0.5 capitalize">{today}</p>
        </div>
        <div className="flex items-center gap-3">
          {!backendOk && (
            <span className="text-[11px] text-amber-600 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-full">
              Backend offline · Modo local
            </span>
          )}
          <button
            onClick={loadHistory}
            disabled={loadingHistory}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-medflow-slate transition-colors px-3 py-2 rounded-xl hover:bg-slate-100"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingHistory ? "animate-spin" : ""}`} />
            Sincronizar
          </button>
        </div>
      </div>

      {/* Banner de totales */}
      {transacciones.length > 0 && (
        <div className="bg-medflow-slate rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-slate-400 text-xs font-medium mb-1">
              Recaudado hoy ·{" "}
              <span className="text-white font-semibold">
                {transacciones.length} {transacciones.length === 1 ? "transacción" : "transacciones"}
              </span>
            </p>
            <p className="text-4xl font-black text-white leading-none">
              Bs. {new Intl.NumberFormat("es-VE", { minimumFractionDigits: 2 }).format(totalBs)}
            </p>
            {totalUsd > 0 && (
              <p className="text-medflow-emerald text-sm font-semibold mt-1">
                ${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(totalUsd)} USD recibidos
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 px-3 py-2.5 bg-white/10 rounded-xl">
            <DollarSign className="w-4 h-4 text-medflow-emerald" />
            <span className="text-sm text-white font-semibold">Caja abierta</span>
          </div>
        </div>
      )}

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Col izquierda — Formulario + Conversor */}
        <div className="space-y-4">
          <RegistroIngreso onRegistrar={handleRegistrar} />
          <BcvConverter />
        </div>

        {/* Col derecha — Lista + MedIA */}
        <div className="lg:col-span-2 space-y-4">
          {loadingHistory ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-8 flex items-center justify-center gap-3">
              <RefreshCw className="w-4 h-4 text-slate-400 animate-spin" />
              <span className="text-sm text-slate-400">Cargando historial del día...</span>
            </div>
          ) : (
            <TransaccionList transacciones={transacciones} />
          )}
          <MedIAFinanzas />
        </div>

      </div>
    </div>
  );
}
