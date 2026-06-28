import { create } from "zustand";

export type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

export type ProjectSummary = {
  title: string;
  category: string;
  overview: string;
  scopeOfWork: string[];
  keyDetails: { label: string; value: string }[];
  accessAndLocation: string;
  timing: string;
  additionalNotes: string;
  openQuestions: string[];
};

export type ContactDetails = {
  name: string;
  email: string;
  phone: string;
  address: string;
};

type NestState = {
  messages: ChatMessage[];
  turnCount: number;
  summary: ProjectSummary | null;
  contact: ContactDetails | null;
  addMessage: (m: Omit<ChatMessage, "id">) => void;
  setSummary: (s: ProjectSummary) => void;
  setContact: (c: ContactDetails) => void;
  bumpTurn: () => void;
  reset: () => void;
  seedUserMessage: (text: string) => void;
};

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  text:
    "Hi, I'm Nest. Tell me what's happening around your home and I'll help you figure out the next step.",
};

const initial = {
  messages: [WELCOME] as ChatMessage[],
  turnCount: 0,
  summary: null as ProjectSummary | null,
  contact: null as ContactDetails | null,
};

export const useNestStore = create<NestState>((set) => ({
  ...initial,
  addMessage: (m) =>
    set((s) => ({
      messages: [
        ...s.messages,
        { ...m, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}` },
      ],
    })),
  setSummary: (summary) => set({ summary }),
  setContact: (contact) => set({ contact }),
  bumpTurn: () => set((s) => ({ turnCount: s.turnCount + 1 })),
  reset: () => set({ ...initial, messages: [WELCOME] }),
  seedUserMessage: (text) =>
    set({
      messages: [
        WELCOME,
        {
          id: `seed-${Date.now()}`,
          role: "user",
          text,
        },
      ],
      turnCount: 1,
    }),
}));
