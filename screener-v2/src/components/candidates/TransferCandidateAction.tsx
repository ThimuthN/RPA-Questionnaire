"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/primitives/Button";
import { NominateToDeptModal } from "@/components/candidates/NominateToDeptModal";

export function TransferCandidateAction({
  candidateId,
  open: controlledOpen,
  onOpenChange,
}: {
  candidateId: string;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
}) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  return (
    <>
      {controlledOpen === undefined ? (
        <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
          Transfer department
        </Button>
      ) : null}
      <NominateToDeptModal
        isOpen={open}
        onClose={() => setOpen(false)}
        candidateId={candidateId}
        onSuccess={() => {
          setOpen(false);
          router.refresh();
        }}
      />
    </>
  );
}
