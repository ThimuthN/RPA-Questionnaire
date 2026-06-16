"use client";

import { useState } from "react";
import { Shield, ShieldCheck, ShieldOff, Copy, Download, Smartphone, CheckCircle2, AlertTriangle, Loader2, Trash2, RefreshCw } from "lucide-react";

type TrustedDevice = {
  id: string;
  deviceLabel: string | null;
  lastUsedAt: string;
  expiresAt: string;
  createdAt: string;
};

type Props = {
  mfaEnabled: boolean;
  mfaEnrolledAt: string | null;
  backupCodesRemaining: number;
  trustedDevices: TrustedDevice[];
};

type WizardStep = "idle" | "app" | "qr" | "verify" | "codes" | "done";

export function MfaSecurityClient({ mfaEnabled, mfaEnrolledAt, backupCodesRemaining, trustedDevices }: Props) {
  const [enabled, setEnabled] = useState(mfaEnabled);
  const [enrolledAt, setEnrolledAt] = useState(mfaEnrolledAt);
  const [codesRemaining, setCodesRemaining] = useState(backupCodesRemaining);
  const [devices, setDevices] = useState(trustedDevices);
  const [wizardStep, setWizardStep] = useState<WizardStep>("idle");
  const [qrData, setQrData] = useState<{ qrCodeDataUrl: string; secret: string } | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [disableCode, setDisableCode] = useState("");
  const [showDisable, setShowDisable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function startSetup() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/mfa/setup");
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Failed to start setup.");
      setQrData({ qrCodeDataUrl: data.qrCodeDataUrl, secret: data.secret });
      setWizardStep("app");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function verifyAndEnable() {
    if (!qrData || verifyCode.length < 6) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/mfa/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: qrData.secret, code: verifyCode.replace(/\s/g, "") })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Invalid code.");
      setBackupCodes(data.backupCodes);
      setWizardStep("codes");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function completeSetup() {
    setEnabled(true);
    setEnrolledAt(new Date().toISOString());
    setCodesRemaining(10);
    setWizardStep("idle");
    setQrData(null);
    setVerifyCode("");
    setBackupCodes([]);
  }

  async function disableMfa() {
    if (disableCode.length < 6) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/mfa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: disableCode.replace(/\s/g, "") })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Invalid code.");
      setEnabled(false);
      setEnrolledAt(null);
      setDevices([]);
      setShowDisable(false);
      setDisableCode("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function revokeDevice(deviceId: string) {
    try {
      await fetch("/api/auth/mfa/devices", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId })
      });
      setDevices((prev) => prev.filter((d) => d.id !== deviceId));
    } catch {}
  }

  async function copyAll() {
    await navigator.clipboard.writeText(backupCodes.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadCodes() {
    const blob = new Blob([backupCodes.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "northstar-backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  }

  // ── Wizard overlay ────────────────────────────────────────────────────────

  if (wizardStep !== "idle") {
    return (
      <div className="rounded-2xl border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-8">
        {/* Progress */}
        <div className="mb-8 flex items-center gap-2">
          {(["app", "qr", "verify", "codes"] as WizardStep[]).map((step, i) => {
            const steps: WizardStep[] = ["app", "qr", "verify", "codes"];
            const currentIdx = steps.indexOf(wizardStep);
            const done = i < currentIdx;
            const active = step === wizardStep;
            return (
              <div key={step} className="flex items-center gap-2">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${done ? "bg-[color:var(--app-brand)] text-white" : active ? "border-2 border-[color:var(--app-brand)] text-[color:var(--app-brand)]" : "border border-[color:var(--app-border)] text-[color:var(--app-muted)]"}`}>
                  {done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </div>
                {i < 3 && <div className={`h-px w-8 transition-colors ${done ? "bg-[color:var(--app-brand)]" : "bg-[color:var(--app-border)]"}`} />}
              </div>
            );
          })}
        </div>

        {/* Step: Download app */}
        {wizardStep === "app" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-[color:var(--app-heading)]">Download an authenticator app</h2>
              <p className="mt-1 text-sm text-[color:var(--app-muted)]">You&apos;ll need an app to generate one-time codes. Any of these work:</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { name: "Google Authenticator", sub: "iOS / Android" },
                { name: "Authy", sub: "iOS / Android / Desktop" },
                { name: "1Password", sub: "Built-in authenticator" }
              ].map((app) => (
                <div key={app.name} className="rounded-xl border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4 text-center">
                  <Smartphone className="mx-auto mb-2 h-6 w-6 text-[color:var(--app-brand)]" />
                  <p className="text-sm font-medium text-[color:var(--app-heading)]">{app.name}</p>
                  <p className="mt-0.5 text-xs text-[color:var(--app-muted)]">{app.sub}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setWizardStep("qr")} className="flex-1 rounded-xl bg-[color:var(--app-brand)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[color:var(--app-brand-strong)]">
                I have an app →
              </button>
              <button onClick={() => { setWizardStep("idle"); setQrData(null); }} className="rounded-xl border border-[color:var(--app-border)] px-4 py-2.5 text-sm text-[color:var(--app-muted)] transition hover:bg-[color:var(--app-surface-soft)]">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Step: Scan QR */}
        {wizardStep === "qr" && qrData && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-[color:var(--app-heading)]">Scan the QR code</h2>
              <p className="mt-1 text-sm text-[color:var(--app-muted)]">Open your authenticator app and scan this code.</p>
            </div>
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-2xl border border-[color:var(--app-border)] bg-white p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrData.qrCodeDataUrl} alt="MFA QR Code" className="h-[200px] w-[200px]" />
              </div>
              <details className="w-full">
                <summary className="cursor-pointer text-center text-xs text-[color:var(--app-muted)] hover:text-[color:var(--app-text)]">
                  Can&apos;t scan? Enter the code manually
                </summary>
                <div className="mt-2 rounded-xl border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-4 py-3">
                  <p className="mb-1 text-xs text-[color:var(--app-muted)]">Secret key</p>
                  <p className="break-all font-mono text-sm text-[color:var(--app-text)]">{qrData.secret}</p>
                </div>
              </details>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setWizardStep("verify")} className="flex-1 rounded-xl bg-[color:var(--app-brand)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[color:var(--app-brand-strong)]">
                I&apos;ve scanned it →
              </button>
              <button onClick={() => setWizardStep("app")} className="rounded-xl border border-[color:var(--app-border)] px-4 py-2.5 text-sm text-[color:var(--app-muted)] transition hover:bg-[color:var(--app-surface-soft)]">
                Back
              </button>
            </div>
          </div>
        )}

        {/* Step: Verify */}
        {wizardStep === "verify" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-[color:var(--app-heading)]">Enter the verification code</h2>
              <p className="mt-1 text-sm text-[color:var(--app-muted)]">Enter the 6-digit code from your authenticator app to confirm setup.</p>
            </div>
            {error && (
              <div className="rounded-lg border border-[color:var(--app-danger-soft)] bg-[color:var(--app-danger-soft)] px-4 py-3 text-sm text-[color:var(--app-danger)]">
                {error}
              </div>
            )}
            <input
              type="text"
              inputMode="numeric"
              autoFocus
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value.replace(/[^0-9\s]/g, "").slice(0, 7))}
              placeholder="000 000"
              className="w-full rounded-xl border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-center text-xl font-mono tracking-[0.3em] text-[color:var(--app-text)] placeholder:text-[color:var(--app-muted)] placeholder:tracking-[0.3em] outline-none transition focus:border-[color:var(--app-brand)] focus:ring-2 focus:ring-[color:var(--app-brand-soft)]"
            />
            <div className="flex gap-3">
              <button
                onClick={verifyAndEnable}
                disabled={loading || verifyCode.replace(/\s/g, "").length < 6}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[color:var(--app-brand)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[color:var(--app-brand-strong)] disabled:opacity-50"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Verify & enable
              </button>
              <button onClick={() => setWizardStep("qr")} className="rounded-xl border border-[color:var(--app-border)] px-4 py-2.5 text-sm text-[color:var(--app-muted)] transition hover:bg-[color:var(--app-surface-soft)]">
                Back
              </button>
            </div>
          </div>
        )}

        {/* Step: Backup codes */}
        {wizardStep === "codes" && (
          <div className="space-y-6">
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800/40 dark:bg-amber-900/20">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <p className="text-sm text-amber-700 dark:text-amber-300">
                <span className="font-semibold">Save these codes now.</span> They won&apos;t be shown again. Each can be used once to sign in if you lose access to your authenticator.
              </p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[color:var(--app-heading)]">Your backup codes</h2>
              <p className="mt-1 text-sm text-[color:var(--app-muted)]">Store these somewhere safe — a password manager or printed copy.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
              {backupCodes.map((code) => (
                <code key={code} className="rounded-lg bg-[color:var(--app-control-bg)] px-3 py-2 text-center font-mono text-sm tracking-widest text-[color:var(--app-text)]">
                  {code}
                </code>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={copyAll} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-2.5 text-sm font-medium text-[color:var(--app-text)] transition hover:bg-[color:var(--app-surface-soft)]">
                {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied!" : "Copy all"}
              </button>
              <button onClick={downloadCodes} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-2.5 text-sm font-medium text-[color:var(--app-text)] transition hover:bg-[color:var(--app-surface-soft)]">
                <Download className="h-4 w-4" />
                Download
              </button>
            </div>
            <button onClick={completeSetup} className="w-full rounded-xl bg-[color:var(--app-brand)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[color:var(--app-brand-strong)]">
              I&apos;ve saved my codes — finish setup
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Main view ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* MFA status card */}
      <div className="rounded-2xl border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-6">
        <div className="flex items-start gap-4">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${enabled ? "bg-green-100 dark:bg-green-900/30" : "bg-[color:var(--app-surface-soft)]"}`}>
            {enabled
              ? <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
              : <Shield className="h-5 w-5 text-[color:var(--app-muted)]" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-[color:var(--app-heading)]">
                Two-Factor Authentication
              </h2>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${enabled ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400" : "bg-[color:var(--app-surface-soft)] text-[color:var(--app-muted)]"}`}>
                {enabled ? "Enabled" : "Disabled"}
              </span>
            </div>
            <p className="mt-1 text-sm text-[color:var(--app-muted)]">
              {enabled
                ? `Added extra protection to your account${enrolledAt ? ` · Enabled ${formatDate(enrolledAt)}` : ""}`
                : "Add an extra layer of security. When enabled, you'll enter a code from your phone when signing in."}
            </p>
          </div>
          {!enabled && (
            <button
              onClick={startSetup}
              disabled={loading}
              className="flex shrink-0 items-center gap-2 rounded-xl bg-[color:var(--app-brand)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[color:var(--app-brand-strong)] disabled:opacity-50"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Set up
            </button>
          )}
        </div>

        {enabled && (
          <div className="mt-5 space-y-4 border-t border-[color:var(--app-border)] pt-5">

            {/* Backup codes status */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[color:var(--app-text)]">Backup codes</p>
                <p className={`text-xs mt-0.5 ${codesRemaining <= 3 ? "text-amber-600 dark:text-amber-400" : "text-[color:var(--app-muted)]"}`}>
                  {codesRemaining} of 10 remaining
                  {codesRemaining <= 3 && " · Consider regenerating"}
                </p>
              </div>
            </div>

            {/* Disable MFA */}
            {!showDisable ? (
              <button
                onClick={() => { setShowDisable(true); setError(null); }}
                className="flex items-center gap-2 text-sm text-[color:var(--app-danger)] transition hover:opacity-70"
              >
                <ShieldOff className="h-4 w-4" />
                Disable two-factor authentication
              </button>
            ) : (
              <div className="rounded-xl border border-[color:var(--app-danger-soft)] bg-[color:var(--app-danger-soft)]/30 p-4 space-y-3">
                <p className="text-sm font-medium text-[color:var(--app-danger)]">Confirm disable</p>
                <p className="text-xs text-[color:var(--app-muted)]">Enter your authenticator code to disable 2FA. All trusted devices will be removed.</p>
                {error && <p className="text-xs text-[color:var(--app-danger)]">{error}</p>}
                <input
                  type="text"
                  inputMode="numeric"
                  autoFocus
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value.replace(/[^0-9\s]/g, "").slice(0, 7))}
                  placeholder="000 000"
                  className="w-full rounded-xl border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-2.5 text-center font-mono tracking-[0.25em] text-[color:var(--app-text)] placeholder:text-[color:var(--app-muted)] outline-none transition focus:border-[color:var(--app-danger)] focus:ring-2 focus:ring-[color:var(--app-danger)]/20"
                />
                <div className="flex gap-2">
                  <button
                    onClick={disableMfa}
                    disabled={loading || disableCode.replace(/\s/g, "").length < 6}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[color:var(--app-danger)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                  >
                    {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Disable
                  </button>
                  <button onClick={() => { setShowDisable(false); setDisableCode(""); setError(null); }} className="flex-1 rounded-xl border border-[color:var(--app-border)] px-4 py-2 text-sm text-[color:var(--app-muted)] transition hover:bg-[color:var(--app-surface-soft)]">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Trusted devices */}
      {enabled && (
        <div className="rounded-2xl border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-[color:var(--app-heading)]">Trusted devices</h2>
              <p className="mt-0.5 text-sm text-[color:var(--app-muted)]">Devices that skip 2FA for 30 days.</p>
            </div>
          </div>

          {devices.length === 0 ? (
            <p className="text-sm text-[color:var(--app-muted)]">No trusted devices yet.</p>
          ) : (
            <div className="space-y-2">
              {devices.map((device) => (
                <div key={device.id} className="flex items-center justify-between rounded-xl border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Smartphone className="h-4 w-4 shrink-0 text-[color:var(--app-muted)]" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[color:var(--app-text)]">{device.deviceLabel ?? "Unknown device"}</p>
                      <p className="text-xs text-[color:var(--app-muted)]">
                        Last used {formatDate(device.lastUsedAt)} · Expires {formatDate(device.expiresAt)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => revokeDevice(device.id)}
                    className="ml-3 flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-[color:var(--app-muted)] transition hover:bg-[color:var(--app-danger-soft)] hover:text-[color:var(--app-danger)]"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Revoke
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
