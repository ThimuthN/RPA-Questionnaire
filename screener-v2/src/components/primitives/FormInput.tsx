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
      <label className="grid gap-1">
        {label && <span className="text-sm text-[color:var(--app-text)]">{label}</span>}
        <input
          ref={ref}
          className={`rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--app-brand)] ${
            error ? "border-[color:var(--app-danger)]" : ""
          } ${className ?? ""}`}
          {...props}
        />
        {error && <p className="text-xs text-[color:var(--app-danger)]">{error}</p>}
        {helperText && !error && <p className="text-xs text-[color:var(--app-muted)]">{helperText}</p>}
      </label>
    );
  }
);

FormInput.displayName = "FormInput";
