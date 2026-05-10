import asyncio
import httpx
from datetime import datetime
from ..models import Market, Contract
from ..category import infer_category
from .base import MarketSource

BASE = "https://external-api.kalshi.com/trade-api/v2"

SKIP_CATEGORIES = {"Sports"}


class KalshiSource(MarketSource):
    name = "kalshi"

    async def _fetch(self, limit: int = 200) -> list[Market]:
        series_tickers = await self._fetch_non_sports_series()
        markets: list[Market] = []

        async with httpx.AsyncClient(timeout=15) as client:
            for series_ticker in series_tickers:
                if len(markets) >= limit:
                    break
                batch = await self._markets_for_series(client, series_ticker, limit - len(markets))
                markets.extend(batch)

        return markets[:limit]

    async def _fetch_non_sports_series(self) -> list[str]:
        """Return series_tickers for all open non-sports Kalshi events."""
        tickers: list[str] = []
        cursor = None

        async with httpx.AsyncClient(timeout=15) as client:
            while True:
                params: dict = {"limit": 100, "status": "open"}
                if cursor:
                    params["cursor"] = cursor

                r = await client.get(f"{BASE}/events", params=params)
                if r.status_code == 429:
                    break  # hit rate limit — use what we have
                r.raise_for_status()
                data = r.json()

                for event in data.get("events", []):
                    if event.get("category") in SKIP_CATEGORIES:
                        continue
                    st = event.get("series_ticker")
                    if st:
                        tickers.append(st)

                cursor = data.get("cursor")
                if not cursor or not data.get("events"):
                    break

        return tickers

    async def _markets_for_series(
        self, client: httpx.AsyncClient, series_ticker: str, limit: int
    ) -> list[Market]:
        markets: list[Market] = []
        cursor = None

        while True:
            params: dict = {
                "limit": min(100, limit - len(markets)),
                "status": "open",
                "mve_filter": "exclude",
                "series_ticker": series_ticker,
            }
            if cursor:
                params["cursor"] = cursor

            try:
                r = await client.get(f"{BASE}/markets", params=params)
                r.raise_for_status()
                data = r.json()
            except Exception:
                break

            for m in data.get("markets", []):
                yes = _price(m, "yes_ask_dollars", "last_price_dollars")
                no  = _price(m, "no_ask_dollars", None)
                if yes is None:
                    continue
                if no is None or no >= 0.95:
                    no = round(1 - yes, 4)

                markets.append(Market(
                    id=m["ticker"],
                    title=m.get("title") or m["ticker"],
                    category=infer_category(m.get("title") or "", m.get("event_ticker", "")),
                    source=self.name,
                    url=f"https://kalshi.com/markets/{m['ticker']}",
                    contract=Contract(
                            yes=yes, no=no,
                            volume=m.get("volume_fp"),
                            liquidity=m.get("open_interest_fp"),
                        ),
                    closes_at=_parse_dt(m.get("close_time")),
                    raw=m,
                ))

            cursor = data.get("cursor")
            if not cursor or not data.get("markets") or len(markets) >= limit:
                break

        return markets


def _price(m: dict, primary: str, fallback: str | None) -> float | None:
    val = m.get(primary)
    if val is None and fallback:
        val = m.get(fallback)
    if val is None:
        return None
    val = float(val)
    return round(val, 4) if val > 0 else None


def _parse_dt(s: str | None) -> datetime | None:
    if not s:
        return None
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00"))
    except Exception:
        return None
