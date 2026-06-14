"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect } from "react";
import { OverlayShell } from "@/components/primitives/OverlayShell";
import type { AddonCatalogEntry, AssessmentPresetEntry } from "@/lib/addons/catalog";
import { CreateAssessmentBuilder } from "@/components/assessments/CreateAssessmentBuilder";
import { Button } from "@/components/primitives/Button";

interface CandidateAssessmentBuilderOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onInviteCreated?: () => void | Promise<void>;
  initialAddons: AddonCatalogEntry[];
  initialPresets: AssessmentPresetEntry[];
  linkedCandidateId: string;
  linkedCandidateMilestoneId: string;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
}

export function CandidateAssessmentBuilderOverlay({
  isOpen,
  onClose,
  onInviteCreated,
  initialAddons,
  initialPresets,
  linkedCandidateId,
  linkedCandidateMilestoneId,
  eyebrow = "Assessment",
  title = "Create a screening assessment",
  subtitle = "Build the assessment in place, keep the candidate open, and refresh the evidence once access is generated."
}: CandidateAssessmentBuilderOverlayProps) {
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  return (
    <OverlayShell isOpen={isOpen}>
      <AnimatePresence>
        {isOpen ? (
          <>
            <motion.div
              key="assessment-backdrop"
              className="fixed inset-0 z-[999] flex items-center justify-center p-3 md:p-6"
              style={{
                background:
                  "radial-gradient(circle at top, color-mix(in srgb, var(--app-brand) 14%, transparent), transparent 24%), rgba(3,8,20,0.82)"
              }}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, backdropFilter: "blur(0px)" }}
              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, backdropFilter: "blur(10px)" }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, backdropFilter: "blur(0px)" }}
              transition={{ duration: reduceMotion ? 0.12 : 0.22, ease: [0.22, 1, 0.36, 1] }}
              onClick={onClose}
            >
              <motion.div
                className="flex max-h-[96vh] w-full max-w-[1440px] flex-col overflow-hidden rounded-[32px] border border-[color:var(--app-border)] bg-[color:var(--app-modal-surface)] shadow-[var(--app-modal-shadow)]"
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.985, filter: "blur(10px)" }}
                animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.992, filter: "blur(8px)" }}
                transition={{ duration: reduceMotion ? 0.14 : 0.26, ease: [0.22, 1, 0.36, 1] }}
                onClick={(event) => event.stopPropagation()}
              >
                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-5 md:py-5">
                  <CreateAssessmentBuilder
                    embedded
                    initialAddons={initialAddons}
                    initialPresets={initialPresets}
                    eyebrow={eyebrow}
                    title={title}
                    subtitle={subtitle}
                    linkedCandidateId={linkedCandidateId}
                    linkedCandidateMilestoneId={linkedCandidateMilestoneId}
                    onInviteCreated={onInviteCreated}
                    utility={
                      <Button type="button" variant="secondary" onClick={onClose}>
                        Close
                      </Button>
                    }
                  />
                </div>
              </motion.div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </OverlayShell>
  );
}
