# Solitaire Result Receipts v0.1

## Purpose

Result receipts are the player-facing and system-facing record of what happened during a game session or marketplace transaction.

They are not just summaries. They are intended to become the game's trust, audit, and navigation layer.

A receipt should answer:

* What happened?
* What did the player spend?
* What value was consumed?
* What did the player recover, win, lose, or carry forward?
* What fees or rules applied?
* What choices are available next?

---

## Core Principle

Every major game outcome should produce a clear receipt.

This helps prevent confusion, especially when money, resale value, wallet balances, escrow, or marketplace transfers are involved.

The receipt should avoid vague labels such as "net" unless the meaning is obvious. Prefer explicit language:

```text
Amount spent
Amount recovered
Fee
Profit/loss
Remaining value
Payout potential
```

---

## Receipt as Chain of Custody

An in-progress game can change state and ownership over time.

A game might follow a path like:

```text
Game created
Player A starts game
Player A draws stock cards
Player A lists game
Listing price is set
Buyer purchases game
Escrow transfers
Player B continues game
Player B completes, loses, or relists
Final receipt is generated
```

This creates a chain of custody.

The project does not need literal blockchain technology for this concept to matter. The important idea is that each state transition should be recorded, explainable, and auditable.

---

## Why This Matters

Result receipts support three major product needs:

1. **Player trust**

   * Players can understand what happened and why.
   * Money-related outcomes feel transparent rather than mysterious.

2. **Audit / data structure**

   * Each game state change can become a traceable event.
   * Marketplace listings, sales, escrow, and settlement can be reconstructed.

3. **UX navigation**

   * The current receipt/state determines which choices should be shown next.
   * This helps guide players toward appropriate next actions instead of overwhelming them with every possible button.

---

## Initial Receipt Types

## Implemented Receipt Types

### `completed-game`

The `completed-game` receipt is currently shown when a deal reaches a completed state.

It includes:

- Receipt type
- Receipt ID
- Deal seed preview
- Receipt status
- Final score
- Move count
- Undo count
- Score breakdown
- Economy preview
- Next-action buttons

The current economy preview includes entry tier, payout potential, value steps, value step rate, value consumed, remaining value, and remaining percent.

This receipt is still marked preview-only. It does not perform wallet movement, escrow, marketplace sale pricing, bonuses, refunds, or final settlement.

### `listing-preview`

The `listing-preview` receipt is currently a development-only marketplace receipt preview.

Current UI behavior:

- The `listing-preview` receipt does not appear automatically after game completion.
- The player must click `Preview Listing` from the completed-game receipt next actions.
- The player can dismiss it with `Hide Listing Preview`.
- Starting a new Draw 1 or Draw 3 game resets/hides the listing preview.

Implementation note:

- The current app uses an `activeReceiptView` UI state to control the visible secondary receipt view.
- `listing-preview` is currently the only secondary receipt view.
- This is intended to scale better than adding separate booleans for every future receipt type.

It proves that the receipt system can support more than one receipt type while keeping marketplace behavior preview-only and user-requested.

It includes:

- Receipt type
- Receipt ID
- Deal seed preview
- Receipt status
- Entry tier
- Payout potential
- Value steps
- Value step rate
- Remaining value
- Remaining percent
- Suggested listing value placeholder
- Pricing summary
- Pricing mode
- Reference EV status
- Reference EV value
- Reference EV method
- Seller price status
- Seller price value
- Seller price mode
- Allowed price band status
- Band rule
- Hard floor
- Hard ceiling
- Price tick

The suggested listing value is intentionally shown as `Not calculated yet`.

Current pricing / guardrail preview:

- Suggested listing value is shown as `Not calculated yet`.
- Pricing summary is shown as `Preview only — waiting on reference EV and seller price`.
- Pricing mode is shown as `Preview only`.
- Reference EV status is shown as `Not calculated yet`.
- Reference EV value is shown as `Not calculated yet`.
- Reference EV method is shown as `TBD`.
- Seller price status is shown as `Not set`.
- Seller price value is shown as `Not set`.
- Seller price mode is shown as `Seller-set pricing not enabled`.
- Allowed price band status is shown as `Waiting on reference EV`.
- Band rule is shown as `EV × 0.5 to EV × 1.5`.
- Hard floor is previewed as 10% of the entry tier.
- Hard ceiling is previewed as 120% of payout potential.
- Price tick is previewed as `$0.05`.

Implementation note:

The listing preview receipt now groups pricing-specific fields under a `pricingPreview` object in the app code.

This keeps receipt identity/status, game/economy snapshot values, and future marketplace pricing logic separated:

- Receipt identity/status fields describe what kind of receipt this is.
- Game/economy snapshot fields describe the current deal value state.
- `pricingPreview` fields describe marketplace pricing readiness, guardrails, and placeholders.

This structure is intended to make future reference EV and seller-pricing work easier to add without bloating the main receipt object.

The pricing preview also includes a summary line so the current marketplace pricing state can be understood before reading the detailed rows.

The current `pricingPreview` object is built through a `buildListingPricingPreview()` helper so future reference EV, seller pricing, and guardrail logic has a dedicated place to grow.

Reference EV is now represented as a nested `referenceEv` object with `status`, `valueLabel`, and `method` fields, so future EV logic has a dedicated structure before any calculation is implemented.

Seller price is now represented as a nested `sellerPrice` object with `status`, `valueLabel`, and `mode` fields, so future seller-set pricing can be added without creating a real listing yet.

Allowed price band is now represented as a nested `allowedPriceBand` object with `status`, `rule`, `hardFloor`, `hardCeiling`, and `priceTick` fields, so future price-band calculations can be added without mixing them into the main receipt object.

The allowed price band cannot be fully calculated until reference EV exists.

The hard floor, hard ceiling, and price tick are shown because they can be previewed independently from reference EV. These values are still preview-only and do not create a listing, sale price, escrow, buyer, seller, wallet movement, or settlement.

These fields reserve space for future marketplace pricing logic while keeping the current implementation honest about what is and is not calculated.

These fields reserve space for future marketplace pricing logic without implementing reference EV, seller-set pricing, allowed price bands, escrow, or purchase flow yet.

This receipt does not create a marketplace listing. It does not create wallet movement, escrow, sale price, buyer, seller, settlement, refund, or bonus activity.

The purpose of this receipt is to reserve space for future marketplace pricing logic without prematurely defining the reference EV, listing price band, seller-set price, escrow, or purchase flow.

### 1. Completed / Won Receipt

Created when a player successfully completes a game.

Should include:

```text
Game outcome
Entry tier
Draw mode
Final score
Moves
Undos
Score breakdown
Value steps
Value step rate
Value consumed
Remaining value
Remaining %
Payout potential
Final payout, when real settlement exists
```

Current prototype status:

```text
Implemented as preview-only.
No wallet movement or final settlement yet.
```

---

### 2. Lost / Abandoned Receipt

Created when a player plays out a game and loses, or chooses to abandon.

Should include:

```text
Game outcome
Entry tier
Draw mode
Amount spent
Value consumed
Remaining value, if any
Final score
Near-win bonus, if any
Final result
```

Open question:

```text
Should abandon and true loss use the same receipt type or separate types?
```

---

### 3. Listed for Sale Receipt

Created when a player lists an in-progress game.

Should include:

```text
Entry tier
Draw mode
Amount spent so far
Value steps
Value consumed
Remaining value
Reference EV or coarse EV hint
Suggested price range
Seller listing price
Estimated resale fee
Estimated seller recovery
Listing expiration or cooldown
```

Purpose:

```text
Help the seller understand what they are offering and what they may recover.
```

---

### 4. Sold Receipt

Created when a listed game is purchased by another player.

Should include:

```text
Sale price
Resale fee
Seller credit
Amount previously spent
Amount recovered
Profit/loss result
Buyer receives game state
Escrow status
```

Preferred player-facing wording:

```text
Sold for $X.
Fee: $Y.
You recovered $C of $S spent.
Result: ±$Z.
```

This avoids the old prototype confusion where a positive recovered amount could feel like a win even if the player was still down overall.

---

### 5. Bought Game Receipt

Created when a buyer purchases an in-progress game.

Should include:

```text
Purchase price
Entry tier / original game tier
Draw mode
Remaining value
Payout potential
Coarse EV hint
Escrow status
Ownership transfer confirmation
Available next actions
```

Potential next actions:

```text
Continue playing
View purchase details
Relist, if allowed
```

---

### 6. Relisted Receipt

Created when a buyer or seller relists an in-progress game.

Should include:

```text
Prior listing price
New listing price
Relist nudge or price adjustment
Current remaining value
Current coarse EV hint
Updated estimated fee
Updated potential recovery
```

Open question:

```text
Should buyers be allowed to relist games they purchased?
```

---

### 7. Expired / Canceled Listing Receipt

Created when a listing expires or is canceled before sale.

Should include:

```text
Original listing price
Current remaining value
Reason: expired or canceled
Whether the game returns to active play
Relist option
Suggested adjustment, if any
```

Potential next actions:

```text
Relist
Return to game
Start new game
```

---

### 8. Refund / Technical Issue Receipt

Created when a technical failure or approved refund affects the game.

Should include:

```text
Issue type
Entry tier
Amount refunded
Wallet credit
Game status
Rule or policy used
Timestamp / reference ID
```

This receipt may become important for support, audit, and responsible play.

---

## Receipt-State Navigation

Receipts help determine what buttons and choices should appear next.

Example states:

### Active Game

Likely actions:

```text
Continue playing
List for sale
Undo, if allowed
New game, possibly with warning
```

### Listed Game

Likely actions:

```text
Wait for buyer
Cancel listing
Lower price / relist
Return to play, if allowed
```

### Sold Game

Likely actions:

```text
View receipt
Start new game
Cash out / wallet, later
```

### Bought Game

Likely actions:

```text
Continue playing
View purchase details
Relist, if allowed
```

### Completed Game

Likely actions:

```text
View receipt
Start new game
Review score/value result
```

---

## Data Events to Consider Later

Possible internal events:

```text
game.created
game.started
stock.drawn
game.value_consumed
game.completed
game.lost
game.abandoned
listing.created
listing.updated
listing.canceled
listing.expired
listing.sold
escrow.created
escrow.released
wallet.credited
wallet.debited
receipt.generated
```

These events should eventually allow reconstruction of the full game state history.

---

## Current Implementation Status

Implemented in current prototype:

```text
Completed-game score receipt
Completed-game economy preview receipt
Live Development Economy Preview panel
```

Not implemented yet:

```text
Lost receipt
Listed receipt
Sold receipt
Bought receipt
Relisted receipt
Canceled/expired listing receipt
Refund receipt
Wallet settlement
Escrow settlement
Marketplace purchase flow
```

---

## Current Direction

Result receipts should be developed gradually.

Near-term goal:

```text
Use receipts to explain game outcomes and preview economy impact.
```

Later goal:

```text
Use receipts as the foundation for marketplace trust, wallet settlement, audit trails, and player navigation.
```
