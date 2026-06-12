"use client";

import React from "react";

export interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, helperText, error, className, ...props }, ref) => {
    return (
      <label className="grid gap-2">
        {label && <span className="text-sm font-medium text-[color:var(--app-text)]">{label}</span>}
        <input
          ref={ref}
          className={`rounded-sm border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80 ${
            error ? "border-[color:var(--app-danger)]" : ""
          } ${className ?? ""}`}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-[color:var(--app-danger)]">{error}</p>}
        {helperText && !error && <p className="mt-1 text-xs text-[color:var(--app-muted)]">{helperText}</p>}
      </label>
    );
  }
);

FormInput.displayName = "FormInput";
