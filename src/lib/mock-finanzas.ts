export const BCV_RATE = 92.45; // Bs per 1 USD — mock (real: FastAPI scraper)

export type PaymentMethod = "zelle" | "efectivo-usd" | "efectivo-bs" | "pago-movil" | "transferencia-bs";

export interface Transaction {
  id: string;
  patientName: string;
  concept: string;
  method: PaymentMethod;
  amountUsd?: number;
  amountBs?: number;
  reference?: string;
  time: string; // HH:MM
  date: string; // YYYY-MM-DD
}

export interface PendingInvoice {
  id: string;
  patientName: string;
  procedure: string;
  date: string;
  amountUsd: number;
}

// Today's transactions (2026-05-13)
export const TODAY_TRANSACTIONS: Transaction[] = [
  {
    id: "T001",
    patientName: "José L. Torrealba",
    concept: "Honorarios RTU Próstata",
    method: "zelle",
    amountUsd: 800,
    reference: "ZL-482910",
    time: "09:47",
    date: "2026-05-13",
  },
  {
    id: "T002",
    patientName: "Ramón A. Pérez",
    concept: "Abono Biopsia (50%)",
    method: "efectivo-usd",
    amountUsd: 175,
    time: "10:22",
    date: "2026-05-13",
  },
  {
    id: "T003",
    patientName: "Luis F. Gutiérrez",
    concept: "Honorarios Litotricia Láser",
    method: "pago-movil",
    amountBs: 55_470,
    time: "11:15",
    date: "2026-05-13",
  },
  {
    id: "T004",
    patientName: "Miguel Á. Soto",
    concept: "Honorarios Varicocele (50%)",
    method: "zelle",
    amountUsd: 225,
    reference: "ZL-483201",
    time: "11:52",
    date: "2026-05-13",
  },
  {
    id: "T005",
    patientName: "Carlos J. Herrera",
    concept: "Depósito Ureteroscopía",
    method: "transferencia-bs",
    amountBs: 27_735,
    time: "13:40",
    date: "2026-05-13",
  },
];

// 3 invoices pending from last week (triggers MedIA alert)
export const PENDING_INVOICES: PendingInvoice[] = [
  {
    id: "INV-091",
    patientName: "Héctor J. Romero",
    procedure: "Nefrectomía Parcial",
    date: "2026-05-06",
    amountUsd: 1_100,
  },
  {
    id: "INV-092",
    patientName: "Gustavo M. Leal",
    procedure: "RTU de Vejiga",
    date: "2026-05-07",
    amountUsd: 700,
  },
  {
    id: "INV-093",
    patientName: "Nelson F. Castro",
    procedure: "Cistoscopia + Biopsia",
    date: "2026-05-08",
    amountUsd: 520,
  },
];

// Computed summaries
export function computeDailySummary(transactions: Transaction[]) {
  let zelleUsd = 0;
  let efectivoUsd = 0;
  let efectivoBs = 0;
  let pagoMovilBs = 0;
  let transferenciaBs = 0;

  for (const t of transactions) {
    if (t.method === "zelle") zelleUsd += t.amountUsd ?? 0;
    if (t.method === "efectivo-usd") efectivoUsd += t.amountUsd ?? 0;
    if (t.method === "efectivo-bs") efectivoBs += t.amountBs ?? 0;
    if (t.method === "pago-movil") pagoMovilBs += t.amountBs ?? 0;
    if (t.method === "transferencia-bs") transferenciaBs += t.amountBs ?? 0;
  }

  const totalBs = efectivoBs + pagoMovilBs + transferenciaBs;
  const totalUsd = zelleUsd + efectivoUsd + totalBs / BCV_RATE;

  return { zelleUsd, efectivoUsd, efectivoBs, pagoMovilBs, transferenciaBs, totalBs, totalUsd };
}
