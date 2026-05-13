/**
 * MedFlow-AI — Cliente API
 * En desarrollo apunta a http://localhost:8000
 * En producción usa NEXT_PUBLIC_API_URL (Railway)
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ── BCV Rate ─────────────────────────────────────────────────────────────────

export interface BcvRateResponse {
  status: "success" | "cached" | "success_fallback" | "fallback";
  rate: number;
  currency: string;
  provider: string;
  message?: string;
}

export async function fetchBcvRate(): Promise<BcvRateResponse> {
  const res = await fetch(`${BASE_URL}/api/v1/bcv`, {
    next: { revalidate: 300 }, // Next.js cache — revalida cada 5 min
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

// ── MedIA — Alerta financiera ─────────────────────────────────────────────────

export interface FinanceAlertPayload {
  total_usd: number;
  pending_invoices: number;
  pending_amount_usd: number;
  bcv_rate: number;
}

export async function getFinanceAlert(
  payload: FinanceAlertPayload
): Promise<{ alert: string }> {
  const res = await fetch(`${BASE_URL}/api/v1/media/finance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Error en alerta financiera");
  return res.json();
}
