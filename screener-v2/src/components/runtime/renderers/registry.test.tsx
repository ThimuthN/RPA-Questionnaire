import { describe, expect, it } from "vitest";
import { getQuestionRuntimeFormatDefinition, questionRuntimeFormatRegistry } from "@/components/runtime/renderers/registry";

describe("question runtime format registry", () => {
  it("returns definitions for supported formats", () => {
    const definition = getQuestionRuntimeFormatDefinition("single_select");
    expect(definition).not.toBeNull();
    expect(definition?.label).toBe("Single select");
  });

  it("returns null for unsupported formats", () => {
    expect(getQuestionRuntimeFormatDefinition("imaginary_format")).toBeNull();
  });

  it("keeps all registered formats supplied with labels and hints", () => {
    for (const definition of Object.values(questionRuntimeFormatRegistry)) {
      expect(definition.label.trim().length).toBeGreaterThan(0);
      expect(definition.hint.trim().length).toBeGreaterThan(0);
      expect(definition.Renderer).toBeTruthy();
    }
  });
});
