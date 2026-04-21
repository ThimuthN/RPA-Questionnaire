const allowedTags = new Set(["p", "br", "strong", "em", "ul", "ol", "li", "h2", "h3", "blockquote"]);

const tagAliases: Record<string, string> = {
  b: "strong",
  strong: "strong",
  i: "em",
  em: "em",
  div: "p",
  p: "p",
  br: "br",
  ul: "ul",
  ol: "ol",
  li: "li",
  h1: "h2",
  h2: "h2",
  h3: "h3",
  h4: "h3",
  blockquote: "blockquote",
  section: "p",
  article: "p"
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function plainTextToHtml(value: string) {
  const normalized = value.replace(/\r\n/g, "\n").trim();
  if (!normalized) {
    return "";
  }

  return normalized
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

export function sanitizeJobDescriptionHtml(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (!/<[a-z!/][^>]*>/i.test(trimmed)) {
    return plainTextToHtml(trimmed);
  }

  const withoutBlockedTags = trimmed
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\s*(script|style|iframe|object|embed|svg|math)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "");

  const sanitized = withoutBlockedTags.replace(/<[^>]+>/g, (tag) => {
    const match = tag.match(/^<\s*(\/?)\s*([a-z0-9]+)[^>]*\/?\s*>$/i);
    if (!match) {
      return "";
    }

    const closing = match[1] === "/";
    const originalTag = match[2].toLowerCase();
    const normalizedTag = tagAliases[originalTag];

    if (!normalizedTag || !allowedTags.has(normalizedTag)) {
      return "";
    }

    if (normalizedTag === "br") {
      return "<br>";
    }

    return closing ? `</${normalizedTag}>` : `<${normalizedTag}>`;
  });

  return sanitized
    .replace(/<(p|h2|h3|blockquote)>\s*<\/\1>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function jobDescriptionTextContent(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|h2|h3|li|blockquote)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
