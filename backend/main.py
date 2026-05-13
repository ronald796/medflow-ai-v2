import os
import time
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from bs4 import BeautifulSoup
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

app = FastAPI(title="MedFlow-AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restringir a tu dominio de Vercel en producción
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── In-memory BCV cache (evita martillar la web del BCV) ─────────────────────
_bcv_cache: dict = {"rate": None, "timestamp": 0}
BCV_CACHE_TTL = 300  # 5 minutos


# ── Modelos ───────────────────────────────────────────────────────────────────

class PatientData(BaseModel):
    name: str
    age: int
    psa_total: float
    psa_free: Optional[float] = None
    prostate_volume: Optional[float] = None
    psa_history: Optional[list[dict]] = None  # [{"date": "...", "psa_total": x}]
    observations: str = ""


class AnalysisResponse(BaseModel):
    analysis: str
    model: str
    tokens_used: int


# ── Health check ──────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {"status": "ok", "service": "MedFlow-AI API", "version": "1.0.0"}


# ── ENDPOINT: Tasa BCV real (scraper) ────────────────────────────────────────

@app.get("/api/v1/bcv")
async def get_bcv_rate():
    global _bcv_cache

    # Devolver caché si sigue vigente
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

        # Selector principal: div#dolar > strong
        rate_div = soup.find("div", {"id": "dolar"})
        if rate_div:
            strong = rate_div.find("strong")
            if strong:
                rate_text = strong.text.strip().replace(",", ".")
                rate = float(rate_text)
                _bcv_cache = {"rate": rate, "timestamp": time.time()}
                return {
                    "status": "success",
                    "rate": rate,
                    "currency": "VES",
                    "provider": "BCV",
                }

        # Selector de respaldo: buscar el número flotante grande en la tabla de divisas
        tables = soup.find_all("table")
        for table in tables:
            for row in table.find_all("tr"):
                cells = row.find_all("td")
                if cells and "USD" in row.text:
                    for cell in cells:
                        text = cell.text.strip().replace(",", ".")
                        try:
                            val = float(text)
                            if 10 < val < 1000:  # rango razonable de tasa BCV
                                _bcv_cache = {"rate": val, "timestamp": time.time()}
                                return {
                                    "status": "success_fallback",
                                    "rate": val,
                                    "currency": "VES",
                                    "provider": "BCV",
                                }
                        except ValueError:
                            continue

        raise ValueError("No se encontró la tasa en el HTML de bcv.org.ve")

    except Exception as exc:
        # Fallback con tasa referencial si el BCV está caído (muy frecuente)
        fallback_rate = _bcv_cache["rate"] if _bcv_cache["rate"] else 92.45
        return {
            "status": "fallback",
            "rate": fallback_rate,
            "currency": "VES",
            "provider": "cache_or_default",
            "message": f"BCV no disponible: {str(exc)[:120]}",
        }


# ── ENDPOINT: MedIA — Análisis urológico con Groq ────────────────────────────

@app.post("/api/v1/media/analyze", response_model=AnalysisResponse)
async def analyze_with_media(data: PatientData):
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY no configurada en .env")

    # Calcular métricas derivadas
    psa_ratio_str = "N/D"
    psa_ratio_val = None
    if data.psa_free and data.psa_total > 0:
        psa_ratio_val = round(data.psa_free / data.psa_total * 100, 1)
        psa_ratio_str = f"{psa_ratio_val}%"

    velocity_str = "N/D"
    if data.psa_history and len(data.psa_history) >= 2:
        oldest = data.psa_history[0]
        newest = data.psa_history[-1]
        try:
            from datetime import datetime
            d1 = datetime.strptime(oldest["date"], "%Y-%m-%d")
            d2 = datetime.strptime(newest["date"], "%Y-%m-%d")
            years = (d2 - d1).days / 365.25
            if years > 0:
                velocity = round((newest["psa_total"] - oldest["psa_total"]) / years, 2)
                velocity_str = f"{velocity} ng/mL/año"
        except Exception:
            pass

    prompt = f"""Actúa como MedIA, el agente experto de MedFlow-AI especializado en Urología.

Datos clínicos del paciente:
- Nombre: {data.name} ({data.age} años)
- PSA Total: {data.psa_total} ng/mL
- PSA Libre: {data.psa_free if data.psa_free else "No registrado"} ng/mL
- Relación PSA Libre/Total: {psa_ratio_str}
- Velocidad de PSA: {velocity_str}
- Volumen prostático: {data.prostate_volume if data.prostate_volume else "No registrado"} cc
- Observaciones clínicas: {data.observations if data.observations else "Ninguna"}

Siguiendo las guías de la AUA (American Urological Association) y la EAU, proporciona:
1. Interpretación clínica del perfil de PSA
2. Nivel de sospecha de malignidad (bajo / intermedio / alto)
3. Recomendación de acción concreta (vigilancia activa / biopsia / RM multiparamétrica / etc.)
4. Una alerta específica si la velocidad de PSA o el índice L/T son preocupantes

Sé directo, conciso y clínico. Responde en español. Sin saludos ni despedidas. Máximo 150 palabras."""

    try:
        client = Groq(api_key=api_key)
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Eres MedIA, un asistente urológico de élite integrado en MedFlow-AI. "
                        "Tus análisis son precisos, basados en evidencia y orientados a la acción clínica."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
            max_tokens=300,
        )

        analysis_text = completion.choices[0].message.content
        tokens = completion.usage.total_tokens if completion.usage else 0

        return AnalysisResponse(
            analysis=analysis_text,
            model="llama-3.3-70b-versatile",
            tokens_used=tokens,
        )

    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Error conectando con Groq: {str(exc)[:200]}",
        )


# ── ENDPOINT: MedIA — Análisis financiero ────────────────────────────────────

class FinanceData(BaseModel):
    total_usd: float
    pending_invoices: int
    pending_amount_usd: float
    bcv_rate: float


@app.post("/api/v1/media/finance")
async def finance_alert(data: FinanceData):
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY no configurada")

    prompt = f"""Como MedIA, asistente financiero médico de MedFlow-AI:
- Recaudación del día: ${data.total_usd:.2f} USD
- Facturas pendientes: {data.pending_invoices} (${data.pending_amount_usd:.2f} USD)
- Tasa BCV actual: Bs. {data.bcv_rate:.2f} / USD

En 2 oraciones directas: indica si el flujo del día es saludable y qué acción prioritaria recomiendas sobre las facturas pendientes. Sin saludos. En español."""

    try:
        client = Groq(api_key=api_key)
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "Eres MedIA, asistente financiero de una clínica urológica en Venezuela."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
            max_tokens=120,
        )
        return {"alert": completion.choices[0].message.content}
    except Exception as exc:
        raise HTTPException(status_code=503, detail=str(exc))
