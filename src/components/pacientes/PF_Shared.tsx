"use client";

import { ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Semáforo clínico ──────────────────────────────────────────────────────────

export type Signal = "green" | "amber" | "red" | null;

export function signalClass(s: Signal): string {
  if (s === "green") return "text-medflow-emerald bg-medflow-emerald-light border-medflow-emerald/20";
  if (s === "amber") return "text-amber-700 bg-amber-50 border-amber-200";
  if (s === "red")   return "text-red-700 bg-red-50 border-red-200";
  return "text-slate-500 bg-slate-100 border-slate-200";
}

// ── Wrapper de sección acordeón ───────────────────────────────────────────────

interface SectionWrapperProps {
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  required?: boolean;
  completedFields: number;
  totalFields: number;
  children: React.ReactNode;
}

export function SectionWrapper({
  title, icon, isOpen, onToggle, required,
  completedFields, totalFields, children,
}: SectionWrapperProps) {
  const pct = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
  const isComplete = required ? completedFields >= totalFields : false;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-slate-50/60 transition-colors text-left"
      >
        <span className="text-xl flex-shrink-0">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-medflow-slate">{title}</span>
            {required && (
              <span className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                isComplete ? "bg-medflow-emerald-light text-medflow-emerald border-medflow-emerald/20"
                           : "bg-red-50 text-red-600 border-red-100"
              )}>
                {isComplete ? "✓ Completo" : "Obligatoria"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-300",
                  pct === 100 ? "bg-medflow-emerald" : pct > 0 ? "bg-urology-blue" : "bg-slate-200"
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 flex-shrink-0">
              {completedFields}/{totalFields}
            </span>
          </div>
        </div>
        {isOpen
          ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
          : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
        }
      </button>

      {isOpen && (
        <div className="px-5 pb-6 pt-2 border-t border-slate-50 space-y-4">
          {children}
        </div>
      )}
    </div>
  );
}

// ── Campo con label ───────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}

export function Field({ label, required, error, hint, children }: FieldProps) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      {hint && !error && <p className="text-[10px] text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

// ── Estilos de inputs ─────────────────────────────────────────────────────────

export const inputCls = "w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-medflow-emerald focus:bg-white transition-colors text-medflow-slate placeholder:text-slate-300 disabled:opacity-50";
export const inputErrCls = "w-full px-3 py-2.5 text-sm bg-red-50 border border-red-300 rounded-xl outline-none focus:border-red-400 focus:bg-white transition-colors text-medflow-slate placeholder:text-red-200";

// ── Checkbox card ─────────────────────────────────────────────────────────────

interface CheckboxCardProps {
  label: string;
  checked: boolean;
  onChange: () => void;
  color?: "emerald" | "amber" | "blue";
}

export function CheckboxCard({ label, checked, onChange, color = "emerald" }: CheckboxCardProps) {
  const activeClass = {
    emerald: "border-medflow-emerald bg-medflow-emerald-light",
    amber:   "border-amber-400 bg-amber-50",
    blue:    "border-urology-blue bg-urology-blue-light",
  }[color];

  return (
    <button
      type="button"
      onClick={onChange}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all text-left w-full",
        checked ? activeClass : "border-slate-200 bg-slate-50 hover:border-slate-300"
      )}
    >
      <div className={cn(
        "w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border-2 transition-colors",
        checked
          ? color === "blue" ? "bg-urology-blue border-urology-blue" : "bg-medflow-emerald border-medflow-emerald"
          : "border-slate-300"
      )}>
        {checked && <CheckCircle2 className="w-3 h-3 text-white" />}
      </div>
      <span className={checked ? "text-medflow-slate font-semibold" : "text-slate-600"}>{label}</span>
    </button>
  );
}

// ── Badge con semáforo ────────────────────────────────────────────────────────

export function ClinicalBadge({ value, label, signal }: { value: string; label: string; signal: Signal }) {
  return (
    <div className={cn("rounded-xl border px-3 py-2.5 flex items-center justify-between", signalClass(signal))}>
      <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70">{label}</span>
      <span className="text-base font-black">{value}</span>
    </div>
  );
}

// ── Grid de 2 columnas responsivo ─────────────────────────────────────────────

export function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>;
}

export function Grid3({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{children}</div>;
}

// ── Fila de radio buttons ─────────────────────────────────────────────────────

interface RadioGroupProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}

export function RadioGroup({ options, value, onChange }: RadioGroupProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "px-3 py-2 rounded-xl text-xs font-semibold border transition-all",
            value === opt.value
              ? "bg-medflow-slate text-white border-transparent"
              : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
