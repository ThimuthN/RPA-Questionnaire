"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Mail, ChevronDown, Eye, EyeOff, Send, AlertCircle, CheckCircle2, Users } from "lucide-react";
import { Button } from "@/components/primitives/Button";

type EmailTemplate =
  | "ad_hoc"
  | "application_received"
  | "interview_invite"
  | "stage_advance"
  | "rejection"
  | "offer_sent"
  | "screener_invite";

interface TemplateConfig {
  label: string;
  description: string;
  defaultSubject: string;
  defaultBody: string;
  color: string;
}

const TEMPLATES: Record<EmailTemplate, TemplateConfig> = {
  ad_hoc: {
    label: "Custom message",
    description: "Write a freeform email to the candidate",
    defaultSubject: "",
    defaultBody: "",
    color: "bg-slate-500/20 text-slate-300",
  },
  application_received: {
    label: "Application received",
    description: "Confirm receipt of their application",
    defaultSubject: "We received your application",
    defaultBody: "Thank you for your application. Our team will review it and be in touch within 5–7 business days.",
    color: "bg-blue-500/20 text-blue-300",
  },
  interview_invite: {
    label: "Interview invite",
    description: "Notify the candidate of a scheduled interview",
    defaultSubject: "Your interview has been scheduled",
    defaultBody: "We'd like to invite you to an interview. Please see the details below.",
    color: "bg-violet-500/20 text-violet-300",
  },
  stage_advance: {
    label: "Stage advance",
    description: "Let the candidate know they're moving forward",
    defaultSubject: "Update on your application",
    defaultBody: "We're pleased to let you know your application has advanced to the next stage.",
    color: "bg-emerald-500/20 text-emerald-300",
  },
  rejection: {
    label: "Rejection",
    description: "Respectfully decline the candidate",
    defaultSubject: "Your application update",
    defaultBody: "Thank you for the time you invested in applying. After careful review, we've decided to move forward with other candidates.",
    color: "bg-red-500/20 text-red-300",
  },
  offer_sent: {
    label: "Offer letter",
    description: "Send the formal offer to the candidate",
    defaultSubject: "Your offer from us",
    defaultBody: "We are thrilled to extend you an offer for this position. Please review the details below.",
    color: "bg-amber-500/20 text-amber-300",
  },
  screener_invite: {
    label: "Assessment invite",
    description: "Send a skills assessment link",
    defaultSubject: "Complete your skills assessment",
    defaultBody: "As part of the application process, we'd like you to complete a short skills assessment.",
    color: "bg-cyan-500/20 text-cyan-300",
  },
};

interface TeamMember {
  email: string;
  name?: string;
}

interface EmailComposerModalProps {
  candidateId: string;
  candidateEmail: string;
  candidateName: string;
  hiringTeam?: TeamMember[];
  defaultTemplate?: EmailTemplate;
  defaultParams?: Record<string, string>;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

function inputCls(extra?: string) {
  return `w-full rounded-[12px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-3 py-2 text-sm text-[color:var(--app-text)] placeholder:text-[color:var(--app-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/70 ${extra ?? ""}`;
}

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${className}`}>
      {label}
    </span>
  );
}

export function EmailComposerModal({
  candidateId,
  candidateEmail,
  candidateName,
  hiringTeam = [],
  defaultTemplate = "ad_hoc",
  defaultParams = {},
  onSuccess,
  trigger,
}: EmailComposerModalProps) {
  const [open, setOpen] = useState(false);
  const [template, setTemplate] = useState<EmailTemplate>(defaultTemplate);
  const [to, setTo] = useState(candidateEmail);
  const [ccInput, setCcInput] = useState("");
  const [ccList, setCcList] = useState<string[]>([]);
  const [autoTeamCc, setAutoTeamCc] = useState(true);
  const [subject, setSubject] = useState(TEMPLATES[defaultTemplate].defaultSubject);
  const [body, setBody] = useState(TEMPLATES[defaultTemplate].defaultBody);
  const [preview, setPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setTemplate(defaultTemplate);
      setSubject(TEMPLATES[defaultTemplate].defaultSubject);
      setBody(TEMPLATES[defaultTemplate].defaultBody);
      setTo(candidateEmail);
      setCcList([]);
      setCcInput("");
      setAutoTeamCc(true);
      setError(null);
      setSuccess(false);
      setPreview(false);
    }
  }, [open, defaultTemplate, candidateEmail]);

  function selectTemplate(t: EmailTemplate) {
    setTemplate(t);
    setSubject(TEMPLATES[t].defaultSubject);
    setBody(TEMPLATES[t].defaultBody);
    setTemplateOpen(false);
    setError(null);
  }

  function addCc() {
    const email = ccInput.trim().toLowerCase();
    if (!email || ccList.includes(email) || email === to) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return;
    setCcList((prev) => [...prev, email]);
    setCcInput("");
  }

  function removeCc(email: string) {
    setCcList((prev) => prev.filter((e) => e !== email));
  }

  function toggleTeamMember(email: string) {
    setCcList((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  }

  const effectiveCc = [
    ...ccList,
    ...(autoTeamCc ? hiringTeam.map((m) => m.email).filter((e) => e !== to && !ccList.includes(e)) : []),
  ];

  async function handleSend() {
    if (!to || !subject.trim()) {
      setError("Recipient and subject are required.");
      return;
    }

    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/candidates/${candidateId}/emails`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template,
          to,
          ccEmails: effectiveCc,
          subject: subject.trim(),
          bodyOverride: body.trim() || undefined,
          params: defaultParams,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || data.ok === false) throw new Error(data.error ?? "Failed to send email");

      setSuccess(true);
      setTimeout(() => {
        setOpen(false);
        onSuccess?.();
      }, 1400);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <div onClick={() => setOpen(true)}>
        {trigger ?? (
          <Button type="button" variant="secondary">
            <Mail size={14} className="mr-1.5" />
            Send email
          </Button>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !sending && setOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 340, damping: 30 }}
              className="relative z-10 w-full max-w-2xl rounded-[24px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] shadow-2xl flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[color:var(--app-border)] px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500/15">
                    <Mail size={15} className="text-brand-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[color:var(--app-heading)]">Send email</p>
                    <p className="text-xs text-[color:var(--app-muted)]">to {candidateName}</p>
                  </div>
                </div>
                <button
                  onClick={() => !sending && setOpen(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[color:var(--app-muted)] transition hover:bg-[color:var(--app-surface-soft)] hover:text-[color:var(--app-heading)]"
                >
                  <X size={15} />
                </button>
              </div>

              {success ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-12">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15">
                    <CheckCircle2 size={28} className="text-emerald-400" />
                  </div>
                  <p className="text-base font-semibold text-[color:var(--app-heading)]">Email sent</p>
                  <p className="text-sm text-[color:var(--app-muted)]">Delivered to {to}</p>
                </div>
              ) : (
                <div className="flex flex-1 flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

                    {/* Template selector */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[color:var(--app-muted)]">Email type</label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setTemplateOpen((v) => !v)}
                          className="flex w-full items-center justify-between rounded-[12px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-3 py-2 text-sm text-[color:var(--app-text)] transition hover:border-[color:var(--app-border-strong)]"
                        >
                          <div className="flex items-center gap-2">
                            <Badge label={TEMPLATES[template].label} className={TEMPLATES[template].color} />
                            <span className="text-xs text-[color:var(--app-muted)]">{TEMPLATES[template].description}</span>
                          </div>
                          <ChevronDown size={14} className={`text-[color:var(--app-muted)] transition ${templateOpen ? "rotate-180" : ""}`} />
                        </button>

                        {templateOpen && (
                          <div className="absolute top-full left-0 right-0 z-20 mt-1 rounded-[14px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] shadow-xl overflow-hidden">
                            {(Object.keys(TEMPLATES) as EmailTemplate[]).map((t) => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => selectTemplate(t)}
                                className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-[color:var(--app-surface-soft)] ${t === template ? "bg-[color:var(--app-surface-soft)]" : ""}`}
                              >
                                <Badge label={TEMPLATES[t].label} className={TEMPLATES[t].color} />
                                <span className="text-xs text-[color:var(--app-muted)] leading-5">{TEMPLATES[t].description}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Recipients */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-[color:var(--app-muted)]">To (candidate)</label>
                        <input
                          type="email"
                          value={to}
                          onChange={(e) => setTo(e.target.value)}
                          className={inputCls()}
                          placeholder="candidate@email.com"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-[color:var(--app-muted)]">Add CC</label>
                        <div className="flex gap-1.5">
                          <input
                            type="email"
                            value={ccInput}
                            onChange={(e) => setCcInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCc())}
                            className={inputCls("flex-1")}
                            placeholder="cc@email.com"
                          />
                          <button
                            type="button"
                            onClick={addCc}
                            className="rounded-[10px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-3 text-xs font-medium text-[color:var(--app-muted)] hover:text-[color:var(--app-heading)]"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Hiring team CC */}
                    {hiringTeam.length > 0 && (
                      <div className="rounded-[14px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Users size={13} className="text-[color:var(--app-muted)]" />
                            <span className="text-xs font-medium text-[color:var(--app-heading)]">Hiring team</span>
                          </div>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={autoTeamCc}
                              onChange={(e) => setAutoTeamCc(e.target.checked)}
                              className="h-3.5 w-3.5 rounded accent-brand-500"
                            />
                            <span className="text-xs text-[color:var(--app-muted)]">CC all</span>
                          </label>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {hiringTeam.map((member) => {
                            const isIncluded = autoTeamCc || ccList.includes(member.email);
                            return (
                              <button
                                key={member.email}
                                type="button"
                                onClick={() => { setAutoTeamCc(false); toggleTeamMember(member.email); }}
                                className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                                  isIncluded
                                    ? "bg-brand-500/20 text-brand-300 ring-1 ring-brand-500/30"
                                    : "bg-[color:var(--app-control-bg)] text-[color:var(--app-muted)] hover:text-[color:var(--app-text)]"
                                }`}
                              >
                                {member.name ?? member.email}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* CC tags */}
                    {ccList.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {ccList.map((email) => (
                          <span
                            key={email}
                            className="inline-flex items-center gap-1 rounded-full bg-[color:var(--app-surface-soft)] border border-[color:var(--app-border)] px-2.5 py-1 text-[11px] text-[color:var(--app-muted)]"
                          >
                            {email}
                            <button type="button" onClick={() => removeCc(email)} className="hover:text-red-400">
                              <X size={10} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Subject */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[color:var(--app-muted)]">Subject</label>
                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className={inputCls()}
                        placeholder="Email subject"
                      />
                    </div>

                    {/* Body */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-[color:var(--app-muted)]">
                          Message{template !== "ad_hoc" ? " (optional override)" : ""}
                        </label>
                        <button
                          type="button"
                          onClick={() => setPreview((v) => !v)}
                          className="flex items-center gap-1 text-[11px] text-[color:var(--app-muted)] hover:text-[color:var(--app-heading)]"
                        >
                          {preview ? <EyeOff size={12} /> : <Eye size={12} />}
                          {preview ? "Edit" : "Preview"}
                        </button>
                      </div>

                      {preview ? (
                        <div
                          className="min-h-[140px] rounded-[12px] border border-[color:var(--app-border)] bg-white p-4 text-sm text-gray-700 leading-relaxed overflow-auto"
                          dangerouslySetInnerHTML={{ __html: body.replace(/\n/g, "<br>") }}
                        />
                      ) : (
                        <textarea
                          value={body}
                          onChange={(e) => setBody(e.target.value)}
                          rows={6}
                          className={inputCls("resize-none")}
                          placeholder={template === "ad_hoc" ? "Write your message..." : "Customize the message (optional — leave blank to use the default)"}
                        />
                      )}
                      <p className="text-right text-[11px] text-[color:var(--app-muted)]">{body.length} chars</p>
                    </div>

                    {/* Effective CC summary */}
                    {effectiveCc.length > 0 && (
                      <p className="text-[11px] text-[color:var(--app-muted)]">
                        CC: {effectiveCc.join(", ")}
                      </p>
                    )}

                    {error && (
                      <div className="flex items-start gap-2 rounded-[12px] border border-red-500/20 bg-red-500/10 px-3 py-2.5">
                        <AlertCircle size={14} className="mt-0.5 flex-shrink-0 text-red-400" />
                        <p className="text-xs text-red-300">{error}</p>
                      </div>
                    )}
                  </div>

                  {/* Footer actions */}
                  <div className="flex items-center justify-between border-t border-[color:var(--app-border)] px-5 py-3">
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      disabled={sending}
                      className="text-sm text-[color:var(--app-muted)] hover:text-[color:var(--app-heading)] transition"
                    >
                      Cancel
                    </button>
                    <Button
                      type="button"
                      onClick={handleSend}
                      disabled={sending || !to || !subject.trim()}
                    >
                      {sending ? (
                        <span className="flex items-center gap-2">
                          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          Sending…
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <Send size={14} />
                          Send email
                        </span>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
