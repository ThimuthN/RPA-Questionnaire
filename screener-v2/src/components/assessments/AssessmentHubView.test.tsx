import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AssessmentHubView } from "./AssessmentHubView";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>
}));

describe("AssessmentHubView", () => {
  it("renders the shared global assessment hub actions", () => {
    const markup = renderToStaticMarkup(<AssessmentHubView />);

    expect(markup).toContain("Assessment hub");
    expect(markup).toContain('href="/create-test"');
    expect(markup).toContain('href="/addons"');
    expect(markup).toContain('href="/results"');
  });

  it("scopes assessment hub actions to the selected workspace", () => {
    const markup = renderToStaticMarkup(
      <AssessmentHubView workspaceId="dept-1" workspaceName="BA IND" />
    );

    expect(markup).toContain("BA IND");
    expect(markup).toContain('href="/create-test?workspaceId=dept-1"');
    expect(markup).toContain('href="/addons?workspaceId=dept-1"');
    expect(markup).toContain('href="/results?workspaceId=dept-1"');
  });
});
