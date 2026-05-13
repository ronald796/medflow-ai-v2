"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CalendarClock,
  Activity,
  Banknote,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Pacientes",
    href: "/pacientes",
    icon: Users,
  },
  {
    label: "Agenda Quirúrgica",
    href: "/agenda",
    icon: CalendarClock,
  },
  {
    label: "Control PSA",
    href: "/psa",
    icon: Activity,
  },
  {
    label: "Caja",
    href: "/caja",
    icon: Banknote,
  },
];

const bottomItems = [
  { label: "Configuración", href: "/configuracion", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-[260px] bg-medflow-slate flex flex-col z-30">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
        <Image
          src="/logo-medflow.png"
          alt="MedFlow-AI"
          width={120}
          height={40}
          className="object-contain h-9 w-auto"
          priority
        />
      </div>

      {/* Specialty Badge */}
      <div className="px-6 pt-4 pb-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-medflow-emerald bg-medflow-emerald/10 px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-medflow-emerald animate-pulse" />
          Urología
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto">
        <p className="text-medflow-muted text-[10px] font-semibold uppercase tracking-widest px-3 mb-2">
          Módulos
        </p>
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                    isActive
                      ? "bg-medflow-emerald text-white shadow-sm"
                      : "text-slate-300 hover:bg-white/8 hover:text-white"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-4 h-4 flex-shrink-0",
                      isActive ? "text-white" : "text-slate-400"
                    )}
                  />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom: Settings + User */}
      <div className="px-3 pb-4 border-t border-white/10 pt-3 space-y-0.5">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-white/8 hover:text-white transition-all duration-150"
            >
              <Icon className="w-4 h-4 text-slate-400 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}

        {/* User card */}
        <div className="flex items-center gap-3 px-3 py-3 mt-2 rounded-lg bg-white/5">
          <div className="w-8 h-8 rounded-full bg-medflow-emerald flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">DR</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">Dr. Ramírez</p>
            <p className="text-medflow-muted text-[10px] truncate">Urólogo Jefe</p>
          </div>
          <button className="text-slate-400 hover:text-white transition-colors">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
