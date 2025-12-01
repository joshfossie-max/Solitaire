import { describe, it, expect } from "vitest";
import { init, dispatchMove, summarize } from "../src/api";

describe("engine API – basic play flow", () => {
  it("allows init → a couple moves → summarize", () => {
    // Start a classic game from the public API.
    let state = init({ seed: "api-play-seed", ruleset: "classic_v1" });

    // Use the dispatcher via the API (just like the future UI will).
    state = dispatchMove(state as any, { type: "draw3" } as any);
    state = dispatchMove(state as any, { type: "recycle" } as any);

    const summary = summarize(state);

    // Minimal sanity checks.
    expect(summary).toBeDefined();
    expect(typeof summary.completed).toBe("boolean");
    expect(summary.moves).toBeGreaterThanOrEqual(0);
  });
});
