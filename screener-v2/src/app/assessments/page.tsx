import { redirect } from "next/navigation";
import { buildLoginHref, getAppSession } from "@/lib/auth/app-session";

export default async function AssessmentsPage() {
  if (!(await getAppSession())) {
    redirect(buildLoginHref("/assessments"));
  }

  redirect("/create-test");
}
