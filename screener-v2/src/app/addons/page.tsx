import { redirect } from "next/navigation";
import { AddonLibraryClient } from "@/components/addons/AddonLibraryClient";
import { SceneShell } from "@/components/scene/SceneShell";
import { StatusPill } from "@/components/primitives/StatusPill";
import { getSession } from "@/lib/auth/session";
import { listAddonCatalog, listAssessmentPresets } from "@/lib/addons/catalog";

export default async function AddonsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/addons");
  }

  const [addons, presets] = await Promise.all([
    listAddonCatalog(true),
    listAssessmentPresets(true)
  ]);

  return (
    <SceneShell
      variant="create"
      eyebrow="Add-ons"
      title="Add-on library"
      subtitle="Manage global add-on defaults and simple presets."
      utility={
        <div className="flex flex-wrap gap-2">
          <StatusPill label={`${addons.length} add-ons`} tone="blue" />
          <StatusPill label={`${presets.length} presets`} tone="purple" />
        </div>
      }
    >
      <AddonLibraryClient initialAddons={addons} initialPresets={presets} />
    </SceneShell>
  );
}
