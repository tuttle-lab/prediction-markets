import httpx
from datetime import datetime
from ..models import Market, Contract
from ..category import infer_category
from .base import MarketSource

BASE = "https://api.manifold.markets/v0"


class ManifoldSource(MarketSource):
    name = "manifold"

    async def _fetch(self, limit: int = 200) -> list[Market]:
        markets = []
        before = None

        async with httpx.AsyncClient(timeout=15) as client:
            while True:
                # isResolved/outcomeType no longer accepted as query params — filter client-side
                params: dict = {"limit": 500, "sort": "last-bet-time"}
                if before:
                    params["before"] = before

                r = await client.get(f"{BASE}/markets", params=params)
                r.raise_for_status()
                batch = r.json()
                if not batch:
                    break

                for m in batch:
                    if m.get("outcomeType") != "BINARY" or m.get("isResolved"):
                        continue
                    prob = m.get("probability", 0.5)
                    markets.append(Market(
                        id=m["id"],
                        title=m.get("question", ""),
                        category=infer_category(m.get("question", "")),
                        source=self.name,
                        url=m.get("url", f"https://manifold.markets/{m['slug']}"),
                        contract=Contract(
                            yes=round(prob, 4),
                            no=round(1 - prob, 4),
                            volume=m.get("volume"),
                            liquidity=float(m.get("uniqueBettorCount") or 1) * 200,
                        ),
                        closes_at=_parse_ms(m.get("closeTime")),
                        raw=m,
                    ))

                if len(batch) < 500 or len(markets) >= limit:
                    break
                before = batch[-1]["id"]

        return markets[:limit]


def _parse_ms(ms: int | None) -> datetime | None:
    if not ms:
        return None
    try:
        return datetime.fromtimestamp(ms / 1000)
    except Exception:
        return None
