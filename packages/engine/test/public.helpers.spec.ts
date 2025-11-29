import { describe, it, expect } from "vitest";
import { isMoveType, MOVES_LIST } from "../src/public-moves";

describe("public helpers", () => {
  it("lists known move types", () => {
    expect(MOVES_LIST.sort()).toEqual(["draw3", "place_f", "place_t", "recycle"].sort());
  });

  it("isMoveType flags known/unknown correctly", () => {
    expect(isMoveType("draw3")).toBe(true);
    expect(isMoveType("not-a-move")).toBe(false);
  });
});
