import type { Metadata } from "next";
import { requireAdminPageSession } from "@/lib/auth/guards";
import { getOrgSecuritySettings } from "@/lib/auth/security-settings";
import { SecuritySettingsClient } from "@/components/admin/SecuritySettingsClient";

export const metadata: Metadata = { title: "Security Settings" };
export const dynamic = "force-dynamic";

export default async function SecuritySettingsPage() {
  await requireAdminPageSession("/security");

  const settings = await getOrgSecuritySettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-medium text-[color:var(--app-heading)]">Security</h1>
        <p className="mt-1 text-sm text-[color:var(--app-muted)]">
          Configure authentication policy, account lockout, and password requirements for all users.
        </p>
      </div>

      <SecuritySettingsClient initial={settings} />
    </div>
  );
}
