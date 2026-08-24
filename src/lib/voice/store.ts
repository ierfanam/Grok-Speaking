import { create } from "zustand";
import { DEFAULT_VOICE, type VoiceId } from "./voices";
import { type UiLang } from "./copy";

export type CallState =
  | "idle"
  | "connecting"
  | "listening"
  | "thinking"
  | "speaking"
  | "error";

export type EngineMode = "realtime" | "local" | null;

export type Turn = {
  id: string;
  role: "user" | "grok";
  text: string;
};

type VoiceStore = {
  phase: "start" | "call";
  state: CallState;
  voiceId: VoiceId;
  uiLang: UiLang;
  spokenLang: "auto" | "fa" | "en";
  muted: boolean;
  amp: number;
  userCaption: string;
  grokCaption: string;
  history: Turn[];
  error: string | null;
  mode: EngineMode;
  historyOpen: boolean;
  pickerOpen: boolean;
  textOpen: boolean;
  draft: string;
  setPhase: (phase: "start" | "call") => void;
  setState: (state: CallState) => void;
  setVoice: (id: VoiceId) => void;
  setUiLang: (lang: UiLang) => void;
  setSpokenLang: (lang: "auto" | "fa" | "en") => void;
  setMuted: (muted: boolean) => void;
  setAmp: (amp: number) => void;
  setUserCaption: (text: string) => void;
  setGrokCaption: (text: string) => void;
  pushTurn: (role: "user" | "grok", text: string) => void;
  setError: (error: string | null) => void;
  setMode: (mode: EngineMode) => void;
  setHistoryOpen: (open: boolean) => void;
  setPickerOpen: (open: boolean) => void;
  setTextOpen: (open: boolean) => void;
  setDraft: (draft: string) => void;
  resetCall: () => void;
};

let turnN = 0;

export const useVoice = create<VoiceStore>((set) => ({
  phase: "start",
  state: "idle",
  voiceId: DEFAULT_VOICE,
  uiLang: "en",
  spokenLang: "auto",
  muted: false,
  amp: 0,
  userCaption: "",
  grokCaption: "",
  history: [],
  error: null,
  mode: null,
  historyOpen: false,
  pickerOpen: false,
  textOpen: false,
  draft: "",
  setPhase: (phase) => set({ phase }),
  setState: (state) => set({ state }),
  setVoice: (voiceId) => set({ voiceId }),
  setUiLang: (uiLang) => set({ uiLang }),
  setSpokenLang: (spokenLang) => set({ spokenLang }),
  setMuted: (muted) => set({ muted }),
  setAmp: (amp) => set({ amp }),
  setUserCaption: (userCaption) => set({ userCaption }),
  setGrokCaption: (grokCaption) => set({ grokCaption }),
  pushTurn: (role, text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    turnN += 1;
    set((s) => ({
      history: [...s.history, { id: `t${turnN}`, role, text: trimmed }],
    }));
  },
  setError: (error) => set({ error, state: error ? "error" : "idle" }),
  setMode: (mode) => set({ mode }),
  setHistoryOpen: (historyOpen) => set({ historyOpen }),
  setPickerOpen: (pickerOpen) => set({ pickerOpen }),
  setTextOpen: (textOpen) => set({ textOpen }),
  setDraft: (draft) => set({ draft }),
  resetCall: () =>
    set({
      phase: "start",
      state: "idle",
      muted: false,
      amp: 0,
      userCaption: "",
      grokCaption: "",
      error: null,
      mode: null,
      historyOpen: false,
      pickerOpen: false,
      textOpen: false,
      draft: "",
    }),
}));
