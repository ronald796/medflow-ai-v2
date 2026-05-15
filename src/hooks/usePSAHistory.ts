"use client";

import { useState, useEffect, useCallback } from "react";
import { getPsaHistory, PSAHistoryResponse } from "@/lib/api";

interface UsePSAHistoryResult {
  data: PSAHistoryResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePSAHistory(patientId: string): UsePSAHistoryResult {
  const [data, setData]     = useState<PSAHistoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getPsaHistory(patientId);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando historial PSA");
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}
