"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { Component, type ErrorInfo, type ReactNode, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const DynamicRive = dynamic(() => import("@rive-app/react-canvas"), {
  ssr: false
});

const sizeClasses = {
  sm: "h-10 w-10",
  md: "h-16 w-16",
  lg: "h-24 w-24",
  xl: "h-36 w-36",
  hero: "h-[240px] w-[240px] sm:h-[320px] sm:w-[320px]"
} as const;

class MascotErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { hasError: boolean }> {
  constructor(props: { fallback: ReactNode; children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _errorInfo: ErrorInfo) {}

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

function MascotFallback({ size }: { size: keyof typeof sizeClasses }) {
  const iconSize = size === "sm" ? 28 : size === "md" ? 44 : size === "lg" ? 64 : size === "xl" ? 92 : 180;

  return (
    <div className={cn("relative isolate", sizeClasses[size])}>
      <div className="absolute inset-[10%] rounded-full bg-brand-400/14 blur-2xl" />
      <div className="absolute inset-0 rounded-full border border-white/10 bg-[radial-gradient(circle_at_50%_40%,rgba(138,184,255,0.16),rgba(138,184,255,0.02)_58%,transparent_76%)]" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[22px] border border-white/10 bg-black/20 p-2">
        <Image src="/icon.svg" alt="" width={iconSize} height={iconSize} className="block" />
      </div>
    </div>
  );
}

export function RiveMascot({
  className,
  size = "lg",
  glow = true
}: {
  className?: string;
  size?: keyof typeof sizeClasses;
  glow?: boolean;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fallback = (
    <div className={cn(className)}>
      <MascotFallback size={size} />
    </div>
  );

  if (!mounted) return fallback;

  return (
    <div className={cn("relative isolate", sizeClasses[size], className)}>
      {glow ? <div className="absolute inset-[10%] rounded-full bg-brand-400/14 blur-2xl" /> : null}
      <MascotErrorBoundary fallback={<MascotFallback size={size} />}>
        <DynamicRive
          src="/mascot/character-head.riv"
          artboard="Artboard"
          stateMachines="State Machine 1"
          className="relative h-full w-full"
        />
      </MascotErrorBoundary>
    </div>
  );
}
