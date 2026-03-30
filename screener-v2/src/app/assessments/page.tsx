import { redirect } from "next/navigation";
import { requirePageSession } from "@/lib/auth/guards";

export default async function AssessmentsPage() {
  await requirePageSession("/assessments");

  redirect("/create-test");
}
