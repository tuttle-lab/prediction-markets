import math
import re
from collections import defaultdict
from .models import Market

STOPWORDS = {
    'will', 'the', 'a', 'an', 'by', 'in', 'on', 'at', 'to', 'for', 'of',
    'with', 'before', 'after', 'be', 'is', 'are', 'was', 'were', 'have',
    'has', 'had', 'do', 'does', 'did', 'not', 'no', 'yes', 'or', 'and',
    'it', 'its', 'this', 'that', 'than', 'then', 'when', 'how', 'what',
    'who', 'which', 'if', 'as', 'from', 'into', 'during', 'win', 'wins',
    'lose', 'loses', 'more', 'less', 'over', 'under', 'any', 'all', 'most',
    'many', '2024', '2025', '2026', '2027', 'market', 'contract', 'price',
    'next', 'set',  # Kalshi title boilerplate
}

_ALIASES = [
    (r'\bdonald\s+trump\b', 'trump'),
    (r'\bkamala\b', 'harris'),
    (r'\bus\b|\bu\.s\.\b|\bunited\s+states\b', 'us'),
    (r'\bgop\b|\brepublicans?\b', 'republican'),
    (r'\bdems?\b|\bdemocrats?\b', 'democrat'),
    (r'\bfederal\s+reserve\b', 'fed'),
    (r'\bbitcoin\b|\bbtc\b', 'bitcoin'),
    (r'\bethereum\b|\beth\b', 'ethereum'),
]


def _normalize(title: str) -> str:
    t = title.lower()
    for pattern, replacement in _ALIASES:
        t = re.sub(pattern, replacement, t)
    t = re.sub(r"[^\w\s]", " ", t)
    t = re.sub(r"\s+", " ", t).strip()
    return t


def _tokens(normalized: str) -> set[str]:
    return {w for w in normalized.split() if len(w) > 2 and w not in STOPWORDS}


def _idf_weights(token_sets: list[set[str]]) -> dict[str, float]:
    """Smoothed IDF: log((N+1)/(df+1)) + 1  over all token sets."""
    N = len(token_sets)
    if N == 0:
        return {}
    df: dict[str, int] = {}
    for ts in token_sets:
        for t in ts:
            df[t] = df.get(t, 0) + 1
    return {t: math.log((N + 1) / (n + 1)) + 1.0 for t, n in df.items()}


def _weighted_jaccard(ta: set[str], tb: set[str], idf: dict[str, float]) -> float:
    """IDF-weighted Jaccard: rare shared tokens (country names, people) score high;
    common boilerplate (senate, election) scores low regardless of presence."""
    if not ta or not tb:
        return 0.0
    inter = ta & tb
    union = ta | tb
    w_inter = sum(idf.get(t, 1.0) for t in inter)
    w_union = sum(idf.get(t, 1.0) for t in union)
    return w_inter / w_union if w_union > 0 else 0.0


def find_matches(markets: list[Market], threshold: float = 0.25) -> list[dict]:
    """
    Group markets from different sources that likely cover the same event.
    Uses IDF-weighted Jaccard so rare entity tokens (names, countries) dominate
    over generic political boilerplate.
    """
    if not markets:
        return []

    normalized = [_normalize(m.title) for m in markets]
    token_sets = [_tokens(n) for n in normalized]
    idf = _idf_weights(token_sets)

    inverted: dict[str, list[int]] = defaultdict(list)
    for i, tokens in enumerate(token_sets):
        for t in tokens:
            inverted[t].append(i)

    pair_shared: dict[tuple[int, int], int] = defaultdict(int)
    for posting in inverted.values():
        if len(posting) > 50:
            continue
        for i in range(len(posting)):
            for j in range(i + 1, len(posting)):
                key = (min(posting[i], posting[j]), max(posting[i], posting[j]))
                pair_shared[key] += 1

    edges: list[tuple[int, int]] = []
    for (a, b), shared in pair_shared.items():
        if shared < 3:
            continue
        if markets[a].source == markets[b].source:
            continue
        if markets[a].category != markets[b].category:
            continue
        score = _weighted_jaccard(token_sets[a], token_sets[b], idf)
        if score >= threshold:
            edges.append((a, b))

    parent = list(range(len(markets)))

    def find(x: int) -> int:
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    def union(x: int, y: int) -> None:
        parent[find(x)] = find(y)

    for a, b in edges:
        union(a, b)

    groups: dict[int, list[int]] = defaultdict(list)
    for i in range(len(markets)):
        groups[find(i)].append(i)

    result = []
    for indices in groups.values():
        if len(indices) < 2:
            continue
        cluster_markets = [markets[i] for i in indices]
        sources = {m.source for m in cluster_markets}
        if len(sources) < 2:
            continue

        pairs = [
            (token_sets[indices[a]], token_sets[indices[b]])
            for a in range(len(indices))
            for b in range(a + 1, len(indices))
        ]
        avg_sim = (
            sum(_weighted_jaccard(ta, tb, idf) for ta, tb in pairs) / len(pairs)
            if pairs else 1.0
        )

        result.append({
            "confidence": round(avg_sim, 3),
            "sources": sorted(sources),
            "markets": [
                {
                    "id": m.id,
                    "title": m.title,
                    "source": m.source,
                    "category": m.category,
                    "url": m.url,
                    "yes": m.contract.yes,
                    "no": m.contract.no,
                    "liquidity": m.contract.liquidity,
                }
                for m in cluster_markets
            ],
        })

    result.sort(key=lambda c: -len(c["sources"]))
    return result
