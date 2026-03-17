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
    <div key={key} className="overflow-x-auto rounded-xl border border-white/10 bg-black/20">
      <table className="min-w-full border-collapse text-left text-sm text-slate-200">
        <thead className="bg-white/5 text-slate-100">
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
            <tr key={`row-${rowIndex}`} className="border-t border-white/10">
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
            <p key={`block-${index}`} className="whitespace-pre-wrap text-sm leading-6 text-slate-200">
              {block.text}
            </p>
          );
        }

        if (block.type === "prompt") {
          return (
            <p key={`block-${index}`} className="text-sm font-semibold leading-6 text-slate-100">
              {block.text}
            </p>
          );
        }

        if (block.type === "table") {
          return (
            <section key={`block-${index}`} className="space-y-3">
              {block.heading ? (
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{block.heading}</p>
              ) : null}
              {renderTable(`table-${index}`, { headers: block.headers, rows: block.rows })}
            </section>
          );
        }

        return (
          <section key={`block-${index}`} className="space-y-3">
            {block.heading ? (
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{block.heading}</p>
            ) : null}
            {block.style === "plain" ? (
              <ul className="space-y-2">
                {block.items.map((item) => (
                  <li key={`${index}-${item}`} className="text-sm leading-6 text-slate-200">
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="space-y-2">
                {block.items.map((item) => (
                  <li
                    key={`${index}-${item}`}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm leading-6 text-slate-200"
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
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{block.slice(0, -1)}</p>
              {sectionTable ? renderTable(`section-table-${index}`, sectionTable) : null}
              {listItems.length > 0 ? (
                <ul className="space-y-2">
                  {listItems.map((item) => (
                    <li
                      key={`${block}-${item}`}
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm leading-6 text-slate-200"
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
                  <p key={`${block}-${item}`} className="whitespace-pre-wrap text-sm leading-6 text-slate-200">
                    {item}
                  </p>
                );
              })}
            </section>
          );
        }

        return (
          <p key={`block-${index}`} className="whitespace-pre-wrap text-sm leading-6 text-slate-200">
            {block}
          </p>
        );
      })}
    </div>
  );
}
