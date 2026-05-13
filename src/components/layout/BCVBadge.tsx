import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export const BCVBadge = () => {
  const [data, setData] = useState({ rate: 0, time: '', loading: true, error: false });

  const fetchRate = useCallback(async () => {
    setData(prev => ({ ...prev, loading: true }));
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/bcv`);
      const json = await res.json();

      if (json.status === "success") {
        setData({
          rate: json.rate,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          loading: false,
          error: false
        });
      } else { throw new Error(); }
    } catch (e) {
      setData(prev => ({ ...prev, loading: false, error: true }));
    }
  }, []);

  useEffect(() => {
    fetchRate();
    const interval = setInterval(fetchRate, 300000);
    return () => clearInterval(interval);
  }, [fetchRate]);

  return (
    <div className={`flex items-center gap-3 px-4 py-2 rounded-lg border shadow-sm transition-colors ${
      data.error ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'
    }`}>
      <div className="flex flex-col items-end">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold uppercase tracking-wider ${data.error ? 'text-amber-600' : 'text-emerald-600'}`}>
            Tasa BCV Oficial
          </span>
          {data.error ? <AlertCircle size={12} className="text-amber-500" /> : <CheckCircle2 size={12} className="text-emerald-500" />}
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-[10px] text-gray-500 font-medium">Bs.</span>
          <span className={`text-lg font-bold leading-none ${data.error ? 'text-amber-700' : 'text-emerald-700'}`}>
            {data.loading ? '...' : data.rate.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <span className="text-[9px] text-gray-400 font-mono">act. {data.time || '--:--'}</span>
      </div>

      <button
        onClick={fetchRate}
        disabled={data.loading}
        className={`p-1.5 rounded-md hover:bg-white/50 transition-all ${data.loading ? 'animate-spin' : ''}`}
      >
        <RefreshCw size={16} className={data.error ? 'text-amber-600' : 'text-emerald-600'} />
      </button>
    </div>
  );
};
