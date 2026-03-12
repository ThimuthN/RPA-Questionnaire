import React from "react";

export function GenericReviewRenderer({ review }: { review: any }) {
  const lines = Array.isArray(review?.lines) ? review.lines : [];
  return (
    <div className="space-y-1 text-sm text-slate-200">
      {lines.map((line: string, index: number) => (
        <p key={`${index}-${line}`}>{line}</p>
      ))}
    </div>
  );
}
