import { describe, expect, it } from "vitest";
import { getIntegrityPolicy, normalizeIntegrityPreset } from "@/lib/integrity/policy";

describe("integrity policy", () => {
  it("falls back old records to strict when no preset is stored", () => {
    expect(normalizeIntegrityPreset(undefined, "strict")).toBe("strict");
    expect(getIntegrityPolicy(undefined).requireFullscreen).toBe(true);
  });

  it("maps standard and relaxed presets to different runtime behavior", () => {
    expect(getIntegrityPolicy("standard").requireFullscreen).toBe(false);
    expect(getIntegrityPolicy("standard").blockClipboard).toBe(true);
    expect(getIntegrityPolicy("relaxed").blockClipboard).toBe(false);
    expect(getIntegrityPolicy("relaxed").blurShieldEnabled).toBe(false);
  });
});
