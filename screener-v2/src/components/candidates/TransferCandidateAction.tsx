"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/primitives/Button";
import { NominateToDeptModal } from "@/components/candidates/NominateToDeptModal";

export function TransferCandidateAction({ candidateId }: { candidateId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        Transfer department
      </Button>
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
