from prediction_markets.sources import KalshiSource, PolymarketSource, PredictItSource, ManifoldSource

# Add new exchanges here — nothing else needs to change.
SOURCES = [
    KalshiSource(),
    PolymarketSource(),
    PredictItSource(),
    ManifoldSource(),
]
