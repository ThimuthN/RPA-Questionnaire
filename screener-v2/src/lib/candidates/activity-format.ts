import type { CandidateActivityItem } from "./workspace";
import { candidateStageLabels } from "./types";

export type ActivityColorKey =
  | "blue"
  | "green"
  | "red"
  | "amber"
  | "purple"
  | "gray"
  | "teal"
  | "pink";

export type FormattedActivityItem = {
  iconName: string;
  colorKey: ActivityColorKey;
  headline: string;
  before?: string;
  after?: string;
  body?: string;
};


const statusLabels: Record<string, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  done: "Done",
  skipped: "Skipped",
  failed: "Failed",
  passed: "Passed",
  review: "Under Review",
  hired: "Hired",
  rejected: "Rejected",
  active: "Active",
  inactive: "Inactive"
};

function toTitle(s: string): string {
  return (s ?? "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function labelStage(s: string): string {
  return candidateStageLabels[s?.trim() as keyof typeof candidateStageLabels] ?? toTitle(s);
}

function labelStatus(s: string): string {
  return statusLabels[s?.trim()] ?? toTitle(s);
}

function parseArrow(detail: string): { before: string; after: string } | null {
  const match = detail.match(/^([\s\S]+?)\s*(?:->|→)\s*([\s\S]+)$/);
  if (!match) return null;
  return { before: match[1].trim(), after: match[2].trim() };
}

function truncate(s: string, max = 150): string {
  if (!s) return "";
  return s.length > max ? `${s.slice(0, max)}...` : s;
}

function statusColorKey(statusStr: string): ActivityColorKey {
  if (statusStr === "done" || statusStr === "passed" || statusStr === "hired") return "green";
  if (statusStr === "failed" || statusStr === "rejected") return "red";
  if (statusStr === "skipped") return "amber";
  return "blue";
}

export function formatActivity(item: CandidateActivityItem): FormattedActivityItem {
  const { kind, rawEvent, title, detail } = item;

  if (kind === "activity" && rawEvent) {
    switch (rawEvent) {
      case "stage_advanced": {
        const arrow = parseArrow(detail);
        if (arrow) {
          const fromLabel = labelStage(arrow.before);
          const toLabel = labelStage(arrow.after);
          return {
            iconName: "ArrowRight",
            colorKey: "blue",
            headline: `Advanced to ${toLabel}`,
            before: fromLabel,
            after: toLabel
          };
        }
        return { iconName: "ArrowRight", colorKey: "blue", headline: "Stage advanced", body: detail };
      }

      case "milestone_status_changed": {
        const colonIdx = detail.indexOf(":");
        if (colonIdx > -1) {
          const msTitle = detail.slice(0, colonIdx).trim();
          const rest = detail.slice(colonIdx + 1).trim();
          const arrow = parseArrow(rest);
          if (arrow) {
            const fromLabel = labelStatus(arrow.before);
            const toLabel = labelStatus(arrow.after);
            return {
              iconName: "CheckCircle",
              colorKey: statusColorKey(arrow.after),
              headline: `${msTitle} marked as ${toLabel}`,
              before: fromLabel,
              after: toLabel
            };
          }
        }
        return { iconName: "CheckCircle", colorKey: "blue", headline: "Step status changed", body: detail };
      }

      case "check_updated": {
        const colonIdx = detail.indexOf(":");
        if (colonIdx > -1) {
          const checkType = detail.slice(0, colonIdx).trim().replace(/_/g, " ");
          const rest = detail.slice(colonIdx + 1).trim();
          const dashIdx = rest.indexOf(" - ");
          const statusStr = (dashIdx > -1 ? rest.slice(0, dashIdx) : rest).trim();
          const notes = dashIdx > -1 ? rest.slice(dashIdx + 3).trim() : undefined;
          return {
            iconName: "ClipboardCheck",
            colorKey: statusColorKey(statusStr),
            headline: `${toTitle(checkType)}: ${labelStatus(statusStr)}`,
            body: notes || undefined
          };
        }
        return { iconName: "ClipboardCheck", colorKey: "blue", headline: "Check updated", body: detail };
      }

      case "candidate_profile_updated": {
        const fieldsMatch = detail.match(/^Updated:\s*(.+)$/i);
        if (fieldsMatch) {
          const fields = fieldsMatch[1]
            .split(",")
            .map((f) => toTitle(f.trim()))
            .join(", ");
          return {
            iconName: "UserCog",
            colorKey: "purple",
            headline: "Profile updated",
            body: `Changed: ${fields}`
          };
        }
        return { iconName: "UserCog", colorKey: "purple", headline: "Profile updated", body: detail };
      }

      case "milestone_updated": {
        const colonIdx = detail.indexOf(":");
        if (colonIdx > -1) {
          const msTitle = detail.slice(0, colonIdx).trim();
          const fields = detail.slice(colonIdx + 1).trim();
          return {
            iconName: "Layers",
            colorKey: "gray",
            headline: `${msTitle} updated`,
            body: fields ? `Changed: ${fields}` : undefined
          };
        }
        return { iconName: "Layers", colorKey: "gray", headline: "Step updated", body: detail };
      }

      case "milestone_deleted": {
        const cleanTitle = detail.replace(/\s*\(.*\)$/, "").trim();
        return {
          iconName: "Trash2",
          colorKey: "red",
          headline: `Step removed: ${cleanTitle || detail}`
        };
      }

      case "interview_panel_scheduled": {
        const forIdx = detail.toLowerCase().indexOf(" scheduled for ");
        if (forIdx > -1) {
          const panelTitle = detail.slice(0, forIdx).trim();
          const when = detail.slice(forIdx + " scheduled for ".length).trim();
          return {
            iconName: "CalendarCheck",
            colorKey: "teal",
            headline: `${panelTitle} scheduled`,
            body: `Scheduled for ${when}`
          };
        }
        return { iconName: "CalendarCheck", colorKey: "teal", headline: detail };
      }

      case "interview_panel_updated":
        return { iconName: "CalendarClock", colorKey: "teal", headline: detail || "Interview panel updated" };

      case "assessment_linked": {
        const isGeneric = detail === "Assessment linked to milestone" || detail === "Assessment linked";
        return {
          iconName: "Link",
          colorKey: "blue",
          headline: "Assessment linked to screening step",
          body: isGeneric ? undefined : detail
        };
      }

      case "assessment_unlinked":
        return { iconName: "Unlink", colorKey: "amber", headline: "Assessment unlinked from step" };

      case "hired": {
        const isGeneric = !detail || detail === "Marked as hired";
        return {
          iconName: "PartyPopper",
          colorKey: "green",
          headline: "Candidate marked as hired",
          body: isGeneric ? undefined : truncate(detail)
        };
      }

      case "rejected": {
        const isGeneric = !detail || detail === "Rejected";
        return {
          iconName: "XCircle",
          colorKey: "red",
          headline: "Candidate rejected",
          body: isGeneric ? undefined : truncate(detail)
        };
      }

      case "finalization_reverted": {
        const what = detail.replace(/^Reverted\s+/i, "").trim();
        return {
          iconName: "RotateCcw",
          colorKey: "amber",
          headline: `${toTitle(what)} decision reversed`
        };
      }

      case "email_sent":
        return {
          iconName: "Mail",
          colorKey: "blue",
          headline: "Email sent",
          body: detail ? truncate(detail, 220) : undefined
        };

      case "offer_saved":
        return {
          iconName: "FileText",
          colorKey: "gray",
          headline: "Offer draft updated",
          body: detail ? truncate(detail) : undefined
        };

      case "offer_submitted_for_approval":
        return {
          iconName: "Send",
          colorKey: "amber",
          headline: "Offer submitted for approval",
          body: detail ? truncate(detail, 220) : undefined
        };

      case "offer_approval_step_approved":
        return {
          iconName: "BadgeCheck",
          colorKey: "blue",
          headline: "Offer approval advanced",
          body: detail ? truncate(detail, 220) : undefined
        };

      case "offer_auto_approved":
        return {
          iconName: "BadgeCheck",
          colorKey: "green",
          headline: "Offer auto-approved",
          body: detail ? truncate(detail, 220) : undefined
        };

      case "offer_approved":
        return {
          iconName: "BadgeCheck",
          colorKey: "green",
          headline: "Offer approved",
          body: detail ? truncate(detail, 220) : undefined
        };

      case "offer_sent":
        return {
          iconName: "MailCheck",
          colorKey: "green",
          headline: "Offer sent",
          body: detail ? truncate(detail, 220) : undefined
        };

      case "offer_revoked":
        return {
          iconName: "RotateCcw",
          colorKey: "amber",
          headline: "Offer returned to draft",
          body: detail ? truncate(detail, 220) : undefined
        };

      case "offer_rejected":
        return {
          iconName: "XCircle",
          colorKey: "red",
          headline: "Offer approval rejected",
          body: detail ? truncate(detail, 220) : undefined
        };

      case "note_updated":
        return {
          iconName: "FileText",
          colorKey: "gray",
          headline: "Note edited",
          body: detail ? truncate(detail) : undefined
        };

      case "note_deleted":
        return {
          iconName: "Trash2",
          colorKey: "red",
          headline: "Note deleted",
          body: detail ? truncate(detail) : undefined
        };

      case "department_transferred":
        return {
          iconName: "ArrowRightLeft",
          colorKey: "purple",
          headline: detail || "Transferred to another department"
        };

      case "candidacy_status_changed": {
        const colonIdx = detail.indexOf(":");
        if (colonIdx > -1) {
          const dept = detail.slice(0, colonIdx).trim();
          const status = detail.slice(colonIdx + 1).trim();
          return {
            iconName: "Activity",
            colorKey: "blue",
            headline: `Candidacy in ${dept} set to ${labelStatus(status)}`
          };
        }
        return { iconName: "Activity", colorKey: "blue", headline: "Candidacy status changed", body: detail };
      }

      case "org_status_changed": {
        const status = detail.trim();
        return {
          iconName: "ToggleRight",
          colorKey: status === "finalized" || status === "active" ? "green" : "gray",
          headline: `Overall status set to ${labelStatus(status)}`
        };
      }

      default:
        return {
          iconName: "Activity",
          colorKey: "gray",
          headline: title || toTitle(rawEvent),
          body: detail && detail !== title ? truncate(detail) : undefined
        };
    }
  }

  switch (kind) {
    case "resume":
      return {
        iconName: "FileUp",
        colorKey: "blue",
        headline: "Resume uploaded",
        body: detail || undefined
      };

    case "note":
      return {
        iconName: "StickyNote",
        colorKey: "gray",
        headline: title,
        body: detail ? truncate(detail, 250) : undefined
      };

    case "assessment":
      return {
        iconName: "ClipboardList",
        colorKey: "purple",
        headline: "Assessment assigned",
        body: detail || undefined
      };

    case "result": {
      const score = parseFloat(detail);
      const colorKey: ActivityColorKey = !isNaN(score)
        ? score >= 70
          ? "green"
          : score >= 50
            ? "amber"
            : "red"
        : "blue";
      return {
        iconName: "Trophy",
        colorKey,
        headline: "Assessment completed",
        body: `Score: ${detail}`
      };
    }

    case "application":
      return {
        iconName: "Inbox",
        colorKey: "teal",
        headline: "Application received",
        body: detail || undefined
      };

    case "milestone":
      return {
        iconName: "Flag",
        colorKey: "blue",
        headline: title,
        body: detail && detail !== title ? truncate(detail, 120) : undefined
      };

    case "candidate":
    default:
      return {
        iconName: "User",
        colorKey: "gray",
        headline: title || "Candidate record updated",
        body: detail && detail !== title ? truncate(detail) : undefined
      };
  }
}
