"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/primitives/Button";
import { cn } from "@/lib/utils";

function toolbarButtonClassName(active = false) {
  return active
    ? "border-brand-400/50 bg-brand-500/15 text-[color:var(--app-heading)]"
    : "border-[color:var(--app-border)] bg-[color:var(--app-surface)] text-[color:var(--app-muted)] hover:border-[color:var(--app-border-strong)] hover:text-[color:var(--app-heading)]";
}

export function RichTextField({
  name,
  label,
  initialValue,
  value,
  onChange,
  placeholder,
  helperText,
  error
}: {
  name: string;
  label: string;
  initialValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  helperText?: string;
  error?: string;
}) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const id = useId();
  const resolvedValue = value ?? initialValue ?? "";
  const [empty, setEmpty] = useState(!resolvedValue.trim());

  useEffect(() => {
    const nextValue = resolvedValue.trim() || "";

    if (editorRef.current && editorRef.current.innerHTML !== nextValue) {
      editorRef.current.innerHTML = nextValue;
    }
    if (inputRef.current && inputRef.current.value !== nextValue) {
      inputRef.current.value = nextValue;
    }
    setEmpty((editorRef.current?.textContent || "").trim().length === 0);
  }, [resolvedValue]);

  function syncValue() {
    const nextValue = editorRef.current?.innerHTML ?? "";
    if (inputRef.current) {
      inputRef.current.value = nextValue;
    }
    setEmpty((editorRef.current?.textContent || "").trim().length === 0);
    onChange?.(nextValue);
  }

  function runCommand(command: string, valueArg?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, valueArg);
    syncValue();
  }

  return (
    <div className="grid gap-2">
      <label className="text-sm text-[color:var(--app-text)]" htmlFor={id}>
        {label}
      </label>
      <textarea ref={inputRef} name={name} defaultValue={resolvedValue.trim() || ""} className="hidden" readOnly />

      <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-3">
        <div className="mb-3 flex flex-wrap gap-2 border-b border-[color:var(--app-border)] pb-3">
          <Button type="button" variant="ghost" className={`rounded-[14px] border px-3 py-1.5 text-xs ${toolbarButtonClassName()}`} onClick={() => runCommand("bold")}>
            Bold
          </Button>
          <Button type="button" variant="ghost" className={`rounded-[14px] border px-3 py-1.5 text-xs ${toolbarButtonClassName()}`} onClick={() => runCommand("italic")}>
            Italic
          </Button>
          <Button type="button" variant="ghost" className={`rounded-[14px] border px-3 py-1.5 text-xs ${toolbarButtonClassName()}`} onClick={() => runCommand("formatBlock", "H2")}>
            Heading
          </Button>
          <Button type="button" variant="ghost" className={`rounded-[14px] border px-3 py-1.5 text-xs ${toolbarButtonClassName()}`} onClick={() => runCommand("formatBlock", "P")}>
            Paragraph
          </Button>
          <Button type="button" variant="ghost" className={`rounded-[14px] border px-3 py-1.5 text-xs ${toolbarButtonClassName()}`} onClick={() => runCommand("insertUnorderedList")}>
            Bullets
          </Button>
          <Button type="button" variant="ghost" className={`rounded-[14px] border px-3 py-1.5 text-xs ${toolbarButtonClassName()}`} onClick={() => runCommand("insertOrderedList")}>
            Numbers
          </Button>
          <Button type="button" variant="ghost" className={`rounded-[14px] border px-3 py-1.5 text-xs ${toolbarButtonClassName()}`} onClick={() => runCommand("formatBlock", "BLOCKQUOTE")}>
            Quote
          </Button>
        </div>

        <div className="relative">
          {empty && placeholder ? (
            <div className="pointer-events-none absolute inset-0 px-4 py-3 text-sm text-[color:var(--app-muted)]">
              {placeholder}
            </div>
          ) : null}
          <div
            id={id}
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={syncValue}
            className={cn(
              "min-h-[260px] rounded-[18px] border bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80 [&_blockquote]:border-l-2 [&_blockquote]:border-[color:var(--app-brand)] [&_blockquote]:pl-4 [&_h2]:mt-4 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:mt-3 [&_h3]:text-xl [&_h3]:font-semibold [&_li]:ml-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5",
              error
                ? "border-[color:var(--app-danger)]/60 bg-[color:var(--app-danger)]/5"
                : "border-[color:var(--app-border)]"
            )}
          />
        </div>
      </div>

      {helperText ? <p className="text-xs text-[color:var(--app-muted)]">{helperText}</p> : null}
      {error ? <p className="text-xs text-[color:var(--app-danger)]">{error}</p> : null}
    </div>
  );
}
