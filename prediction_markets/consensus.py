from collections import defaultdict
from .matching import _normalize, _tokens, _idf_weights, _weighted_jaccard
from .models import Market

PREDICTIT_FIXED_WEIGHT = 15_000


def _liquidity_weight(market: Market) -> float:
    liq = market.contract.liquidity
    if liq is not None and liq > 0:
        return float(liq)
    if market.source == "predictit":
        return PREDICTIT_FIXED_WEIGHT
    return 500.0


def build_consensus(
    kalshi_markets: list[Market],
    other_markets: list[Market],
    threshold: float = 0.25,
    min_shared_tokens: int = 3,
) -> list[dict]:
    """
    For each Kalshi market, find matching external markets and compute a
    liquidity-weighted consensus price using IDF-weighted Jaccard matching.
    Rare tokens (country names, candidate names) dominate the similarity score,
    preventing generic boilerplate from creating false cross-geography matches.
    """
    if not kalshi_markets or not other_markets:
        return []

    n_k = len(kalshi_markets)
    all_markets = kalshi_markets + other_markets
    normalized = [_normalize(m.title) for m in all_markets]
    token_sets = [_tokens(n) for n in normalized]

    # IDF over the entire corpus so rare tokens get high weight
    idf = _idf_weights(token_sets)

    # Inverted index over non-Kalshi markets only
    inverted: dict[str, list[int]] = defaultdict(list)
    for i in range(n_k, len(all_markets)):
        for t in token_sets[i]:
            inverted[t].append(i)

    rows = []

    for ki in range(n_k):
        k_tokens = token_sets[ki]

        shared_counts: dict[int, int] = defaultdict(int)
        for t in k_tokens:
            for oi in inverted.get(t, []):
                shared_counts[oi] += 1

        matches: list[tuple[Market, float]] = []
        for oi, shared in shared_counts.items():
            if shared < min_shared_tokens:
                continue
            other = all_markets[oi]
            if other.category != kalshi_markets[ki].category:
                continue
            sim = _weighted_jaccard(k_tokens, token_sets[oi], idf)
            if sim >= threshold:
                matches.append((other, sim))

        if not matches:
            continue

        kalshi = kalshi_markets[ki]

        total_weight = 0.0
        weighted_yes = 0.0
        for m, sim in matches:
            w = _liquidity_weight(m) * sim
            weighted_yes += m.contract.yes * w
            total_weight += w

        if total_weight == 0:
            continue

        consensus = round(weighted_yes / total_weight, 4)
        gap = round(kalshi.contract.yes - consensus, 4)
        avg_sim = round(sum(s for _, s in matches) / len(matches), 3)

        best_per_source: dict[str, tuple[Market, float]] = {}
        for m, sim in matches:
            if m.source not in best_per_source or sim > best_per_source[m.source][1]:
                best_per_source[m.source] = (m, sim)

        rows.append({
            "id": kalshi.id,
            "title": kalshi.title,
            "category": kalshi.category,
            "url": kalshi.url,
            "kalshi_yes": kalshi.contract.yes,
            "kalshi_no": kalshi.contract.no,
            "kalshi_volume": kalshi.contract.volume,
            "kalshi_liquidity": kalshi.contract.liquidity,
            "consensus": consensus,
            "gap": gap,
            "confidence": avg_sim,
            "sources": sorted(best_per_source.keys()),
            "matches": [
                {
                    "source": m.source,
                    "title": m.title,
                    "url": m.url,
                    "yes": m.contract.yes,
                    "no": m.contract.no,
                    "liquidity": m.contract.liquidity,
                    "volume": m.contract.volume,
                    "similarity": round(sim, 3),
                    "weight": round(_liquidity_weight(m)),
                }
                for m, sim in sorted(matches, key=lambda x: -_liquidity_weight(x[0]))
            ],
        })

    # Deduplicate: Kalshi sometimes emits multiple contracts with identical titles
    # (e.g. YES and NO legs of the same race). Keep the one with the highest confidence.
    seen: dict[str, dict] = {}
    for row in rows:
        key = row["title"].strip().lower()
        if key not in seen or row["confidence"] > seen[key]["confidence"]:
            seen[key] = row

    deduped = list(seen.values())
    deduped.sort(key=lambda r: -abs(r["gap"]))
    return deduped
