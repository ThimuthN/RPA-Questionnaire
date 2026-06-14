import { PublicSiteFrame } from "@/components/marketing/PublicSiteFrame";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";
import { publicOrgName, SITE_POLICY_LAST_UPDATED } from "@/lib/legal/site-policy";

export default function TermsPage() {
  const orgName = publicOrgName();

  return (
    <PublicSiteFrame current="terms">
      <SceneShell
        variant="results"
        tone="page"
        eyebrow="Legal"
        title="Terms of Use"
        subtitle="Baseline terms for using the public careers pages, candidate application flow, and hiring workspace interfaces."
      >
        <div className="space-y-5">
          <StagePanel tone="summary" className="space-y-3">
            <p className="text-sm text-[color:var(--app-text)]">
              These terms govern access to the public careers surfaces and related hiring workflows provided through {orgName}.
            </p>
            <p className="text-xs text-[color:var(--app-muted)]">Updated {SITE_POLICY_LAST_UPDATED}</p>
          </StagePanel>

          <LegalSection
            title="Acceptable use"
            body="Do not submit false identity information, malicious files, abusive content, automated spam applications, or attempts to disrupt the service or bypass access controls."
          />
          <LegalSection
            title="Candidate submissions"
            body="Submitting an application does not guarantee review, interview, offer, or employment. Organizations using the platform control their own hiring criteria and decisions."
          />
          <LegalSection
            title="Workspace access"
            body="Internal users are responsible for protecting credentials, using the platform only for authorized recruiting work, and respecting candidate privacy, auditability, and department boundaries."
          />
          <LegalSection
            title="Service changes"
            body="Features, workflows, and integrations may change over time. Organizations should validate internal operating procedures and legal notices whenever the hiring process materially changes."
          />
        </div>
      </SceneShell>
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
