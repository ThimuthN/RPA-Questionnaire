import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import PrivacyPage from "./page";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>
}));

vi.mock("@/components/brand/AppLogo", () => ({
  AppLogo: () => <div>Northstar</div>
}));

describe("/privacy", () => {
  it("renders a real privacy policy with versioned copy", () => {
    const markup = renderToStaticMarkup(<PrivacyPage />);

    expect(markup).toContain("Privacy Policy");
    expect(markup).toContain("Version 2026-06-15");
    expect(markup).toContain("What we collect");
    expect(markup).toContain("Candidate rights and requests");
  });
});
