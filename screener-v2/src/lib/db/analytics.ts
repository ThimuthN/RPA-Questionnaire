import { cache } from "react";
import { prisma } from "@/lib/db/prisma";
import { candidateStageLabels } from "@/lib/candidates/types";

const STAGE_ORDER = [
  "applicant",
  "pipeline",
  "screening",
  "interview",
  "advanced_review",
  "finalized",
] as const;

export type FunnelRow = {
  stage: string;
  label: string;
  count: number;
  conversionFromPrev: number | null;
};

export const getFunnelConversion = cache(async function(): Promise<FunnelRow[]> {
  const groups = await prisma.candidate.groupBy({
    by: ["stage"],
    _count: { id: true },
  });

  const countByStage = new Map(groups.map((g) => [g.stage, g._count.id]));

  const rows: FunnelRow[] = [];
  let prev: number | null = null;
  for (const stage of STAGE_ORDER) {
    const count = countByStage.get(stage) ?? 0;
    const conversion =
      prev !== null && prev > 0 ? Math.round((count / prev) * 100) : null;
    rows.push({ stage, label: candidateStageLabels[stage] ?? stage, count, conversionFromPrev: conversion });
    prev = count;
  }
  return rows;
});

export type StageTimeRow = {
  stage: string;
  label: string;
  avgDays: number;
  medianDays: number;
};

export const getStageTimings = cache(async function(): Promise<StageTimeRow[]> {
  const stages = ["pipeline", "screening", "interview", "advanced_review"] as const;
  const results = await Promise.all(
    stages.map((stage) =>
      prisma.candidate.findMany({
        where: { stage, orgStage: { not: "finalized" } },
        select: { updatedAt: true, createdAt: true },
        take: 200,
      })
    )
  );

  return stages.map((stage, i) => {
    const rows = results[i];
    if (rows.length === 0) return { stage, label: candidateStageLabels[stage] ?? stage, avgDays: 0, medianDays: 0 };
    const days = rows
      .map((r) => (r.updatedAt.getTime() - r.createdAt.getTime()) / 86_400_000)
      .sort((a, b) => a - b);
    const avg = Math.round(days.reduce((s, d) => s + d, 0) / days.length);
    const mid = Math.floor(days.length / 2);
    const median = Math.round(days.length % 2 === 0 ? (days[mid - 1]! + days[mid]!) / 2 : days[mid]!);
    return { stage, label: candidateStageLabels[stage] ?? stage, avgDays: avg, medianDays: median };
  });
});

export type InterviewerLoadRow = {
  userId: string;
  name: string;
  email: string;
  panelCount: number;
  feedbackSubmitted: number;
  submissionRate: number;
};

export const getInterviewerLoad = cache(async function(days = 30): Promise<InterviewerLoadRow[]> {
  const since = new Date(Date.now() - days * 86_400_000);

  const members = await prisma.interviewPanelMember.findMany({
    where: { panel: { createdAt: { gte: since } } },
    select: {
      userId: true,
      user: { select: { id: true, name: true, email: true } },
      panel: {
        select: {
          feedbacks: {
            where: { submittedAt: { not: null } },
            select: { interviewerId: true },
          },
        },
      },
    },
  });

  const byUser = new Map<string, { name: string; email: string; panels: number; submitted: number }>();
  for (const m of members) {
    const existing = byUser.get(m.userId) ?? {
      name: m.user.name ?? m.user.email,
      email: m.user.email,
      panels: 0,
      submitted: 0,
    };
    existing.panels += 1;
    const didSubmit = m.panel.feedbacks.some((f) => f.interviewerId === m.userId);
    if (didSubmit) existing.submitted += 1;
    byUser.set(m.userId, existing);
  }

  return Array.from(byUser.entries())
    .map(([userId, d]) => ({
      userId,
      name: d.name,
      email: d.email,
      panelCount: d.panels,
      feedbackSubmitted: d.submitted,
      submissionRate: d.panels > 0 ? Math.round((d.submitted / d.panels) * 100) : 0,
    }))
    .sort((a, b) => b.panelCount - a.panelCount);
});

export type RoleAgingRow = {
  id: string;
  title: string;
  department: string | null;
  daysOpen: number;
  applicantCount: number;
  pipelineCount: number;
  isStalled: boolean;
};

export const getRoleAging = cache(async function(): Promise<RoleAgingRow[]> {
  const now = new Date();
  const jobs = await prisma.jobPosting.findMany({
    where: { isOpen: true, isPublished: true },
    select: {
      id: true,
      title: true,
      createdAt: true,
      department: { select: { name: true } },
      _count: {
        select: {
          applications: {
            where: { status: { in: ["submitted", "under_review"] } },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const pipelineCounts = await prisma.candidate.groupBy({
    by: ["positionAppliedFor"],
    where: { stage: { notIn: ["applicant", "finalized"] }, orgStage: "active" },
    _count: { id: true },
  });
  const pipelineByTitle = new Map(
    pipelineCounts.map((r) => [r.positionAppliedFor ?? "", r._count.id])
  );

  return jobs.map((j) => {
    const daysOpen = Math.floor((now.getTime() - j.createdAt.getTime()) / 86_400_000);
    const applicantCount = j._count.applications;
    return {
      id: j.id,
      title: j.title,
      department: j.department?.name ?? null,
      daysOpen,
      applicantCount,
      pipelineCount: pipelineByTitle.get(j.title) ?? 0,
      isStalled: daysOpen >= 14 && applicantCount === 0,
    };
  });
});

export type SourceBreakdownRow = {
  source: string;
  label: string;
  count: number;
  pct: number;
};

const SOURCE_LABELS: Record<string, string> = {
  referral: "Referral",
  linkedin: "LinkedIn",
  job_board: "Job Board",
  direct: "Direct",
  agency: "Agency",
  other: "Other",
};

export const getSourceBreakdown = cache(async function(): Promise<SourceBreakdownRow[]> {
  const groups = await prisma.candidateApplication.groupBy({
    by: ["source"],
    _count: { id: true },
  });

  const total = groups.reduce((s, g) => s + g._count.id, 0);
  return groups
    .filter((g) => g.source)
    .map((g) => ({
      source: g.source!,
      label: SOURCE_LABELS[g.source!] ?? g.source!,
      count: g._count.id,
      pct: total > 0 ? Math.round((g._count.id / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);
});
