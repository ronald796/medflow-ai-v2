"use client";

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

const STORAGE_KEY = "medflow_bcv_rate";

// Cualquier status con tasa válida se acepta
function isValidResponse(json: { status: string; rate: number }) {
  return json.rate > 0 && ["success", "cached", "success_fallback", "fallback"].includes(json.status);
}

export const BCVBadge = () => {
  const [data, setData] = useState({ rate: 0, time: '', loading: true, error: false, isFallback: false });

  const fetchRate = useCallback(async () => {
    setData(prev => ({ ...prev, loading: true }));
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/bcv`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      if (isValidResponse(json)) {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const isFallback = json.status === "fallback";
        // Guardar en localStorage para sobrevivir recargas sin backend
        if (!isFallback) localStorage.setItem(STORAGE_KEY, JSON.stringify({ rate: json.rate, time }));
        setData({ rate: json.rate, time, loading: false, error: false, isFallback });
      } else {
        throw new Error("Tasa inválida");
      }
    } catch {
      // Intentar recuperar del localStorage antes de mostrar error
      try {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          const { rate, time } = JSON.parse(cached);
          setData({ rate, time, loading: false, error: false, isFallback: true });
          return;
        }
      } catch {}
      setData(prev => ({ ...prev, loading: false, error: true, isFallback: false }));
    }
  }, []);

  useEffect(() => {
    // Mostrar inmediatamente el valor guardado mientras carga el real
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const { rate, time } = JSON.parse(cached);
        setData({ rate, time, loading: true, error: false, isFallback: false });
      }
    } catch {}

    fetchRate();
    const interval = setInterval(fetchRate, 300000);
    return () => clearInterval(interval);
  }, [fetchRate]);

  const isError    = data.error;
  const isWarning  = data.isFallback && !data.error;

  return (
    <div className={`flex items-center gap-3 px-4 py-2 rounded-lg border shadow-sm transition-colors ${
      isError   ? 'bg-red-50 border-red-200' :
      isWarning ? 'bg-amber-50 border-amber-200' :
                  'bg-emerald-50 border-emerald-200'
    }`}>
      <div className="flex flex-col items-end">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold uppercase tracking-wider ${
            isError ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-emerald-600'
          }`}>
            Tasa BCV Oficial
          </span>
          {isError
            ? <AlertCircle size={12} className="text-red-500" />
            : <CheckCircle2 size={12} className={isWarning ? "text-amber-500" : "text-emerald-500"} />
          }
        </div>

        <div className="flex items-baseline gap-1">
          <span className="text-[10px] text-gray-500 font-medium">Bs.</span>
          <span className={`text-lg font-bold leading-none ${
            isError ? 'text-red-700' : isWarning ? 'text-amber-700' : 'text-emerald-700'
          }`}>
            {data.loading && data.rate === 0
              ? '...'
              : data.rate.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <span className="text-[9px] text-gray-400 font-mono">
          {isWarning ? 'ref. ' : 'act. '}{data.time || '--:--'}
        </span>
      </div>

      <button
        onClick={fetchRate}
        disabled={data.loading}
        title="Actualizar tasa BCV"
        className={`p-1.5 rounded-md hover:bg-white/50 transition-all ${data.loading ? 'animate-spin' : ''}`}
      >
        <RefreshCw size={16} className={
          isError ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-emerald-600'
        } />
      </button>
    </div>
  );
};
