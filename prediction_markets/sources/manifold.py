import httpx
from datetime import datetime
from ..models import Market, Contract
from .base import MarketSource

BASE = "https://api.manifold.markets/v0"


class ManifoldSource(MarketSource):
    name = "manifold"

    async def fetch(self) -> list[Market]:
        markets = []
        before = None

        async with httpx.AsyncClient(timeout=15) as client:
            while True:
                params = {"limit": 500, "isResolved": "false", "outcomeType": "BINARY"}
                if before:
                    params["before"] = before

                r = await client.get(f"{BASE}/markets", params=params)
                r.raise_for_status()
                batch = r.json()
                if not batch:
                    break

                for m in batch:
                    prob = m.get("probability", 0.5)
                    markets.append(Market(
                        id=m["id"],
                        title=m.get("question", ""),
                        category=m.get("groupSlugs", ["general"])[0].replace("-", " ") if m.get("groupSlugs") else "general",
                        source=self.name,
                        url=m.get("url", f"https://manifold.markets/{m['id']}"),
                        contract=Contract(
                            yes=round(prob, 4),
                            no=round(1 - prob, 4),
                            volume=m.get("volume"),
                        ),
                        closes_at=_parse_ms(m.get("closeTime")),
                        raw=m,
                    ))

                if len(batch) < 500:
                    break
                before = batch[-1]["id"]

        return markets


def _parse_ms(ms: int | None) -> datetime | None:
    if not ms:
        return None
    try:
        return datetime.fromtimestamp(ms / 1000)
    except Exception:
        return None
