import httpx
from datetime import datetime
from ..models import Market, Contract
from .base import MarketSource

BASE = "https://gamma-api.polymarket.com"


class PolymarketSource(MarketSource):
    name = "polymarket"

    async def fetch(self) -> list[Market]:
        markets = []
        offset = 0
        limit = 100

        async with httpx.AsyncClient(timeout=15) as client:
            while True:
                r = await client.get(
                    f"{BASE}/markets",
                    params={"active": "true", "closed": "false", "limit": limit, "offset": offset},
                )
                r.raise_for_status()
                batch = r.json()
                if not batch:
                    break

                for m in batch:
                    outcomes = m.get("outcomes", "[]")
                    prices   = m.get("outcomePrices", "[]")
                    if isinstance(outcomes, str):
                        import json
                        outcomes = json.loads(outcomes)
                        prices   = json.loads(prices)

                    yes, no = 0.5, 0.5
                    if len(outcomes) == 2 and len(prices) == 2:
                        for i, o in enumerate(outcomes):
                            if o.lower() == "yes":
                                yes = float(prices[i])
                            elif o.lower() == "no":
                                no = float(prices[i])

                    markets.append(Market(
                        id=str(m.get("id", m.get("slug", ""))),
                        title=m.get("question", m.get("title", "")),
                        category=m.get("category", "general").lower(),
                        source=self.name,
                        url=f"https://polymarket.com/event/{m.get('slug', m.get('id', ''))}",
                        contract=Contract(yes=round(yes, 4), no=round(no, 4), volume=m.get("volume")),
                        closes_at=_parse_dt(m.get("endDate")),
                        raw=m,
                    ))

                if len(batch) < limit:
                    break
                offset += limit

        return markets


def _parse_dt(s: str | None) -> datetime | None:
    if not s:
        return None
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00"))
    except Exception:
        return None
