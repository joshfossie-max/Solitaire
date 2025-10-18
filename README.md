[![CI](https://github.com/joshfossie-max/Solitaire/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/joshfossie-max/Solitaire/actions/workflows/ci.yml)

# Solitaire Engine

Deterministic PRNG (SplitMix64 + xorshift128+), Fisher–Yates shuffle, Klondike deal, and the first move (draw stock → waste) with tests.

## Dev

pnpm --filter @solitaire/engine run build
pnpm --filter @solitaire/engine test

## Repo

- Monorepo using pnpm workspaces
- Package: @solitaire/engine
- Tests: Vitest

