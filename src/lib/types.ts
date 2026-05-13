export type PatientStatus =
  | "control-psa"
  | "post-op"
  | "pendiente-biopsia"
  | "nuevo"
  | "alta";

export interface PsaRecord {
  date: string; // YYYY-MM-DD
  psaTotal: number;
  psaFree: number;
  label?: string; // formatted for chart axis
}

export interface EcoFile {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  category: "prostata" | "renal" | "vejiga" | "otro";
}

// ── Contabilidad Multimoneda ──────────────────────────────────────────────────

export type Moneda = 'USD' | 'VES' | 'EUR';

export type MetodoPago =
  | 'Zelle'
  | 'Efectivo'
  | 'Pago Movil'
  | 'Transferencia'
  | 'Punto';

export interface Transaccion {
  id: string;
  monto: number;            // Monto en la moneda original
  moneda: Moneda;
  metodo: MetodoPago;
  tasaReferencia: number;   // Tasa BCV en el momento exacto del registro
  montoCalculadoBs: number; // monto * tasaReferencia (si USD/EUR) | monto (si VES)
  concepto: string;         // "Consulta Urología - Carlos Medina"
  fecha: string;            // ISO timestamp
  referencia?: string;      // Número de referencia Zelle / transferencia
}

// Métodos disponibles por moneda
export const METODOS_POR_MONEDA: Record<Moneda, MetodoPago[]> = {
  USD: ['Zelle', 'Efectivo', 'Transferencia'],
  VES: ['Efectivo', 'Pago Movil', 'Transferencia', 'Punto'],
  EUR: ['Efectivo', 'Transferencia'],
};

// ── Pacientes ──────────────────────────────────────────────────────────────────

export interface Patient {
  id: string;
  name: string;
  cedula: string;
  age: number;
  birthDate: string;
  phone: string;
  email?: string;
  status: PatientStatus;
  lastVisit: string;
  primaryDiagnosis: string;
  prostaticVolume?: number; // cc
  ipssScore?: number;       // 0-35
  psaHistory: PsaRecord[];
  ecos: EcoFile[];
  notes?: string;
}
