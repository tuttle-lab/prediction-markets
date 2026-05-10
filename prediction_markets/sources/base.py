from abc import ABC, abstractmethod
from ..models import Market


class MarketSource(ABC):
    """
    Add a new exchange by subclassing this and appending to SOURCES in api/deps.py.
    """

    @property
    @abstractmethod
    def name(self) -> str: ...

    @abstractmethod
    async def fetch(self) -> list[Market]: ...

    async def health(self) -> dict:
        try:
            markets = await self.fetch()
            return {"source": self.name, "status": "ok", "count": len(markets)}
        except Exception as e:
            return {"source": self.name, "status": "error", "detail": str(e)}
