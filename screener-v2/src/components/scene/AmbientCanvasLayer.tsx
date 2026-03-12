"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type SceneVariant = "create" | "run" | "results";

const variantConfig: Record<
  SceneVariant,
  { particle: string; glow: string; line: string; count: number }
> = {
  create: {
    particle: "47, 134, 255",
    glow: "18, 179, 168",
    line: "138, 184, 255",
    count: 10
  },
  run: {
    particle: "138, 184, 255",
    glow: "47, 134, 255",
    line: "18, 179, 168",
    count: 8
  },
  results: {
    particle: "255, 255, 255",
    glow: "47, 134, 255",
    line: "230, 160, 25",
    count: 9
  }
};

interface Particle {
  x: number;
  y: number;
  dx: number;
  dy: number;
  size: number;
}

export function AmbientCanvasLayer({
  variant,
  className
}: {
  variant: SceneVariant;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!canvasRef.current) return;
    const currentCanvas: HTMLCanvasElement = canvasRef.current;

    const parent = currentCanvas.parentElement;
    if (!parent) return;

    const rawContext = currentCanvas.getContext("2d");
    if (!rawContext) return;
    const context: CanvasRenderingContext2D = rawContext;

    const config = variantConfig[variant];
    let animationFrame = 0;
    let width = 0;
    let height = 0;
    let particles: Particle[] = [];

    function resize() {
      const currentParent = currentCanvas.parentElement;
      if (!currentParent) return;
      const rect = currentParent.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      currentCanvas.width = Math.floor(rect.width * ratio);
      currentCanvas.height = Math.floor(rect.height * ratio);
      currentCanvas.style.width = `${rect.width}px`;
      currentCanvas.style.height = `${rect.height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);

      particles = Array.from({ length: config.count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        dx: (Math.random() - 0.5) * 0.24,
        dy: (Math.random() - 0.5) * 0.24,
        size: 1.4 + Math.random() * 2.2
      }));
    }

    function drawBackground() {
      context.clearRect(0, 0, width, height);

      const radial = context.createRadialGradient(width * 0.22, height * 0.18, 0, width * 0.22, height * 0.18, width * 0.42);
      radial.addColorStop(0, `rgba(${config.glow}, 0.16)`);
      radial.addColorStop(1, "rgba(0, 0, 0, 0)");
      context.fillStyle = radial;
      context.fillRect(0, 0, width, height);

      context.strokeStyle = "rgba(255,255,255,0.04)";
      context.lineWidth = 1;
      for (let x = 24; x < width; x += 72) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, height);
        context.stroke();
      }
      for (let y = 20; y < height; y += 68) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(width, y);
        context.stroke();
      }
    }

    function render(staticOnly = false) {
      drawBackground();

      for (let index = 0; index < particles.length; index += 1) {
        const particle = particles[index];
        if (!staticOnly) {
          particle.x += particle.dx;
          particle.y += particle.dy;
          if (particle.x < -10 || particle.x > width + 10) particle.dx *= -1;
          if (particle.y < -10 || particle.y > height + 10) particle.dy *= -1;
        }

        context.beginPath();
        context.fillStyle = `rgba(${config.particle}, 0.68)`;
        context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        context.fill();

        for (let otherIndex = index + 1; otherIndex < particles.length; otherIndex += 1) {
          const other = particles[otherIndex];
          const dx = particle.x - other.x;
          const dy = particle.y - other.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 120) {
            context.beginPath();
            context.strokeStyle = `rgba(${config.line}, ${0.14 - distance / 900})`;
            context.moveTo(particle.x, particle.y);
            context.lineTo(other.x, other.y);
            context.stroke();
          }
        }
      }
    }

    function frame() {
      render(false);
      animationFrame = window.requestAnimationFrame(frame);
    }

    resize();

    if (reduceMotion) {
      render(true);
    } else {
      frame();
    }

    const observer = new ResizeObserver(resize);
    observer.observe(parent);
    window.addEventListener("resize", resize);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resize);
      window.cancelAnimationFrame(animationFrame);
    };
  }, [reduceMotion, variant]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 h-full w-full opacity-70", className)}
    />
  );
}
