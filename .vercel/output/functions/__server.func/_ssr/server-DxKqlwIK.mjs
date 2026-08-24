import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/server-DxKqlwIK.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var XAI = "https://api.x.ai/v1";
function apiKey() {
	return process.env.XAI_API_KEY ?? null;
}
var createVoiceSession_createServerFn_handler = createServerRpc({
	id: "ba9a85fe51c5474412ce86cb991ef1389dfaa169108a59be7aa48c911a535f3a",
	name: "createVoiceSession",
	filename: "src/lib/voice/server.ts"
}, (opts) => createVoiceSession.__executeServer(opts));
var createVoiceSession = createServerFn({ method: "POST" }).handler(createVoiceSession_createServerFn_handler, async () => {
	const key = apiKey();
	if (!key) return {
		ok: false,
		error: "unavailable"
	};
	const res = await fetch(`${XAI}/realtime/client_secrets`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${key}`
		},
		body: JSON.stringify({ expires_after: { seconds: 300 } })
	});
	if (!res.ok) return {
		ok: false,
		error: `xAI ${res.status}`
	};
	const body = await res.json();
	if (!body.value) return {
		ok: false,
		error: "no token"
	};
	return {
		ok: true,
		token: body.value,
		expiresAt: body.expires_at ?? Math.floor(Date.now() / 1e3) + 300,
		model: "grok-voice-latest"
	};
});
var transcribeAudio_createServerFn_handler = createServerRpc({
	id: "12b681ffbea9aa622dfcacba3358a817542f13f80519bfa1a34dadf7a7d38fd9",
	name: "transcribeAudio",
	filename: "src/lib/voice/server.ts"
}, (opts) => transcribeAudio.__executeServer(opts));
var transcribeAudio = createServerFn({ method: "POST" }).validator((input) => input).handler(transcribeAudio_createServerFn_handler, async ({ data }) => {
	const key = apiKey();
	if (!key) return {
		ok: false,
		error: "unavailable"
	};
	const bytes = Buffer.from(data.audioBase64, "base64");
	if (bytes.byteLength > 15e5) return {
		ok: false,
		error: "too large"
	};
	const form = new FormData();
	const ext = data.mimeType.includes("wav") ? "wav" : data.mimeType.includes("mpeg") ? "mp3" : "webm";
	form.append("file", new Blob([new Uint8Array(bytes)], { type: data.mimeType || "audio/webm" }), `clip.${ext}`);
	const res = await fetch(`${XAI}/stt`, {
		method: "POST",
		headers: { Authorization: `Bearer ${key}` },
		body: form
	});
	if (!res.ok) return {
		ok: false,
		error: `stt ${res.status}`
	};
	return {
		ok: true,
		text: (await res.json()).text ?? ""
	};
});
var speakText_createServerFn_handler = createServerRpc({
	id: "aa2df86d59c856e3193500da12a2a77734eec024e490a553dd3140a408c8a52f",
	name: "speakText",
	filename: "src/lib/voice/server.ts"
}, (opts) => speakText.__executeServer(opts));
var speakText = createServerFn({ method: "POST" }).validator((input) => input).handler(speakText_createServerFn_handler, async ({ data }) => {
	const key = apiKey();
	if (!key) return {
		ok: false,
		error: "unavailable"
	};
	const text = data.text.slice(0, 1200);
	const res = await fetch(`${XAI}/tts`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${key}`
		},
		body: JSON.stringify({
			text,
			voice_id: data.voiceId,
			language: data.language || "auto"
		})
	});
	if (!res.ok) return {
		ok: false,
		error: `tts ${res.status}`
	};
	return {
		ok: true,
		audioBase64: Buffer.from(await res.arrayBuffer()).toString("base64"),
		mime: res.headers.get("content-type") || "audio/mpeg"
	};
});
var chatTurn_createServerFn_handler = createServerRpc({
	id: "216f2226b1f738d40da13d599db89bccd408481fd517bb51a607df67c9bc6741",
	name: "chatTurn",
	filename: "src/lib/voice/server.ts"
}, (opts) => chatTurn.__executeServer(opts));
var chatTurn = createServerFn({ method: "POST" }).validator((input) => input).handler(chatTurn_createServerFn_handler, async ({ data }) => {
	const key = apiKey();
	if (!key) return {
		ok: false,
		error: "unavailable"
	};
	const res = await fetch(`${XAI}/chat/completions`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${key}`
		},
		body: JSON.stringify({
			model: "grok-4.5",
			messages: data.messages.slice(-12),
			max_tokens: 280
		})
	});
	if (!res.ok) return {
		ok: false,
		error: `chat ${res.status}`
	};
	return {
		ok: true,
		text: (await res.json()).choices?.[0]?.message?.content ?? ""
	};
});
//#endregion
export { chatTurn_createServerFn_handler, createVoiceSession_createServerFn_handler, speakText_createServerFn_handler, transcribeAudio_createServerFn_handler };
