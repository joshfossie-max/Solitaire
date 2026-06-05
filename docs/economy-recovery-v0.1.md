# Solitaire Economy Recovery v0.1

## Purpose

This document preserves the recovered economy work from earlier Solitaire project conversations and prototypes.

The goal is to prevent drift as the project moves from playable prototype features into money-related systems such as entry tiers, payouts, remaining value, marketplace listings, escrow, wallet behavior, and player-facing receipts.

This document should be treated as a recovery/reference note, not a final legal, financial, or regulatory specification.

---

## Working Principle

Money-related logic should not move from idea to code until we can explain the circuit in plain English and balance it on paper.

The current approach is:

1. Understand the model.
2. Document the model.
3. Identify confirmed rules versus open questions.
4. Code only the confirmed or intentionally chosen v0.1 pieces.
5. Test the behavior.
6. Commit with a clear message.

---

## Recovered Economy Layers

The recovered material points to three related but distinct economy layers:

1. **Contest / payout backbone**
2. **Remaining-value / taper layer**
3. **Marketplace pricing and escrow layer**

These layers are connected, but they should not be treated as the same thing.

---

## 1. Contest / Payout Backbone

### Confirmed / strongly recovered

A later, more mature economy model used:

* Entry tiers: `$1`, `$2`, and likely later `$5`
* Win payout multiple: `1.70 × entry`
* Player break-even win rate: approximately `58.82%`
* Reference modeled win rate: approximately `55%`
* Bonus-pool skim: `1%`, funded from house-side revenue rather than added as an extra player fee

### Core formulas

```text
payout = entry × 1.70
```

```text
break_even_win_rate = entry / payout
break_even_win_rate = 1 / 1.70
break_even_win_rate = 58.82%
```

At a modeled 55% win rate:

```text
expected_player_return = 0.55 × payout
player_EV = expected_player_return - entry
```

For a `$1` game:

```text
payout = $1.70
expected_player_return = 0.55 × $1.70 = $0.935
player_EV = $0.935 - $1.00 = -$0.065
player_EV% = -6.5%
```

If the bonus skim is 1% of entry and funded from house-side revenue:

```text
gross_house_margin = entry - expected_player_return
bonus_pool_contribution = entry × 0.01
house_net = gross_house_margin - bonus_pool_contribution
```

For a `$1` game at 55% WR:

```text
gross_house_margin = $0.065
bonus_pool_contribution = $0.010
house_net = $0.055
```

For a `$2` game at 55% WR:

```text
payout = $3.40
expected_player_return = 0.55 × $3.40 = $1.87
player_EV = -$0.13
bonus_pool_contribution = $0.02
house_net = $0.11
```

### Current interpretation

This later `1.70×` model should be treated as the serious economy foundation unless intentionally reopened.

It is cleaner than the earlier clickable marketplace prototype because it directly models entry, payout, break-even win rate, player EV, house EV, and bonus-pool skim.

---

## 2. Remaining-Value / Taper Layer

### Confirmed / strongly recovered

The project included a remaining-value concept for in-progress games.

The original idea was that a fresh game begins with a defined value, and that value declines as play consumes the opportunity.

This remaining value supported the idea that a player could:

* start a game;
* play some amount;
* decide not to keep risking the full game;
* list the in-progress board;
* allow another player to buy the remaining opportunity.

### Recovered likely decay rate

A value near `0.35` was recovered from memory and later confirmed in the older clickable marketplace prototype code.

In that prototype:

```text
Single Draw draw cost = 0.0035 dollars
```

For a `$1` game:

```text
$0.0035 = 0.35 cents
```

This matches the remembered “about a third of a cent” value.

### Important distinction

The older clickable prototype used a **linear draw-cost model**:

```text
remaining_value = entry_fee - (draw_steps × draw_cost)
```

That is different from a later conceptual reconstruction that suggested percentage/exponential decay:

```text
remaining_value = entry × (1 - 0.0035)^decay_steps
```

The linear formula is confirmed in the old clickable prototype. The exponential formula should be treated as a later reconstruction, not a confirmed original artifact rule.

### Confirmed trigger in the old clickable prototype

In the older clickable prototype:

* Only stock draws consumed value.
* Tableau moves and flips were free.
* Recycling the stock was free.
* Draw 1 counted as one draw step.
* Draw 3 counted as three draw steps.
* Draw 3 used a slightly lower per-card cost.

Old clickable prototype draw costs:

```text
Single Draw:
DRAW_COST = $0.0035 per stock card

3-Card:
DRAW_COST = $0.0032 per stock card
One Draw 3 click = 3 × $0.0032 = $0.0096
```

### Current interpretation

For the current project, this is an important design anchor:

```text
Value decays when stock-card information is consumed.
```

The old prototype supports treating Draw 3 as three value-consumption steps, not one.

---

## 3. Marketplace Pricing and Escrow Layer

### Original/simple resale model

The earliest resale model appears to have been:

```text
fresh_game_value = entry
remaining_value declines as play consumes value
seller can sell/list at current or prorated remaining value
buyer purchases the current remaining opportunity
```

So the original version was close to:

```text
listing_reference = current_remaining_value
```

### Later marketplace model

A later marketplace model evolved toward seller-set pricing inside EV-based guardrails.

Recovered marketplace rules included:

* Seller-set listing price
* System-calculated reference EV
* Allowed band: `reference_EV × 0.5` to `reference_EV × 1.5`
* Hard floor: `10% of entry`
* Hard ceiling: `120% of payout potential`
* Tick size: `$0.05`
* Coarse EV hint
* Anonymized seller
* Buyer purchase flow
* Escrow settlement

### Recovered marketplace guardrail formula

```text
ev_band_min = reference_EV × 0.5
ev_band_max = reference_EV × 1.5

hard_floor = entry × 0.10
hard_ceiling = payout_potential × 1.20

allowed_min_price = max(ev_band_min, hard_floor)
allowed_max_price = min(ev_band_max, hard_ceiling)
```

Listing price must satisfy:

```text
allowed_min_price ≤ seller_listing_price ≤ allowed_max_price
```

Listing price uses:

```text
tick_size = $0.05
```

Recommended rounding rule:

```text
min allowed price: round/ceil up to next $0.05
max allowed price: round/floor down to previous $0.05
```

This avoids accidentally allowing a listing outside the guardrails.

### Current interpretation

The later marketplace model did not throw away remaining value. It appears to have changed remaining value from a direct price-setting mechanism into an input or constraint for system-calculated reference value.

The best current interpretation is:

```text
Remaining value helps inform or constrain reference EV.
Reference EV creates the allowed listing band.
Seller chooses price inside the band.
Buyer sees a coarse EV hint, not exact hidden math.
Escrow protects the transfer.
```

---

## 4. Old Clickable Marketplace Prototype

A recovered React artifact titled approximately:

```text
Solitaire Marketplace — Clickable V1 / V1.2
```

included:

* stake selector: `$1 / $2 / $5`
* mode selector: Single Draw / 3-Card
* wallet stub
* available / held / pending balances
* cash-out stub
* bonus pool
* listing flow
* zero-draw listing confirmation
* relist simulation
* telemetry log

### Confirmed constants from the old clickable prototype

Single Draw:

```text
ENTRY_FEE = $1.00 base
DRAW_COST = $0.0035
PAYOUT_WIN = $2.38
BONUS_NEAR_WIN = $0.12
NEAR_WIN_RATE = 0.22
MARKET_FILL_TARGET = 0.95
HOUSE_CUT_ENTRY = 0.05
HOUSE_CUT_RESALE = 0.05
RESALE_PRESERVE = 0.985
RESALE_DISCOUNT_RATE_MIN = 0.02
RESALE_DISCOUNT_RATE_MAX = 0.07
BONUS_POOL_RATE = 0.20
P_WIN_STARTER = 0.46
```

3-Card:

```text
ENTRY_FEE = $1.00 base
DRAW_COST = $0.0032
PAYOUT_WIN = $3.20
BONUS_NEAR_WIN = $0.15
NEAR_WIN_RATE = 0.25
MARKET_FILL_TARGET = 0.93
HOUSE_CUT_ENTRY = 0.05
HOUSE_CUT_RESALE = 0.05
RESALE_PRESERVE = 0.985
RESALE_DISCOUNT_RATE_MIN = 0.03
RESALE_DISCOUNT_RATE_MAX = 0.09
BONUS_POOL_RATE = 0.20
P_WIN_STARTER = 0.22
```

Stake scaling:

```text
ENTRY_FEE = base_entry_fee × stake
DRAW_COST = base_draw_cost × stake
PAYOUT_WIN = base_payout × stake
BONUS_NEAR_WIN = base_bonus × stake
```

### Resale formula in old clickable prototype

```text
remaining_value = max(0, entry_fee - draws × draw_cost)
```

```text
discount = remaining_value × random_discount_rate
```

```text
suggested_resale_price =
  max(0, RESALE_PRESERVE × remaining_value - discount)
```

Effective resale price after relist nudge:

```text
effective_resale_price =
  suggested_resale_price × (1 - relist_nudge_pct)
```

Relist nudge:

```text
each relist = additional 1% price reduction
```

If sold:

```text
resale_fee = sale_price × HOUSE_CUT_RESALE
seller_credit = sale_price - resale_fee
seller_net = seller_credit - amount_spent
```

### Important interpretation

The old clickable prototype is valuable for UX and loop recovery, but it should not be treated as the final financial model.

It confirms the interaction pattern:

```text
choose stake
choose draw mode
start game
draws consume value
list for sale
buyer may fill listing
seller receives credit minus fee
wallet updates
cashout stub exists
```

But its payout values and house mechanics were later superseded or at least reconsidered.

---

## 5. Old Simulation Behind Single Draw Prototype

The old Single Draw marketplace prototype was connected to a rough Monte Carlo-style simulation.

Recovered final simulation title:

```text
Overall Platform Economics — Near-Breakeven Target
```

Final output:

```text
total_sessions = 3000
platform_rev_total = 419.7272
platform_rev_per_session = 0.1399
player_net_total = 134.5983
player_net_per_session = 0.0449
```

### Raw assumptions

```text
N = 1000 per archetype
entry_fee = $1.00
draw_cost_per_card = $0.0035
draws_low = 25
draws_high = 45
platform_cut_entry = 0.05
platform_cut_resale = 0.05
payout_base = $2.38
bonus_close_call = $0.12
near_win_prob = 0.22
market_fill_rate = 0.95
alpha_preserve = 0.985
beta_discount_min = 0.02
beta_discount_max = 0.07
p_win_starter_finisher = 0.46
p_win_after_buy = 0.43
sniper_buy_ratio = 0.85
```

Archetypes:

```text
grinder
finisher
sniper
```

### What the simulation modeled

The simulation modeled:

* starters paying entry;
* stock draw costs;
* some grinders/finishers reselling early;
* snipers mostly buying in-progress games;
* near-win bonuses;
* market fill rate;
* resale fees;
* player net outcomes;
* gross platform inflows from entry cuts, draw costs, and resale fees.

### Critical caveat

The simulation tracked `player_net` and `platform_revenue` separately.

Winner payouts increased player net, but were not debited from platform revenue.

Therefore:

```text
platform_rev_per_session = 0.1399
```

should be interpreted as gross platform inflow from fees/draws/resales, not true closed-loop house profit after paying winners.

This is a major reason the old `$2.38` / `$3.20` prototype payouts should not be treated as final solvency-proof values.

### Current interpretation

The old simulation was useful for:

* player-feel tuning;
* confirming that draw costs and resale flow could produce meaningful economic signals;
* exploring player archetypes;
* testing whether players could hover near break-even under a rough model.

The old simulation was not sufficient for:

* final platform solvency;
* full closed bankroll accounting;
* proving the house can sustainably pay all winners;
* final marketplace launch math.

---

## 6. Current Recommended Direction

The current recommended approach is:

1. Treat the later `1.70×` contest model as the serious economy foundation.
2. Preserve the older clickable marketplace prototype as historical UX/economy-loop evidence.
3. Borrow the old prototype’s interaction lessons:

   * stock draws consume value;
   * tableau moves and flips are free;
   * Draw 3 consumes three stock-card steps;
   * remaining value supports resale/listing logic;
   * wallet and escrow concepts matter;
   * player-facing explanations are important.
4. Do not adopt the old `$2.38` Single Draw or `$3.20` 3-Card payouts as final without a new closed-loop simulation.
5. Build any new money-related prototype features behind clear development labels.
6. Maintain separation between:

   * score receipt;
   * remaining-value receipt;
   * marketplace listing price;
   * final payout / wallet accounting.

---

## 7. Current Current Prototype Status

The current repo prototype already includes several features that support the economy model without locking money rules:

* Draw 1 / Draw 3 modes
* Undo
* completed-game detection
* completed-game locking
* completion banner
* score breakdown receipt
* near-win development board
* mixed receipt development board

These features are compatible with the recovered economy because they provide:

* mode awareness;
* board completion;
* score transparency;
* controlled test states;
* outcome summaries;
* a foundation for future value receipts.

---

## 8. Open Questions Before Coding Economy Logic

The following questions should be answered before real money/value logic is added to the current prototype.

### Economy model

* Is `1.70×` definitely the current payout multiple for both Draw 1 and Draw 3?
* Should Draw 1 and Draw 3 share one payout multiple, or have separate payout tables?
* Should the `$1 / $2 / $5` tiers all use the same payout multiple?
* Is the 1% bonus-pool skim still the current target?

### Remaining value

* Should remaining value use linear draw-cost deduction or percentage/exponential decay?
* Is `0.35%` the final value-decay rate, or only a recovered historical value?
* Should Draw 3 use a lower per-card value cost than Draw 1?
* Should decay trigger only on stock-card exposure?
* Should tableau hidden-card flips also count as exposure/value decay?
* Should recycles affect remaining value, score, both, or neither?

### Marketplace

* Does remaining value feed directly into reference EV, or only constrain it?
* What is the first v0.1 reference EV formula?
* How will estimated win probability be derived before a real solver/model exists?
* Should sellers be able to list after buying a game, or only original starters?
* What should happen if no buyer appears?
* How long do listings remain active?
* Is the `$0.05` tick size appropriate for `$1` games?

### Wallet / settlement

* What amount is held in escrow when a game is listed?
* When does the seller receive funds?
* When does the platform collect the fee?
* What happens if a listing is canceled?
* What happens if a buyer purchases but abandons the game?
* How are refunds handled for technical failures?

### Player trust

* What value information is shown to the buyer?
* Should exact EV be hidden and replaced with a coarse hint?
* How should ownership history be displayed?
* Should games with repeated resale be allowed later?
* How should the receipt explain value loss without making the game feel punitive?

---

## 9. Near-Term Build Recommendation

Before adding real marketplace or wallet logic, build a development-only economy preview that does not move funds.

Recommended first build:

```text
Economy Preview Panel
- Entry tier
- Draw mode
- Payout multiple
- Payout potential
- Draw/value steps
- Remaining value
- Value consumed
- Notes showing which assumptions are active
```

This should be clearly labeled as:

```text
Development Economy Preview
```

The first version should avoid real wallet settlement and avoid marketplace purchases.

The purpose is to connect the current playable board to the recovered economy gradually and safely.

---

## 10. Decision Log

### Recovered

* Original clickable marketplace prototype existed.
* Single Draw used `$0.0035` draw cost.
* Draw 3 used `$0.0032` per card.
* Draw 3 counted as three card steps in the old prototype.
* Only stock draws consumed value in the old prototype.
* Resale price was based on remaining value in the old prototype.
* Later economy work used `1.70×` payout and `58.82%` break-even.
* Later marketplace rules used seller-set pricing inside EV guardrails.

### Current direction

* Use the later `1.70×` model as the main serious economy foundation.
* Use the old clickable marketplace prototype as historical UX and interaction evidence.
* Do not port old higher payouts directly without new solvency testing.
* Document money circuits before coding them.

### Still open

* Final reference EV formula.
* Final remaining-value formula.
* Final draw mode payout differences.
* Final marketplace eligibility rules.
* Final wallet/escrow settlement rules.
