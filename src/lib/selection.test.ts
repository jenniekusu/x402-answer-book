import { describe, expect, it } from "vitest";
import { pickWeightedRandom } from "./selection";

describe("pickWeightedRandom", () => {
  it("returns null for empty list", () => {
    expect(pickWeightedRandom([])).toBeNull();
  });

  it("returns the only item when single element", () => {
    const item = { weight: 1, value: "only" };
    expect(pickWeightedRandom([item])).toEqual(item);
  });

  it("prefers items with higher weight (statistical sanity check)", () => {
    const items = [
      { weight: 1, value: "low" },
      { weight: 5, value: "high" },
    ];

    let highCount = 0;
    const runs = 200;
    for (let i = 0; i < runs; i++) {
      const picked = pickWeightedRandom(items);
      if (picked?.value === "high") highCount++;
    }

    // 在大致随机的情况下，高权重项应明显更常被选中
    expect(highCount).toBeGreaterThan(runs / 2);
  });
});


