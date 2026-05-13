from __future__ import annotations

import os
import time
import sqlite3
from contextlib import contextmanager
from datetime import datetime, date
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from bs4 import BeautifulSoup
import httpx
from pydantic import BaseModel
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

app = FastAPI(title="MedFlow-AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── SQLite — conexión segura con context manager ───────────────────────────────

DB_PATH = os.getenv("DB_PATH", "medflow.db")

@contextmanager
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # filas como dicts
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_db():
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS transacciones (
                id            TEXT PRIMARY KEY,
                monto         REAL NOT NULL,
                moneda        TEXT NOT NULL,
                metodo        TEXT NOT NULL,
                tasa_ref      REAL NOT NULL,
                monto_bs      REAL NOT NULL,
                concepto      TEXT NOT NULL,
                referencia    TEXT,
                fecha         TEXT NOT NULL
            )
        """)

init_db()

# ── In-memory BCV cache ────────────────────────────────────────────────────────

_bcv_cache: dict = {"rate": None, "timestamp": 0}
BCV_CACHE_TTL = 300  # 5 minutos


# ═══════════════════════════════════════════════════════════════════════════════
#  MODELOS
# ═══════════════════════════════════════════════════════════════════════════════

class PatientData(BaseModel):
    name: str
    age: int
    psa_total: float
    psa_free: Optional[float] = None
    prostate_volume: Optional[float] = None
    psa_history: Optional[List[Dict[str, Any]]] = None
    observations: str = ""

class TransaccionIn(BaseModel):
    id: str
    monto: float
    moneda: str          # USD | VES | EUR
    metodo: str          # Zelle | Efectivo | Pago Movil | Transferencia | Punto
    tasaReferencia: float
    montoCalculadoBs: float
    concepto: str
    referencia: Optional[str] = None
    fecha: str           # ISO timestamp desde el frontend


# ═══════════════════════════════════════════════════════════════════════════════
#  HEALTH CHECK
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/")
async def root():
    return {"status": "ok", "service": "MedFlow-AI API", "version": "1.0.0"}


# ═══════════════════════════════════════════════════════════════════════════════
#  TASA BCV REAL (SCRAPER)
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/api/v1/bcv")
async def get_bcv_rate():
    global _bcv_cache

    if _bcv_cache["rate"] and (time.time() - _bcv_cache["timestamp"]) < BCV_CACHE_TTL:
        return {
            "status": "cached",
            "rate": _bcv_cache["rate"],
            "currency": "VES",
            "provider": "BCV",
            "cached_at": int(_bcv_cache["timestamp"]),
        }

    url = "https://www.bcv.org.ve/"
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        ),
        "Accept-Language": "es-VE,es;q=0.9",
    }

    try:
        async with httpx.AsyncClient(verify=False, timeout=15) as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()

        soup = BeautifulSoup(response.text, "html.parser")

        rate_div = soup.find("div", {"id": "dolar"})
        if rate_div:
            strong = rate_div.find("strong")
            if strong:
                rate = float(strong.text.strip().replace(",", "."))
                _bcv_cache = {"rate": rate, "timestamp": time.time()}
                return {"status": "success", "rate": rate, "currency": "VES", "provider": "BCV"}

        # Selector de respaldo
        for table in soup.find_all("table"):
            for row in table.find_all("tr"):
                if "USD" in row.text:
                    for cell in row.find_all("td"):
                        try:
                            val = float(cell.text.strip().replace(",", "."))
                            if 10 < val < 10000:
                                _bcv_cache = {"rate": val, "timestamp": time.time()}
                                return {"status": "success_fallback", "rate": val, "currency": "VES", "provider": "BCV"}
                        except ValueError:
                            continue

        raise ValueError("Tasa no encontrada en bcv.org.ve")

    except Exception as exc:
        fallback_rate = _bcv_cache["rate"] if _bcv_cache["rate"] else 92.45
        return {
            "status": "fallback",
            "rate": fallback_rate,
            "currency": "VES",
            "provider": "cache_or_default",
            "message": str(exc)[:120],
        }


# ═══════════════════════════════════════════════════════════════════════════════
#  FINANZAS — LIBRO MAYOR SQLITE
# ═══════════════════════════════════════════════════════════════════════════════

@app.post("/api/v1/finance/transactions", status_code=201)
async def save_transaction(tx: TransaccionIn):
    with get_db() as conn:
        conn.execute(
            """INSERT OR REPLACE INTO transacciones
               (id, monto, moneda, metodo, tasa_ref, monto_bs, concepto, referencia, fecha)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                tx.id, tx.monto, tx.moneda, tx.metodo,
                tx.tasaReferencia, tx.montoCalculadoBs,
                tx.concepto, tx.referencia, tx.fecha,
            ),
        )
    return {"status": "success", "id": tx.id}


@app.get("/api/v1/finance/transactions")
async def get_transactions(fecha: Optional[str] = Query(None, description="Filtrar por fecha YYYY-MM-DD")):
    with get_db() as conn:
        if fecha:
            rows = conn.execute(
                "SELECT * FROM transacciones WHERE fecha LIKE ? ORDER BY fecha DESC",
                (f"{fecha}%",),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM transacciones ORDER BY fecha DESC LIMIT 200"
            ).fetchall()

    return {"transactions": [dict(r) for r in rows], "count": len(rows)}


@app.delete("/api/v1/finance/transactions/{tx_id}", status_code=200)
async def delete_transaction(tx_id: str):
    with get_db() as conn:
        result = conn.execute("DELETE FROM transacciones WHERE id = ?", (tx_id,))
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Transacción no encontrada")
    return {"status": "deleted", "id": tx_id}


# ═══════════════════════════════════════════════════════════════════════════════
#  MEDIA — ANÁLISIS FINANCIERO INTELIGENTE (GROQ)
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/api/v1/finance/analysis")
async def get_financial_analysis(fecha: Optional[str] = Query(None)):
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY no configurada")

    hoy = fecha or date.today().isoformat()

    with get_db() as conn:
        rows = conn.execute(
            "SELECT * FROM transacciones WHERE fecha LIKE ? ORDER BY fecha",
            (f"{hoy}%",),
        ).fetchall()

    if not rows:
        return {"analysis": "No hay transacciones registradas para analizar hoy."}

    txs = [dict(r) for r in rows]

    # ── Métricas pre-calculadas para el prompt ──────────────────────────────
    total_bs     = sum(t["monto_bs"] for t in txs)
    por_moneda   = {}
    por_metodo   = {}
    cash_usd     = 0.0

    for t in txs:
        por_moneda[t["moneda"]]  = por_moneda.get(t["moneda"], 0) + t["monto"]
        por_metodo[t["metodo"]] = por_metodo.get(t["metodo"], 0) + 1
        if t["moneda"] == "USD" and t["metodo"] == "Efectivo":
            cash_usd += t["monto"]

    pct_cash_usd = round(cash_usd / sum(t["monto"] for t in txs if t["moneda"] == "USD") * 100, 1) if por_moneda.get("USD") else 0
    tasa_promedio = round(sum(t["tasa_ref"] for t in txs) / len(txs), 2)
    metodo_top   = max(por_metodo, key=por_metodo.get)

    resumen_moneda = " | ".join(f"{k}: {v:.2f}" for k, v in por_moneda.items())
    resumen_metodo = " | ".join(f"{k}: {v} pagos" for k, v in por_metodo.items())

    prompt = f"""Eres MedIA, asesor financiero experto para consultorios médicos en Venezuela.

Datos del día {hoy}:
- Transacciones: {len(txs)}
- Ingresos por moneda: {resumen_moneda}
- Métodos de pago: {resumen_metodo}
- Método más usado: {metodo_top}
- Equivalente total en Bs.: {total_bs:,.2f}
- Tasa BCV promedio aplicada: {tasa_promedio:,.2f} Bs./$
- USD Efectivo recibido: ${cash_usd:.2f} ({pct_cash_usd}% del total USD)

Proporciona exactamente 3 puntos con el siguiente formato:
💰 **Flujo del día**: [resumen de qué entró en qué moneda]
⚠️ **Alerta**: [si cash_usd > 30%, advierte sobre tener vuelto/cambio; si Pago Móvil es alto, recordar confirmar recepción; otro riesgo relevante]
🎯 **Recomendación**: [acción concreta para el consultorio hoy]

Sé directo, máximo 120 palabras. Sin saludos."""

    groq_client = Groq(api_key=api_key)
    completion = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": "Eres MedIA, asistente financiero de una clínica urológica venezolana. Respuestas concisas en español."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.3,
        max_tokens=250,
    )

    return {
        "analysis": completion.choices[0].message.content,
        "stats": {
            "total_txs": len(txs),
            "total_bs": round(total_bs, 2),
            "por_moneda": por_moneda,
            "por_metodo": por_metodo,
            "tasa_promedio": tasa_promedio,
        },
    }


# ═══════════════════════════════════════════════════════════════════════════════
#  MEDIA — ANÁLISIS UROLÓGICO (GROQ)
# ═══════════════════════════════════════════════════════════════════════════════

class AnalysisResponse(BaseModel):
    analysis: str
    model: str
    tokens_used: int

@app.post("/api/v1/media/analyze", response_model=AnalysisResponse)
async def analyze_with_media(data: PatientData):
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY no configurada en .env")

    psa_ratio_str = "N/D"
    if data.psa_free and data.psa_total > 0:
        psa_ratio_str = f"{round(data.psa_free / data.psa_total * 100, 1)}%"

    velocity_str = "N/D"
    if data.psa_history and len(data.psa_history) >= 2:
        try:
            d1 = datetime.strptime(data.psa_history[0]["date"], "%Y-%m-%d")
            d2 = datetime.strptime(data.psa_history[-1]["date"], "%Y-%m-%d")
            years = (d2 - d1).days / 365.25
            if years > 0:
                v = (data.psa_history[-1]["psa_total"] - data.psa_history[0]["psa_total"]) / years
                velocity_str = f"{round(v, 2)} ng/mL/año"
        except Exception:
            pass

    prompt = f"""Actúa como MedIA, especialista urológico de MedFlow-AI.

Paciente: {data.name} ({data.age} años)
PSA Total: {data.psa_total} ng/mL | PSA Libre: {data.psa_free or 'N/D'} | Relación L/T: {psa_ratio_str}
Velocidad PSA: {velocity_str} | Volumen prostático: {data.prostate_volume or 'N/D'} cc
Observaciones: {data.observations or 'Ninguna'}

Siguiendo guías AUA/EAU, proporciona:
1. Interpretación clínica del perfil PSA
2. Nivel de sospecha de malignidad (bajo/intermedio/alto)
3. Recomendación de acción concreta
Máximo 150 palabras. Sin saludos. En español."""

    groq_client = Groq(api_key=api_key)
    completion = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": "Eres MedIA, asistente urológico de élite integrado en MedFlow-AI."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.3,
        max_tokens=300,
    )

    return AnalysisResponse(
        analysis=completion.choices[0].message.content,
        model="llama-3.3-70b-versatile",
        tokens_used=completion.usage.total_tokens if completion.usage else 0,
    )
