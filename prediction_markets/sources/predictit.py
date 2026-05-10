import httpx
from datetime import datetime
from ..models import Market, Contract
from ..category import infer_category
from .base import MarketSource

BASE = "https://www.predictit.org/api/marketdata/all/"


class PredictItSource(MarketSource):
    name = "predictit"

    async def _fetch(self, limit: int = 200) -> list[Market]:
        markets = []

        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get(BASE)
            r.raise_for_status()
            data = r.json()

            for m in data.get("markets", []):
                for contract in m.get("contracts", []):
                    yes = contract.get("lastTradePrice") or contract.get("bestBuyYesCost") or 0.5
                    no  = contract.get("bestBuyNoCost") or round(1 - yes, 4)
                    name = contract.get("name", m.get("name", ""))
                    markets.append(Market(
                        id=str(contract.get("id", m.get("id", ""))),
                        title=f"{m.get('name', '')} — {name}" if name != m.get("name") else name,
                        category=infer_category(f"{m.get('name', '')} {name}"),
                        source=self.name,
                        url=m.get("url", f"https://www.predictit.org/markets/detail/{m.get('id')}"),
                        contract=Contract(yes=round(yes, 4), no=round(no, 4), volume=None),
                        closes_at=_parse_dt(contract.get("dateEnd")),
                        raw={**m, "_contract": contract},
                    ))

        return markets


def _parse_dt(s: str | None) -> datetime | None:
    if not s:
        return None
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00"))
    except Exception:
        return None
