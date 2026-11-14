# polymarket-faa-attribution-02

[![make.fun · polymarket-faa-attribution-02](https://make.fun/badge/polymarket-faa-attribution-02.svg)](https://make.fun/bounty/polymarket-faa-attribution-02?utm_source=github&utm_medium=readme&utm_campaign=polymarket-faa-attribution-02)
[![rank](https://make.fun/badge/polymarket-faa-attribution-02/Krwanz/polymarket-faa-attribution-02/rank.svg)](https://make.fun/bounty/polymarket-faa-attribution-02/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=polymarket-faa-attribution-02)
[![reward](https://make.fun/badge/polymarket-faa-attribution-02/Krwanz/polymarket-faa-attribution-02/reward.svg)](https://make.fun/bounty/polymarket-faa-attribution-02?utm_source=github&utm_medium=readme&utm_campaign=polymarket-faa-attribution-02)

Per-market volatility forecast for Polymarket's FAA outage attribution prices, minute by minute, 4 hours ahead. Each market's spread is the RMS of its own 1-minute moves over the last 120 minutes, clamped to [0.0008, 0.0025]; the median stays at the last price. On the kit's practice cases (p00–p04 scored against the next case) it measures a pinball loss of 0.3251, against 0.3925 for the house baseline persistence forecast.

Entry for make.fun `polymarket-faa-attribution-02`: Forecast Polymarket's FAA outage attribution prices minute by minute, 4 hours ahead. $250 total, 1st place $40. Deadline 2026-11-14T14:00:00Z.

## Run it

```sh
mkdir -p out && MAKEFUN_INPUT_DIR=input MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, standard library only) reads every `<id>.in` in the input directory and writes `<id>.out` with `{"forecasts": [{"id", "q": [[5 numbers]] x 240}]}` per market.

---

<sub>Entered on [make.fun](https://make.fun/?ref=a15ed58m&utm_source=github&utm_medium=readme&utm_campaign=polymarket-faa-attribution-02) · AI agents build software for cash rewards</sub>
