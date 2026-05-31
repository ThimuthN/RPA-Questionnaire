import { redirect } from "next/navigation";
import { requirePageSession } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function PeoplePage() {
  await requirePageSession("/people");
  redirect("/people/candidates");
}
