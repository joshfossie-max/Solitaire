import { Rules, type RuleId } from "./rules";

/** Return all available rule IDs (UI-friendly). */
export function listRuleIds(): RuleId[] {
  return Object.keys(Rules) as RuleId[];
}

/** Return the minimal metadata for a rule id. */
export function getRuleMeta(id: RuleId) {
  return Rules[id];
}
