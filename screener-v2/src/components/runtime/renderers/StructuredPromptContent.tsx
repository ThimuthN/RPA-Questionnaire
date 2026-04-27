import Image from "next/image";
import type { PromptBlock } from "@/lib/assessment-engine/types";

interface StructuredPromptContentProps {
  text: string;
  className?: string;
  blocks?: PromptBlock[];
}

function normalizeText(text: string) {
  return text.replace(/\r\n/g, "\n").trim();
}

function splitBlocks(text: string) {
  return normalizeText(text)
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);
}

function isSectionHeading(block: string) {
  return !block.includes("\n") && block.endsWith(":");
}

function parseTabularBlock(block: string) {
  const rows = block
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split("\t").map((cell) => cell.trim()));

  if (rows.length < 2) return null;

  const columnCount = rows[0]?.length ?? 0;
  if (columnCount < 2 || !rows.every((row) => row.length === columnCount)) {
    return null;
  }

  return {
    headers: rows[0],
    rows: rows.slice(1)
  };
}

function renderTable(
  key: string,
  table: { headers: string[]; rows: string[][] }
) {
  return (
    <div key={key} className="overflow-x-auto rounded-xl border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)]">
      <table className="min-w-full border-collapse text-left text-sm text-[color:var(--app-text)]">
        <thead className="bg-[color:var(--app-surface)] text-[color:var(--app-heading)]">
          <tr>
            {table.headers.map((header) => (
              <th key={header} className="px-3 py-2 font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, rowIndex) => (
            <tr key={`row-${rowIndex}`} className="border-t border-[color:var(--app-border)]">
              {row.map((cell, cellIndex) => (
                <td key={`cell-${rowIndex}-${cellIndex}`} className="px-3 py-2 align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function StructuredPromptContent({ text, className }: StructuredPromptContentProps) {
  return renderPromptContent({ text, className });
}

export function StructuredPromptBlocks({
  blocks,
  className
}: {
  blocks: PromptBlock[];
  className?: string;
}) {
  if (blocks.length === 0) {
    return null;
  }

  return (
    <div className={className ?? "space-y-4"}>
      {blocks.map((block, index) => {
        if (block.type === "paragraph") {
          return (
            <p key={`block-${index}`} className="whitespace-pre-wrap text-sm leading-6 text-[color:var(--app-text)]">
              {block.text}
            </p>
          );
        }

        if (block.type === "prompt") {
          return (
            <p key={`block-${index}`} className="text-sm font-semibold leading-6 text-[color:var(--app-heading)]">
              {block.text}
            </p>
          );
        }

        if (block.type === "image") {
          return (
            <figure
              key={`block-${index}`}
              className="overflow-hidden rounded-3xl border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)]"
            >
              <Image
                src={block.src}
                alt={block.alt}
                width={1200}
                height={800}
                className="w-full object-contain"
              />
              {block.caption ? (
                <figcaption className="px-4 py-3 text-sm text-[color:var(--app-muted)]">
                  {block.caption}
                </figcaption>
              ) : null}
            </figure>
          );
        }

        if (block.type === "table") {
          return (
            <section key={`block-${index}`} className="space-y-3">
              {block.heading ? (
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--app-muted)]">{block.heading}</p>
              ) : null}
              {renderTable(`table-${index}`, { headers: block.headers, rows: block.rows })}
            </section>
          );
        }

        return (
          <section key={`block-${index}`} className="space-y-3">
            {block.heading ? (
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--app-muted)]">{block.heading}</p>
            ) : null}
            {block.style === "plain" ? (
              <ul className="space-y-2">
                {block.items.map((item) => (
                  <li key={`${index}-${item}`} className="text-sm leading-6 text-[color:var(--app-text)]">
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="space-y-2">
                {block.items.map((item) => (
                  <li
                    key={`${index}-${item}`}
                    className="rounded-xl border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-3 py-2 text-sm leading-6 text-[color:var(--app-text)]"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

function renderPromptContent({ text, className }: StructuredPromptContentProps) {
  const blocks = splitBlocks(text);

  if (blocks.length === 0) {
    return null;
  }

  return (
    <div className={className ?? "space-y-4"}>
      {blocks.map((block, index) => {
        if (index > 0 && isSectionHeading(blocks[index - 1])) {
          return null;
        }

        const table = parseTabularBlock(block);

        if (table) {
          return renderTable(`block-${index}`, table);
        }

        if (isSectionHeading(block)) {
          const sectionBlocks: string[] = [];
          let cursor = index + 1;
          while (cursor < blocks.length && !isSectionHeading(blocks[cursor])) {
            sectionBlocks.push(blocks[cursor]);
            cursor += 1;
          }

          const listItems = sectionBlocks.filter((item) => !item.includes("\n") && !item.endsWith("?"));
          const textBlocks = sectionBlocks.filter((item) => item.includes("\n") || item.endsWith("?"));
          const sectionTable = sectionBlocks.length === 1 ? parseTabularBlock(sectionBlocks[0]) : null;

          return (
            <section key={`block-${index}`} className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--app-muted)]">{block.slice(0, -1)}</p>
              {sectionTable ? renderTable(`section-table-${index}`, sectionTable) : null}
              {listItems.length > 0 ? (
                <ul className="space-y-2">
                  {listItems.map((item) => (
                    <li
                      key={`${block}-${item}`}
                      className="rounded-xl border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-3 py-2 text-sm leading-6 text-[color:var(--app-text)]"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              ) : null}
              {textBlocks.map((item) => {
                const nestedTable = parseTabularBlock(item);
                if (nestedTable) {
                  return renderTable(`${block}-${item}`, nestedTable);
                }

                return (
                  <p key={`${block}-${item}`} className="whitespace-pre-wrap text-sm leading-6 text-[color:var(--app-text)]">
                    {item}
                  </p>
                );
              })}
            </section>
          );
        }

        return (
          <p key={`block-${index}`} className="whitespace-pre-wrap text-sm leading-6 text-[color:var(--app-text)]">
            {block}
          </p>
        );
      })}
    </div>
  );
}
