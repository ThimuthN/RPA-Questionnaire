import { describe, expect, it } from "vitest";
import { safeLocalPath } from "./safe-local-path";

describe("safeLocalPath", () => {
  it("allows ordinary local paths", () => {
    expect(safeLocalPath("/people/candidates?stage=pipeline")).toBe("/people/candidates?stage=pipeline");
  });

  it("rejects protocol-relative external paths", () => {
    expect(safeLocalPath("//evil.example/phish")).toBeUndefined();
  });

  it("rejects absolute external URLs", () => {
    expect(safeLocalPath("https://evil.example/phish")).toBeUndefined();
  });
});
