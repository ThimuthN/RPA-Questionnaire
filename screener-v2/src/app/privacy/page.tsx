import { PublicSiteFrame } from "@/components/marketing/PublicSiteFrame";
import { StagePanel } from "@/components/scene/StagePanel";
import {
  CANDIDATE_PRIVACY_POLICY_VERSION,
  publicOrgName,
  publicSupportEmail,
  SITE_POLICY_LAST_UPDATED
} from "@/lib/legal/site-policy";

export default function PrivacyPage() {
  const orgName = publicOrgName();
  const supportEmail = publicSupportEmail();

  return (
    <PublicSiteFrame current="privacy">
      <div className="space-y-8">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--pub-brand)]">Legal</p>
          <h1 className="font-display text-3xl font-semibold text-[color:var(--app-heading)]">Privacy Policy</h1>
          <p className="text-sm leading-6 text-[color:var(--app-muted)]">How candidate and hiring data is collected, used, retained, and protected in the current {orgName} recruiting workflow.</p>
        </div>
        <div className="space-y-5">
          <StagePanel tone="summary" className="space-y-3">
            <p className="text-sm text-[color:var(--app-text)]">
              This policy applies to public job applications, candidate assessments, recruiter review workflows, and related hiring operations run through {orgName}.
            </p>
            <div className="flex flex-wrap gap-2 text-xs text-[color:var(--app-muted)]">
              <span className="rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-surface)] px-3 py-1">Version {CANDIDATE_PRIVACY_POLICY_VERSION}</span>
              <span className="rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-surface)] px-3 py-1">Updated {SITE_POLICY_LAST_UPDATED}</span>
            </div>
          </StagePanel>

          <LegalSection
            title="What we collect"
            body="We collect application data that candidates submit directly, including name, email address, phone number, resume files, cover notes, screening answers, assessment results, and hiring workflow updates created by recruiters and hiring teams."
          />
          <LegalSection
            title="Why we use it"
            body="We use this information to review applications, evaluate screening results, coordinate interviews, communicate with candidates, make hiring decisions, maintain audit history, and meet legitimate security and compliance obligations connected to recruiting."
          />
          <LegalSection
            title="Who can access it"
            body="Access is limited to authorized recruiting, hiring, and system administration users with role-based permissions in the platform. Access is expected to be scoped to the relevant department or system function."
          />
          <LegalSection
            title="How long we retain it"
            body="Application records, assessment evidence, hiring decisions, and audit logs may be retained for active recruiting operations, internal reporting, and lawful recordkeeping. Retention periods should be set by the organization operating this workspace."
          />
          <LegalSection
            title="Candidate rights and requests"
            body={`Candidates can request reasonable access, correction, or deletion review through the recruiting organization operating this workspace. Privacy questions can be directed to ${supportEmail}.`}
          />
          <LegalSection
            title="Security and handling"
            body="Northstar is designed to restrict access through authenticated sessions, permission checks, audit activity, and controlled storage of hiring records. No system should be treated as risk-free, so sensitive access and retention settings should be reviewed before production use."
          />
        </div>
      </div>
    </PublicSiteFrame>
  );
}

function LegalSection({ title, body }: { title: string; body: string }) {
  return (
    <StagePanel className="space-y-2">
      <h2 className="text-xl font-semibold text-[color:var(--app-heading)]">{title}</h2>
      <p className="text-sm leading-7 text-[color:var(--app-muted)]">{body}</p>
    </StagePanel>
  );
}
