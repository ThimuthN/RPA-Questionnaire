"use client";

import { create } from "zustand";
import type { Question, RoleId, StackId } from "@/lib/assessment-engine/types";
import type { PracticalPack } from "@/features/practical/packs";

interface RuntimeState {
  attemptId: string | null;
  roleId: RoleId | null;
  stacks: StackId[];
  questions: Question[];
  answers: Record<string, unknown>;
  practicalPack: PracticalPack | null;
  practicalAnswer: Record<string, unknown>;
  coreRemainingSeconds: number;
  practicalRemainingSeconds: number;
  setRuntimePayload: (payload: {
    attemptId: string;
    roleId: RoleId;
    stacks: StackId[];
    questions: Question[];
    practicalPack: PracticalPack;
    coreRemainingSeconds: number;
    practicalRemainingSeconds: number;
  }) => void;
  setAnswer: (questionId: string, value: unknown) => void;
  setPracticalAnswer: (taskId: string, value: unknown) => void;
  tickCore: () => void;
  tickPractical: () => void;
  reset: () => void;
}

const initialState = {
  attemptId: null,
  roleId: null,
  stacks: [] as StackId[],
  questions: [] as Question[],
  answers: {} as Record<string, unknown>,
  practicalPack: null as PracticalPack | null,
  practicalAnswer: {} as Record<string, unknown>,
  coreRemainingSeconds: 20 * 60,
  practicalRemainingSeconds: 10 * 60
};

export const useRuntimeStore = create<RuntimeState>((set) => ({
  ...initialState,
  setRuntimePayload: (payload) =>
    set(() => ({
      ...payload,
      answers: {},
      practicalAnswer: {}
    })),
  setAnswer: (questionId, value) =>
    set((state) => ({
      answers: {
        ...state.answers,
        [questionId]: value
      }
    })),
  setPracticalAnswer: (taskId, value) =>
    set((state) => ({
      practicalAnswer: {
        ...state.practicalAnswer,
        [taskId]: value
      }
    })),
  tickCore: () =>
    set((state) => ({
      coreRemainingSeconds: Math.max(0, state.coreRemainingSeconds - 1)
    })),
  tickPractical: () =>
    set((state) => ({
      practicalRemainingSeconds: Math.max(0, state.practicalRemainingSeconds - 1)
    })),
  reset: () => set(() => initialState)
}));
