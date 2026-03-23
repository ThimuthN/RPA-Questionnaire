export type InviteValidationState =
  | "valid"
  | "invalid"
  | "expired"
  | "attempt_limit_reached"
  | "passcode_required"
  | "passcode_invalid";

export interface InviteValidationResult {
  ok: boolean;
  state: InviteValidationState;
  message: string;
  remainingAttempts: number;
}

interface BuildInviteValidationArgs {
  exists: boolean;
  expired: boolean;
  attemptLimitReached: boolean;
  requiresPasscode: boolean;
  passcodeProvided: boolean;
  passcodeMatches: boolean;
  roleMismatch: boolean;
  remainingAttempts: number;
}

export function buildInviteValidationResult(args: BuildInviteValidationArgs): InviteValidationResult {
  if (!args.exists || args.roleMismatch) {
    return {
      ok: false,
      state: "invalid",
      message: "This assessment link is not available.",
      remainingAttempts: 0
    };
  }

  if (args.expired) {
    return {
      ok: false,
      state: "expired",
      message: "This assessment link has expired.",
      remainingAttempts: 0
    };
  }

  if (args.attemptLimitReached) {
    return {
      ok: false,
      state: "attempt_limit_reached",
      message: "This assessment link has already been used.",
      remainingAttempts: 0
    };
  }

  if (args.requiresPasscode && !args.passcodeProvided) {
    return {
      ok: false,
      state: "passcode_required",
      message: "Enter the passcode to continue with this assessment.",
      remainingAttempts: args.remainingAttempts
    };
  }

  if (args.requiresPasscode && !args.passcodeMatches) {
    return {
      ok: false,
      state: "passcode_invalid",
      message: "That passcode did not match this assessment.",
      remainingAttempts: args.remainingAttempts
    };
  }

  return {
    ok: true,
    state: "valid",
    message: "Assessment access is ready.",
    remainingAttempts: args.remainingAttempts
  };
}

export function isInvitePasscodeState(state: InviteValidationState) {
  return state === "passcode_required" || state === "passcode_invalid";
}

export function isInviteBlockedState(state: InviteValidationState) {
  return state === "invalid" || state === "expired" || state === "attempt_limit_reached";
}
