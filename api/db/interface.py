from abc import ABC, abstractmethod
from typing import Any


class DatabaseClient(ABC):
    """
    Swap implementations by returning a different subclass from api/deps.py.
    All methods are async; filters use {column: value} equality by default.
    """

    @abstractmethod
    async def select(
        self,
        table: str,
        *,
        columns: str = "*",
        filters: dict[str, Any] | None = None,
        limit: int | None = None,
    ) -> list[dict]:
        """Fetch rows. Returns [] on no match."""

    @abstractmethod
    async def insert(
        self,
        table: str,
        data: dict | list[dict],
    ) -> list[dict]:
        """Insert one or many rows. Returns inserted rows."""

    @abstractmethod
    async def update(
        self,
        table: str,
        data: dict,
        *,
        filters: dict[str, Any],
    ) -> list[dict]:
        """Update rows matching filters. Returns updated rows."""

    @abstractmethod
    async def delete(
        self,
        table: str,
        *,
        filters: dict[str, Any],
    ) -> list[dict]:
        """Delete rows matching filters. Returns deleted rows."""

    @abstractmethod
    async def rpc(
        self,
        function_name: str,
        params: dict | None = None,
    ) -> Any:
        """Call a database function / stored procedure."""
