export type SurgeryStatus =
  | "programada"
  | "en-pabellon"
  | "recuperacion"
  | "finalizada"
  | "cancelada";

export interface Surgery {
  id: string;
  patientId?: string;
  patientName: string;
  procedure: string;
  date: string;       // YYYY-MM-DD
  startTime: string;  // HH:MM
  duration: number;   // minutes
  quirofano: string;
  anesthesiologist: string;
  status: SurgeryStatus;
  honorarios: number; // USD
  notes?: string;
}

// Week of 2026-05-11 → 2026-05-17 (today = Wed 13)
export const MOCK_SURGERIES: Surgery[] = [
  // ── Monday 11 ──────────────────────────────────────────────────────
  {
    id: "S001",
    patientId: "P002",
    patientName: "José L. Torrealba",
    procedure: "RTU de Próstata",
    date: "2026-05-11",
    startTime: "09:00",
    duration: 90,
    quirofano: "Quirófano 1",
    anesthesiologist: "Dr. Morales",
    status: "finalizada",
    honorarios: 800,
  },
  {
    id: "S002",
    patientId: "P005",
    patientName: "Ramón A. Pérez",
    procedure: "Biopsia de Próstata",
    date: "2026-05-11",
    startTime: "11:30",
    duration: 45,
    quirofano: "Quirófano 2",
    anesthesiologist: "Dra. Pérez",
    status: "finalizada",
    honorarios: 350,
  },
  // ── Tuesday 12 ─────────────────────────────────────────────────────
  {
    id: "S003",
    patientId: "P003",
    patientName: "Luis F. Gutiérrez",
    procedure: "Litotricia Láser",
    date: "2026-05-12",
    startTime: "08:30",
    duration: 75,
    quirofano: "Quirófano 1",
    anesthesiologist: "Dr. Morales",
    status: "finalizada",
    honorarios: 600,
  },
  {
    id: "S004",
    patientId: "P004",
    patientName: "Miguel Á. Soto",
    procedure: "Varicocelectomía",
    date: "2026-05-12",
    startTime: "11:00",
    duration: 60,
    quirofano: "Quirófano 2",
    anesthesiologist: "Dra. Pérez",
    status: "finalizada",
    honorarios: 450,
  },
  // ── Wednesday 13 — HOY ─────────────────────────────────────────────
  {
    id: "S005",
    patientId: "P001",
    patientName: "Carlos E. Medina",
    procedure: "Prostatectomía Radical",
    date: "2026-05-13",
    startTime: "09:00",
    duration: 180,
    quirofano: "Quirófano 1",
    anesthesiologist: "Dr. Morales",
    status: "en-pabellon",
    honorarios: 1200,
    notes: "Cirugía robótica. Preparar campo estéril extendido.",
  },
  {
    id: "S006",
    patientName: "Carlos J. Herrera",
    procedure: "Ureteroscopía + Extracción",
    date: "2026-05-13",
    startTime: "13:00",
    duration: 60,
    quirofano: "Quirófano 2",
    anesthesiologist: "Dra. Pérez",
    status: "programada",
    honorarios: 550,
  },
  {
    id: "S007",
    patientId: "P006",
    patientName: "Antonio J. Flores",
    procedure: "Cistoscopia Diagnóstica",
    date: "2026-05-13",
    startTime: "15:30",
    duration: 30,
    quirofano: "Quirófano 1",
    anesthesiologist: "Dr. Morales",
    status: "programada",
    honorarios: 280,
  },
  // ── Thursday 14 ────────────────────────────────────────────────────
  {
    id: "S008",
    patientName: "Pedro R. Díaz",
    procedure: "Nefrolitotomía Percutánea",
    date: "2026-05-14",
    startTime: "09:30",
    duration: 120,
    quirofano: "Quirófano 1",
    anesthesiologist: "Dr. Morales",
    status: "programada",
    honorarios: 950,
  },
  {
    id: "S009",
    patientName: "Roberto E. Blanco",
    procedure: "Resección Transuretral Vejiga",
    date: "2026-05-14",
    startTime: "13:00",
    duration: 75,
    quirofano: "Quirófano 2",
    anesthesiologist: "Dra. Pérez",
    status: "programada",
    honorarios: 700,
  },
  // ── Friday 15 ──────────────────────────────────────────────────────
  {
    id: "S010",
    patientName: "Manuel A. Ruiz",
    procedure: "Litotripsia Extracorpórea",
    date: "2026-05-15",
    startTime: "10:00",
    duration: 60,
    quirofano: "Quirófano 1",
    anesthesiologist: "Dr. Morales",
    status: "programada",
    honorarios: 480,
  },
];

export function getSurgeriesForWeek(weekStart: Date): Surgery[] {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d.toISOString().split("T")[0];
  });
  return MOCK_SURGERIES.filter((s) => days.includes(s.date));
}

export function getSurgeriesForDay(dateStr: string): Surgery[] {
  return MOCK_SURGERIES.filter((s) => s.date === dateStr).sort((a, b) =>
    a.startTime.localeCompare(b.startTime)
  );
}

export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function formatWeekLabel(start: Date): string {
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric" };
  const monthOpts: Intl.DateTimeFormatOptions = { month: "long", year: "numeric" };
  return `${start.getDate()} – ${end.toLocaleString("es-VE", { ...opts, ...monthOpts })}`;
}
