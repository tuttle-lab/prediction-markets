from typing import Any
from supabase import create_client, Client
from .interface import DatabaseClient


class SupabaseClient(DatabaseClient):
    def __init__(self, url: str, key: str) -> None:
        self._client: Client = create_client(url, key)

    def _apply_filters(self, query, filters: dict[str, Any]):
        for column, value in filters.items():
            query = query.eq(column, value)
        return query

    async def select(
        self,
        table: str,
        *,
        columns: str = "*",
        filters: dict[str, Any] | None = None,
        limit: int | None = None,
    ) -> list[dict]:
        query = self._client.table(table).select(columns)
        if filters:
            query = self._apply_filters(query, filters)
        if limit:
            query = query.limit(limit)
        return query.execute().data

    async def insert(
        self,
        table: str,
        data: dict | list[dict],
    ) -> list[dict]:
        return self._client.table(table).insert(data).execute().data

    async def update(
        self,
        table: str,
        data: dict,
        *,
        filters: dict[str, Any],
    ) -> list[dict]:
        query = self._client.table(table).update(data)
        query = self._apply_filters(query, filters)
        return query.execute().data

    async def delete(
        self,
        table: str,
        *,
        filters: dict[str, Any],
    ) -> list[dict]:
        query = self._client.table(table).delete()
        query = self._apply_filters(query, filters)
        return query.execute().data

    async def rpc(
        self,
        function_name: str,
        params: dict | None = None,
    ) -> Any:
        return self._client.rpc(function_name, params or {}).execute().data
