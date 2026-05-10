from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class Contract:
    yes: float              # 0.0–1.0
    no: float               # 0.0–1.0
    volume: float | None = None
    liquidity: float | None = None


@dataclass
class Market:
    id: str
    title: str
    category: str
    source: str             # "kalshi" | "polymarket" | "predictit" | "manifold"
    url: str
    contract: Contract
    closes_at: datetime | None = None
    raw: dict = field(default_factory=dict, repr=False)


@dataclass
class ArbOpportunity:
    title_a: str
    title_b: str
    source_a: str
    source_b: str
    buy_yes_on: str         # which source to buy YES
    buy_no_on: str          # which source to buy NO
    profit_pct: float       # guaranteed profit % (positive = real arb)
    url_a: str
    url_b: str
    yes_price: float
    no_price: float
