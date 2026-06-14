import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PublicSiteFrame } from "./PublicSiteFrame";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>
}));

vi.mock("@/components/brand/AppLogo", () => ({
  AppLogo: () => <div>Northstar</div>
}));

describe("PublicSiteFrame", () => {
  it("renders public legal and careers navigation links", () => {
    const markup = renderToStaticMarkup(
      <PublicSiteFrame current="privacy">
        <div>Body</div>
      </PublicSiteFrame>
    );

    expect(markup).toContain('href="/privacy"');
    expect(markup).toContain('href="/terms"');
    expect(markup).toContain('href="/jobs"');
    expect(markup).toContain("Policy set updated");
  });
});
