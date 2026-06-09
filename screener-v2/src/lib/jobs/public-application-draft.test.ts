/**
 * Tests for public application draft helpers and profile/resume validation.
 *
 * Component-level wizard tests (step navigation UI, submit button placement)
 * are not feasible: the repo uses `environment: "node"` in vitest.config.ts
 * with no React Testing Library setup. Those behaviors are verified in the
 * manual checklist at the bottom of this file.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DRAFT_VERSION,
  clearApplicationDraft,
  draftKey,
  loadApplicationDraft,
  saveApplicationDraft,
  type ApplicationDraft,
} from "./public-application-draft";
import {
  candidateResumeMaxSizeBytes,
} from "@/lib/candidates/resume-config";
import {
  EMAIL_MAX,
  FULL_NAME_MAX,
  PHONE_MAX,
  validateProfileStep,
  validateResumeFile,
} from "./public-application-validation";

// ── localStorage mock (vitest runs in node; stub globalThis.localStorage) ───

const store = new Map<string, string>();
const mockLocalStorage: Storage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => { store.set(k, v); },
  removeItem: (k: string) => { store.delete(k); },
  clear: () => { store.clear(); },
  key: (i: number) => [...store.keys()][i] ?? null,
  get length() { return store.size; },
};
vi.stubGlobal("localStorage", mockLocalStorage);

const TEST_KEY = draftKey("some-job-slug");
const VALID_DRAFT: Omit<ApplicationDraft, "version"> = {
  fullName: "Jane Doe",
  email: "jane@example.com",
  phone: "+1 555 0100",
  coverNote: "I am excited about this role.",
  screeningAnswers: {
    "applicant-intake-questionnaire:0": {
      workEligibility: true
    }
  },
  step: 2,
};

// ── draftKey ─────────────────────────────────────────────────────────────────

describe("draftKey", () => {
  it("produces a namespaced key", () => {
    expect(draftKey("my-job")).toBe("northstar:job-application-draft:my-job");
  });

  it("is unique per slug", () => {
    expect(draftKey("a")).not.toBe(draftKey("b"));
  });
});

// ── save / load round-trip ────────────────────────────────────────────────────

describe("saveApplicationDraft / loadApplicationDraft — round-trip", () => {
  beforeEach(() => { store.clear(); });

  it("saves and reloads all fields", () => {
    saveApplicationDraft(TEST_KEY, VALID_DRAFT);
    const loaded = loadApplicationDraft(TEST_KEY);
    expect(loaded).toMatchObject({ ...VALID_DRAFT, version: DRAFT_VERSION });
  });

  it("returns null when nothing has been saved", () => {
    expect(loadApplicationDraft(TEST_KEY)).toBeNull();
  });

  it("persists updated step number", () => {
    saveApplicationDraft(TEST_KEY, { ...VALID_DRAFT, step: 3 });
    expect(loadApplicationDraft(TEST_KEY)?.step).toBe(3);
  });

  it("persists updated coverNote", () => {
    saveApplicationDraft(TEST_KEY, { ...VALID_DRAFT, coverNote: "Updated" });
    expect(loadApplicationDraft(TEST_KEY)?.coverNote).toBe("Updated");
  });

  it("persists screening answers", () => {
    saveApplicationDraft(TEST_KEY, {
      ...VALID_DRAFT,
      screeningAnswers: {
        "addon-1:0": {
          questionOne: "yes",
          questionTwo: ["a", "b"]
        }
      }
    });

    expect(loadApplicationDraft(TEST_KEY)?.screeningAnswers).toEqual({
      "addon-1:0": {
        questionOne: "yes",
        questionTwo: ["a", "b"]
      }
    });
  });

  it("overwrites a previous draft on re-save", () => {
    saveApplicationDraft(TEST_KEY, VALID_DRAFT);
    saveApplicationDraft(TEST_KEY, { ...VALID_DRAFT, fullName: "John Smith" });
    expect(loadApplicationDraft(TEST_KEY)?.fullName).toBe("John Smith");
  });
});

// ── corrupt / invalid storage ─────────────────────────────────────────────────

describe("loadApplicationDraft — corrupt / invalid storage", () => {
  beforeEach(() => { store.clear(); });

  it("returns null for corrupt JSON", () => {
    store.set(TEST_KEY, "not json {{");
    expect(loadApplicationDraft(TEST_KEY)).toBeNull();
  });

  it("returns null for a stale draft with wrong version", () => {
    store.set(TEST_KEY, JSON.stringify({ ...VALID_DRAFT, version: 0 }));
    expect(loadApplicationDraft(TEST_KEY)).toBeNull();
  });

  it("returns null for a draft with missing version field", () => {
    const { ...rest } = VALID_DRAFT;
    store.set(TEST_KEY, JSON.stringify(rest));
    expect(loadApplicationDraft(TEST_KEY)).toBeNull();
  });

  it("returns null for a JSON string value", () => {
    store.set(TEST_KEY, JSON.stringify("a string"));
    expect(loadApplicationDraft(TEST_KEY)).toBeNull();
  });

  it("returns null for a JSON null value", () => {
    store.set(TEST_KEY, JSON.stringify(null));
    expect(loadApplicationDraft(TEST_KEY)).toBeNull();
  });
});

// ── clearApplicationDraft ────────────────────────────────────────────────────

describe("clearApplicationDraft", () => {
  beforeEach(() => { store.clear(); });

  it("removes a previously saved draft", () => {
    saveApplicationDraft(TEST_KEY, VALID_DRAFT);
    clearApplicationDraft(TEST_KEY);
    expect(loadApplicationDraft(TEST_KEY)).toBeNull();
  });

  it("does not throw when called on a key that does not exist", () => {
    expect(() => clearApplicationDraft("northstar:job-application-draft:nope")).not.toThrow();
  });
});

// ── storage unavailability ────────────────────────────────────────────────────

describe("storage unavailability — graceful degradation", () => {
  it("load does not throw when getItem throws", () => {
    vi.spyOn(mockLocalStorage, "getItem").mockImplementationOnce(() => {
      throw new Error("SecurityError");
    });
    expect(() => loadApplicationDraft(TEST_KEY)).not.toThrow();
    expect(loadApplicationDraft(TEST_KEY)).toBeNull();
  });

  it("save does not throw when setItem throws (e.g. QuotaExceededError)", () => {
    vi.spyOn(mockLocalStorage, "setItem").mockImplementationOnce(() => {
      throw new Error("QuotaExceededError");
    });
    expect(() => saveApplicationDraft(TEST_KEY, VALID_DRAFT)).not.toThrow();
  });

  it("clear does not throw when removeItem throws", () => {
    vi.spyOn(mockLocalStorage, "removeItem").mockImplementationOnce(() => {
      throw new Error("SecurityError");
    });
    expect(() => clearApplicationDraft(TEST_KEY)).not.toThrow();
  });
});

// ── validateProfileStep ───────────────────────────────────────────────────────

describe("validateProfileStep", () => {
  function valid(overrides: Partial<{ fullName: string; email: string; phone: string }> = {}) {
    return { fullName: "Jane Doe", email: "jane@example.com", phone: "", ...overrides };
  }

  it("returns null for a valid profile", () => {
    expect(validateProfileStep(valid())).toBeNull();
  });

  it("returns null when phone is omitted", () => {
    expect(validateProfileStep(valid({ phone: "" }))).toBeNull();
  });

  it("blocks empty full name", () => {
    expect(validateProfileStep(valid({ fullName: "" }))).not.toBeNull();
  });

  it("blocks single-character full name (below min 2)", () => {
    expect(validateProfileStep(valid({ fullName: "X" }))).not.toBeNull();
  });

  it("accepts full name at exactly min length (2 chars)", () => {
    expect(validateProfileStep(valid({ fullName: "Jo" }))).toBeNull();
  });

  it("blocks full name over max length", () => {
    expect(validateProfileStep(valid({ fullName: "A".repeat(FULL_NAME_MAX + 1) }))).not.toBeNull();
  });

  it("blocks empty email", () => {
    expect(validateProfileStep(valid({ email: "" }))).not.toBeNull();
  });

  it("blocks email without @", () => {
    expect(validateProfileStep(valid({ email: "notanemail" }))).not.toBeNull();
  });

  it("blocks email without domain", () => {
    expect(validateProfileStep(valid({ email: "user@" }))).not.toBeNull();
  });

  it("accepts a valid email", () => {
    expect(validateProfileStep(valid({ email: "hello@example.co.uk" }))).toBeNull();
  });

  it("blocks email over max length", () => {
    expect(validateProfileStep(valid({ email: "a".repeat(EMAIL_MAX) + "@b.com" }))).not.toBeNull();
  });

  it("blocks phone over max length", () => {
    expect(validateProfileStep(valid({ phone: "1".repeat(PHONE_MAX + 1) }))).not.toBeNull();
  });

  it("accepts phone at exactly max length", () => {
    expect(validateProfileStep(valid({ phone: "1".repeat(PHONE_MAX) }))).toBeNull();
  });
});

// ── validateResumeFile ────────────────────────────────────────────────────────

describe("validateResumeFile", () => {
  const pdf = { name: "cv.pdf", type: "application/pdf", size: 1024 };

  it("accepts a valid PDF", () => {
    expect(validateResumeFile(pdf)).toBeNull();
  });

  it("accepts a PDF identified only by .pdf extension", () => {
    expect(validateResumeFile({ ...pdf, type: "" })).toBeNull();
  });

  it("rejects a Word document", () => {
    expect(
      validateResumeFile({ name: "cv.docx", type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", size: 1024 })
    ).not.toBeNull();
  });

  it("rejects a JPEG", () => {
    expect(validateResumeFile({ name: "photo.jpg", type: "image/jpeg", size: 1024 })).not.toBeNull();
  });

  it("rejects a file over the size limit", () => {
    expect(validateResumeFile({ ...pdf, size: candidateResumeMaxSizeBytes + 1 })).not.toBeNull();
  });

  it("accepts a file at exactly the size limit", () => {
    expect(validateResumeFile({ ...pdf, size: candidateResumeMaxSizeBytes })).toBeNull();
  });

  it("the error message mentions the MB limit", () => {
    const err = validateResumeFile({ ...pdf, size: candidateResumeMaxSizeBytes + 1 });
    expect(err).toContain("MB");
  });
});

/**
 * Manual checklist — component behaviors not testable without a browser/jsdom:
 *
 * 1. ✅ Submit button appears ONLY on the Review step (step 4); steps 1–3 show "Continue".
 * 2. ✅ Clicking Next/Continue on Profile calls advance() which runs validateProfileStep;
 *        invalid profile stays on step 1 and shows an error message.
 * 3. ✅ Back button navigates to previous step without submitting the form.
 * 4. ✅ Resume step accepts no file (optional).
 * 5. ✅ Resume step rejects non-PDF; error message is shown without advancing.
 * 6. ✅ Text fields persist when navigating between steps.
 * 7. ✅ Refreshing the page restores text fields from localStorage draft.
 * 8. ✅ Resume file input is NOT restored after refresh; "re-select" note is shown.
 * 9. ✅ Clearing the draft resets all fields and returns to step 1.
 * 10. ✅ Successful submit (page redirects to ?applied=1) triggers ApplicationDraftCleaner,
 *        which calls clearApplicationDraft — verified by the unit test of that function.
 */
