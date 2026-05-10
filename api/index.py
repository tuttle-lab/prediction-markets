import asyncio
from dataclasses import asdict
from datetime import datetime, timezone
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from prediction_markets import calc_arb
from .deps import SOURCES

app = FastAPI(
    title="Prediction Markets API",
    version="0.1.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/ping")
def ping():
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}


@app.get("/api/sources")
async def sources_health():
    results = await asyncio.gather(*[s.health() for s in SOURCES])
    return {"sources": results}


@app.get("/api/markets")
async def markets(
    source:   str | None = Query(None, description="Filter by source name"),
    category: str | None = Query(None, description="Filter by category"),
    search:   str | None = Query(None, description="Keyword search on title"),
    limit:    int        = Query(200,  le=1000),
):
    active = [s for s in SOURCES if not source or s.name == source]
    results = await asyncio.gather(*[s.fetch() for s in active], return_exceptions=True)

    all_markets = []
    for batch in results:
        if isinstance(batch, Exception):
            continue
        all_markets.extend(batch)

    if category:
        all_markets = [m for m in all_markets if category.lower() in m.category.lower()]
    if search:
        q = search.lower()
        all_markets = [m for m in all_markets if q in m.title.lower()]

    all_markets = all_markets[:limit]

    def _serialise(m):
        d = asdict(m)
        d.pop("raw", None)
        if d.get("closes_at"):
            d["closes_at"] = d["closes_at"].isoformat() if isinstance(d["closes_at"], datetime) else d["closes_at"]
        return d

    return {"markets": [_serialise(m) for m in all_markets], "count": len(all_markets)}


@app.get("/api/arb")
async def arb(
    a: str = Query(..., description="Market ID for market A"),
    b: str = Query(..., description="Market ID for market B"),
):
    all_markets = []
    results = await asyncio.gather(*[s.fetch() for s in SOURCES], return_exceptions=True)
    for batch in results:
        if not isinstance(batch, Exception):
            all_markets.extend(batch)

    market_a = next((m for m in all_markets if m.id == a or a in m.url), None)
    market_b = next((m for m in all_markets if m.id == b or b in m.url), None)

    if not market_a:
        return {"error": f"Market not found: {a}"}
    if not market_b:
        return {"error": f"Market not found: {b}"}

    opp = calc_arb(market_a, market_b)
    return {"opportunity": asdict(opp) if opp else None}
