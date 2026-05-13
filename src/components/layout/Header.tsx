"use client";

import { useEffect, useState } from "react";
import { Bell, Search } from "lucide-react";
import { BCVBadge } from "@/components/layout/BCVBadge";

export default function Header({ title }: { title?: string }) {
  const [currentTime, setCurrentTime] = useState("");

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

      <BCVBadge />

      <span className="text-xs text-slate-400 hidden lg:block capitalize">{currentTime}</span>

      <button className="relative p-2 rounded-lg hover:bg-slate-50 transition-colors">
        <Bell className="w-4 h-4 text-slate-500" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-medflow-emerald rounded-full ring-2 ring-white" />
      </button>
    </header>
  );
}
