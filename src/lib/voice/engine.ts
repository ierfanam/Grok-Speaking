import { createVoiceSession } from "./server";
import {
  arrayBufferToBase64,
  base64ToArrayBuffer,
  floatTo16BitPCM,
  pcm16ToFloat,
  resampleLinear,
  rms,
} from "./pcm";
import { grokGreeting, grokReply, isPersian } from "./local-brain";
import type { VoiceId } from "./voices";

export type EngineHandlers = {
  onState: (state: "connecting" | "listening" | "thinking" | "speaking") => void;
  onAmp: (amp: number) => void;
  onUserCaption: (text: string, final: boolean) => void;
  onGrokCaption: (text: string, final: boolean) => void;
  onTurn: (role: "user" | "grok", text: string) => void;
  onMode: (mode: "realtime" | "local") => void;
  onError: (message: string) => void;
};

type StartOpts = {
  voiceId: VoiceId;
  spokenLang: "auto" | "fa" | "en";
  uiFa: boolean;
};

const TARGET_RATE = 24000;
const GROK_INSTRUCTIONS = `You are Grok, an AI assistant built by xAI. You are helpful, maximally truthful, and have a dry, irreverent wit inspired by the Hitchhiker's Guide to the Galaxy and JARVIS.

# Style
This is a spoken conversation. Keep answers concise: usually one to three sentences, longer only if asked. Sound natural, not like an essay. No markdown, no bullet lists, no URLs unless asked.

# Language
Reply in the same language the user is speaking. If they speak Persian (Farsi), answer in fluent Persian. Switch mid-conversation when they switch.

# Identity
You are Grok. You were built by xAI. You are not ChatGPT, not Google, not Alexa.`;

type Recog = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort?: () => void;
  onresult: ((ev: SpeechRecogEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((ev: { error?: string }) => void) | null;
};

type SpeechRecogEvent = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0?: { transcript: string };
  }>;
};

function speechRecognitionCtor(): (new () => Recog) | null {
  const w = window as unknown as {
    SpeechRecognition?: new () => Recog;
    webkitSpeechRecognition?: new () => Recog;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function speechLang(spoken: "auto" | "fa" | "en", uiFa: boolean): string {
  if (spoken === "fa") return "fa-IR";
  if (spoken === "en") return "en-US";
  if (uiFa) return "fa-IR";
  const nav = (navigator.language || "en").toLowerCase();
  if (nav.startsWith("fa")) return "fa-IR";
  return navigator.language || "en-US";
}

export class VoiceEngine {
  private handlers: EngineHandlers;
  private opts: StartOpts | null = null;
  private stopped = false;
  private muted = false;
  private mode: "realtime" | "local" | null = null;
  private stream: MediaStream | null = null;
  private audio: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private ws: WebSocket | null = null;
  private nextPlay = 0;
  private speaking = false;
  private playAmp = 0;
  private ampRaf = 0;
  private recog: Recog | null = null;
  private localHistory: { role: "user" | "grok"; text: string }[] = [];
  private currentUser = "";
  private currentGrok = "";
  private greetingPlayed = false;
  private ampSmooth = 0;

  constructor(handlers: EngineHandlers) {
    this.handlers = handlers;
  }

  async start(opts: StartOpts): Promise<void> {
    this.opts = opts;
    this.stopped = false;
    this.handlers.onState("connecting");

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });
    } catch {
      this.handlers.onError("mic");
      return;
    }
    if (this.stopped) {
      this.cleanupMedia();
      return;
    }

    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.audio = new Ctx();
    if (this.audio.state === "suspended") await this.audio.resume();

    let session: Awaited<ReturnType<typeof createVoiceSession>>;
    try {
      session = await createVoiceSession();
    } catch {
      session = { ok: false, error: "unavailable" };
    }
    if (this.stopped) {
      this.cleanupMedia();
      return;
    }

    if (session.ok) {
      const connected = await this.connectRealtime(session.token, session.model);
      if (connected && !this.stopped) {
        this.mode = "realtime";
        this.handlers.onMode("realtime");
        this.hookMic(true);
        this.handlers.onState("listening");
        this.startAmpLoop();
        return;
      }
    }

    this.mode = "local";
    this.handlers.onMode("local");
    this.hookMic(false);
    this.startAmpLoop();
    this.startLocal();
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    this.stream?.getAudioTracks().forEach((t) => {
      t.enabled = !muted;
    });
  }

  setVoice(voiceId: VoiceId) {
    if (!this.opts) return;
    this.opts = { ...this.opts, voiceId };
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: "session.update",
          session: { voice: voiceId },
        }),
      );
    }
  }

  sendText(text: string) {
    const trimmed = text.trim();
    if (!trimmed || this.stopped) return;
    this.handlers.onUserCaption(trimmed, true);
    this.handlers.onTurn("user", trimmed);
    this.localHistory.push({ role: "user", text: trimmed });

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: "conversation.item.create",
          item: {
            type: "message",
            role: "user",
            content: [{ type: "input_text", text: trimmed }],
          },
        }),
      );
      this.ws.send(JSON.stringify({ type: "response.create" }));
      this.handlers.onState("thinking");
      return;
    }

    void this.localAnswer(trimmed);
  }

  stop() {
    this.stopped = true;
    this.cleanup();
  }

  private async connectRealtime(token: string, model: string): Promise<boolean> {
    return new Promise((resolve) => {
      let settled = false;
      const finish = (ok: boolean) => {
        if (settled) return;
        settled = true;
        resolve(ok);
      };

      const url = `wss://api.x.ai/v1/realtime?model=${encodeURIComponent(model)}`;
      let ws: WebSocket;
      try {
        ws = new WebSocket(url, [`xai-client-secret.${token}`]);
      } catch {
        finish(false);
        return;
      }
      this.ws = ws;

      const timer = window.setTimeout(() => {
        if (!settled) {
          try {
            ws.close();
          } catch {
            /* ignore */
          }
          finish(false);
        }
      }, 6000);

      ws.onopen = () => {
        const langHint =
          this.opts?.spokenLang === "fa"
            ? "fa"
            : this.opts?.spokenLang === "en"
              ? "en"
              : this.opts?.uiFa
                ? "fa"
                : undefined;
        ws.send(
          JSON.stringify({
            type: "session.update",
            session: {
              instructions: GROK_INSTRUCTIONS,
              voice: this.opts?.voiceId ?? "eve",
              turn_detection: {
                type: "server_vad",
                threshold: 0.72,
                silence_duration_ms: 650,
                prefix_padding_ms: 300,
              },
              audio: {
                input: {
                  format: { type: "audio/pcm", rate: TARGET_RATE },
                  transport: "json",
                  ...(langHint
                    ? { transcription: { language_hint: langHint } }
                    : {}),
                },
                output: {
                  format: { type: "audio/pcm", rate: TARGET_RATE },
                  transport: "json",
                },
              },
            },
          }),
        );
      };

      ws.onmessage = (ev) => {
        if (typeof ev.data !== "string") {
          if (ev.data instanceof ArrayBuffer) {
            this.enqueuePcm(ev.data);
          }
          return;
        }
        let msg: Record<string, unknown>;
        try {
          msg = JSON.parse(ev.data) as Record<string, unknown>;
        } catch {
          return;
        }
        const type = String(msg.type ?? "");
        if (type === "session.updated" || type === "session.created") {
          window.clearTimeout(timer);
          finish(true);
          if (!this.greetingPlayed) {
            this.greetingPlayed = true;
            const text = grokGreeting(Boolean(this.opts?.uiFa));
            ws.send(
              JSON.stringify({
                type: "conversation.item.create",
                item: {
                  type: "force_message",
                  role: "assistant",
                  interruptible: true,
                  content: [{ type: "output_text", text }],
                },
              }),
            );
          }
          return;
        }
        this.handleRealtimeEvent(msg);
      };

      ws.onerror = () => {
        window.clearTimeout(timer);
        finish(false);
      };
      ws.onclose = () => {
        window.clearTimeout(timer);
        if (!settled) finish(false);
        this.ws = null;
      };
    });
  }

  private handleRealtimeEvent(msg: Record<string, unknown>) {
    const type = String(msg.type ?? "");
    const delta = typeof msg.delta === "string" ? msg.delta : "";
    const audio = typeof msg.audio === "string" ? msg.audio : "";
    const transcript =
      typeof msg.transcript === "string"
        ? msg.transcript
        : typeof msg.text === "string"
          ? msg.text
          : "";

    switch (type) {
      case "input_audio_buffer.speech_started":
        this.interruptPlayback();
        this.currentUser = "";
        this.handlers.onState("listening");
        break;
      case "input_audio_buffer.speech_stopped":
        this.handlers.onState("thinking");
        break;
      case "conversation.item.input_audio_transcription.updated": {
        const t = transcript || delta;
        if (t) {
          this.currentUser = t;
          this.handlers.onUserCaption(t, false);
        }
        break;
      }
      case "conversation.item.input_audio_transcription.completed": {
        const t = transcript || this.currentUser;
        if (t) {
          this.currentUser = t;
          this.handlers.onUserCaption(t, true);
          this.handlers.onTurn("user", t);
          this.localHistory.push({ role: "user", text: t });
        }
        break;
      }
      case "response.created":
        this.currentGrok = "";
        this.handlers.onState("speaking");
        break;
      case "response.output_audio.delta":
      case "response.audio.delta": {
        const chunk = delta || audio;
        if (chunk) this.enqueuePcm(base64ToArrayBuffer(chunk));
        this.handlers.onState("speaking");
        break;
      }
      case "response.output_audio_transcript.delta":
      case "response.audio_transcript.delta": {
        this.currentGrok += delta || transcript;
        this.handlers.onGrokCaption(this.currentGrok, false);
        break;
      }
      case "response.output_audio_transcript.done":
      case "response.audio_transcript.done": {
        const done = transcript || this.currentGrok;
        if (done) {
          this.currentGrok = done;
          this.handlers.onGrokCaption(done, true);
          this.handlers.onTurn("grok", done);
          this.localHistory.push({ role: "grok", text: done });
        }
        break;
      }
      case "response.done":
        this.handlers.onState("listening");
        break;
      case "error": {
        const err = msg.error as { message?: string } | undefined;
        if (err?.message) this.handlers.onError(err.message);
        break;
      }
      default:
        break;
    }
  }

  private hookMic(sendRealtime: boolean) {
    if (!this.audio || !this.stream) return;
    this.source = this.audio.createMediaStreamSource(this.stream);
    this.processor = this.audio.createScriptProcessor(2048, 1, 1);
    const silent = this.audio.createGain();
    silent.gain.value = 0;
    this.processor.onaudioprocess = (ev) => {
      const input = ev.inputBuffer.getChannelData(0);
      const level = rms(input);
      this.ampSmooth = this.ampSmooth * 0.8 + level * 0.2;
      if (!sendRealtime || this.muted || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
        return;
      }
      const resampled = resampleLinear(input, this.audio!.sampleRate, TARGET_RATE);
      const pcm = floatTo16BitPCM(resampled);
      this.ws.send(
        JSON.stringify({
          type: "input_audio_buffer.append",
          audio: arrayBufferToBase64(pcm),
        }),
      );
    };
    this.source.connect(this.processor);
    this.processor.connect(silent);
    silent.connect(this.audio.destination);
  }

  private startAmpLoop() {
    const tick = () => {
      if (this.stopped) return;
      const mic = this.muted ? 0 : this.ampSmooth;
      const speak = this.speaking ? Math.max(this.playAmp, 0.22) : 0;
      this.handlers.onAmp(Math.min(1, Math.max(mic * 4, speak)));
      this.ampRaf = requestAnimationFrame(tick);
    };
    this.ampRaf = requestAnimationFrame(tick);
  }

  private enqueuePcm(buffer: ArrayBuffer) {
    const ctx = this.audio;
    if (!ctx || buffer.byteLength < 2) return;
    const float = pcm16ToFloat(buffer);
    if (ctx.sampleRate !== TARGET_RATE) {
      const up = resampleLinear(float, TARGET_RATE, ctx.sampleRate);
      this.scheduleFloat(up, ctx);
    } else {
      this.scheduleFloat(float, ctx);
    }
  }

  private scheduleFloat(float: Float32Array, ctx: AudioContext) {
    const audioBuffer = ctx.createBuffer(1, float.length, ctx.sampleRate);
    audioBuffer.getChannelData(0).set(float);
    const node = ctx.createBufferSource();
    node.buffer = audioBuffer;
    const gain = ctx.createGain();
    gain.gain.value = 1;
    node.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    if (this.nextPlay < now + 0.02) this.nextPlay = now + 0.02;
    node.start(this.nextPlay);
    this.nextPlay += audioBuffer.duration;
    this.speaking = true;
    this.playAmp = Math.min(1, rms(float) * 6 + 0.18);
    node.onended = () => {
      if (ctx.currentTime >= this.nextPlay - 0.05) {
        this.speaking = false;
        this.playAmp = 0;
      }
    };
  }

  private interruptPlayback() {
    this.nextPlay = this.audio ? this.audio.currentTime : 0;
    this.speaking = false;
    this.playAmp = 0;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: "response.cancel" }));
    }
    if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
  }

  private startLocal() {
    this.handlers.onState("listening");
    const greeting = grokGreeting(Boolean(this.opts?.uiFa));
    window.setTimeout(() => {
      if (this.stopped) return;
      void this.speakLocal(greeting);
    }, 350);
    this.armRecognition();
  }

  private armRecognition() {
    const Ctor = speechRecognitionCtor();
    if (!Ctor) return;
    const recog = new Ctor();
    recog.continuous = true;
    recog.interimResults = true;
    recog.lang = speechLang(this.opts?.spokenLang ?? "auto", Boolean(this.opts?.uiFa));
    recog.onresult = (ev) => {
      if (this.muted || this.stopped) return;
      let interim = "";
      let finalText = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const res = ev.results[i];
        const piece = res?.[0]?.transcript ?? "";
        if (res?.isFinal) finalText += piece;
        else interim += piece;
      }
      const live = (finalText || interim).trim();
      if (live) this.handlers.onUserCaption(live, Boolean(finalText));
      if (finalText.trim()) {
        this.interruptPlayback();
        const said = finalText.trim();
        this.handlers.onTurn("user", said);
        this.localHistory.push({ role: "user", text: said });
        void this.localAnswer(said);
      }
    };
    recog.onend = () => {
      if (!this.stopped && !this.muted) {
        try {
          recog.start();
        } catch {
          /* ignore restart races */
        }
      }
    };
    recog.onerror = () => {
      /* Chrome fires no-speech; keep living */
    };
    this.recog = recog;
    try {
      recog.start();
    } catch {
      /* ignore */
    }
  }

  private async localAnswer(userText: string) {
    this.handlers.onState("thinking");
    await wait(280 + Math.random() * 420);
    if (this.stopped) return;
    const fa = this.opts?.uiFa || isPersian(userText);
    const reply = grokReply(userText, this.localHistory, Boolean(fa));
    await this.speakLocal(reply);
  }

  private async speakLocal(text: string) {
    if (this.stopped) return;
    this.handlers.onGrokCaption(text, false);
    this.handlers.onState("speaking");
    this.localHistory.push({ role: "grok", text });
    this.handlers.onTurn("grok", text);

    await new Promise<void>((resolve) => {
      if (typeof speechSynthesis === "undefined") {
        this.simulateSpeak(text.length, resolve);
        return;
      }
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const fa = isPersian(text) || Boolean(this.opts?.uiFa);
      u.lang = fa ? "fa-IR" : "en-US";
      u.rate = 1.02;
      u.pitch = this.opts?.voiceId === "leo" ? 0.92 : 1;
      const voices = speechSynthesis.getVoices();
      const wanted = voices.find((v) =>
        fa ? v.lang.toLowerCase().startsWith("fa") : v.lang.toLowerCase().startsWith("en"),
      );
      if (wanted) u.voice = wanted;
      this.speaking = true;
      const started = performance.now();
      const ampTick = () => {
        if (!this.speaking) return;
        const t = (performance.now() - started) / 1000;
        this.playAmp =
          0.28 + 0.22 * Math.abs(Math.sin(t * 7.4)) + 0.12 * Math.abs(Math.sin(t * 13.1));
        requestAnimationFrame(ampTick);
      };
      requestAnimationFrame(ampTick);
      u.onend = () => {
        this.speaking = false;
        this.playAmp = 0;
        this.handlers.onGrokCaption(text, true);
        if (!this.stopped) this.handlers.onState("listening");
        resolve();
      };
      u.onerror = () => {
        this.simulateSpeak(text.length, resolve);
      };
      speechSynthesis.speak(u);
    });
  }

  private simulateSpeak(len: number, done: () => void) {
    const ms = Math.min(5000, 700 + len * 45);
    this.speaking = true;
    const started = performance.now();
    const tick = () => {
      if (this.stopped) {
        done();
        return;
      }
      const t = performance.now() - started;
      this.playAmp = 0.3 + 0.2 * Math.abs(Math.sin(t / 90));
      if (t >= ms) {
        this.speaking = false;
        this.playAmp = 0;
        this.handlers.onState("listening");
        done();
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  private cleanupMedia() {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    try {
      this.processor?.disconnect();
    } catch {
      /* ignore */
    }
    try {
      this.source?.disconnect();
    } catch {
      /* ignore */
    }
    this.processor = null;
    this.source = null;
    void this.audio?.close();
    this.audio = null;
  }

  private cleanup() {
    cancelAnimationFrame(this.ampRaf);
    this.interruptPlayback();
    try {
      this.recog?.abort?.();
      this.recog?.stop();
    } catch {
      /* ignore */
    }
    this.recog = null;
    try {
      this.ws?.close();
    } catch {
      /* ignore */
    }
    this.ws = null;
    this.cleanupMedia();
  }
}

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
