import httpx
from datetime import datetime
from ..models import Market, Contract
from ..category import infer_category
from .base import MarketSource

BASE = "https://gamma-api.polymarket.com"


class PolymarketSource(MarketSource):
    name = "polymarket"

    async def _fetch(self, limit: int = 200) -> list[Market]:
        markets = []
        offset = 0
        page_size = min(100, limit)

        async with httpx.AsyncClient(timeout=15) as client:
            while True:
                r = await client.get(
                    f"{BASE}/markets",
                    params={"active": "true", "closed": "false", "limit": page_size, "offset": offset},
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
                        category=infer_category(m.get("question") or m.get("title", "")),
                        source=self.name,
                        url=_market_url(m),
                        contract=Contract(
                            yes=round(yes, 4),
                            no=round(no, 4),
                            volume=m.get("volumeNum"),
                            liquidity=m.get("liquidityNum"),
                        ),
                        closes_at=_parse_dt(m.get("endDate")),
                        raw=m,
                    ))

                if len(batch) < page_size or len(markets) >= limit:
                    break
                offset += page_size

        return markets[:limit]


def _market_url(m: dict) -> str:
    slug = m.get("slug") or str(m.get("id", ""))
    events = m.get("events") or []
    if events and events[0].get("ticker"):
        return f"https://polymarket.com/event/{events[0]['ticker']}/{slug}"
    return f"https://polymarket.com/event/{slug}"


def _parse_dt(s: str | None) -> datetime | None:
    if not s:
        return None
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00"))
    except Exception:
        return None
