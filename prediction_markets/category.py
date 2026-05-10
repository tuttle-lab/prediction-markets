import re

# Ordered rules — first match wins
_RULES: list[tuple[str, list[str]]] = [
    ("crypto", [
        r"\b(bitcoin|btc|ethereum|eth|crypto|defi|nft|solana|sol|xrp|ripple|"
        r"binance|bnb|coinbase|blockchain|stablecoin|altcoin|dogecoin|doge)\b",
    ]),
    ("politics", [
        r"\b(elect|president|congress|senate|house\s+rep|governor|mayor|"
        r"democrat|republican|gop|ballot|vote|voting|legislation|bill|law|"
        r"supreme\s+court|white\s+house|cabinet|minister|parliament|chancellor|"
        r"trump|biden|harris|desantis|newsom|vance|aoc|ocasio|pelosi|"
        r"nato|un\s+|united\s+nations|sanction|tariff|geopolit|treaty)\b",
        r"\b(2026|2028|2030)\s+.*(elect|primary|nominat|race|runoff)\b",
        r"\b(nominat|impeach|resign|approv\s+rating|poll\s+lead)\b",
    ]),
    ("sports", [
        r"\b(nba|nfl|mlb|nhl|nascar|mls|nwsl|wnba|ncaa|ufc|f1|formula\s*1|"
        r"premier\s+league|epl|la\s+liga|bundesliga|serie\s+a|champions\s+league|"
        r"world\s+cup|super\s+bowl|world\s+series|stanley\s+cup|nba\s+finals|"
        r"march\s+madness|masters|wimbledon|us\s+open|french\s+open|"
        r"olympic|olympics|fifa|uefa)\b",
        r"\b(touchdown|home\s*run|hat\s*trick|strikeout|quarterback|pitcher|"
        r"rebounds|assists|yards|innings|sets|wicket|goal|penalty\s+kick)\b",
        r"\b\d\+\s*(hits?|runs?|rbis?|points?|assists?|rebounds?|yards?|"
        r"goals?|strikeouts?|home\s*runs?|touchdowns?)\b",
        r"\b(win|beat|defeat)\s+the\s+\w+s?\s+(game|match|series)\b",
        r"\b(playoffs?|finals?|championship|tournament|draft|trade|signing)\b",
    ]),
    ("economics", [
        r"\b(gdp|inflation|cpi|pce|unemployment|job\s+report|payroll|"
        r"federal\s+reserve|fed\s+rate|interest\s+rate|rate\s+cut|rate\s+hike|"
        r"recession|debt\s+ceiling|deficit|budget|fiscal|monetary|"
        r"s&p|dow\s+jones|nasdaq|stock\s+market|ipo|earnings|"
        r"oil\s+price|crude|brent|gold\s+price|dollar\s+index|dxy)\b",
    ]),
    ("science", [
        r"\b(nasa|spacex|rocket|mars|moon|asteroid|satellite|iss|"
        r"climate|temperature|hurricane|earthquake|volcano|flood|wildfire|"
        r"vaccine|fda|drug\s+approv|clinical\s+trial|cancer|covid|pandemic|"
        r"ai\s+model|gpt|llm|artificial\s+intelligence)\b",
    ]),
    ("entertainment", [
        r"\b(oscar|emmy|grammy|golden\s+globe|academy\s+award|"
        r"box\s+office|album|song|chart|billboard|spotify|"
        r"movie|film|tv\s+show|series|season|episode|streaming|"
        r"celebrity|kardashian|taylor\s+swift|beyonce|rihanna|drake)\b",
    ]),
]

# Kalshi event_ticker prefixes → category (faster path for Kalshi markets)
_TICKER_PREFIXES: list[tuple[str, str]] = [
    ("KXMLB",   "sports"),   # MLB
    ("KXNBA",   "sports"),   # NBA
    ("KXNFL",   "sports"),   # NFL
    ("KXNHL",   "sports"),   # NHL
    ("KXEPL",   "sports"),   # English Premier League
    ("KXUCL",   "sports"),   # UEFA Champions League
    ("KXNASCAR","sports"),
    ("KXSOCCER","sports"),
    ("KXTENNIS","sports"),
    ("KXGOLF",  "sports"),
    ("KXMMA",   "sports"),
    ("KXUFC",   "sports"),
    ("KXUS",    "politics"), # US elections / political
    ("KXPOTUS", "politics"),
    ("KXBTC",   "crypto"),
    ("KXETH",   "crypto"),
    ("KXCRYPTO","crypto"),
    ("KXFED",   "economics"),
    ("KXCPI",   "economics"),
    ("KXGDP",   "economics"),
]


def infer_category(title: str, event_ticker: str = "") -> str:
    """Return a normalised category slug for a market title."""
    # Fast path: Kalshi event_ticker prefix is authoritative
    if event_ticker:
        upper = event_ticker.upper()
        for prefix, cat in _TICKER_PREFIXES:
            if upper.startswith(prefix):
                return cat

    t = title.lower()
    for category, patterns in _RULES:
        for pattern in patterns:
            if re.search(pattern, t):
                return category

    return "other"
