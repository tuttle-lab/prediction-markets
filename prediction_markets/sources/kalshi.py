import httpx
from datetime import datetime, timezone
from ..models import Market, Contract
from .base import MarketSource

BASE = "https://trading-api.kalshi.com/trade-api/v2"


class KalshiSource(MarketSource):
    name = "kalshi"

    async def fetch(self) -> list[Market]:
        markets = []
        cursor = None

        async with httpx.AsyncClient(timeout=15) as client:
            while True:
                params = {"limit": 200, "status": "open"}
                if cursor:
                    params["cursor"] = cursor

                r = await client.get(f"{BASE}/markets", params=params)
                r.raise_for_status()
                data = r.json()

                for m in data.get("markets", []):
                    yes = m.get("yes_ask", m.get("last_price", 0.5))
                    no  = m.get("no_ask",  1 - yes)
                    markets.append(Market(
                        id=m["ticker"],
                        title=m.get("title", m.get("ticker")),
                        category=m.get("category", "general").lower(),
                        source=self.name,
                        url=f"https://kalshi.com/markets/{m['ticker']}",
                        contract=Contract(
                            yes=round(yes / 100 if yes > 1 else yes, 4),
                            no=round(no / 100 if no > 1 else no, 4),
                            volume=m.get("volume"),
                        ),
                        closes_at=_parse_dt(m.get("close_time")),
                        raw=m,
                    ))

                cursor = data.get("cursor")
                if not cursor or not data.get("markets"):
                    break

        return markets


def _parse_dt(s: str | None) -> datetime | None:
    if not s:
        return None
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00"))
    except Exception:
        return None
