import asyncio
import typer
from rich.console import Console
from rich.table import Table
from rich import box
from prediction_markets import KalshiSource, PolymarketSource, PredictItSource, ManifoldSource, calc_arb

app = Console()
cli = typer.Typer(help="Prediction market aggregator — compare odds, find arb.")

SOURCES = {
    "kalshi": KalshiSource(),
    "polymarket": PolymarketSource(),
    "predictit": PredictItSource(),
    "manifold": ManifoldSource(),
}


def _run(coro):
    return asyncio.get_event_loop().run_until_complete(coro)


@cli.command()
def markets(
    source: str = typer.Option(None, "--source", "-s", help="Filter by source"),
    search: str = typer.Option(None, "--search", "-q", help="Keyword search"),
    limit: int = typer.Option(50, "--limit", "-n"),
):
    """List open markets across all sources."""
    sources = [SOURCES[source]] if source else list(SOURCES.values())

    async def _fetch():
        results = []
        for src in sources:
            try:
                markets = await src.fetch()
                results.extend(markets)
            except Exception as e:
                app.print(f"[red]✗ {src.name}: {e}[/red]")
        return results

    all_markets = _run(_fetch())

    if search:
        q = search.lower()
        all_markets = [m for m in all_markets if q in m.title.lower() or q in m.category.lower()]

    all_markets = all_markets[:limit]

    table = Table(box=box.SIMPLE, show_header=True, header_style="bold")
    table.add_column("Source", style="cyan", width=12)
    table.add_column("Category", style="dim", width=12)
    table.add_column("Title", width=52)
    table.add_column("YES", justify="right", width=6)
    table.add_column("NO", justify="right", width=6)

    for m in all_markets:
        table.add_row(
            m.source,
            m.category[:12],
            m.title[:52],
            f"{m.contract.yes:.2f}",
            f"{m.contract.no:.2f}",
        )

    app.print(table)
    app.print(f"[dim]{len(all_markets)} markets shown[/dim]")


@cli.command()
def arb(
    a: str = typer.Option(..., "--a", help="Market ID or URL for market A"),
    b: str = typer.Option(..., "--b", help="Market ID or URL for market B"),
):
    """Check arb between two specific markets."""
    async def _fetch():
        all_markets = []
        for src in SOURCES.values():
            try:
                all_markets.extend(await src.fetch())
            except Exception:
                pass
        return all_markets

    all_markets = _run(_fetch())
    market_a = next((m for m in all_markets if m.id == a or a in m.url), None)
    market_b = next((m for m in all_markets if m.id == b or b in m.url), None)

    if not market_a:
        app.print(f"[red]Market not found: {a}[/red]"); raise typer.Exit(1)
    if not market_b:
        app.print(f"[red]Market not found: {b}[/red]"); raise typer.Exit(1)

    opp = calc_arb(market_a, market_b)
    if opp:
        app.print(f"\n[green bold]ARB OPPORTUNITY — {opp.profit_pct:.2f}% guaranteed profit[/green bold]")
        app.print(f"  Buy YES on [cyan]{opp.buy_yes_on}[/cyan] @ {opp.yes_price:.3f}")
        app.print(f"  Buy NO  on [cyan]{opp.buy_no_on}[/cyan] @ {opp.no_price:.3f}")
        app.print(f"  Total cost: {opp.yes_price + opp.no_price:.3f}  →  profit: {opp.profit_pct:.2f}%\n")
    else:
        app.print("[yellow]No arb opportunity found between these markets.[/yellow]")


@cli.command()
def sources():
    """Health check all market sources."""
    async def _check():
        for src in SOURCES.values():
            result = await src.health()
            if result["status"] == "ok":
                app.print(f"[green]✓[/green] {result['source']:12} {result['count']} markets")
            else:
                app.print(f"[red]✗[/red] {result['source']:12} {result['detail']}")

    _run(_check())


if __name__ == "__main__":
    cli()
