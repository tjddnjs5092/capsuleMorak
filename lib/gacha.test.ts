import { describe, it, expect } from "vitest";
import { pickWeightedItem, calculateDuplicateRefund } from "./gacha";

describe("pickWeightedItem", () => {
  it("returns the only item when there is exactly one", () => {
    const items = [{ id: "a", probability: 1 }];
    expect(pickWeightedItem(items, () => 0.5).id).toBe("a");
  });

  it("picks the first item when rng lands in its range", () => {
    const items = [
      { id: "a", probability: 0.7 },
      { id: "b", probability: 0.3 }
    ];
    expect(pickWeightedItem(items, () => 0.1).id).toBe("a");
  });

  it("picks the second item when rng lands past the first item's range", () => {
    const items = [
      { id: "a", probability: 0.7 },
      { id: "b", probability: 0.3 }
    ];
    expect(pickWeightedItem(items, () => 0.99).id).toBe("b");
  });

  it("throws on an empty item list", () => {
    expect(() => pickWeightedItem([], () => 0.5)).toThrow("No items to pick from");
  });

  it("throws when total probability is zero", () => {
    const items = [{ id: "a", probability: 0 }];
    expect(() => pickWeightedItem(items, () => 0.5)).toThrow("Total probability must be positive");
  });
});

describe("calculateDuplicateRefund", () => {
  it("returns 50% of price, rounded down", () => {
    expect(calculateDuplicateRefund(300)).toBe(150);
    expect(calculateDuplicateRefund(101)).toBe(50);
  });

  it("returns 0 for a zero price", () => {
    expect(calculateDuplicateRefund(0)).toBe(0);
  });
});
