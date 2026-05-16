"use client";

import { useEffect, useRef, useState } from "react";
import { X, AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { deletePatient } from "@/lib/api";
import { useRouter } from "next/navigation";

interface Props {
  patientId: string;
  patientName: string;
  isTestPatient: boolean;
  onClose: () => void;
}

export default function DeleteConfirmationModal({
  patientId, patientName, isTestPatient, onClose,
}: Props) {
  const router = useRouter();
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const nameMatches = confirmText.trim() === patientName.trim();

  // Auto-focus el input y listener de Escape
  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [loading, onClose]);

  const handleDelete = async (permanent = false) => {
    if (!nameMatches || loading) return;
    setLoading(true);
    setError(null);
    try {
      await deletePatient(patientId, { permanent });
      setSuccess(true);
      setTimeout(() => router.push("/pacientes"), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-medflow-slate/60 backdrop-blur-sm"
        onClick={() => !loading && onClose()}
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-4 h-4 text-red-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 id="delete-modal-title" className="text-sm font-bold text-medflow-slate">
              ¿Eliminar a {patientName}?
            </h2>
            {isTestPatient && (
              <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 mt-0.5">
                Paciente de prueba
              </span>
            )}
          </div>
          <button
            onClick={() => !loading && onClose()}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        {success ? (
          <div className="flex flex-col items-center gap-3 py-10 px-5 text-center">
            <div className="w-14 h-14 rounded-full bg-medflow-emerald-light flex items-center justify-center">
              <span className="text-2xl">✓</span>
            </div>
            <p className="text-sm font-bold text-medflow-slate">Paciente eliminado</p>
            <p className="text-xs text-slate-400">Redirigiendo a la lista...</p>
          </div>
        ) : (
          <div className="px-5 py-5 space-y-4">
            {/* Advertencia */}
            <div className={cn(
              "rounded-xl px-4 py-3 border flex items-start gap-2.5",
              isTestPatient
                ? "bg-amber-50 border-amber-100"
                : "bg-red-50 border-red-100"
            )}>
              <AlertTriangle className={cn("w-4 h-4 flex-shrink-0 mt-0.5",
                isTestPatient ? "text-amber-500" : "text-red-500"
              )} />
              <div className="text-xs space-y-1">
                <p className={cn("font-semibold", isTestPatient ? "text-amber-800" : "text-red-800")}>
                  {isTestPatient
                    ? "Este paciente puede ser eliminado permanentemente."
                    : "Esta acción ocultará al paciente del sistema."}
                </p>
                <p className={isTestPatient ? "text-amber-700" : "text-red-700"}>
                  {isTestPatient
                    ? "Sus datos de prueba no afectan registros clínicos reales. Puede elegir entre ocultar o eliminar permanentemente."
                    : "Sus datos se conservan por requisitos de auditoría médica (estándar HIPAA). El paciente desaparecerá de listas y búsquedas."}
                </p>
              </div>
            </div>

            {/* Input de confirmación */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Para confirmar, escribe exactamente el nombre del paciente:
              </label>
              <input
                ref={inputRef}
                type="text"
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && nameMatches && !loading) {
                    handleDelete(false);
                  }
                }}
                placeholder={patientName}
                className={cn(
                  "w-full px-3 py-2.5 text-sm border rounded-xl outline-none transition-colors",
                  confirmText.length === 0
                    ? "bg-slate-50 border-slate-200"
                    : nameMatches
                    ? "bg-medflow-emerald-light border-medflow-emerald text-medflow-slate font-medium"
                    : "bg-red-50 border-red-300 text-red-800"
                )}
                disabled={loading}
                autoComplete="off"
              />
              {confirmText.length > 0 && !nameMatches && (
                <p className="text-[10px] text-red-500 mt-1">
                  El nombre no coincide exactamente — verifica mayúsculas y espacios.
                </p>
              )}
            </div>

            {/* Error API */}
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-100 px-3 py-2.5 text-xs text-red-700">
                {error}
              </div>
            )}

            {/* Acciones */}
            <div className="flex flex-col gap-2 pt-1">
              {isTestPatient ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleDelete(false)}
                    disabled={!nameMatches || loading}
                    className="w-full py-2.5 text-sm font-bold bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Ocultar (soft delete)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(true)}
                    disabled={!nameMatches || loading}
                    className="w-full py-2.5 text-sm font-bold bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Eliminar permanentemente
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => handleDelete(false)}
                  disabled={!nameMatches || loading}
                  className="w-full py-2.5 text-sm font-bold bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {loading ? "Eliminando..." : "Eliminar paciente"}
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="w-full py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
