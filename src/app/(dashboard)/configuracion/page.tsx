"use client";

import { useState } from "react";
import {
  Settings, User, Bell, Shield, Database,
  Monitor, ChevronRight, Check, Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";

const sections = [
  {
    id: "perfil",
    label: "Perfil del Médico",
    icon: User,
    description: "Nombre, especialidad y firma digital",
  },
  {
    id: "clinica",
    label: "Datos de la Clínica",
    icon: Monitor,
    description: "Urológico Valencia — información institucional",
  },
  {
    id: "notificaciones",
    label: "Notificaciones",
    icon: Bell,
    description: "Alertas PSA, recordatorios de citas",
  },
  {
    id: "seguridad",
    label: "Seguridad y Acceso",
    icon: Shield,
    description: "Contraseña, PIN, sesiones activas",
  },
  {
    id: "datos",
    label: "Base de Datos",
    icon: Database,
    description: "Exportar historiales, respaldo PostgreSQL",
  },
  {
    id: "sistema",
    label: "Sistema y Región",
    icon: Globe,
    description: "Idioma, zona horaria, moneda (VES/USD)",
  },
];

export default function ConfiguracionPage() {
  const [active, setActive] = useState("perfil");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-medflow-slate">Configuración</h1>
        <p className="text-sm text-slate-400 mt-0.5">Personaliza MedFlow-AI para el Urológico Valencia</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* Sidebar de secciones */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-50">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Secciones</p>
          </div>
          <nav className="p-2 space-y-0.5">
            {sections.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => setActive(s.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all",
                    active === s.id
                      ? "bg-medflow-emerald text-white"
                      : "hover:bg-slate-50 text-slate-600"
                  )}
                >
                  <Icon className={cn("w-4 h-4 flex-shrink-0", active === s.id ? "text-white" : "text-slate-400")} />
                  <div className="min-w-0">
                    <p className={cn("text-xs font-semibold truncate", active === s.id ? "text-white" : "text-medflow-slate")}>
                      {s.label}
                    </p>
                    <p className={cn("text-[10px] truncate", active === s.id ? "text-white/70" : "text-slate-400")}>
                      {s.description}
                    </p>
                  </div>
                  <ChevronRight className={cn("w-3.5 h-3.5 flex-shrink-0 ml-auto", active === s.id ? "text-white/60" : "text-slate-300")} />
                </button>
              );
            })}
          </nav>
        </div>

        {/* Panel de contenido */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
            <div className="w-9 h-9 rounded-xl bg-medflow-emerald-light flex items-center justify-center">
              <Settings className="w-4 h-4 text-medflow-emerald" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-medflow-slate">
                {sections.find((s) => s.id === active)?.label}
              </h2>
              <p className="text-xs text-slate-400">
                {sections.find((s) => s.id === active)?.description}
              </p>
            </div>
          </div>

          {/* Perfil del médico */}
          {active === "perfil" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Nombre</label>
                  <input defaultValue="Dr. Ramírez" className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-medflow-emerald transition-colors" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Especialidad</label>
                  <input defaultValue="Urología" className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-medflow-emerald transition-colors" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">MPPS / CIU</label>
                  <input defaultValue="MPPS-00000" className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-medflow-emerald transition-colors" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Teléfono de contacto</label>
                  <input defaultValue="+58 424-0000000" className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-medflow-emerald transition-colors" />
                </div>
              </div>
            </div>
          )}

          {/* Datos de la clínica */}
          {active === "clinica" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Nombre de la clínica</label>
                  <input defaultValue="Urológico Valencia" className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-medflow-emerald transition-colors" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Dirección</label>
                  <input defaultValue="Valencia, Carabobo, Venezuela" className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-medflow-emerald transition-colors" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">RIF</label>
                  <input defaultValue="J-000000000-0" className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-medflow-emerald transition-colors" />
                </div>
              </div>
            </div>
          )}

          {/* Sistema y región */}
          {active === "sistema" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Moneda principal</label>
                  <select className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-medflow-emerald transition-colors">
                    <option>USD + VES (Bimonetario)</option>
                    <option>USD</option>
                    <option>VES (Bolívares)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Zona horaria</label>
                  <select className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-medflow-emerald transition-colors">
                    <option>America/Caracas (UTC-4)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Placeholder para otras secciones */}
          {!["perfil", "clinica", "sistema"].includes(active) && (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-medflow-emerald-light flex items-center justify-center">
                <Settings className="w-6 h-6 text-medflow-emerald" />
              </div>
              <p className="text-sm font-semibold text-medflow-slate">Módulo en desarrollo</p>
              <p className="text-xs text-slate-400 max-w-xs">
                Esta sección estará disponible en la próxima versión de MedFlow-AI.
              </p>
            </div>
          )}

          {/* Botón guardar */}
          {["perfil", "clinica", "sistema"].includes(active) && (
            <div className="flex justify-end pt-2">
              <button
                onClick={handleSave}
                className={cn(
                  "inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl transition-all",
                  saved
                    ? "bg-medflow-emerald-light text-medflow-emerald"
                    : "bg-medflow-emerald text-white hover:bg-medflow-emerald-hover shadow-sm"
                )}
              >
                {saved ? <><Check className="w-4 h-4" /> Guardado</> : "Guardar cambios"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
