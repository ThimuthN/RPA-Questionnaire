import { sanitizeJobDescriptionHtml } from "@/lib/jobs/rich-text";

export function JobDescriptionContent({ html }: { html: string }) {
  const safeHtml = sanitizeJobDescriptionHtml(html);

  return (
    <div
      className="job-description text-sm leading-7 text-[color:var(--app-text)] [&_blockquote]:my-4 [&_blockquote]:border-l-2 [&_blockquote]:border-[color:var(--app-brand)] [&_blockquote]:pl-4 [&_h2]:mt-6 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:mt-5 [&_h3]:text-xl [&_h3]:font-semibold [&_li]:ml-5 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-4 [&_strong]:font-semibold [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5"
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}
