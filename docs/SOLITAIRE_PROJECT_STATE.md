# Solitaire Project State Checkpoint

_Last updated: June 7, 2026_

## Purpose
This checkpoint is the living handoff document for the Solitaire project. Paste this into a fresh ChatGPT thread whenever the current thread gets sluggish, or use it as the starting context before continuing development.

## Project Vision
Build a playable, polished solitaire game with a marketplace layer where users can start games, pay small draw costs, win payouts, and eventually buy/sell in-progress games based on remaining expected value. The project is both a real game prototype and a learning vehicle for building confidence with React, TypeScript, Vite, tests, Git, and product/economy design.

## Current Working Premise
The current app is a React/Vite solitaire prototype with TypeScript. The project has moved beyond pure concept into active implementation, debugging, wallet/economy UI, draw handling, waste selection, and marketplace scaffolding.

## Current Files / Areas We Have Been Touching
- Main React app files in the Solitaire project folder.
- Solitaire game engine / state logic.
- Draw pile, waste pile, tableau, foundation, and card selection logic.
- Wallet / economy display areas.
- Marketplace-related UI and listing logic.
- Tests using Vitest.
- Deterministic shuffle / game-state testing utilities.

Exact filenames should be re-confirmed from the current VS Code Explorer before making edits, but the active work has centered on the main game component, game logic helpers, and wallet/marketplace additions.

## Current Build Status
- Main 7 correction checkpoint: active in-progress games can now open the listing preview from Game Options.
- Main 7 buyer-side preview checkpoint: Preview Listing Detail now includes buyer readiness, disabled Preview Purchase, preview purchase state, and buyer handoff preview; all remain preview-only with no real buyer, wallet, escrow, settlement, backend persistence, or game handoff behavior.
- Current listing value is system-priced and currently follows remaining value.
- Draw 1 consumes 1 value step; Draw 3 consumes 3 value steps.
- The player chooses when to list, not price.
- Listing preview remains preview-only: no wallet movement, escrow, buyer, seller, sale, refund, bonus, settlement, or real listing creation.
- Preview-only `List at Current Value` action now exists.
- Clicking `List at Current Value` updates the receipt/status locally to show a preview-only listing was created.
- The preview-only listing receives a local `preview-listing-<seed>` ID.
- Wallet, escrow, and settlement effects remain `None`.
- No real marketplace listing, buyer, sale, backend persistence, or settlement behavior exists yet.
- Preview listing state resets when starting/loading a new session.
- Preview Marketplace Listings panel now appears after local preview-only listing creation.
- Preview marketplace listing value is snapshotted at the moment `List at Current Value` is clicked.
- After local preview listing creation, continued play can change the live game value, but the preview marketplace listing keeps its captured listing value.
- The panel shows listing ID, status, current listing value, draw mode, wallet effect, and escrow effect.
- Preview Listing Detail view now opens from the Preview Marketplace Listings panel.
- Preview Listing Detail can be closed without removing the preview listing.
- Closing the detail view re-enables `View Listing Detail` while keeping the preview marketplace listing visible.
- The detail view shows snapshotted listing ID, status, listed value, draw mode, value steps, remaining %, wallet effect, escrow effect, and settlement effect.
- Detail view remains preview-only; no buyer, sale, wallet, escrow, settlement, or backend persistence behavior exists.
- Preview buyer readiness now appears inside Preview Listing Detail.
- Buyer preview status is `Not started`; purchase action status is `Disabled`.
- Disabled `Preview Purchase` button now appears in Preview Listing Detail as a future buyer-side action placeholder.
- Preview Purchase includes an explanatory disabled-state note: preview buyer state, purchase handoff, wallet/escrow rules, and buyer-game continuation must be defined first.
- Preview purchase state now appears in Preview Listing Detail.
- Purchase state currently shows status `Not created`, buyer `None`, wallet effect `None`, escrow effect `None`, and game handoff `Not started`.
- Purchase state remains preview-only; no buyer, purchase, wallet, escrow, settlement, backend persistence, or game handoff behavior exists.
- Buyer handoff preview now appears in Preview Listing Detail.
- Buyer handoff preview shows buyer game state, source listing, listed value, and handoff status.
- Buyer handoff remains preview-only; no buyer game state, purchase handoff, wallet/escrow movement, settlement, or backend persistence behavior exists.
- Buyer readiness identifies required future work: preview buyer state, purchase handoff, wallet/escrow rules, and buyer-game continuation.
- Buyer readiness remains preview-only; no buyer, purchase, wallet, escrow, settlement, or backend persistence behavior exists.
- Main 9 buyer preview checkpoint: Preview Listing Detail now includes a compact Buyer preview summary near the top of the buyer-side detail panel.
- Buyer preview summary shows buyer preview `Locked preview only`, purchase action `Disabled`, buyer game copy `Not created`, wallet/escrow movement `None`, and listing value `Snapshotted at listing creation`.
- Preview buyer game copy scaffold now appears in Preview Listing Detail.
- Preview buyer game copy shows buyer game copy `Not created`, buyer resume point `Not defined`, buyer playable state `Not enabled`, required future work `Copied game state, resume point, and ownership rules`, and copy status `Preview only — buyer cannot resume or play this listing`.
- Main 10 buyer game-copy source checkpoint: Preview Listing Detail now distinguishes the available listing metadata snapshot from the missing playable game-state snapshot; buyer copy source, source freeze rule, and copy creation trigger remain undefined, the derived copy-source readiness gate currently shows `No`, and the Preview handoff plan summary reads from that gate.
- Main 10 buyer game-copy component checkpoint: a structured seven-component future payload scaffold now identifies engine state, ruleset/draw mode, source listing, listing value, resume point, ownership target, and schema version; all seven currently show `Not captured`, with derived counts `7` total, `0` captured, `7` missing, and all-components-captured `No`.
- Main 10 buyer game-copy readiness checkpoint: source readiness and payload readiness are now separate derived gates; both currently show `No`, combined buyer-game-copy readiness shows `No`, and two active blocker IDs—`COPY_BLOCKER_SOURCE_NOT_READY` and `COPY_BLOCKER_PAYLOAD_NOT_READY`—feed both the readiness summary and Preview handoff plan summary.
- Main 10 top-level handoff readiness checkpoint: the Buyer handoff readiness model now also reads from the buyer game-copy readiness summary; combined handoff readiness requires both all six handoff requirements and buyer-game-copy readiness, currently shows `No`, exposes the two buyer-copy blocker IDs, and remains preview-only with purchase execution disabled.
- Buyer handoff blockers now appear in Preview Listing Detail.
- Buyer handoff blockers explicitly list future required pieces as not implemented: buyer identity, wallet/escrow rules, ownership transfer, copied buyer game state, resume/play rules, and backend persistence.
- Preview Marketplace Listings card now includes a compact locked-status summary before opening the detail view: purchase locked, buyer game copy not created, wallet/escrow none, and handoff not started.
- All Main 9 buyer-preview additions remain preview-only/local-only; Preview Purchase remains disabled, and no real wallet movement, escrow movement, sale, settlement, ownership transfer, backend persistence, or game handoff is enabled.
- Main 9 lock reason checkpoint: Preview buyer action log and Preview purchase execution lock now expose a durable lock reason code.
- Default buyer action log lock reason code is `NONE`.
- Locked purchase attempts now use `BUYER_HANDOFF_NOT_READY`, while the permanent Preview purchase execution lock uses `PREVIEW_PURCHASE_EXECUTION_DISABLED`.
- Preview Marketplace Listings card also shows purchase guard `Active`, guard complete `No`, blocking requirements `6`, and the current combined guard reason code `BUYER_HANDOFF_NOT_READY` before opening the detail view.
- Preview Marketplace Listings card locked-status rows are now backed by structured `previewMarketplaceCardStatusSummary` data in `App.tsx` to reduce scattered inline card values.
- Preview Marketplace Listings card rows now render through `renderPreviewStatusCardRow` to reduce repeated card-row JSX while keeping the visible UI unchanged.
- Preview Listing Detail now includes a top-level `previewBuyerHandoffReadinessModel` that ties together unlock gate status, requirement counts, purchase guard state, disabled reason code, marketplace card status source, and overall readiness status.
- Preview Listing Detail now includes `previewBuyerHandoffReadinessSourceSummary`, which explicitly lists the scaffold sources feeding the readiness model: unlock gate, requirements summary, purchase guard, marketplace card summary, blocking requirements, completion mode summary, handoff plan summary, and the preview-only execution boundary.
- Preview Listing Detail now includes a Buyer handoff traceability chain showing the scaffold flow: requirements array → requirements summary → completion mode summary → unlock gate → purchase guard → marketplace card summary → handoff plan summary → readiness model, with execution boundary `Preview only — does not enable purchase`.
- Main 10 handoff-plan visibility checkpoint: each of the five structured Preview purchase handoff plan steps now exposes `Step status` in Preview Listing Detail; all five currently show `pending`, and the readiness model now exposes the preview-only handoff plan status.
- Main 9 buyer handoff requirement ID checkpoint: Buyer handoff blockers now include stable requirement IDs that can later become checklist, test, or system keys.
- Requirement IDs currently shown in Preview Listing Detail: `REQ_BUYER_IDENTITY`, `REQ_WALLET_ESCROW_RULES`, `REQ_OWNERSHIP_TRANSFER`, `REQ_BUYER_GAME_COPY`, `REQ_RESUME_PLAY_RULES`, and `REQ_BACKEND_PERSISTENCE`.
- Requirement ID constants are centralized in `App.tsx` to reduce drift between buyer handoff blocker rows and future system/test usage.
- Buyer handoff requirement status values are centralized in `App.tsx` as `PREVIEW_REQUIREMENT_STATUS_IMPLEMENTED` and `PREVIEW_REQUIREMENT_STATUS_NOT_IMPLEMENTED`; requirement summary and blocking logic now compare against the centralized implemented-status constant.
- Buyer handoff requirements now include a `completionMode` field, currently set to `manual_future` through centralized `PREVIEW_REQUIREMENT_COMPLETION_MODE_MANUAL_FUTURE`, to distinguish current implementation status from how the requirement will eventually be completed.
- Preview Listing Detail now includes a Requirement completion mode summary showing `manual_future` requirements `6`, derived from the structured buyer handoff requirements array.
- Requirement ID work remains preview-only/local-only; it does not enable purchase, wallet movement, escrow movement, sale, settlement, ownership transfer, backend persistence, or buyer game handoff.
- Main 9 structured buyer handoff requirements checkpoint: Buyer handoff blockers are now backed by a structured `PREVIEW_BUYER_HANDOFF_REQUIREMENTS` array in `App.tsx` instead of repeated hardcoded JSX rows.
- Buyer handoff requirements summary now derives total, implemented, and remaining requirement counts from the structured requirements array.
- Current preview summary shows total requirements `6`, implemented requirements `0`, remaining requirements `6`, and requirement status `Locked — requirements not complete`.
- A derived `previewBuyerHandoffAllRequirementsComplete` boolean now exists as a future unlock gate, but Preview Purchase remains disabled.
- Preview Listing Detail now includes a Buyer handoff unlock gate section.
- Buyer handoff unlock gate currently shows gate exists `Yes`, gate currently complete `No`, gate source `Buyer handoff requirements`, and purchase effect `Does not enable Preview Purchase`.
- Unlock gate preview is informational only; it does not enable Preview Purchase or create real purchase, wallet, escrow, ownership transfer, backend persistence, or buyer game handoff behavior.
- Disabled Preview Purchase helper text still references the buyer handoff unlock gate and now displays the combined disabled reason code `BUYER_HANDOFF_NOT_READY`.
- Preview purchase state now exposes `BUYER_HANDOFF_NOT_READY` whenever either the six buyer handoff requirements or buyer game-copy readiness is incomplete.
- Preview Listing Detail now includes a combined Preview purchase guard summary showing guard active `Yes`, handoff requirements complete `No`, buyer game copy ready `No`, buyer handoff ready `No`, blocking requirements `6`, buyer game-copy blocking conditions `2`, both groups of blocker IDs, purchase button state `Disabled`, disabled reason code `BUYER_HANDOFF_NOT_READY`, and execution mode `Preview only`.
- Actual disabled Preview Purchase button continues to use centralized `previewPurchaseButtonDisabled`; the guard summary reads from the same disabled-state value, but the button remains disabled.
- Purchase disabled reason codes are centralized in `App.tsx` as `BUYER_HANDOFF_NOT_READY_DISABLED_REASON` and `PREVIEW_PURCHASE_EXECUTION_DISABLED_REASON`.
- Preview purchase disabled reason now uses the combined buyer handoff gate: incomplete handoff requirements or buyer game-copy readiness show `Buyer handoff requirements or buyer game-copy readiness are incomplete; preview purchase remains disabled`.
- Structured requirements, summary counts, completion gate, and gated disabled reason remain preview-only/local-only; they do not enable purchase, wallet movement, escrow movement, sale, settlement, ownership transfer, backend persistence, or buyer game handoff.
- Preview lock and disabled-reason codes are centralized in `App.tsx`: `PREVIEW_LOCK_REASON_NONE`, `BUYER_HANDOFF_NOT_READY_DISABLED_REASON`, and `PREVIEW_PURCHASE_EXECUTION_DISABLED_REASON`, with each lock surface using the code appropriate to its boundary.
- Lock reason code work remains preview-only/local-only; it does not enable purchase, wallet movement, escrow movement, sale, settlement, ownership transfer, backend persistence, or buyer game handoff.
- Local preview listings can be removed without starting a new game.
- Removing the preview listing clears the Preview Marketplace Listings panel and re-enables `List at Current Value`.
- Remove behavior is still preview-only; no real wallet, escrow, buyer, sale, settlement, or backend persistence behavior exists.
- The app has been running locally through Vite.
- We recently fixed or moved past TypeScript/red-squiggle issues involving selected waste sources / selectedWasteSources.
- The game disappeared once during a recent edit/refresh cycle, then we got back on track.
- The user reported the project was saved after the latest stable point.
- The user naturally won a game during playtesting, which confirmed that the core game can reach a normal win state.
- Listing preview is now controlled through an `activeReceiptView` UI state instead of a simple boolean.
- The completed-game receipt now includes a `Preview Listing` action.
- The listing preview receipt opens only when requested, can be hidden with `Hide Listing Preview`, and resets when starting a new Draw 1 or Draw 3 game.
- The completed receipt now shows the current secondary receipt view status.
- Listing pricing preview has been structured under a `pricingPreview` object.
- `pricingPreview` now includes a summary, pricing mode, nested `referenceEv`, nested `sellerPrice`, and nested `allowedPriceBand`.
- Reference EV and seller price are still placeholders only; no real listing, sale price, escrow, wallet movement, or settlement is created.
- Allowed price band guardrails are previewed independently from reference EV: EV × 0.5 to EV × 1.5, hard floor at 10% of entry tier, hard ceiling at 120% of payout potential, and $0.05 price tick.
- Listing pricing preview has continued to mature as preview-only marketplace scaffolding.
- `pricingPreview` now includes nested `referenceEv`, `sellerPrice`, and `allowedPriceBand` objects.
- Reference EV now has status, value label, method, and readiness fields.
- Seller price now has status, value label, mode, and readiness fields.
- Allowed price band now has status, rule, hard floor, hard ceiling, and price tick fields.
- The listing preview receipt UI is grouped into Deal value snapshot, Pricing readiness, and Price band guardrails sections.
- Listing preview rendering now uses helper functions including `renderListingPreviewReceipt(...)`, `renderDealValueSnapshotRows(...)`, `renderPricingReadinessRows(...)`, and `renderPriceBandGuardrailRows(...)`.
- The completed receipt uses `formatActiveReceiptView(...)` for the secondary receipt view label and `isListingPreviewOpen` to avoid repeating the listing-preview state check.

## Known Recent Bugs / Watch Items
- Red squiggles around selectedWasteSources appeared recently and should be watched carefully.
- The visible game disappeared after one change, likely due to a render/state/conditional issue introduced during editing.
- Waste selection logic is sensitive and should be edited cautiously.
- Div structure/layout can be easy to misalign; when instructions reference a section, compare against the actual file before deleting or moving blocks.
- After each change, verify both the browser and VS Code terminal before moving on.
- The listing preview receipt is becoming long; continue grouping and extracting sections carefully rather than adding unstructured rows.

## Economy Constants / Design Notes Recovered So Far
Older and newer economy concepts both exist in the conversation history. Treat the following as project memory, not necessarily final production constants.

### Earlier $1 / $2 Tier Model
- $1 and $2 tiers were explored.
- 1.70x payout was explored.
- 58.82% break-even rate was discussed.
- 55% reference win rate was discussed.
- 1% bonus-pool skim was discussed.
- A likely 0.35% remaining-value decay was discussed, but the exact decay trigger still needed confirmation.

### Later Marketplace / Clickable V1 Constants Recovered
- Single Draw:
  - DRAW_COST: 0.0035
  - PAYOUT_WIN: 2.38
  - P_WIN_STARTER: 0.46
- 3-Card:
  - DRAW_COST: 0.0032
  - PAYOUT_WIN: 3.20
  - P_WIN_STARTER: 0.22
- HOUSE_CUT_ENTRY: 0.05
- HOUSE_CUT_RESALE: 0.05
- RESALE_PRESERVE: 0.985
- Resale discount ranges:
  - Single Draw: 2–7%
  - 3-Card: 3–9%
- BONUS_POOL_RATE: 0.20
- Near-win bonuses and market fill targets were discussed.

### Monte Carlo / Simulation Values to Preserve
A recovered final Single Draw simulation result referenced:
- player_net_per_session: +0.0449
- platform_rev_per_session: +0.1399

The exact assumptions behind starter, buyer, resale, loss, near-win, and platform revenue still need to be recovered or rebuilt if we need audit-grade economy documentation.

## Marketplace Pricing Rules Recovered
### Current authoritative direction — Main 7 correction

The current intended marketplace model is system-priced, not seller-priced.

The player chooses **when** to list/sell an in-progress game, not **how much** to sell it for. The listing/sell value should be calculated by the system from the current game state, remaining value, entry tier, payout potential, and stock-card value consumption.

### Main 8 Buyer-Side Preview Checkpoint

Main 8 continued the marketplace preview scaffold on the buyer side while keeping all behavior preview-only/local-only.

Confirmed current behavior:
- Local preview listings are created from the current system-priced listing value.
- Listing value is snapshotted at the moment `List at Current Value` is clicked.
- Continued play changes the live game economy value but does not change the preview listing's captured value.
- Buyer-side preview values now consistently use the snapshotted listing value, including:
  - Preview listing detail listed value
  - Buyer purchase quote buyer price
  - Buyer handoff preview listed value
  - Preview purchase handoff plan value
- Removing the preview listing clears the local marketplace panel/detail and re-enables `List at Current Value`.

Buyer-side preview scaffold now includes:
- Listing-card buyer preview status: `Not available yet`
- Buyer preview readiness
- Buyer preview requirements
- Preview buyer identity
- Preview buyer wallet
- Preview buyer escrow
- Preview buyer acceptance readiness
- Preview buyer ownership transfer
- Preview buyer game-state handoff
- Preview purchase state
- Preview purchase execution lock
- Purchase disabled reason
- Preview buyer purchase quote
- Buyer handoff preview
- Preview purchase handoff plan
- Disabled `Preview Purchase` button

Preview detail readability now includes:
- Grouping labels for `Listing snapshot`, `Buyer-side preview path`, and `Purchase and handoff preview`
- Styled group labels with top dividers for easier scanning
- Preview-only detail note explaining that no buyer, wallet, escrow, purchase, ownership transfer, or game handoff is created
- Styled preview-only note card for clearer tester/developer context

Preview detail refactor progress:
- Added `renderPreviewDetailRow(label, value)` helper for repeated preview/detail rows
- Refactored `renderPreviewOnlyListingStateRows` to use the shared row helper
- Confirmed receipt preview still renders Status, Listing ID, Wallet effect, Escrow effect, and Settlement effect correctly

Locked-preview language now includes:
- Listing card buyer preview status now says `Preview locked`
- Marketplace card action now says `View Locked Preview`
- Disabled purchase helper now starts with `Preview Purchase is locked`
- Buyer preview readiness and buyer acceptance readiness now use locked/view-only wording
- Preview purchase handoff plan now clarifies purchase lock, wallet/escrow rules, and buyer game handoff requirements
- Preview purchase handoff plan is now backed by structured `PREVIEW_PURCHASE_HANDOFF_PLAN_STEPS` data and `PREVIEW_PURCHASE_HANDOFF_PLAN_STATUS` in `App.tsx`; visible plan rows remain unchanged while reducing repeated JSX and preparing for future handoff/checklist logic.
- Preview Listing Detail now includes a Preview handoff plan summary showing plan steps `5`, completed steps `0`, pending steps `5`, and plan status `Preview only — no transaction or transfer`, derived from the structured preview purchase handoff plan data.
- Preview handoff plan step statuses are now centralized as `PREVIEW_HANDOFF_PLAN_STEP_STATUS_PENDING` and `PREVIEW_HANDOFF_PLAN_STEP_STATUS_COMPLETE`; completed and pending step counts are derived from each step's `stepStatus`.
- Preview purchase handoff plan now exposes stable step IDs for each plan step: `STEP_LISTED_GAME`, `STEP_BUYER_PREVIEWS`, `STEP_BUYER_ACCEPTS`, `STEP_WALLET_ESCROW`, and `STEP_BUYER_RECEIVES_GAME`.
- Locked preview checklist near the top of listing detail summarizes buyer identity, wallet/escrow rules, ownership transfer, buyer game handoff, and purchase lock status

Locked checklist/action log progress:
- Locked preview checklist values are now sourced from `previewLockedChecklist` instead of hardcoded render rows
- Checklist source row shows `Buyer preview requirements`
- Preview buyer action log records the current preview-only buyer action state: no action attempted, purchase locked, and no buyer action recorded
- Preview buyer action log is now backed by local React state
- `Record Locked Attempt` records a preview-only locked purchase attempt while keeping `Preview Purchase` disabled
- Locked attempt updates the action log only; no buyer, wallet, escrow, sale, settlement, ownership transfer, or game handoff is created
- Action log now supports the full preview-only loop: no action → record locked attempt → clear action log
- Preview action log states are now centralized as named default and locked-attempt states
- Preview buyer action log now tracks attempt count: 0 by default, 1 after `Record Locked Attempt`, and 0 again after `Clear Action Log`
- Preview buyer action log now includes a last-action note for default, locked-attempt, and cleared states
- Bottom helper text now clarifies that `Record Locked Attempt` updates the preview log only and creates no buyer, wallet, escrow, sale, settlement, ownership transfer, or game handoff

Still not implemented:
- Real buyer identity
- Real wallet debit
- Real escrow credit
- Seller payout
- Platform fee
- Ownership transfer
- Backend persistence
- Actual buyer game-state handoff
- Any enabled purchase behavior

Main 8 commits pushed:
- `Fix buyer handoff preview listing value snapshot`
- `Add preview purchase handoff plan`
- `Add buyer preview requirements scaffold`
- `Refactor buyer preview requirements display`
- `Add preview purchase disabled reason`
- `Add buyer preview status to listing card`
- `Add preview buyer purchase quote`
- `Add preview buyer identity scaffold`
- `Add preview buyer wallet scaffold`
- `Add preview buyer escrow scaffold`
- `Add preview buyer acceptance readiness`
- `Add preview buyer ownership transfer scaffold`
- `Add preview buyer game-state handoff scaffold`
- `Add preview purchase execution lock`
- `Add preview listing detail grouping labels`
- `Style preview detail group labels`
- `Add preview-only detail note`
- `Style preview-only detail note`
- `Add preview detail row helper`
- `Refactor preview listing state rows`
- `Complete preview listing state row refactor`
- `Clarify buyer preview locked status`
- `Clarify preview purchase locked helper text`
- `Clarify buyer handoff locked wording`
- `Clarify locked marketplace preview card`
- `Clarify buyer preview readiness locked state`
- `Clarify buyer acceptance locked wording`
- `Add locked preview checklist`
- `Source locked preview checklist values`
- `Add locked checklist source row`
- `Add preview buyer action log`
- `Back preview buyer action log with state`
- `Record locked preview purchase attempt`
- `Add clear preview action log`
- `Extract preview action log states`
- `Add preview action log attempt count`
- `Add preview action log note`
- `Clarify preview action log helper text`

This restores the original/simple resale model recovered in `docs/economy-recovery-v0.1.md`:

```text
listing_reference = current_remaining_value
```
Important current design anchor:

```text
Value decays when stock-card information is consumed.
```
Working interpretation:
- Draw 1 consumes one value step.
- Draw 3 consumes three value steps.
- Tableau/foundation moves do not consume value.
- Recycling stock does not consume value.
- Seller-entered price fields are not part of the current intended model.
- Any existing `sellerPrice` naming in code should be treated as legacy/internal naming drift until renamed.
- Marketplace preview remains preview-only until listing creation is intentionally implemented.

The later seller-set pricing model below is preserved as recovered history, but it is **not** the current active direction unless intentionally reopened.
Later marketplace pricing used:
- Seller-set listing price.
- Reference EV.
- Allowed price band: EV × 0.5 to EV × 1.5.
- Hard floor: 10% of entry.
- Hard ceiling: 120% of payout potential.
- $0.05 tick size.
- Coarse EV hint.
- Anonymized seller.
- Escrow.

Open questions still exist:
1. Exactly how the current listing value should be calculated from remaining value, entry tier, payout potential, and game state.
2. Whether reference_EV remains useful as an internal audit/market hint concept or should be deferred.
3. How visible the remaining-value formula should be to the player.
4. How and when the preview-only listing flow should become a real listing creation flow.

## Product Decisions Already Made / Strong Direction
- Keep using fresh chats when conversation sluggishness increases.
- Maintain this living Project State checkpoint as the handoff between chats.
- Build step-by-step in VS Code with screenshots and small safe edits.
- Prefer supervised edits over giant unsupervised rewrites.
- Use Codex only when helpful for contained coding tasks; ChatGPT remains the planning/context guide.
- Keep the project exciting and momentum-based, but protect working code with incremental saves and checks.

## Current Developer Workflow
1. Start Vite locally.
2. Confirm the app loads in the browser.
3. Make one contained edit at a time.
4. Watch VS Code red squiggles immediately.
5. Watch terminal errors immediately.
6. Refresh browser and verify visible behavior.
7. Save after stable milestones.
8. Use screenshots when something looks different than expected.

## Workflow Notes

The user currently operates with two VS Code terminals to keep tasks separated:

- **App Terminal** — used for running the local development app, such as `pnpm dev`, and watching Vite/browser output.
- **Git Terminal** — used for Git commands such as `git status`, `git add`, `git commit`, and `git push`.

This separation helps avoid mixing long-running app processes with Git/checkpoint commands.

## Commands That Have Been Useful
These should be re-confirmed against the current package.json, but likely commands include:

```bash
npm install
npm run dev
npm test
npm run build
```

Use PowerShell from the project root unless otherwise specified.

## What Not To Touch Casually
- Waste selection state unless we are specifically working on waste behavior.
- Large JSX/div blocks without first identifying their matching opening/closing tags.
- Economy constants without noting whether we are changing prototype behavior or only labels/documentation.
- Marketplace pricing/listing formulas unless we are following the current authoritative system-priced model: player chooses when to list, system calculates current listing value.
- Any stable game-engine logic immediately before a save/checkpoint unless tests or browser behavior confirm it.

## Next 3 Recommended Tasks
1. Stabilize the current app state and confirm it still loads cleanly after the Pro upgrade / new checkpoint.
2. Create or update an in-repo `PROJECT_STATE.md` / `SOLITAIRE_PROJECT_STATE.md` file using this checkpoint.
3. Continue the next build step from the last stable UI issue, likely wallet/marketplace/game-state polish, while keeping edits small and verified.

## How To Start A New Chat With This Checkpoint
Paste the following instruction at the top of a new Solitaire chat:

“Use this as the current Solitaire Project State checkpoint. Continue from here. Keep edits small, explain where to paste code, and ask for screenshots when the file structure differs.”

Then paste this document.

## Tone / Collaboration Notes
The project matters personally to Josh and has become a major confidence-building project. Keep momentum high, but do not rush risky code changes. Prefer clear step-by-step guidance, concrete file locations, and quick recovery when something breaks. Celebrate working milestones because those are part of the project’s fuel.
