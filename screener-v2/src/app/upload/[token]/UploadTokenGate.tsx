import { resolveUploadToken } from "@/lib/external-assessment-upload-token";
import { UploadForm } from "./UploadForm";

export async function UploadTokenGate({ token }: { token: string }) {
  const result = await resolveUploadToken(token);

  if (result.status === "not_found") {
    return <UploadErrorScreen title="Link not found" description="This upload link doesn't exist or has been removed." />;
  }
  if (result.status === "expired") {
    return <UploadErrorScreen title="Link expired" description="This upload link has expired. Contact the hiring team to request a new one." />;
  }
  if (result.status === "used") {
    return <UploadSuccessScreen alreadyUsed />;
  }

  // status === "valid" at this point; narrowing guard for TS
  if (!result.record) return null;
  const { assessment } = result.record;

  return (
    <UploadForm token={token} assessmentTitle={assessment.title} />
  );
}

function UploadErrorScreen({ title, description }: { title: string; description: string }) {
  return (
    <UploadShell>
      <div className="text-center space-y-3">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
          <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="text-sm text-slate-400 max-w-xs">{description}</p>
      </div>
    </UploadShell>
  );
}

export function UploadSuccessScreen({ alreadyUsed = false }: { alreadyUsed?: boolean }) {
  return (
    <UploadShell>
      <div className="text-center space-y-3">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
          <svg className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-white">
          {alreadyUsed ? "Files already submitted" : "Upload complete"}
        </h2>
        <p className="text-sm text-slate-400 max-w-xs">
          {alreadyUsed
            ? "Your files have already been submitted via this link. Contact the hiring team if you need to resubmit."
            : "Your files have been received. The hiring team will review them shortly."}
        </p>
      </div>
    </UploadShell>
  );
}

export function UploadShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#080f1c] flex flex-col items-center justify-center px-4 py-12">
      {/* Starry wordmark */}
      <div className="mb-10 flex items-center gap-2">
        <span className="text-[18px] text-[#18b5ae]" style={{ fontFamily: "serif" }}>✦</span>
        <span className="font-semibold text-[18px] text-white tracking-tight">Starry</span>
        <span className="ml-1 text-[10px] uppercase tracking-[0.22em] text-slate-500">Talent OS</span>
      </div>

      <div className="w-full max-w-md rounded-[24px] border border-white/[0.08] bg-white/[0.04] p-8 backdrop-blur-xl shadow-[0_32px_64px_rgba(0,0,0,0.6)]">
        {children}
      </div>

      <p className="mt-8 text-[11px] text-slate-600">
        Secure upload powered by Starry Talent OS
      </p>
    </div>
  );
}
