/**
 * MedFlow-AI — Cliente API
 * Dev:  http://localhost:8000
 * Prod: NEXT_PUBLIC_API_URL (Railway)
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ── BCV Rate ──────────────────────────────────────────────────────────────────

export interface BcvRateResponse {
  status: "success" | "cached" | "success_fallback" | "fallback";
  rate: number;
  currency: string;
  provider: string;
  message?: string;
}

export async function fetchBcvRate(): Promise<BcvRateResponse> {
  const res = await fetch(`${BASE_URL}/api/v1/bcv`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error("Error obteniendo tasa BCV");
  return res.json();
}

// ── MedIA — Análisis urológico ────────────────────────────────────────────────

export interface PatientAnalysisPayload {
  name: string;
  age: number;
  psa_total: number;
  psa_free?: number;
  prostate_volume?: number;
  psa_history?: { date: string; psa_total: number }[];
  observations?: string;
}

export interface AnalysisResult {
  analysis: string;
  model: string;
  tokens_used: number;
}

export async function analyzePatient(
  payload: PatientAnalysisPayload
): Promise<AnalysisResult> {
  const res = await fetch(`${BASE_URL}/api/v1/media/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? "Error en MedIA");
  }
  return res.json();
}

// ── Finanzas — Libro Mayor ────────────────────────────────────────────────────

export interface TransaccionPayload {
  id: string;
  monto: number;
  moneda: string;
  metodo: string;
  tasaReferencia: number;
  montoCalculadoBs: number;
  concepto: string;
  referencia?: string;
  fecha: string;
}

export interface TransaccionDB {
  id: string;
  monto: number;
  moneda: string;
  metodo: string;
  tasa_ref: number;
  monto_bs: number;
  concepto: string;
  referencia: string | null;
  fecha: string;
}

export async function saveTransaction(tx: TransaccionPayload): Promise<{ status: string; id: string }> {
  const res = await fetch(`${BASE_URL}/api/v1/finance/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tx),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? "Error guardando transacción");
  }
  return res.json();
}

export async function getTransactions(fecha?: string): Promise<{ transactions: TransaccionDB[]; count: number }> {
  const url = fecha
    ? `${BASE_URL}/api/v1/finance/transactions?fecha=${fecha}`
    : `${BASE_URL}/api/v1/finance/transactions`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Error obteniendo transacciones");
  return res.json();
}

export async function deleteTransaction(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/v1/finance/transactions/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Error eliminando transacción");
}

// ── MedIA — Análisis financiero ───────────────────────────────────────────────

export interface FinanceAnalysisResult {
  analysis: string;
  stats: {
    total_txs: number;
    total_bs: number;
    por_moneda: Record<string, number>;
    por_metodo: Record<string, number>;
    tasa_promedio: number;
  };
}

export async function getFinanceAnalysis(fecha?: string): Promise<FinanceAnalysisResult> {
  const url = fecha
    ? `${BASE_URL}/api/v1/finance/analysis?fecha=${fecha}`
    : `${BASE_URL}/api/v1/finance/analysis`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? "Error en análisis financiero");
  }
  return res.json();
}

// ── PSA Longitudinal ──────────────────────────────────────────────────────────

export type ClinicalContext =
  | "SCREENING" | "POST_BIOPSY" | "POST_RTU" | "POST_PROSTATECTOMY"
  | "POST_RADIOTHERAPY" | "POST_HORMONOTHERAPY" | "ACTIVE_SURVEILLANCE" | "FOLLOW_UP";

export interface PSAMeasurementCreate {
  measurement_date: string;        // YYYY-MM-DD
  psa_total: number;               // ng/mL — requerido, > 0
  psa_free?: number;               // ng/mL — opcional
  prostate_volume?: number;        // cc — opcional
  lab_name?: string;
  clinical_context?: ClinicalContext;
  notes?: string;
  created_by?: string;
}

export interface PSAMeasurementOut extends PSAMeasurementCreate {
  id: string;
  patient_id: string;
  psa_ratio: number | null;        // calculado: psa_free/psa_total * 100
  psa_density: number | null;      // calculado: psa_total/prostate_volume
  clinical_context: ClinicalContext;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PSAMetrics {
  count: number;
  latest_psa: number | null;
  latest_date: string | null;
  psa_velocity: number | null;        // ng/mL/año
  psa_doubling_time: number | null;   // meses
  psa_nadir: number | null;
  trend: "INCREASING" | "STABLE" | "DECREASING" | "INSUFFICIENT_DATA";
  biochemical_recurrence: boolean | null;
}

export interface PSAHistoryResponse {
  patient_id: string;
  measurements: PSAMeasurementOut[];
  metrics: PSAMetrics;
}

export async function createPsaMeasurement(
  patientId: string,
  payload: PSAMeasurementCreate
): Promise<PSAMeasurementOut> {
  const res = await fetch(`${BASE_URL}/api/v1/pacientes/${patientId}/psa`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? "Error registrando medición PSA");
  }
  return res.json();
}

export async function getPsaHistory(patientId: string): Promise<PSAHistoryResponse> {
  const res = await fetch(
    `${BASE_URL}/api/v1/pacientes/${patientId}/psa`,
    { cache: "no-store" }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? "Error obteniendo historial PSA");
  }
  return res.json();
}

export async function deletePsaMeasurement(
  patientId: string,
  measurementId: string
): Promise<void> {
  const res = await fetch(
    `${BASE_URL}/api/v1/pacientes/${patientId}/psa/${measurementId}`,
    { method: "DELETE" }
  );
  if (!res.ok) throw new Error("Error eliminando medición PSA");
}
