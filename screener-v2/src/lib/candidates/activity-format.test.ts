import { describe, expect, it } from "vitest";
import { formatActivity } from "./activity-format";

describe("formatActivity", () => {
  it("formats outbound email events with a mail-specific headline", () => {
    const formatted = formatActivity({
      id: "event-1",
      at: "2026-06-14T00:00:00.000Z",
      kind: "activity",
      rawEvent: "email_sent",
      title: "Email Sent",
      detail: "offer_sent email sent to candidate@example.com."
    });

    expect(formatted.headline).toBe("Email sent");
    expect(formatted.iconName).toBe("Mail");
  });

  it("formats offer approval events as explicit offer workflow activity", () => {
    const formatted = formatActivity({
      id: "event-2",
      at: "2026-06-14T00:00:00.000Z",
      kind: "activity",
      rawEvent: "offer_submitted_for_approval",
      title: "Offer Submitted For Approval",
      detail: "Offer submitted for approval. First approver: approver@example.com."
    });

    expect(formatted.headline).toBe("Offer submitted for approval");
    expect(formatted.iconName).toBe("Send");
    expect(formatted.colorKey).toBe("amber");
  });

  it("formats approval step progression as explicit workflow activity", () => {
    const formatted = formatActivity({
      id: "event-3",
      at: "2026-06-14T00:00:00.000Z",
      kind: "activity",
      rawEvent: "offer_approval_step_approved",
      title: "Offer Approval Step Approved",
      detail: "Manager approved this step. Next approver: director@example.com."
    });

    expect(formatted.headline).toBe("Offer approval advanced");
    expect(formatted.iconName).toBe("BadgeCheck");
    expect(formatted.colorKey).toBe("blue");
  });
});
