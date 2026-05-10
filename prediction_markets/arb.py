from .models import Market, ArbOpportunity


def calc_arb(a: Market, b: Market) -> ArbOpportunity | None:
    """
    Check if two markets on the same event offer an arb.
    Buy YES on whichever platform is cheaper, NO on the other.
    If total cost < 1.0 the spread is guaranteed profit.
    """
    yes_a, no_a = a.contract.yes, a.contract.no
    yes_b, no_b = b.contract.yes, b.contract.no

    # Option 1: YES on A, NO on B
    cost1 = yes_a + no_b
    # Option 2: YES on B, NO on A
    cost2 = yes_b + no_a

    best_cost = min(cost1, cost2)
    if best_cost >= 1.0:
        return None

    profit_pct = round((1 - best_cost) * 100, 2)

    if cost1 <= cost2:
        return ArbOpportunity(
            title_a=a.title, title_b=b.title,
            source_a=a.source, source_b=b.source,
            buy_yes_on=a.source, buy_no_on=b.source,
            profit_pct=profit_pct,
            url_a=a.url, url_b=b.url,
            yes_price=yes_a, no_price=no_b,
        )
    else:
        return ArbOpportunity(
            title_a=a.title, title_b=b.title,
            source_a=a.source, source_b=b.source,
            buy_yes_on=b.source, buy_no_on=a.source,
            profit_pct=profit_pct,
            url_a=a.url, url_b=b.url,
            yes_price=yes_b, no_price=no_a,
        )
