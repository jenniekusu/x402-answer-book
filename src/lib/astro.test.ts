import { describe, expect, it } from "vitest";
import { getSunSign } from "./astro";

describe("getSunSign", () => {
  it("returns correct signs for a few known dates", () => {
    expect(getSunSign("1995-03-21")).toBe("Aries"); // Aries season start
    expect(getSunSign("1995-04-19")).toBe("Aries");
    expect(getSunSign("1995-04-20")).toBe("Taurus");
    expect(getSunSign("1995-08-01")).toBe("Leo");
    expect(getSunSign("1995-12-25")).toBe("Capricorn");
  });

  it("returns Unknown for invalid dates", () => {
    expect(getSunSign("not-a-date")).toBe("Unknown");
  });
});

