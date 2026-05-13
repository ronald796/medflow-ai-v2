"use client";

import { useState } from "react";
import { ArrowRightLeft, TrendingUp } from "lucide-react";
import { BCV_RATE } from "@/lib/mock-finanzas";
import { cn } from "@/lib/utils";

type Direction = "usd-to-bs" | "bs-to-usd";

export default function BcvConverter() {
  const [input, setInput] = useState("");
  const [direction, setDirection] = useState<Direction>("usd-to-bs");

  const numeric = parseFloat(input.replace(/,/g, "")) || 0;
  const result =
    direction === "usd-to-bs"
      ? numeric * BCV_RATE
      : numeric / BCV_RATE;

  const formatted =
    direction === "usd-to-bs"
      ? new Intl.NumberFormat("es-VE", { minimumFractionDigits: 2 }).format(result) + " Bs."
      : "$" + new Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(result);

  const flip = () => {
    setDirection((d) => (d === "usd-to-bs" ? "bs-to-usd" : "usd-to-bs"));
    setInput("");
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-xl bg-medflow-emerald-light">
          <TrendingUp className="w-4 h-4 text-medflow-emerald" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-medflow-slate">Conversor BCV</h3>
          <p className="text-[10px] text-slate-400">Tasa: Bs. {BCV_RATE.toFixed(2)} / $1 USD</p>
        </div>
      </div>

      {/* Direction toggle */}
      <div className="flex items-center gap-2 mb-4">
        <span className={cn(
          "text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors",
          direction === "usd-to-bs" ? "bg-urology-blue text-white" : "bg-slate-100 text-slate-500"
        )}>
          USD → Bs.
        </span>
        <button
          onClick={flip}
          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors text-slate-500"
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
        </button>
        <span className={cn(
          "text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors",
          direction === "bs-to-usd" ? "bg-medflow-emerald text-white" : "bg-slate-100 text-slate-500"
        )}>
          Bs. → USD
        </span>
      </div>

      {/* Input */}
      <div className="relative mb-3">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
          {direction === "usd-to-bs" ? "$" : "Bs."}
        </span>
        <input
          type="number"
          min={0}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="0.00"
          className="w-full pl-9 pr-4 py-3 text-lg font-bold text-medflow-slate bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-medflow-emerald transition-colors"
        />
      </div>

      {/* Result */}
      <div className={cn(
        "flex items-center justify-between px-4 py-3.5 rounded-xl",
        numeric > 0 ? "bg-medflow-emerald-light border border-medflow-emerald/20" : "bg-slate-50"
      )}>
        <p className="text-xs text-slate-500 font-medium">
          {direction === "usd-to-bs" ? "Equivalente en Bolívares" : "Equivalente en Dólares"}
        </p>
        <p className={cn(
          "text-xl font-black tabular-nums",
          numeric > 0 ? "text-medflow-emerald" : "text-slate-300"
        )}>
          {numeric > 0 ? formatted : "—"}
        </p>
      </div>

      {/* Quick presets (USD common amounts) */}
      {direction === "usd-to-bs" && (
        <div className="mt-3 flex gap-2 flex-wrap">
          {[100, 200, 500, 1000].map((amt) => (
            <button
              key={amt}
              onClick={() => setInput(String(amt))}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 hover:bg-urology-blue-light hover:text-urology-blue transition-colors"
            >
              ${amt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
