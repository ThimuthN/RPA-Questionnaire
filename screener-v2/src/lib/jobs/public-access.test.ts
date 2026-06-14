import { afterAll, describe, expect, it, vi } from "vitest";

const originalPublicJobsEnabled = process.env.PUBLIC_JOBS_ENABLED;

describe("PUBLIC_JOBS_ENABLED", () => {
  it("defaults to enabled when no environment override is provided", async () => {
    vi.resetModules();
    delete process.env.PUBLIC_JOBS_ENABLED;

    const mod = await import("./public-access");
    expect(mod.PUBLIC_JOBS_ENABLED).toBe(true);
  });

  it("can be disabled with an environment flag", async () => {
    vi.resetModules();
    process.env.PUBLIC_JOBS_ENABLED = "false";

    const mod = await import("./public-access");
    expect(mod.PUBLIC_JOBS_ENABLED).toBe(false);
  });
});

afterAll(() => {
  process.env.PUBLIC_JOBS_ENABLED = originalPublicJobsEnabled;
});
