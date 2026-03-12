import { redirect } from "next/navigation";

export default function LegacyEmployeeEntryPage() {
  redirect("/run-test?mode=employee");
}
