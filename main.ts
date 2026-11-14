// Polymarket FAA outage attribution — minute-by-minute 4h forecast.
// Node 22, standard library only, offline, deterministic.
//
// Idea (measured on the kit's practice cases p00-p04, scored against the
// next case's first 240 minutes, pinball loss in percentage points):
//   baseline persistence, sigma 0.0025 ............ 0.3925
//   this entry, per-market sigma from the last 120 minutes .. 0.3251
//
// Prices move in steps: most minutes they do not move at all, then a
// tick, now and then a jump. A single global spread is therefore too
// wide for quiet markets and too narrow for jumpy ones. For each market
// we measure how much it actually moved recently — the root-mean-square
// of its 1-minute price changes over the last 120 minutes — and use
// that as its own spread, clamped to [0.0008, 0.0025] price units per
// square-root minute so a market with no recent move still gets a
// floor and a market that just jumped does not get an absurd spread.
// The median stays at the last price: on the practice, adding a drift
// (recent 1h or 4h trend, shrunk) or pulling the median toward a
// recent mean both made the loss worse, so the median is the last
// price, unchanged. Quantiles are the normal quantiles around it,
// widening like sqrt(h), clamped to [0, 1], rounded to 6 decimals.
//
//   q_tau(h) = clamp(x + z_tau * sigma_market * sqrt(h), 0, 1)
//
// where x is the market's price at the checkpoint, z_tau is the
// standard normal quantile at tau in [0.05, 0.25, 0.5, 0.75, 0.95],
// and h = 1..240 is the minute after the checkpoint.
//
// Reads every <id>.in in the input directory ($MAKEFUN_INPUT_DIR, else
// /input) and writes <id>.out to the output directory
// ($MAKEFUN_OUTPUT_DIR, else /output):
//   {"forecasts": [{"id": <market id>, "q": [[5 numbers]] x 240}]}
// one forecast row per market, exactly once, 240 rows, 5 non-decreasing
// numbers in [0, 1] per row.

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const INPUT_DIR = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The quantile levels the contest scores, in the order each row lists them.
const LEVELS = [0.05, 0.25, 0.5, 0.75, 0.95];
// Standard normal quantiles at those levels, to 6 decimals.
const NORMAL_Z = [-1.644854, -0.67449, 0, 0.67449, 1.644854];

// How many recent minutes of price changes set a market's spread.
const SPREAD_WINDOW_MINUTES = 120;
// Spread floor and ceiling, price units per square-root minute.
const SPREAD_MIN = 0.0008;
const SPREAD_MAX = 0.0025;

interface MarketInput {
  id: string;
  prices: number[];
}

interface CaseInput {
  horizon_minutes: number;
  quantiles: number[];
  markets: MarketInput[];
}

// Clamp to [0, 1] and round to 6 decimals (0, never -0).
function toPrice(value: number): number {
  const clamped = Math.min(1, Math.max(0, value));
  return Math.round(clamped * 1e6) / 1e6 + 0;
}

// A market's own spread: RMS of its 1-minute changes over the recent
// window, clamped. Falls back to the floor when there is no history
// to measure (a market with one price, or one that never moved).
function marketSpread(prices: number[]): number {
  const window = prices.slice(-(SPREAD_WINDOW_MINUTES + 1));
  if (window.length < 2) return SPREAD_MIN;
  let sumSquares = 0;
  for (let i = 1; i < window.length; i++) {
    const move = window[i] - window[i - 1];
    sumSquares += move * move;
  }
  const rms = Math.sqrt(sumSquares / (window.length - 1));
  return Math.min(SPREAD_MAX, Math.max(SPREAD_MIN, rms));
}

// One market's forecast: 240 rows, five quantiles per row, around its
// last price, widening with sqrt(horizon minute). No drift term: on the
// practice, a shrunk 1h or 4h trend and a pull toward a recent mean both
// raised the pinball loss, so the median stays at the last price and
// only the spread adapts per market.
function forecastMarket(market: MarketInput, horizon: number): number[][] {
  if (market.prices.length === 0) {
    throw new Error(`market ${market.id} has no prices`);
  }
  const last = market.prices[market.prices.length - 1];
  const spread = marketSpread(market.prices);
  const rows: number[][] = [];
  for (let h = 1; h <= horizon; h++) {
    const width = spread * Math.sqrt(h);
    // Each row is non-decreasing because NORMAL_Z is sorted ascending
    // and toPrice is monotone; clamping at 0/1 can only flatten rows.
    rows.push(NORMAL_Z.map((z) => toPrice(last + z * width)));
  }
  return rows;
}

mkdirSync(OUTPUT_DIR, { recursive: true });
// Every case file, in name order, so two runs write the same bytes.
const inputFiles = readdirSync(INPUT_DIR).filter((f) => f.endsWith('.in')).sort();
for (const file of inputFiles) {
  const id = file.slice(0, -'.in'.length);
  const parsed = JSON.parse(readFileSync(join(INPUT_DIR, file), 'utf8')) as CaseInput;
  if (
    parsed.quantiles.length !== LEVELS.length ||
    parsed.quantiles.some((level, i) => level !== LEVELS[i])
  ) {
    throw new Error(`${file} asks for quantiles ${JSON.stringify(parsed.quantiles)}, not ${JSON.stringify(LEVELS)}`);
  }
  const forecasts = parsed.markets.map((m) => ({
    id: m.id,
    q: forecastMarket(m, parsed.horizon_minutes),
  }));
  writeFileSync(join(OUTPUT_DIR, `${id}.out`), `${JSON.stringify({ forecasts })}\n`);
}
