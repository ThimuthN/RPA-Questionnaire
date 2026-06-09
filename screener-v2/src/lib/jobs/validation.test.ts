import { describe, expect, it } from "vitest";
import { INT4_MAX, parseSalaryField, parseTeamSizeField, validateSalaryRange } from "./validation";

describe("parseSalaryField", () => {
  it("returns undefined for an empty string", () => {
    expect(parseSalaryField("")).toBeUndefined();
  });

  it("returns undefined for a whitespace-only string", () => {
    expect(parseSalaryField("   ")).toBeUndefined();
  });

  it("returns undefined for undefined input (optional field)", () => {
    expect(parseSalaryField(undefined)).toBeUndefined();
  });

  it("parses a valid whole number", () => {
    expect(parseSalaryField("120000")).toBe(120000);
  });

  it("parses zero as valid", () => {
    expect(parseSalaryField("0")).toBe(0);
  });

  it("parses the INT4_MAX boundary value", () => {
    expect(parseSalaryField(String(INT4_MAX))).toBe(INT4_MAX);
  });

  it("rejects a decimal number", () => {
    expect(() => parseSalaryField("1000.50")).toThrow("Salary must be a whole number.");
  });

  it("rejects a fractional string", () => {
    expect(() => parseSalaryField("1.1")).toThrow("Salary must be a whole number.");
  });

  it("rejects a non-numeric string", () => {
    expect(() => parseSalaryField("abc")).toThrow("Salary must be a whole number.");
  });

  it("rejects a negative number", () => {
    expect(() => parseSalaryField("-1")).toThrow("Salary cannot be negative.");
  });

  it("rejects a large negative number", () => {
    expect(() => parseSalaryField("-100000")).toThrow("Salary cannot be negative.");
  });

  it("rejects a value one above INT4_MAX", () => {
    expect(() => parseSalaryField(String(INT4_MAX + 1))).toThrow("Salary is too large.");
  });

  it("rejects a value that overflows INT4 range (e.g. 123123123213)", () => {
    expect(() => parseSalaryField("123123123213")).toThrow("Salary is too large.");
  });
});

describe("validateSalaryRange", () => {
  it("passes when both values are undefined", () => {
    expect(() => validateSalaryRange(undefined, undefined)).not.toThrow();
  });

  it("passes when only min is provided", () => {
    expect(() => validateSalaryRange(100000, undefined)).not.toThrow();
  });

  it("passes when only max is provided", () => {
    expect(() => validateSalaryRange(undefined, 150000)).not.toThrow();
  });

  it("passes when min equals max", () => {
    expect(() => validateSalaryRange(100000, 100000)).not.toThrow();
  });

  it("passes when min is less than max", () => {
    expect(() => validateSalaryRange(100000, 150000)).not.toThrow();
  });

  it("throws when min is greater than max", () => {
    expect(() => validateSalaryRange(150000, 100000)).toThrow(
      "Minimum salary cannot be greater than maximum salary."
    );
  });
});

describe("parseTeamSizeField", () => {
  it("returns undefined for empty string", () => {
    expect(parseTeamSizeField("")).toBeUndefined();
  });

  it("returns undefined for whitespace-only string", () => {
    expect(parseTeamSizeField("   ")).toBeUndefined();
  });

  it("returns undefined for undefined input (optional field)", () => {
    expect(parseTeamSizeField(undefined)).toBeUndefined();
  });

  it("accepts 1 (minimum valid value)", () => {
    expect(parseTeamSizeField("1")).toBe(1);
  });

  it("accepts 500 (maximum valid value)", () => {
    expect(parseTeamSizeField("500")).toBe(500);
  });

  it("accepts a mid-range value", () => {
    expect(parseTeamSizeField("12")).toBe(12);
  });

  it("rejects 0", () => {
    expect(() => parseTeamSizeField("0")).toThrow("Team size must be at least 1.");
  });

  it("rejects negative values", () => {
    expect(() => parseTeamSizeField("-1")).toThrow("Team size must be at least 1.");
  });

  it("rejects decimal values", () => {
    expect(() => parseTeamSizeField("4.5")).toThrow("Team size must be a whole number.");
  });

  it("rejects non-numeric strings", () => {
    expect(() => parseTeamSizeField("ten")).toThrow("Team size must be a whole number.");
  });

  it("rejects values above 500", () => {
    expect(() => parseTeamSizeField("501")).toThrow("Team size is too large.");
  });

  it("rejects huge values that would overflow Prisma INT4", () => {
    expect(() => parseTeamSizeField("999999999999")).toThrow("Team size is too large.");
  });
});
