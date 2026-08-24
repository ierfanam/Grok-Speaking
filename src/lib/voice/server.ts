import { createServerFn } from "@tanstack/react-start";

const XAI = "https://api.x.ai/v1";

function apiKey(): string | null {
  return process.env.XAI_API_KEY ?? null;
}

export type SessionResult =
  | { ok: true; token: string; expiresAt: number; model: string }
  | { ok: false; error: string };

export const createVoiceSession = createServerFn({ method: "POST" }).handler(
  async (): Promise<SessionResult> => {
    const key = apiKey();
    if (!key) return { ok: false, error: "unavailable" };

    const res = await fetch(`${XAI}/realtime/client_secrets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ expires_after: { seconds: 300 } }),
    });

    if (!res.ok) {
      return { ok: false, error: `xAI ${res.status}` };
    }

    const body = (await res.json()) as { value?: string; expires_at?: number };
    if (!body.value) return { ok: false, error: "no token" };
    return {
      ok: true,
      token: body.value,
      expiresAt: body.expires_at ?? Math.floor(Date.now() / 1000) + 300,
      model: "grok-voice-latest",
    };
  },
);

export const transcribeAudio = createServerFn({ method: "POST" })
  .validator((input: { audioBase64: string; mimeType: string }) => input)
  .handler(async ({ data }) => {
    const key = apiKey();
    if (!key) return { ok: false as const, error: "unavailable" };

    const bytes = Buffer.from(data.audioBase64, "base64");
    if (bytes.byteLength > 1_500_000) {
      return { ok: false as const, error: "too large" };
    }

    const form = new FormData();
    const ext = data.mimeType.includes("wav")
      ? "wav"
      : data.mimeType.includes("mpeg")
        ? "mp3"
        : "webm";
    form.append(
      "file",
      new Blob([new Uint8Array(bytes)], { type: data.mimeType || "audio/webm" }),
      `clip.${ext}`,
    );

    const res = await fetch(`${XAI}/stt`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: form,
    });
    if (!res.ok) return { ok: false as const, error: `stt ${res.status}` };
    const body = (await res.json()) as { text?: string };
    return { ok: true as const, text: body.text ?? "" };
  });

export const speakText = createServerFn({ method: "POST" })
  .validator((input: { text: string; voiceId: string; language: string }) => input)
  .handler(async ({ data }) => {
    const key = apiKey();
    if (!key) return { ok: false as const, error: "unavailable" };
    const text = data.text.slice(0, 1200);

    const res = await fetch(`${XAI}/tts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        text,
        voice_id: data.voiceId,
        language: data.language || "auto",
      }),
    });
    if (!res.ok) return { ok: false as const, error: `tts ${res.status}` };
    const buf = Buffer.from(await res.arrayBuffer());
    return {
      ok: true as const,
      audioBase64: buf.toString("base64"),
      mime: res.headers.get("content-type") || "audio/mpeg",
    };
  });

export const chatTurn = createServerFn({ method: "POST" })
  .validator(
    (input: {
      messages: { role: "user" | "assistant" | "system"; content: string }[];
    }) => input,
  )
  .handler(async ({ data }) => {
    const key = apiKey();
    if (!key) return { ok: false as const, error: "unavailable" };

    const res = await fetch(`${XAI}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        messages: data.messages.slice(-12),
        max_tokens: 280,
      }),
    });
    if (!res.ok) return { ok: false as const, error: `chat ${res.status}` };
    const body = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return {
      ok: true as const,
      text: body.choices?.[0]?.message?.content ?? "",
    };
  });
