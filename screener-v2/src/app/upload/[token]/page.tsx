import { Suspense } from "react";
import { UploadTokenGate } from "./UploadTokenGate";

export const dynamic = "force-dynamic";

export default async function UploadPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <Suspense>
      <UploadTokenGate token={token} />
    </Suspense>
  );
}
