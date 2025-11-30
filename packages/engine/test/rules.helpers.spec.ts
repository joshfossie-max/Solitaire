import { describe, it, expect } from "vitest";
import { listRuleIds, getRuleMeta } from "../src/api";

describe("rules helpers", () => {
  it("exposes at least the classic_v1 ruleset", () => {
    const ids = listRuleIds();
    expect(ids).toContain("classic_v1");
    expect(getRuleMeta("classic_v1")).toEqual({ id: "classic_v1" });
  });
});
