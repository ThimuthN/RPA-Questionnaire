"use client";

import { useState, useTransition } from "react";
import { Shield, Lock, KeyRound, Clock, ChevronRight } from "lucide-react";

export interface SecuritySettings {
  mfaEnforcement: string;
  passwordMinLength: number;
  requireUppercase: boolean;
  requireNumber: boolean;
  requireSpecial: boolean;
  sessionDays: number;
  lockoutThreshold: number;
  lockoutMinutes: number;
}

interface Props {
  initial: SecuritySettings;
}

const MFA_OPTIONS = [
  {
    value: "off",
    label: "Optional",
    description: "Users choose whether to enable 2FA on their account.",
  },
  {
    value: "admins",
    label: "Required for admins",
    description: "Users with manage_users, manage_integrations, or manage_roles must enroll.",
  },
  {
    value: "all",
    label: "Required for everyone",
    description: "All users must complete 2FA enrollment before accessing the workspace.",
  },
] as const;

const SESSION_OPTIONS = [
  { value: 1, label: "1 day" },
  { value: 3, label: "3 days" },
  { value: 7, label: "7 days (default)" },
  { value: 14, label: "14 days" },
  { value: 30, label: "30 days" },
];

const LOCKOUT_MINUTE_OPTIONS = [
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes (default)" },
  { value: 60, label: "1 hour" },
  { value: 120, label: "2 hours" },
  { value: 480, label: "8 hours" },
];

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[color:var(--app-border)] bg-[color:var(--app-card)] p-6">
      <div className="flex items-start gap-3 pb-4 border-b border-[color:var(--app-border)]">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[color:var(--app-brand-soft)]">
          <Icon className="h-4 w-4 text-[color:var(--app-brand)]" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-[color:var(--app-heading)]">{title}</h2>
          <p className="mt-0.5 text-xs text-[color:var(--app-muted)]">{description}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function RadioOption({
  value,
  current,
  label,
  description,
  onChange,
}: {
  value: string;
  current: string;
  label: string;
  description: string;
  onChange: (v: string) => void;
}) {
  const selected = value === current;
  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      className={`flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${
        selected
          ? "border-[color:var(--app-brand)] bg-[color:var(--app-brand-soft)]"
          : "border-[color:var(--app-border)] hover:border-[color:var(--app-brand)]"
      }`}
    >
      <div
        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
          selected ? "border-[color:var(--app-brand)]" : "border-[color:var(--app-muted)]"
        }`}
      >
        {selected && (
          <div className="h-2 w-2 rounded-full bg-[color:var(--app-brand)]" />
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-[color:var(--app-heading)]">{label}</p>
        <p className="mt-0.5 text-xs text-[color:var(--app-muted)]">{description}</p>
      </div>
    </button>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-[color:var(--app-border)] last:border-0">
      <div>
        <p className="text-sm font-medium text-[color:var(--app-text)]">{label}</p>
        {description && <p className="mt-0.5 text-xs text-[color:var(--app-muted)]">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--app-brand)] ${
          checked ? "bg-[color:var(--app-brand)]" : "bg-[color:var(--app-border)]"
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

export function SecuritySettingsClient({ initial }: Props) {
  const [settings, setSettings] = useState<SecuritySettings>(initial);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof SecuritySettings>(key: K, value: SecuritySettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
    setError(null);
  }

  function handleSave() {
    startTransition(async () => {
      setError(null);
      try {
        const res = await fetch("/api/security-settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(settings),
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.message ?? "Failed to save.");
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save settings.");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* MFA Enforcement */}
      <SectionCard
        icon={Shield}
        title="Multi-factor authentication"
        description="Require TOTP or backup code verification on login."
      >
        <div className="space-y-2">
          {MFA_OPTIONS.map((opt) => (
            <RadioOption
              key={opt.value}
              value={opt.value}
              current={settings.mfaEnforcement}
              label={opt.label}
              description={opt.description}
              onChange={(v) => update("mfaEnforcement", v)}
            />
          ))}
        </div>
      </SectionCard>

      {/* Account Lockout */}
      <SectionCard
        icon={Lock}
        title="Account lockout"
        description="Temporarily lock accounts after repeated failed login attempts."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-[color:var(--app-muted)] mb-1.5">
              Failed attempts before lockout
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={3}
                max={100}
                value={settings.lockoutThreshold}
                onChange={(e) => update("lockoutThreshold", Math.max(3, Math.min(100, parseInt(e.target.value) || 10)))}
                className="w-20 rounded-lg border border-[color:var(--app-border)] bg-[color:var(--app-bg)] px-3 py-2 text-sm text-[color:var(--app-text)] focus:border-[color:var(--app-brand)] focus:outline-none"
              />
              <span className="text-xs text-[color:var(--app-muted)]">attempts</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[color:var(--app-muted)] mb-1.5">
              Lockout duration
            </label>
            <select
              value={settings.lockoutMinutes}
              onChange={(e) => update("lockoutMinutes", parseInt(e.target.value))}
              className="w-full rounded-lg border border-[color:var(--app-border)] bg-[color:var(--app-bg)] px-3 py-2 text-sm text-[color:var(--app-text)] focus:border-[color:var(--app-brand)] focus:outline-none"
            >
              {LOCKOUT_MINUTE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </SectionCard>

      {/* Password Requirements */}
      <SectionCard
        icon={KeyRound}
        title="Password requirements"
        description="Enforced on account creation, invite acceptance, and password reset."
      >
        <div className="space-y-1 mb-4">
          <label className="block text-xs font-medium text-[color:var(--app-muted)] mb-1.5">
            Minimum length
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={6}
              max={64}
              value={settings.passwordMinLength}
              onChange={(e) => update("passwordMinLength", Math.max(6, Math.min(64, parseInt(e.target.value) || 8)))}
              className="w-20 rounded-lg border border-[color:var(--app-border)] bg-[color:var(--app-bg)] px-3 py-2 text-sm text-[color:var(--app-text)] focus:border-[color:var(--app-brand)] focus:outline-none"
            />
            <span className="text-xs text-[color:var(--app-muted)]">characters</span>
          </div>
        </div>
        <div>
          <Toggle
            checked={settings.requireUppercase}
            onChange={(v) => update("requireUppercase", v)}
            label="Require uppercase letter"
            description="At least one A–Z character."
          />
          <Toggle
            checked={settings.requireNumber}
            onChange={(v) => update("requireNumber", v)}
            label="Require number"
            description="At least one 0–9 digit."
          />
          <Toggle
            checked={settings.requireSpecial}
            onChange={(v) => update("requireSpecial", v)}
            label="Require special character"
            description="At least one character like !@#$%^&*."
          />
        </div>
      </SectionCard>

      {/* Session Duration */}
      <SectionCard
        icon={Clock}
        title="Session duration"
        description="How long users stay logged in before requiring re-authentication."
      >
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {SESSION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => update("sessionDays", opt.value)}
              className={`rounded-lg border px-3 py-2.5 text-center text-xs font-medium transition-colors ${
                settings.sessionDays === opt.value
                  ? "border-[color:var(--app-brand)] bg-[color:var(--app-brand-soft)] text-[color:var(--app-brand)]"
                  : "border-[color:var(--app-border)] text-[color:var(--app-muted)] hover:border-[color:var(--app-brand)] hover:text-[color:var(--app-text)]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-[color:var(--app-muted)]">
          Changing session duration affects newly issued tokens only. Existing sessions remain valid until their current expiry.
        </p>
      </SectionCard>

      {/* SSO placeholder */}
      <div className="rounded-xl border border-dashed border-[color:var(--app-border)] p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[color:var(--app-bg)]">
              <ChevronRight className="h-4 w-4 text-[color:var(--app-muted)]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[color:var(--app-heading)]">Single sign-on (SSO)</p>
              <p className="mt-0.5 text-xs text-[color:var(--app-muted)]">
                SAML 2.0 / OIDC with JIT provisioning. Coming soon — connect your IdP to enforce SSO and control password fallback.
              </p>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-[color:var(--app-bg)] border border-[color:var(--app-border)] px-2.5 py-1 text-xs font-medium text-[color:var(--app-muted)]">
            Coming soon
          </span>
        </div>
      </div>

      {/* Save bar */}
      <div className="flex items-center justify-between rounded-xl border border-[color:var(--app-border)] bg-[color:var(--app-card)] px-5 py-4">
        <div>
          {error && <p className="text-sm text-[color:var(--pill-red-text)]">{error}</p>}
          {saved && <p className="text-sm text-[color:var(--pill-emerald-text)]">Settings saved.</p>}
          {!error && !saved && (
            <p className="text-xs text-[color:var(--app-muted)]">Changes apply to new logins immediately.</p>
          )}
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="rounded-full bg-[color:var(--app-brand)] px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
