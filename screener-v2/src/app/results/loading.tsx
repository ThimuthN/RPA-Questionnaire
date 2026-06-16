import { BrandLoader } from "@/components/brand/BrandLoader";

export default function ResultsLoading() {
  return (
    <BrandLoader
      title="Loading results"
      subtitle="Gathering assessment outcomes and candidate decisions."
      minHeight="min-h-[60vh]"
    />
  );
}
