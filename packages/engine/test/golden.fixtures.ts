export const fixtures = [
  {
    seed: "000102030405060708090a0b0c0d0e0f000102030405060708090a0b0c0d0e0f",
    ruleset: "classic_v1" as const,
    expect: {
      initChecksum: "1af9fb74647ebc0b15accf8c65b84705aa29643d8adaa1d0739bc47e042f4651",
      tableau0First3: "[30]"
    }
  },
  {
    seed: "ffffffffffffffffffffffffffffffff",
    ruleset: "classic_v1" as const,
    expect: {
      initChecksum: "32650afcb4ef22fceeed82f30bfacd892274f7b3b237582121645cd760f535cf",
      tableau0First3: "[21]"
    }
  }
];
