import { useEffect, useRef } from "react";
import {
  AudioLines,
  History,
  Keyboard,
  Mic,
  MicOff,
  PhoneOff,
  Send,
  X,
  ChevronDown,
} from "lucide-react";
import { VoiceOrb } from "./orb";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { COPY, detectUiLang } from "@/lib/voice/copy";
import { VoiceEngine } from "@/lib/voice/engine";
import { useVoice } from "@/lib/voice/store";
import { getVoice, VOICES } from "@/lib/voice/voices";

export function VoiceApp() {
  const phase = useVoice((s) => s.phase);
  const state = useVoice((s) => s.state);
  const amp = useVoice((s) => s.amp);
  const voiceId = useVoice((s) => s.voiceId);
  const uiLang = useVoice((s) => s.uiLang);
  const tint = getVoice(voiceId).tint;
  const engineRef = useRef<VoiceEngine | null>(null);

  useEffect(() => {
    useVoice.getState().setUiLang(detectUiLang());
    return () => {
      engineRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    engineRef.current?.setVoice(voiceId);
  }, [voiceId]);

  return (
    <main className="relative min-h-dvh overflow-hidden bg-bg text-fg">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_38%,color-mix(in_oklab,var(--color-glow)_8%,transparent),transparent_58%)]" />
      {phase === "start" ? (
        <StartScreen engineRef={engineRef} />
      ) : (
        <CallScreen engineRef={engineRef} />
      )}
      <StatusPulse state={state} amp={amp} tint={tint} />
      <p className="sr-only">{COPY[uiLang].about}</p>
    </main>
  );
}

function StartScreen({
  engineRef,
}: {
  engineRef: React.MutableRefObject<VoiceEngine | null>;
}) {
  const uiLang = useVoice((s) => s.uiLang);
  const voiceId = useVoice((s) => s.voiceId);
  const state = useVoice((s) => s.state);
  const amp = useVoice((s) => s.amp);
  const error = useVoice((s) => s.error);
  const pickerOpen = useVoice((s) => s.pickerOpen);
  const t = COPY[uiLang];
  const voice = getVoice(voiceId);
  const connecting = state === "connecting";

  return (
    <div
      className="relative mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))]"
      dir={uiLang === "fa" ? "rtl" : "ltr"}
    >
      <header className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-medium tracking-[0.22em] text-subtle uppercase">
            {t.product}
          </p>
          <h1 className="font-display text-2xl font-medium tracking-tight text-fg">
            {t.brand}
          </h1>
        </div>
        <LangToggle />
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-8">
        <button
          type="button"
          className="group relative grid place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
          onClick={() => void startCall(engineRef)}
          disabled={connecting}
          aria-label={t.start}
        >
          <VoiceOrb
            amp={connecting ? 0.35 : amp * 0.4 + 0.08}
            state={connecting ? "thinking" : "idle"}
            tint={voice.tint}
            size={260}
          />
        </button>

        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-lg font-medium tracking-tight text-fg">{t.tagline}</p>
          <p className="max-w-xs text-sm text-muted">{t.hint}</p>
        </div>

        <button
          type="button"
          className="flex h-11 items-center gap-2 rounded-full bg-surface-2 px-4 text-sm text-fg shadow-[var(--shadow-border)] transition-[transform,background-color] duration-150 ease-out hover:bg-surface active:scale-[0.96]"
          onClick={() => useVoice.getState().setPickerOpen(true)}
        >
          <span className="size-2 rounded-full bg-fg/80" />
          <span>{uiLang === "fa" ? voice.nameFa : voice.name}</span>
          <span className="text-subtle">
            {uiLang === "fa" ? voice.toneFa : voice.tone}
          </span>
          <ChevronDown className="size-4 text-subtle" />
        </button>

        {error === "mic" ? (
          <p className="max-w-sm text-center text-sm text-muted">{t.micDenied}</p>
        ) : null}

        <Button
          size="lg"
          className="min-w-52"
          onClick={() => void startCall(engineRef)}
          disabled={connecting}
        >
          {connecting ? t.connecting : t.start}
        </Button>
      </div>
      {pickerOpen ? <VoicePicker /> : null}
    </div>
  );
}

function CallScreen({
  engineRef,
}: {
  engineRef: React.MutableRefObject<VoiceEngine | null>;
}) {
  const uiLang = useVoice((s) => s.uiLang);
  const state = useVoice((s) => s.state);
  const amp = useVoice((s) => s.amp);
  const voiceId = useVoice((s) => s.voiceId);
  const muted = useVoice((s) => s.muted);
  const userCaption = useVoice((s) => s.userCaption);
  const grokCaption = useVoice((s) => s.grokCaption);
  const historyOpen = useVoice((s) => s.historyOpen);
  const textOpen = useVoice((s) => s.textOpen);
  const pickerOpen = useVoice((s) => s.pickerOpen);
  const t = COPY[uiLang];
  const voice = getVoice(voiceId);
  const status =
    muted && state !== "speaking"
      ? t.muted
      : state === "connecting"
        ? t.connecting
        : state === "thinking"
          ? t.thinking
          : state === "speaking"
            ? t.speaking
            : t.listening;

  const live = grokCaption || userCaption;

  return (
    <div
      className="relative mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))]"
      dir={uiLang === "fa" ? "rtl" : "ltr"}
    >
      <header className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="iconSm"
          className="bg-surface-2/80"
          aria-label={t.close}
          onClick={() => endCall(engineRef)}
        >
          <X className="size-5" />
        </Button>
        <div className="text-center">
          <p className="text-sm font-medium tracking-tight">{t.brand}</p>
          <p className="text-xs text-subtle tabular-nums">{status}</p>
        </div>
        <Button
          variant="ghost"
          size="iconSm"
          className="bg-surface-2/80"
          aria-label={t.history}
          onClick={() => useVoice.getState().setHistoryOpen(true)}
        >
          <History className="size-5" />
        </Button>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-8">
        <VoiceOrb amp={amp} state={state} tint={voice.tint} size={280} />
        <div className="min-h-16 w-full max-w-sm px-2 text-center">
          <p
            dir="auto"
            className="text-pretty text-base font-medium leading-snug tracking-tight text-fg/90"
          >
            {live || " "}
          </p>
        </div>
      </div>

      {textOpen ? <Composer engineRef={engineRef} /> : null}

      <nav className="flex items-center justify-center gap-5 pb-2">
        <RoundControl
          label={t.voices}
          onClick={() => useVoice.getState().setPickerOpen(true)}
        >
          <AudioLines className="size-6" />
        </RoundControl>
        <RoundControl
          label={muted ? t.unmute : t.mute}
          onClick={() => toggleMute(engineRef)}
          active={!muted}
        >
          {muted ? <MicOff className="size-6" /> : <Mic className="size-6" />}
        </RoundControl>
        <RoundControl
          label={t.hangup}
          hang
          onClick={() => endCall(engineRef)}
        >
          <PhoneOff className="size-6" />
        </RoundControl>
        <RoundControl
          label={t.keyboard}
          onClick={() =>
            useVoice.getState().setTextOpen(!useVoice.getState().textOpen)
          }
          active={textOpen}
        >
          <Keyboard className="size-6" />
        </RoundControl>
      </nav>

      {historyOpen ? <HistorySheet /> : null}
      {pickerOpen ? <VoicePicker /> : null}
    </div>
  );
}

function RoundControl({
  children,
  label,
  onClick,
  hang,
  active,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  hang?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "grid size-14 place-items-center rounded-full shadow-[var(--shadow-border)] transition-[transform,background-color,opacity] duration-150 ease-out active:scale-[0.96]",
        hang
          ? "bg-hang text-hang-fg"
          : active
            ? "bg-fg text-accent-fg"
            : "bg-surface-2 text-fg",
      )}
    >
      {children}
    </button>
  );
}

function Composer({
  engineRef,
}: {
  engineRef: React.MutableRefObject<VoiceEngine | null>;
}) {
  const uiLang = useVoice((s) => s.uiLang);
  const draft = useVoice((s) => s.draft);
  const t = COPY[uiLang];

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    useVoice.getState().setDraft("");
    engineRef.current?.sendText(text);
  };

  return (
    <form
      className="mb-4 flex items-center gap-2 rounded-2xl bg-surface-2 p-2 shadow-[var(--shadow-border)]"
      onSubmit={(e) => {
        e.preventDefault();
        send();
      }}
    >
      <input
        value={draft}
        onChange={(e) => useVoice.getState().setDraft(e.target.value)}
        placeholder={t.typePlaceholder}
        className="h-11 min-w-0 flex-1 bg-transparent px-3 text-sm text-fg placeholder:text-subtle focus:outline-none"
        dir="auto"
      />
      <Button
        size="iconSm"
        type="submit"
        aria-label={t.send}
        disabled={!draft.trim()}
      >
        <Send className="size-4" />
      </Button>
    </form>
  );
}

function HistorySheet() {
  const uiLang = useVoice((s) => s.uiLang);
  const history = useVoice((s) => s.history);
  const t = COPY[uiLang];

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-bg/95">
      <div className="flex items-center justify-between px-5 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <h2 className="text-base font-medium">{t.history}</h2>
        <Button
          variant="ghost"
          size="iconSm"
          aria-label={t.close}
          onClick={() => useVoice.getState().setHistoryOpen(false)}
        >
          <X className="size-5" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {history.length === 0 ? (
          <p className="text-sm text-muted">{t.emptyHistory}</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {history.map((turn) => (
              <li key={turn.id} className="flex flex-col gap-1">
                <span className="text-[11px] font-medium tracking-wide text-subtle uppercase">
                  {turn.role === "user" ? t.you : t.grok}
                </span>
                <p dir="auto" className="text-sm leading-relaxed text-fg">
                  {turn.text}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function VoicePicker() {
  const uiLang = useVoice((s) => s.uiLang);
  const voiceId = useVoice((s) => s.voiceId);
  const t = COPY[uiLang];

  return (
    <div
      className="absolute inset-0 z-30 grid place-items-end bg-bg/70"
      onClick={() => useVoice.getState().setPickerOpen(false)}
    >
      <div
        className="w-full max-w-lg rounded-t-3xl bg-surface px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 shadow-[var(--shadow-border)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-fg/15" />
        <h2 className="mb-3 text-base font-medium">{t.pickVoice}</h2>
        <ul className="grid grid-cols-2 gap-2">
          {VOICES.map((v) => {
            const active = v.id === voiceId;
            return (
              <li key={v.id}>
                <button
                  type="button"
                  className={cn(
                    "flex h-16 w-full flex-col items-start justify-center rounded-xl px-3 text-left transition-[transform,background-color] duration-150 ease-out active:scale-[0.96]",
                    active ? "bg-fg text-accent-fg" : "bg-surface-2 text-fg",
                  )}
                  onClick={() => {
                    useVoice.getState().setVoice(v.id);
                    useVoice.getState().setPickerOpen(false);
                  }}
                >
                  <span className="text-sm font-medium">
                    {uiLang === "fa" ? v.nameFa : v.name}
                  </span>
                  <span
                    className={cn(
                      "text-xs",
                      active ? "text-accent-fg/70" : "text-subtle",
                    )}
                  >
                    {uiLang === "fa" ? v.toneFa : v.tone}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function LangToggle() {
  const uiLang = useVoice((s) => s.uiLang);
  const spokenLang = useVoice((s) => s.spokenLang);
  const t = COPY[uiLang];
  const cycle = () => {
    const next = spokenLang === "auto" ? "fa" : spokenLang === "fa" ? "en" : "auto";
    useVoice.getState().setSpokenLang(next);
    if (next === "fa") useVoice.getState().setUiLang("fa");
    if (next === "en") useVoice.getState().setUiLang("en");
  };
  const label =
    spokenLang === "auto" ? t.auto : spokenLang === "fa" ? t.persian : t.english;
  return (
    <button
      type="button"
      onClick={cycle}
      className="h-9 rounded-full bg-surface-2 px-3 text-xs font-medium text-muted shadow-[var(--shadow-border)] transition-[transform,background-color] duration-150 ease-out hover:text-fg active:scale-[0.96]"
    >
      {label}
    </button>
  );
}

function StatusPulse({
  state,
  amp,
  tint,
}: {
  state: string;
  amp: number;
  tint: [number, number, number];
}) {
  const scale = 1 + Math.min(0.08, amp * 0.12);
  return (
    <div
      className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full opacity-30 blur-3xl"
      style={{
        transform: `translateX(-50%) scale(${scale})`,
        background: `rgb(${Math.floor(tint[0] * 255)} ${Math.floor(tint[1] * 255)} ${Math.floor(tint[2] * 255)})`,
        opacity: state === "speaking" ? 0.4 : 0.18,
      }}
    />
  );
}

async function startCall(
  engineRef: React.MutableRefObject<VoiceEngine | null>,
) {
  const store = useVoice.getState();
  store.setError(null);
  store.setState("connecting");
  store.setPhase("call");

  const engine = new VoiceEngine({
    onState: (s) => useVoice.getState().setState(s),
    onAmp: (n) => useVoice.getState().setAmp(n),
    onUserCaption: (text) => {
      useVoice.getState().setUserCaption(text);
      useVoice.getState().setGrokCaption("");
    },
    onGrokCaption: (text) => useVoice.getState().setGrokCaption(text),
    onTurn: (role, text) => useVoice.getState().pushTurn(role, text),
    onMode: (mode) => useVoice.getState().setMode(mode),
    onError: (message) => {
      if (message === "mic") {
        useVoice.getState().setPhase("start");
        useVoice.getState().setError("mic");
      }
    },
  });
  engineRef.current = engine;
  await engine.start({
    voiceId: store.voiceId,
    spokenLang: store.spokenLang,
    uiFa: store.uiLang === "fa",
  });
}

function endCall(engineRef: React.MutableRefObject<VoiceEngine | null>) {
  engineRef.current?.stop();
  engineRef.current = null;
  useVoice.getState().resetCall();
}

function toggleMute(engineRef: React.MutableRefObject<VoiceEngine | null>) {
  const next = !useVoice.getState().muted;
  useVoice.getState().setMuted(next);
  engineRef.current?.setMuted(next);
}
