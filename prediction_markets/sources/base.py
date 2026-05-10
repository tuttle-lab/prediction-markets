import time
from abc import ABC, abstractmethod
from ..models import Market

_TTL = 300  # seconds — data changes slowly, avoid hammering external APIs


class MarketSource(ABC):
    """
    Add a new exchange by subclassing this and appending to SOURCES in api/deps.py.
    """

    def __init__(self) -> None:
        self._cache: list[Market] = []
        self._cached_at: float = 0.0

    @property
    @abstractmethod
    def name(self) -> str: ...

    @abstractmethod
    async def _fetch(self, limit: int = 200) -> list[Market]: ...

    async def fetch(self, limit: int = 200) -> list[Market]:
        now = time.monotonic()
        cache_fresh = self._cache and (now - self._cached_at) < _TTL
        if cache_fresh and len(self._cache) >= limit:
            return self._cache[:limit]
        markets = await self._fetch(limit=limit)
        self._cache = markets
        self._cached_at = now
        return markets

    async def health(self) -> dict:
        try:
            markets = await self.fetch(limit=20)
            return {"source": self.name, "status": "ok", "count": len(markets)}
        except Exception as e:
            return {"source": self.name, "status": "error", "detail": str(e)}
