import { redirect } from "next/navigation";

export default function LegacyQuickLivePage() {
  redirect("/run-test?mode=live_call");
}
