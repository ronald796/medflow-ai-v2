"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell, TrendingUp, Search, RefreshCw } from "lucide-react";
import { fetchBcvRate, BcvRateResponse } from "@/lib/api";
import { cn } from "@/lib/utils";

const BCV_REFRESH_MS = 5 * 60 * 1000; // 5 minutos

function BcvWidget({
  data,
  loading,
  onRefresh,
}: {
  data: BcvRateResponse | null;
  loading: boolean;
  onRefresh: () => void;
}) {
  if (loading && !data) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 animate-pulse w-32 h-7" />
    );
  }

  const isFallback = data?.status === "fallback";

  return (
    <button
      onClick={onRefresh}
      title={isFallback ? "Tasa referencial (BCV no disponible) — Click para reintentar" : "Click para actualizar tasa"}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors cursor-pointer group",
        isFallback
          ? "bg-amber-50 border-amber-200 hover:border-amber-400"
          : "bg-medflow-emerald-light border-medflow-emerald/20 hover:border-medflow-emerald"
      )}
    >
      {loading ? (
        <RefreshCw className="w-3.5 h-3.5 text-slate-400 animate-spin" />
      ) : (
        <TrendingUp className={cn("w-3.5 h-3.5", isFallback ? "text-amber-500" : "text-medflow-emerald")} />
      )}
      <span className={cn("text-xs font-semibold text-medflow-slate")}>
        BCV:{" "}
        <span className={isFallback ? "text-amber-600" : "text-medflow-emerald"}>
          Bs. {data ? data.rate.toFixed(2) : "—"}
        </span>
      </span>
      <span className="text-[10px] text-slate-400 hidden sm:block">/ $1 USD</span>
      {isFallback && (
        <span className="text-[9px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full font-semibold hidden md:block">
          REF
        </span>
      )}
    </button>
  );
}

export default function Header({ title }: { title?: string }) {
  const [bcvData, setBcvData] = useState<BcvRateResponse | null>(null);
  const [bcvLoading, setBcvLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState("");

  const loadBcv = useCallback(async () => {
    setBcvLoading(true);
    try {
      const data = await fetchBcvRate();
      setBcvData(data);
    } catch {
      // Mantener la última tasa si falla
      if (!bcvData) {
        setBcvData({ status: "fallback", rate: 92.45, currency: "VES", provider: "default" });
      }
    } finally {
      setBcvLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadBcv();
    const interval = setInterval(loadBcv, BCV_REFRESH_MS);
    return () => clearInterval(interval);
  }, [loadBcv]);

  useEffect(() => {
    const tick = () => {
      setCurrentTime(
        new Intl.DateTimeFormat("es-VE", {
          weekday: "short",
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date())
      );
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center px-6 gap-4 sticky top-0 z-20">
      <div className="flex-1">
        {title && <h1 className="text-base font-semibold text-medflow-slate">{title}</h1>}
      </div>

      <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 w-56 focus-within:border-medflow-emerald transition-colors">
        <Search className="w-3.5 h-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar paciente..."
          className="bg-transparent text-xs text-medflow-slate placeholder:text-slate-400 outline-none flex-1"
        />
      </div>

      <BcvWidget data={bcvData} loading={bcvLoading} onRefresh={loadBcv} />

      <span className="text-xs text-slate-400 hidden lg:block capitalize">{currentTime}</span>

      <button className="relative p-2 rounded-lg hover:bg-slate-50 transition-colors">
        <Bell className="w-4 h-4 text-slate-500" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-medflow-emerald rounded-full ring-2 ring-white" />
      </button>
    </header>
  );
}
