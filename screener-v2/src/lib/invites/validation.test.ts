import { describe, expect, it } from "vitest";
import {
  buildInviteValidationResult,
  isInviteBlockedState,
  isInvitePasscodeState
} from "@/lib/invites/validation";

describe("buildInviteValidationResult", () => {
  it("returns passcode_required when a protected invite is opened without a passcode", () => {
    const result = buildInviteValidationResult({
      exists: true,
      expired: false,
      attemptLimitReached: false,
      requiresPasscode: true,
      passcodeProvided: false,
      passcodeMatches: false,
      roleMismatch: false,
      remainingAttempts: 1
    });

    expect(result.ok).toBe(false);
    expect(result.state).toBe("passcode_required");
    expect(isInvitePasscodeState(result.state)).toBe(true);
  });

  it("returns expired before other recoverable states", () => {
    const result = buildInviteValidationResult({
      exists: true,
      expired: true,
      attemptLimitReached: false,
      requiresPasscode: true,
      passcodeProvided: true,
      passcodeMatches: true,
      roleMismatch: false,
      remainingAttempts: 0
    });

    expect(result.ok).toBe(false);
    expect(result.state).toBe("expired");
    expect(isInviteBlockedState(result.state)).toBe(true);
  });
});
