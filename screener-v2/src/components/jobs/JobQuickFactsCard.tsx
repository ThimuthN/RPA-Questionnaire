import { Building2, DollarSign, Laptop, MapPin, Users } from "lucide-react";
import { formatSalaryRange } from "@/lib/jobs/currency";

interface QuickFact {
  icon: React.ReactNode;
  label: string;
  value: string;
}

export function JobQuickFactsCard({
  salaryMin,
  salaryMax,
  salaryCurrency,
  teamSize,
  techStack,
  remotePolicy,
  companyName = "Northstar"
}: {
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string | null;
  teamSize?: number | null;
  techStack?: string | null;
  remotePolicy?: string | null;
  companyName?: string;
}) {
  const facts: QuickFact[] = [];

  // Always show company
  facts.push({
    icon: <Building2 className="h-4 w-4" />,
    label: "Company",
    value: companyName
  });

  // Only show facts that have values
  const salaryDisplay = formatSalaryRange(salaryMin, salaryMax, salaryCurrency);
  if (salaryDisplay) {
    facts.push({
      icon: <DollarSign className="h-4 w-4" />,
      label: "Salary",
      value: salaryDisplay
    });
  }

  if (teamSize) {
    facts.push({
      icon: <Users className="h-4 w-4" />,
      label: "Team size",
      value: `${teamSize} engineer${teamSize === 1 ? "" : "s"}`
    });
  }

  if (techStack) {
    facts.push({
      icon: <Laptop className="h-4 w-4" />,
      label: "Tech stack",
      value: techStack
    });
  }

  if (remotePolicy) {
    facts.push({
      icon: <MapPin className="h-4 w-4" />,
      label: "Remote policy",
      value: remotePolicy
    });
  }

  // If no facts at all, don't render
  if (facts.length === 1) {
    return null;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {facts.map((fact, idx) => (
        <div
          key={idx}
          className="rounded-[22px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4"
        >
          <div className="flex items-center gap-2">
            <div className="rounded-lg border border-brand-300/20 bg-brand-400/10 p-1.5 text-brand-200">
              {fact.icon}
            </div>
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--app-muted)]">
                {fact.label}
              </p>
              <p className="mt-1 text-sm font-medium text-[color:var(--app-heading)]">
                {fact.value}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
