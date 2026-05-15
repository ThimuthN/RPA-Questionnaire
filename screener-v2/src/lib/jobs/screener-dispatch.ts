import { buildDraftsFromPreset } from "@/lib/addons/catalog";
import { createInvite } from "@/lib/db/runtime-repository";
import { sendEmail } from "@/lib/email/send";
import { screenerInviteEmail } from "@/lib/email/templates/screener-invite";
import { logError } from "@/lib/server/logger";
import type { AssessmentPresetEntry } from "@/lib/addons/catalog";

export async function dispatchJobScreener(input: {
  candidateId: string;
  candidateEmail: string;
  candidateName: string;
  jobTitle: string;
  screenerPreset: AssessmentPresetEntry | null;
}): Promise<string | null> {
  if (!input.screenerPreset) {
    return null;
  }

  try {
    const drafts = buildDraftsFromPreset(input.screenerPreset);

    const invite = await createInvite({
      assessmentVersionId: "v1-default",
      mode: "candidate",
      contextType: "hiring",
      candidateId: input.candidateId,
      blueprint: {
        exams: drafts
      },
      maxAttempts: 1,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://northstar.local";
    const inviteUrl = `${appUrl}/a/${invite.row.slug}?t=${encodeURIComponent(invite.token)}`;

    await sendEmail({
      to: input.candidateEmail,
      ...screenerInviteEmail({
        candidateName: input.candidateName,
        jobTitle: input.jobTitle,
        orgName: process.env.NEXT_PUBLIC_ORG_NAME ?? "Northstar",
        inviteUrl,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      })
    });

    return inviteUrl;
  } catch (error) {
    logError("Screener dispatch failed", {
      error: error instanceof Error ? error.message : String(error)
    });
    return null;
  }
}
