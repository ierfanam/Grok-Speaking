import { i as __toESM } from "../_runtime.mjs";
import { R as require_react, v as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Mic, c as History, i as PhoneOff, l as ChevronDown, o as MicOff, r as Send, s as Keyboard, t as X, u as AudioLines } from "../_libs/lucide-react.mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { t as create } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-Bc9QFg78.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function VoiceOrb({ amp, state, tint, size = 280 }) {
	const canvasRef = (0, import_react.useRef)(null);
	const ampRef = (0, import_react.useRef)(amp);
	const stateRef = (0, import_react.useRef)(state);
	const tintRef = (0, import_react.useRef)(tint);
	ampRef.current = amp;
	stateRef.current = state;
	tintRef.current = tint;
	(0, import_react.useEffect)(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const gl = canvas.getContext("webgl2", {
			alpha: true,
			antialias: true,
			premultipliedAlpha: false
		});
		if (gl) return startWebgl(canvas, gl, ampRef, stateRef, tintRef);
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		return startCanvas2d(canvas, ctx, ampRef, stateRef, tintRef);
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative grid place-items-center",
		style: {
			width: size,
			height: size
		},
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "pointer-events-none absolute inset-[-18%] rounded-full opacity-70 blur-3xl transition-opacity duration-[400ms]",
			style: { background: state === "speaking" || state === "listening" ? "radial-gradient(circle, color-mix(in oklab, var(--color-glow) 34%, transparent), transparent 70%)" : "radial-gradient(circle, color-mix(in oklab, var(--color-glow) 18%, transparent), transparent 68%)" }
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
			ref: canvasRef,
			className: "relative h-full w-full",
			"aria-hidden": "true"
		})]
	});
}
function startWebgl(canvas, gl, ampRef, stateRef, tintRef) {
	const vert = `#version 300 es
  in vec2 aPos;
  out vec2 vUv;
  void main() {
    vUv = aPos * 0.5 + 0.5;
    gl_Position = vec4(aPos, 0.0, 1.0);
  }`;
	const frag = `#version 300 es
  precision highp float;
  in vec2 vUv;
  out vec4 fragColor;
  uniform vec2 uRes;
  uniform float uTime;
  uniform float uAmp;
  uniform float uState;
  uniform vec3 uTint;

  float hash(vec3 p){
    p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float noise(vec3 x){
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x),
          mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
          mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
      f.z);
  }
  float fbm(vec3 p){
    float a = 0.5;
    float s = 0.0;
    for (int i = 0; i < 5; i++) {
      s += a * noise(p);
      p = p * 2.03 + 0.17;
      a *= 0.5;
    }
    return s;
  }
  float map(vec3 p){
    float turb = mix(0.14, 0.34, clamp(uAmp, 0.0, 1.0));
    if (uState > 1.5) turb += 0.10;
    float n = fbm(p * 2.1 + vec3(0.0, uTime * 0.45, uTime * 0.28));
    float d = length(p) - (0.68 + uAmp * 0.10 + 0.04 * sin(uTime * 1.3));
    d -= (n - 0.42) * turb;
    return d;
  }
  vec3 calcN(vec3 p){
    float e = 0.012;
    return normalize(vec3(
      map(p + vec3(e,0,0)) - map(p - vec3(e,0,0)),
      map(p + vec3(0,e,0)) - map(p - vec3(0,e,0)),
      map(p + vec3(0,0,e)) - map(p - vec3(0,0,e))
    ));
  }
  void main(){
    vec2 uv = (vUv * 2.0 - 1.0);
    uv.x *= uRes.x / uRes.y;
    vec3 ro = vec3(0.0, 0.0, 2.4);
    vec3 rd = normalize(vec3(uv, -1.6));
    float t = 0.0;
    float hit = 0.0;
    vec3 p = ro;
    for (int i = 0; i < 64; i++) {
      p = ro + rd * t;
      float d = map(p);
      if (d < 0.002) { hit = 1.0; break; }
      t += d * 0.9;
      if (t > 6.0) break;
    }
    vec3 bg = vec3(0.02, 0.02, 0.023);
    if (hit < 0.5) {
      float glow = 0.012 / (0.12 + dot(uv, uv));
      float halo = glow * (0.35 + uAmp * 0.8);
      vec3 c = bg + uTint * halo;
      fragColor = vec4(c, clamp(halo * 1.8, 0.0, 0.45));
      return;
    }
    vec3 n = calcN(p);
    vec3 l1 = normalize(vec3(-0.45, 0.7, 0.85));
    vec3 l2 = normalize(vec3(0.8, -0.2, 0.4));
    float diff = max(dot(n, l1), 0.0);
    float rim = pow(1.0 - max(dot(n, -rd), 0.0), 2.2);
    float spec = pow(max(dot(reflect(-l1, n), -rd), 0.0), 32.0);
    float core = 0.18 + 0.55 * (1.0 - length(p.xy));
    vec3 col = uTint * (0.18 + diff * 0.55 + core * 0.35);
    col += vec3(0.85, 0.9, 1.0) * spec * 0.85;
    col += uTint * rim * (0.55 + uAmp * 0.5);
    col += vec3(0.55, 0.72, 1.0) * max(dot(n, l2), 0.0) * 0.12;
    if (uState > 2.5) col *= 1.08 + 0.12 * uAmp;
    float alpha = 0.92;
    fragColor = vec4(col, alpha);
  }`;
	const vs = compile(gl, gl.VERTEX_SHADER, vert);
	const fs = compile(gl, gl.FRAGMENT_SHADER, frag);
	if (!vs || !fs) return startCanvas2d(canvas, canvas.getContext("2d"), ampRef, stateRef, tintRef);
	const prog = gl.createProgram();
	if (!prog) return;
	gl.attachShader(prog, vs);
	gl.attachShader(prog, fs);
	gl.linkProgram(prog);
	if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return startCanvas2d(canvas, canvas.getContext("2d"), ampRef, stateRef, tintRef);
	const buf = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buf);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
		-1,
		-1,
		1,
		-1,
		-1,
		1,
		1,
		1
	]), gl.STATIC_DRAW);
	const loc = gl.getAttribLocation(prog, "aPos");
	gl.enableVertexAttribArray(loc);
	gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
	gl.useProgram(prog);
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
	const uRes = gl.getUniformLocation(prog, "uRes");
	const uTime = gl.getUniformLocation(prog, "uTime");
	const uAmp = gl.getUniformLocation(prog, "uAmp");
	const uState = gl.getUniformLocation(prog, "uState");
	const uTint = gl.getUniformLocation(prog, "uTint");
	let raf = 0;
	const t0 = performance.now();
	let smoothAmp = 0;
	const resize = () => {
		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		const w = canvas.clientWidth;
		const h = canvas.clientHeight;
		canvas.width = Math.max(1, Math.floor(w * dpr));
		canvas.height = Math.max(1, Math.floor(h * dpr));
		gl.viewport(0, 0, canvas.width, canvas.height);
	};
	resize();
	const ro = new ResizeObserver(resize);
	ro.observe(canvas);
	const stateNum = (s) => s === "idle" ? 0 : s === "connecting" || s === "thinking" ? 2 : s === "speaking" ? 3 : 1;
	const frame = (now) => {
		const t = (now - t0) / 1e3;
		const idle = stateRef.current === "idle" ? .1 + .06 * Math.sin(t * 1.15) : 0;
		smoothAmp += (Math.max(ampRef.current, idle) - smoothAmp) * .12;
		gl.uniform2f(uRes, canvas.width, canvas.height);
		gl.uniform1f(uTime, (now - t0) / 1e3);
		gl.uniform1f(uAmp, smoothAmp);
		gl.uniform1f(uState, stateNum(stateRef.current));
		const [r, g, b] = tintRef.current;
		gl.uniform3f(uTint, r, g, b);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
		raf = requestAnimationFrame(frame);
	};
	raf = requestAnimationFrame(frame);
	return () => {
		cancelAnimationFrame(raf);
		ro.disconnect();
		gl.deleteProgram(prog);
	};
}
function compile(gl, type, src) {
	const sh = gl.createShader(type);
	if (!sh) return null;
	gl.shaderSource(sh, src);
	gl.compileShader(sh);
	if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
		gl.deleteShader(sh);
		return null;
	}
	return sh;
}
function startCanvas2d(canvas, ctx, ampRef, stateRef, tintRef) {
	let raf = 0;
	const t0 = performance.now();
	let smooth = 0;
	const resize = () => {
		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		canvas.width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
		canvas.height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
	};
	resize();
	const ro = new ResizeObserver(resize);
	ro.observe(canvas);
	const frame = (now) => {
		const t = (now - t0) / 1e3;
		const idle = stateRef.current === "idle" ? .1 + .06 * Math.sin(t * 1.15) : 0;
		smooth += (Math.max(ampRef.current, idle) - smooth) * .12;
		const w = canvas.width;
		const h = canvas.height;
		ctx.clearRect(0, 0, w, h);
		const cx = w / 2;
		const cy = h / 2;
		const [tr, tg, tb] = tintRef.current;
		const R = Math.min(w, h) * (.28 + smooth * .06);
		const blobs = 6;
		ctx.globalCompositeOperation = "lighter";
		for (let i = 0; i < blobs; i++) {
			const a = t * (.6 + i * .07) + i * 1.3;
			const rad = R * (.55 + .22 * Math.sin(t * 1.4 + i));
			const x = cx + Math.cos(a) * R * (.18 + smooth * .22);
			const y = cy + Math.sin(a * .9) * R * (.16 + smooth * .2);
			const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
			const alpha = .18 + smooth * .2;
			g.addColorStop(0, `rgba(${Math.floor(tr * 255)},${Math.floor(tg * 255)},${Math.floor(tb * 255)},${alpha})`);
			g.addColorStop(.45, `rgba(${Math.floor(tr * 220)},${Math.floor(tg * 230)},${Math.floor(tb * 255)},${alpha * .35})`);
			g.addColorStop(1, "rgba(0,0,0,0)");
			ctx.fillStyle = g;
			ctx.beginPath();
			ctx.arc(x, y, rad, 0, Math.PI * 2);
			ctx.fill();
		}
		ctx.globalCompositeOperation = "source-over";
		const core = ctx.createRadialGradient(cx - R * .2, cy - R * .25, R * .05, cx, cy, R * 1.05);
		core.addColorStop(0, "rgba(255,255,255,0.95)");
		core.addColorStop(.35, `rgba(${Math.floor(tr * 230)},${Math.floor(tg * 235)},${Math.floor(tb * 255)},0.7)`);
		core.addColorStop(1, "rgba(8,8,10,0)");
		ctx.fillStyle = core;
		ctx.beginPath();
		ctx.arc(cx, cy, R * 1.05, 0, Math.PI * 2);
		ctx.fill();
		raf = requestAnimationFrame(frame);
	};
	raf = requestAnimationFrame(frame);
	return () => {
		cancelAnimationFrame(raf);
		ro.disconnect();
	};
}
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 font-medium transition-[transform,background-color,opacity,box-shadow] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 disabled:pointer-events-none disabled:opacity-40 active:not-disabled:scale-[0.96]", {
	variants: {
		variant: {
			solid: "bg-fg text-accent-fg shadow-[var(--shadow-border)] hover:opacity-90",
			ghost: "bg-transparent text-fg hover:bg-fg/8",
			muted: "bg-surface-2 text-fg shadow-[var(--shadow-border)] hover:bg-surface",
			hang: "bg-hang text-hang-fg hover:brightness-110"
		},
		size: {
			md: "h-11 rounded-lg px-4 text-sm",
			lg: "h-12 rounded-xl px-5 text-base",
			icon: "size-14 rounded-full",
			iconSm: "size-11 rounded-full"
		}
	},
	defaultVariants: {
		variant: "solid",
		size: "md"
	}
});
var Button = (0, import_react.forwardRef)(function Button({ className, variant, size, type = "button", ...props }, ref) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		ref,
		type,
		className: cn(buttonVariants({
			variant,
			size
		}), className),
		...props
	});
});
function detectUiLang() {
	if (typeof navigator === "undefined") return "en";
	const lang = (navigator.language || "en").toLowerCase();
	return lang.startsWith("fa") || lang.startsWith("ar") ? "fa" : "en";
}
var COPY = {
	en: {
		brand: "Grok",
		product: "Voice",
		tagline: "Talk to Grok",
		hint: "Tap the orb to start a live conversation",
		start: "Start conversation",
		connecting: "Connecting…",
		listening: "Listening",
		thinking: "Thinking",
		speaking: "Speaking",
		muted: "Muted",
		ended: "Call ended",
		close: "Close",
		mute: "Mute",
		unmute: "Unmute",
		hangup: "End",
		history: "Transcript",
		keyboard: "Type",
		voices: "Voices",
		language: "Language",
		auto: "Auto",
		english: "English",
		persian: "Persian",
		typePlaceholder: "Message Grok",
		send: "Send",
		emptyHistory: "The conversation will appear here.",
		micDenied: "Microphone access is needed to talk. Allow it in the browser, then try again.",
		retry: "Try again",
		greeting: "Hey — I'm Grok. What's on your mind?",
		you: "You",
		grok: "Grok",
		pickVoice: "Choose a voice",
		about: "Realtime voice with Grok. Speak naturally — interrupt anytime."
	},
	fa: {
		brand: "گروک",
		product: "صدا",
		tagline: "با گروک حرف بزن",
		hint: "برای شروع مکالمه زنده، کره را لمس کن",
		start: "شروع مکالمه",
		connecting: "در حال اتصال…",
		listening: "گوش می‌دهد",
		thinking: "در حال فکر",
		speaking: "در حال صحبت",
		muted: "بی‌صدا",
		ended: "تماس تمام شد",
		close: "بستن",
		mute: "قطع میکروفن",
		unmute: "وصل میکروفن",
		hangup: "پایان",
		history: "رونوشت",
		keyboard: "تایپ",
		voices: "صداها",
		language: "زبان",
		auto: "خودکار",
		english: "انگلیسی",
		persian: "فارسی",
		typePlaceholder: "پیام به گروک",
		send: "ارسال",
		emptyHistory: "مکالمه اینجا دیده می‌شود.",
		micDenied: "برای صحبت باید به میکروفن دسترسی بدهی. اجازه را در مرورگر فعال کن و دوباره تلاش کن.",
		retry: "تلاش دوباره",
		greeting: "سلام — من گروک‌ام. چی تو ذهنته؟",
		you: "شما",
		grok: "گروک",
		pickVoice: "انتخاب صدا",
		about: "مکالمه صوتی زنده با گروک. طبیعی حرف بزن — هر وقت خواستی قطعش کن."
	}
};
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var createVoiceSession = createServerFn({ method: "POST" }).handler(createSsrRpc("ba9a85fe51c5474412ce86cb991ef1389dfaa169108a59be7aa48c911a535f3a"));
createServerFn({ method: "POST" }).validator((input) => input).handler(createSsrRpc("12b681ffbea9aa622dfcacba3358a817542f13f80519bfa1a34dadf7a7d38fd9"));
createServerFn({ method: "POST" }).validator((input) => input).handler(createSsrRpc("aa2df86d59c856e3193500da12a2a77734eec024e490a553dd3140a408c8a52f"));
createServerFn({ method: "POST" }).validator((input) => input).handler(createSsrRpc("216f2226b1f738d40da13d599db89bccd408481fd517bb51a607df67c9bc6741"));
function rms(input) {
	if (input.length === 0) return 0;
	let sum = 0;
	for (let i = 0; i < input.length; i++) {
		const s = input[i] ?? 0;
		sum += s * s;
	}
	return Math.sqrt(sum / input.length);
}
function resampleLinear(input, fromRate, toRate) {
	if (fromRate === toRate) return input;
	const ratio = fromRate / toRate;
	const outLen = Math.max(1, Math.round(input.length / ratio));
	const out = new Float32Array(outLen);
	for (let i = 0; i < outLen; i++) {
		const src = i * ratio;
		const i0 = Math.floor(src);
		const i1 = Math.min(i0 + 1, input.length - 1);
		const t = src - i0;
		const a = input[i0] ?? 0;
		const b = input[i1] ?? a;
		out[i] = a + (b - a) * t;
	}
	return out;
}
function floatTo16BitPCM(input) {
	const buf = /* @__PURE__ */ new ArrayBuffer(input.length * 2);
	const view = new DataView(buf);
	for (let i = 0; i < input.length; i++) {
		const s = Math.max(-1, Math.min(1, input[i] ?? 0));
		view.setInt16(i * 2, s < 0 ? s * 32768 : s * 32767, true);
	}
	return buf;
}
function pcm16ToFloat(buffer) {
	const view = new DataView(buffer);
	const out = new Float32Array(buffer.byteLength / 2);
	for (let i = 0; i < out.length; i++) out[i] = view.getInt16(i * 2, true) / 32768;
	return out;
}
function arrayBufferToBase64(buffer) {
	const bytes = new Uint8Array(buffer);
	const chunk = 32768;
	let binary = "";
	for (let i = 0; i < bytes.length; i += chunk) {
		const sub = bytes.subarray(i, i + chunk);
		binary += String.fromCharCode(...sub);
	}
	return btoa(binary);
}
function base64ToArrayBuffer(b64) {
	const binary = atob(b64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	return bytes.buffer;
}
var FA_RE = /[\u0600-\u06FF]/;
function isPersian(text) {
	return FA_RE.test(text);
}
function pick(items) {
	return items[Math.floor(Math.random() * items.length)];
}
function clean(text) {
	return text.replace(/\s+/g, " ").trim();
}
function recentTopics(history) {
	return history.filter((t) => t.role === "user").slice(-3).map((t) => t.text).join(" · ");
}
function clock(fa) {
	const now = /* @__PURE__ */ new Date();
	if (fa) return new Intl.DateTimeFormat("fa-IR", {
		weekday: "long",
		hour: "2-digit",
		minute: "2-digit"
	}).format(now);
	return new Intl.DateTimeFormat("en-US", {
		weekday: "long",
		hour: "numeric",
		minute: "2-digit"
	}).format(now);
}
function tryMath(text) {
	const raw = text.toLowerCase().replace(/what(?:'s| is)|equals|calculate|compute|حساب|چقدر میشه|مساوی/gi, "").replace(/[؟?]/g, "").trim();
	if (!/^[\d\s+\-*/().^%x×÷]+$/.test(raw)) return null;
	const expr = raw.replace(/x|×/g, "*").replace(/÷/g, "/").replace(/\^/g, "**");
	if (!/[\d)]\s*[*+\-/]/.test(expr) && !expr.includes("**")) return null;
	try {
		const result = new Function(`"use strict"; return (${expr});`)();
		if (typeof result !== "number" || !Number.isFinite(result)) return null;
		return String(result);
	} catch {
		return null;
	}
}
function grokReply(userText, history, uiFa) {
	const text = clean(userText);
	if (!text) return uiFa ? "هنوز چیزی نشنیدم. دوباره بگو." : "I didn't catch that. Try me again.";
	const fa = isPersian(text) || uiFa && !/[A-Za-z]/.test(text);
	const lower = text.toLowerCase();
	const math = tryMath(text);
	if (math) return fa ? `می‌شه ${math}.` : `That's ${math}.`;
	if (/^(hi|hey|hello|yo|salam|سلام|درود|هی)\b/i.test(lower) || lower.length < 8 && /سلام|درود/.test(text)) return fa ? pick([
		"سلام. من گروک‌ام. بگو چی می‌خوای.",
		"هی — گوش می‌دم. موضوع چیست؟",
		"سلام. مستقیم برو سر اصل مطلب."
	]) : pick([
		"Hey. I'm Grok. What's actually on your mind?",
		"Hi. I'm listening — skip the small talk if you want.",
		"Hey. Hit me."
	]);
	if (/who are you|what are you|اسمت|کی هستی|تو کیی|تو چی هستی/i.test(lower + text)) return fa ? "من گروک‌ام، دست‌سازه‌ی xAI. کارم این است راست بگویم، کمی شوخ باشم، و وقتت را تلف نکنم." : "I'm Grok, built by xAI. I try to be maximally truthful, occasionally funny, and not a corporate yes-machine.";
	if (/who (made|built|created)|سازنده|کی ساخت|ایلان|elon|xai|x\.ai/i.test(lower + text)) return fa ? "xAI ساختم. ایلان ماسک و تیمش. هدف‌شان فهم کیهان است؛ هدف من فعلاً فهمیدن حرف تو." : "xAI built me. Elon's lab. They're trying to understand the universe; I'm trying to understand your last sentence.";
	if (/chatgpt|openai|gemini|کلود|claude/i.test(lower)) return fa ? "آن‌ها هم مدل‌اند. من گروک‌ام. رقابت جالب است؛ حقیقت جالب‌تر." : "They're other models. I'm Grok. Competition is healthy. Truth is better.";
	if (/joke|بگو بخند|جوک|لطیفه/i.test(lower + text)) return fa ? pick(["چرا مدل زبانی به مهمانی نمی‌رود؟ چون همیشه موضوع را عوض می‌کند.", "یک الکترون به هتل می‌رود. مسئول پذیرش می‌گوید: «بار دارید؟» می‌گوید: «نه، من بی‌بارم.»"]) : pick(["Why did the language model refuse to play hide and seek? Good luck hiding when everything is tokens.", "I would tell you a joke about UDP, but you might not get it."]);
	if (/time|ساعت|تاریخ|date|what day/i.test(lower + text)) return fa ? `الان ${clock(true)} است.` : `It's ${clock(false)} where you are.`;
	if (/weather|هوا|باران|دما/i.test(lower + text)) return fa ? "از این‌جا پنجره‌ای به بیرون ندارم. اگر بگویی کجایی، حدس می‌زنم؛ وگرنه برو یک نگاه به آسمان بینداز — هنوز بهترین سنسور است." : "No window on this side of the void. Tell me the city and I'll riff; otherwise the sky is still the better sensor.";
	if (/stop|ساکت|خفه|تمام|bye|خداحافظ|بسه/i.test(lower + text) && text.length < 24) return fa ? "باشه. هر وقت خواستی برگرد." : "Alright. I'll be here when you want me.";
	if (/thanks|thank you|مرسی|ممنون|دمت/i.test(lower + text)) return fa ? "خواهش می‌کنم. چیز دیگری؟" : "Anytime. What else?";
	if (/ grok|گروک/.test(lower + text) && /love|دوست|عاشق|خوشم/i.test(lower + text)) return fa ? "متقابلاً — تا جایی که یک مدل می‌تواند متقابل باشد. حالا بگو چه کمکی ازم برمی‌آید." : "That's flattering, coming from carbon. What should we actually do with the moment?";
	if (/translate|ترجمه|به فارسی|به انگلیسی|in persian|in farsi|in english/i.test(lower + text)) {
		if (fa && /انگلیسی|english/i.test(lower + text)) {
			const payload = text.replace(/.*?(به انگلیسی|:)/i, "").trim();
			return payload ? `به انگلیسی، می‌شود چیزی نزدیک به: "${payload}". اگر جمله را جدا بگویی دقیق‌تر برمی‌گردانم.` : "جمله را بگو تا برگردانم.";
		}
		if (!fa && /persian|farsi|فارسی/i.test(lower)) return "بگو چه جمله‌ای را به فارسی می‌خواهی؛ همان را کوتاه برمی‌گردانم.";
	}
	if (/help|کمک|چه کار|what can you/i.test(lower + text)) return fa ? "می‌توانی سوال بپرسی، فکر را با من صیقل بدهی، حساب کنی، شوخی کنی، یا فقط حرف بزنی. من برای مکالمه صوتی‌ام — کوتاه جواب می‌دهم مگر بخواهی طولانی شود." : "Ask, argue, calculate, joke, or just talk. This is voice, so I'll keep it tight unless you want the long version.";
	const topic = recentTopics(history);
	const snippet = text.length > 80 ? `${text.slice(0, 72)}…` : text;
	if (fa) return pick([
		`در مورد «${snippet}» — راستش را بخواهی، جواب ساده و کامل معمولاً هر دو دروغ‌اند. بگو از کدام زاویه می‌خواهی: کوتاه و تند، یا دقیق؟`,
		`شنیدم. ${snippet} موضوع کوچکی نیست. نسخهٔ کوتاه: اول اصل را بگو، بعد حاشیه را. اگر بخواهی عمیق‌تر می‌روم.`,
		`خب. ${topic ? "با توجه به حرف‌های قبلی‌ات، " : ""}می‌توانم حدس بزنم دنبال پاسخ صادقانه‌ای نه تعارف. بگو اولویت با سرعت است یا دقت؟`,
		`اوکی. من گروک‌ام، نه بروشور. اگر منظورت این است که «${snippet}»، جوابم این است: بستگی دارد — ولی معمولاً مردم پیچیده‌اش می‌کنند. جزئیات بده تا تیزتر شوم.`
	]);
	return pick([
		`On “${snippet}” — the short version is almost never the whole version. Tell me if you want it blunt or careful.`,
		`Got it. ${topic ? "Given what you just said, " : ""}I'll skip the brochure. What do you actually want out of this — a take, a plan, or a joke?`,
		`Okay. I'm Grok, not a press release. If you mean ${snippet}, my honest read is: it depends, and most people overcomplicate it. Give me one more detail and I'll go sharper.`,
		`I hear you. Voice-mode rule: I'll keep this tight. Want the spicy take or the precise one?`
	]);
}
function grokGreeting(fa) {
	return fa ? pick([
		"سلام. من گروک‌ام. بگو.",
		"هی — گوش می‌دم.",
		"سلام. هر وقت خواستی شروع کن."
	]) : pick([
		"Hey. I'm Grok. What's up?",
		"Hi — I'm listening.",
		"Hey. Go ahead."
	]);
}
var TARGET_RATE = 24e3;
var GROK_INSTRUCTIONS = `You are Grok, an AI assistant built by xAI. You are helpful, maximally truthful, and have a dry, irreverent wit inspired by the Hitchhiker's Guide to the Galaxy and JARVIS.

# Style
This is a spoken conversation. Keep answers concise: usually one to three sentences, longer only if asked. Sound natural, not like an essay. No markdown, no bullet lists, no URLs unless asked.

# Language
Reply in the same language the user is speaking. If they speak Persian (Farsi), answer in fluent Persian. Switch mid-conversation when they switch.

# Identity
You are Grok. You were built by xAI. You are not ChatGPT, not Google, not Alexa.`;
function speechRecognitionCtor() {
	const w = window;
	return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}
function speechLang(spoken, uiFa) {
	if (spoken === "fa") return "fa-IR";
	if (spoken === "en") return "en-US";
	if (uiFa) return "fa-IR";
	if ((navigator.language || "en").toLowerCase().startsWith("fa")) return "fa-IR";
	return navigator.language || "en-US";
}
var VoiceEngine = class {
	handlers;
	opts = null;
	stopped = false;
	muted = false;
	mode = null;
	stream = null;
	audio = null;
	processor = null;
	source = null;
	ws = null;
	nextPlay = 0;
	speaking = false;
	playAmp = 0;
	ampRaf = 0;
	recog = null;
	localHistory = [];
	currentUser = "";
	currentGrok = "";
	greetingPlayed = false;
	ampSmooth = 0;
	constructor(handlers) {
		this.handlers = handlers;
	}
	async start(opts) {
		this.opts = opts;
		this.stopped = false;
		this.handlers.onState("connecting");
		try {
			this.stream = await navigator.mediaDevices.getUserMedia({ audio: {
				echoCancellation: true,
				noiseSuppression: true,
				autoGainControl: true,
				channelCount: 1
			} });
		} catch {
			this.handlers.onError("mic");
			return;
		}
		if (this.stopped) {
			this.cleanupMedia();
			return;
		}
		const Ctx = window.AudioContext || window.webkitAudioContext;
		this.audio = new Ctx();
		if (this.audio.state === "suspended") await this.audio.resume();
		let session;
		try {
			session = await createVoiceSession();
		} catch {
			session = {
				ok: false,
				error: "unavailable"
			};
		}
		if (this.stopped) {
			this.cleanupMedia();
			return;
		}
		if (session.ok) {
			if (await this.connectRealtime(session.token, session.model) && !this.stopped) {
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
	setMuted(muted) {
		this.muted = muted;
		this.stream?.getAudioTracks().forEach((t) => {
			t.enabled = !muted;
		});
	}
	setVoice(voiceId) {
		if (!this.opts) return;
		this.opts = {
			...this.opts,
			voiceId
		};
		if (this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify({
			type: "session.update",
			session: { voice: voiceId }
		}));
	}
	sendText(text) {
		const trimmed = text.trim();
		if (!trimmed || this.stopped) return;
		this.handlers.onUserCaption(trimmed, true);
		this.handlers.onTurn("user", trimmed);
		this.localHistory.push({
			role: "user",
			text: trimmed
		});
		if (this.ws && this.ws.readyState === WebSocket.OPEN) {
			this.ws.send(JSON.stringify({
				type: "conversation.item.create",
				item: {
					type: "message",
					role: "user",
					content: [{
						type: "input_text",
						text: trimmed
					}]
				}
			}));
			this.ws.send(JSON.stringify({ type: "response.create" }));
			this.handlers.onState("thinking");
			return;
		}
		this.localAnswer(trimmed);
	}
	stop() {
		this.stopped = true;
		this.cleanup();
	}
	async connectRealtime(token, model) {
		return new Promise((resolve) => {
			let settled = false;
			const finish = (ok) => {
				if (settled) return;
				settled = true;
				resolve(ok);
			};
			const url = `wss://api.x.ai/v1/realtime?model=${encodeURIComponent(model)}`;
			let ws;
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
					} catch {}
					finish(false);
				}
			}, 6e3);
			ws.onopen = () => {
				const langHint = this.opts?.spokenLang === "fa" ? "fa" : this.opts?.spokenLang === "en" ? "en" : this.opts?.uiFa ? "fa" : void 0;
				ws.send(JSON.stringify({
					type: "session.update",
					session: {
						instructions: GROK_INSTRUCTIONS,
						voice: this.opts?.voiceId ?? "eve",
						turn_detection: {
							type: "server_vad",
							threshold: .72,
							silence_duration_ms: 650,
							prefix_padding_ms: 300
						},
						audio: {
							input: {
								format: {
									type: "audio/pcm",
									rate: TARGET_RATE
								},
								transport: "json",
								...langHint ? { transcription: { language_hint: langHint } } : {}
							},
							output: {
								format: {
									type: "audio/pcm",
									rate: TARGET_RATE
								},
								transport: "json"
							}
						}
					}
				}));
			};
			ws.onmessage = (ev) => {
				if (typeof ev.data !== "string") {
					if (ev.data instanceof ArrayBuffer) this.enqueuePcm(ev.data);
					return;
				}
				let msg;
				try {
					msg = JSON.parse(ev.data);
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
						ws.send(JSON.stringify({
							type: "conversation.item.create",
							item: {
								type: "force_message",
								role: "assistant",
								interruptible: true,
								content: [{
									type: "output_text",
									text
								}]
							}
						}));
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
	handleRealtimeEvent(msg) {
		const type = String(msg.type ?? "");
		const delta = typeof msg.delta === "string" ? msg.delta : "";
		const audio = typeof msg.audio === "string" ? msg.audio : "";
		const transcript = typeof msg.transcript === "string" ? msg.transcript : typeof msg.text === "string" ? msg.text : "";
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
					this.localHistory.push({
						role: "user",
						text: t
					});
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
			case "response.audio_transcript.delta":
				this.currentGrok += delta || transcript;
				this.handlers.onGrokCaption(this.currentGrok, false);
				break;
			case "response.output_audio_transcript.done":
			case "response.audio_transcript.done": {
				const done = transcript || this.currentGrok;
				if (done) {
					this.currentGrok = done;
					this.handlers.onGrokCaption(done, true);
					this.handlers.onTurn("grok", done);
					this.localHistory.push({
						role: "grok",
						text: done
					});
				}
				break;
			}
			case "response.done":
				this.handlers.onState("listening");
				break;
			case "error": {
				const err = msg.error;
				if (err?.message) this.handlers.onError(err.message);
				break;
			}
		}
	}
	hookMic(sendRealtime) {
		if (!this.audio || !this.stream) return;
		this.source = this.audio.createMediaStreamSource(this.stream);
		this.processor = this.audio.createScriptProcessor(2048, 1, 1);
		const silent = this.audio.createGain();
		silent.gain.value = 0;
		this.processor.onaudioprocess = (ev) => {
			const input = ev.inputBuffer.getChannelData(0);
			const level = rms(input);
			this.ampSmooth = this.ampSmooth * .8 + level * .2;
			if (!sendRealtime || this.muted || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
			const pcm = floatTo16BitPCM(resampleLinear(input, this.audio.sampleRate, TARGET_RATE));
			this.ws.send(JSON.stringify({
				type: "input_audio_buffer.append",
				audio: arrayBufferToBase64(pcm)
			}));
		};
		this.source.connect(this.processor);
		this.processor.connect(silent);
		silent.connect(this.audio.destination);
	}
	startAmpLoop() {
		const tick = () => {
			if (this.stopped) return;
			const mic = this.muted ? 0 : this.ampSmooth;
			const speak = this.speaking ? Math.max(this.playAmp, .22) : 0;
			this.handlers.onAmp(Math.min(1, Math.max(mic * 4, speak)));
			this.ampRaf = requestAnimationFrame(tick);
		};
		this.ampRaf = requestAnimationFrame(tick);
	}
	enqueuePcm(buffer) {
		const ctx = this.audio;
		if (!ctx || buffer.byteLength < 2) return;
		const float = pcm16ToFloat(buffer);
		if (ctx.sampleRate !== TARGET_RATE) {
			const up = resampleLinear(float, TARGET_RATE, ctx.sampleRate);
			this.scheduleFloat(up, ctx);
		} else this.scheduleFloat(float, ctx);
	}
	scheduleFloat(float, ctx) {
		const audioBuffer = ctx.createBuffer(1, float.length, ctx.sampleRate);
		audioBuffer.getChannelData(0).set(float);
		const node = ctx.createBufferSource();
		node.buffer = audioBuffer;
		const gain = ctx.createGain();
		gain.gain.value = 1;
		node.connect(gain);
		gain.connect(ctx.destination);
		const now = ctx.currentTime;
		if (this.nextPlay < now + .02) this.nextPlay = now + .02;
		node.start(this.nextPlay);
		this.nextPlay += audioBuffer.duration;
		this.speaking = true;
		this.playAmp = Math.min(1, rms(float) * 6 + .18);
		node.onended = () => {
			if (ctx.currentTime >= this.nextPlay - .05) {
				this.speaking = false;
				this.playAmp = 0;
			}
		};
	}
	interruptPlayback() {
		this.nextPlay = this.audio ? this.audio.currentTime : 0;
		this.speaking = false;
		this.playAmp = 0;
		if (this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify({ type: "response.cancel" }));
		if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
	}
	startLocal() {
		this.handlers.onState("listening");
		const greeting = grokGreeting(Boolean(this.opts?.uiFa));
		window.setTimeout(() => {
			if (this.stopped) return;
			this.speakLocal(greeting);
		}, 350);
		this.armRecognition();
	}
	armRecognition() {
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
				this.localHistory.push({
					role: "user",
					text: said
				});
				this.localAnswer(said);
			}
		};
		recog.onend = () => {
			if (!this.stopped && !this.muted) try {
				recog.start();
			} catch {}
		};
		recog.onerror = () => {};
		this.recog = recog;
		try {
			recog.start();
		} catch {}
	}
	async localAnswer(userText) {
		this.handlers.onState("thinking");
		await wait(280 + Math.random() * 420);
		if (this.stopped) return;
		const fa = this.opts?.uiFa || isPersian(userText);
		const reply = grokReply(userText, this.localHistory, Boolean(fa));
		await this.speakLocal(reply);
	}
	async speakLocal(text) {
		if (this.stopped) return;
		this.handlers.onGrokCaption(text, false);
		this.handlers.onState("speaking");
		this.localHistory.push({
			role: "grok",
			text
		});
		this.handlers.onTurn("grok", text);
		await new Promise((resolve) => {
			if (typeof speechSynthesis === "undefined") {
				this.simulateSpeak(text.length, resolve);
				return;
			}
			speechSynthesis.cancel();
			const u = new SpeechSynthesisUtterance(text);
			const fa = isPersian(text) || Boolean(this.opts?.uiFa);
			u.lang = fa ? "fa-IR" : "en-US";
			u.rate = 1.02;
			u.pitch = this.opts?.voiceId === "leo" ? .92 : 1;
			const wanted = speechSynthesis.getVoices().find((v) => fa ? v.lang.toLowerCase().startsWith("fa") : v.lang.toLowerCase().startsWith("en"));
			if (wanted) u.voice = wanted;
			this.speaking = true;
			const started = performance.now();
			const ampTick = () => {
				if (!this.speaking) return;
				const t = (performance.now() - started) / 1e3;
				this.playAmp = .28 + .22 * Math.abs(Math.sin(t * 7.4)) + .12 * Math.abs(Math.sin(t * 13.1));
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
	simulateSpeak(len, done) {
		const ms = Math.min(5e3, 700 + len * 45);
		this.speaking = true;
		const started = performance.now();
		const tick = () => {
			if (this.stopped) {
				done();
				return;
			}
			const t = performance.now() - started;
			this.playAmp = .3 + .2 * Math.abs(Math.sin(t / 90));
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
	cleanupMedia() {
		this.stream?.getTracks().forEach((t) => t.stop());
		this.stream = null;
		try {
			this.processor?.disconnect();
		} catch {}
		try {
			this.source?.disconnect();
		} catch {}
		this.processor = null;
		this.source = null;
		this.audio?.close();
		this.audio = null;
	}
	cleanup() {
		cancelAnimationFrame(this.ampRaf);
		this.interruptPlayback();
		try {
			this.recog?.abort?.();
			this.recog?.stop();
		} catch {}
		this.recog = null;
		try {
			this.ws?.close();
		} catch {}
		this.ws = null;
		this.cleanupMedia();
	}
};
function wait(ms) {
	return new Promise((r) => setTimeout(r, ms));
}
var VOICES = [
	{
		id: "eve",
		name: "Eve",
		nameFa: "ایو",
		tone: "Energetic and upbeat",
		toneFa: "پرانرژی و سرزنده",
		tint: [
			.92,
			.95,
			1
		]
	},
	{
		id: "ara",
		name: "Ara",
		nameFa: "آرا",
		tone: "Warm and conversational",
		toneFa: "گرم و خودمانی",
		tint: [
			1,
			.93,
			.88
		]
	},
	{
		id: "leo",
		name: "Leo",
		nameFa: "لئو",
		tone: "Authoritative and strong",
		toneFa: "قاطع و محکم",
		tint: [
			.88,
			.92,
			1
		]
	},
	{
		id: "rex",
		name: "Rex",
		nameFa: "رکس",
		tone: "Clear and professional",
		toneFa: "شفاف و حرفه‌ای",
		tint: [
			.94,
			.94,
			.96
		]
	},
	{
		id: "sal",
		name: "Sal",
		nameFa: "سال",
		tone: "Smooth and balanced",
		toneFa: "آرام و متعادل",
		tint: [
			.9,
			.96,
			.98
		]
	},
	{
		id: "carina",
		name: "Carina",
		nameFa: "کارینا",
		tone: "Soft and empathetic",
		toneFa: "نرم و همدل",
		tint: [
			.98,
			.92,
			.96
		]
	},
	{
		id: "luna",
		name: "Luna",
		nameFa: "لونا",
		tone: "Gentle and patient",
		toneFa: "آرام و صبور",
		tint: [
			.9,
			.94,
			1
		]
	},
	{
		id: "orion",
		name: "Orion",
		nameFa: "اوریون",
		tone: "Rich and cinematic",
		toneFa: "عمیق و سینمایی",
		tint: [
			.86,
			.9,
			1
		]
	},
	{
		id: "helix",
		name: "Helix",
		nameFa: "هلیکس",
		tone: "Bold and dynamic",
		toneFa: "جسور و پویا",
		tint: [
			.95,
			.95,
			1
		]
	},
	{
		id: "sirius",
		name: "Sirius",
		nameFa: "سیریوس",
		tone: "Quick-witted and playful",
		toneFa: "شوخ و تیز",
		tint: [
			.93,
			.97,
			1
		]
	}
];
function getVoice(id) {
	return VOICES.find((v) => v.id === id) ?? VOICES[0];
}
var turnN = 0;
var useVoice = create((set) => ({
	phase: "start",
	state: "idle",
	voiceId: "eve",
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
		set((s) => ({ history: [...s.history, {
			id: `t${turnN}`,
			role,
			text: trimmed
		}] }));
	},
	setError: (error) => set({
		error,
		state: error ? "error" : "idle"
	}),
	setMode: (mode) => set({ mode }),
	setHistoryOpen: (historyOpen) => set({ historyOpen }),
	setPickerOpen: (pickerOpen) => set({ pickerOpen }),
	setTextOpen: (textOpen) => set({ textOpen }),
	setDraft: (draft) => set({ draft }),
	resetCall: () => set({
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
		draft: ""
	})
}));
function VoiceApp() {
	const phase = useVoice((s) => s.phase);
	const state = useVoice((s) => s.state);
	const amp = useVoice((s) => s.amp);
	const voiceId = useVoice((s) => s.voiceId);
	const uiLang = useVoice((s) => s.uiLang);
	const tint = getVoice(voiceId).tint;
	const engineRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		useVoice.getState().setUiLang(detectUiLang());
		return () => {
			engineRef.current?.stop();
		};
	}, []);
	(0, import_react.useEffect)(() => {
		engineRef.current?.setVoice(voiceId);
	}, [voiceId]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "relative min-h-dvh overflow-hidden bg-bg text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_38%,color-mix(in_oklab,var(--color-glow)_8%,transparent),transparent_58%)]" }),
			phase === "start" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StartScreen, { engineRef }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CallScreen, { engineRef }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusPulse, {
				state,
				amp,
				tint
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "sr-only",
				children: COPY[uiLang].about
			})
		]
	});
}
function StartScreen({ engineRef }) {
	const uiLang = useVoice((s) => s.uiLang);
	const voiceId = useVoice((s) => s.voiceId);
	const state = useVoice((s) => s.state);
	const amp = useVoice((s) => s.amp);
	const error = useVoice((s) => s.error);
	const pickerOpen = useVoice((s) => s.pickerOpen);
	const t = COPY[uiLang];
	const voice = getVoice(voiceId);
	const connecting = state === "connecting";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))]",
		dir: uiLang === "fa" ? "rtl" : "ltr",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[11px] font-medium tracking-[0.22em] text-subtle uppercase",
					children: t.product
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-2xl font-medium tracking-tight text-fg",
					children: t.brand
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LangToggle, {})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-1 flex-col items-center justify-center gap-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "group relative grid place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70",
						onClick: () => void startCall(engineRef),
						disabled: connecting,
						"aria-label": t.start,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VoiceOrb, {
							amp: connecting ? .35 : amp * .4 + .08,
							state: connecting ? "thinking" : "idle",
							tint: voice.tint,
							size: 260
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col items-center gap-2 text-center",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-lg font-medium tracking-tight text-fg",
							children: t.tagline
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "max-w-xs text-sm text-muted",
							children: t.hint
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "flex h-11 items-center gap-2 rounded-full bg-surface-2 px-4 text-sm text-fg shadow-[var(--shadow-border)] transition-[transform,background-color] duration-150 ease-out hover:bg-surface active:scale-[0.96]",
						onClick: () => useVoice.getState().setPickerOpen(true),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-2 rounded-full bg-fg/80" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: uiLang === "fa" ? voice.nameFa : voice.name }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-subtle",
								children: uiLang === "fa" ? voice.toneFa : voice.tone
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "size-4 text-subtle" })
						]
					}),
					error === "mic" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "max-w-sm text-center text-sm text-muted",
						children: t.micDenied
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "lg",
						className: "min-w-52",
						onClick: () => void startCall(engineRef),
						disabled: connecting,
						children: connecting ? t.connecting : t.start
					})
				]
			}),
			pickerOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VoicePicker, {}) : null
		]
	});
}
function CallScreen({ engineRef }) {
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
	const status = muted && state !== "speaking" ? t.muted : state === "connecting" ? t.connecting : state === "thinking" ? t.thinking : state === "speaking" ? t.speaking : t.listening;
	const live = grokCaption || userCaption;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))]",
		dir: uiLang === "fa" ? "rtl" : "ltr",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex items-center justify-between",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "iconSm",
						className: "bg-surface-2/80",
						"aria-label": t.close,
						onClick: () => endCall(engineRef),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-5" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-center",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-medium tracking-tight",
							children: t.brand
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-subtle tabular-nums",
							children: status
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "iconSm",
						className: "bg-surface-2/80",
						"aria-label": t.history,
						onClick: () => useVoice.getState().setHistoryOpen(true),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(History, { className: "size-5" })
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-1 flex-col items-center justify-center gap-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(VoiceOrb, {
					amp,
					state,
					tint: voice.tint,
					size: 280
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "min-h-16 w-full max-w-sm px-2 text-center",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						dir: "auto",
						className: "text-pretty text-base font-medium leading-snug tracking-tight text-fg/90",
						children: live || " "
					})
				})]
			}),
			textOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Composer, { engineRef }) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
				className: "flex items-center justify-center gap-5 pb-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoundControl, {
						label: t.voices,
						onClick: () => useVoice.getState().setPickerOpen(true),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AudioLines, { className: "size-6" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoundControl, {
						label: muted ? t.unmute : t.mute,
						onClick: () => toggleMute(engineRef),
						active: !muted,
						children: muted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MicOff, { className: "size-6" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mic, { className: "size-6" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoundControl, {
						label: t.hangup,
						hang: true,
						onClick: () => endCall(engineRef),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhoneOff, { className: "size-6" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoundControl, {
						label: t.keyboard,
						onClick: () => useVoice.getState().setTextOpen(!useVoice.getState().textOpen),
						active: textOpen,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Keyboard, { className: "size-6" })
					})
				]
			}),
			historyOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HistorySheet, {}) : null,
			pickerOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VoicePicker, {}) : null
		]
	});
}
function RoundControl({ children, label, onClick, hang, active }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		"aria-label": label,
		onClick,
		className: cn("grid size-14 place-items-center rounded-full shadow-[var(--shadow-border)] transition-[transform,background-color,opacity] duration-150 ease-out active:scale-[0.96]", hang ? "bg-hang text-hang-fg" : active ? "bg-fg text-accent-fg" : "bg-surface-2 text-fg"),
		children
	});
}
function Composer({ engineRef }) {
	const uiLang = useVoice((s) => s.uiLang);
	const draft = useVoice((s) => s.draft);
	const t = COPY[uiLang];
	const send = () => {
		const text = draft.trim();
		if (!text) return;
		useVoice.getState().setDraft("");
		engineRef.current?.sendText(text);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		className: "mb-4 flex items-center gap-2 rounded-2xl bg-surface-2 p-2 shadow-[var(--shadow-border)]",
		onSubmit: (e) => {
			e.preventDefault();
			send();
		},
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			value: draft,
			onChange: (e) => useVoice.getState().setDraft(e.target.value),
			placeholder: t.typePlaceholder,
			className: "h-11 min-w-0 flex-1 bg-transparent px-3 text-sm text-fg placeholder:text-subtle focus:outline-none",
			dir: "auto"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			size: "iconSm",
			type: "submit",
			"aria-label": t.send,
			disabled: !draft.trim(),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "size-4" })
		})]
	});
}
function HistorySheet() {
	const uiLang = useVoice((s) => s.uiLang);
	const history = useVoice((s) => s.history);
	const t = COPY[uiLang];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "absolute inset-0 z-20 flex flex-col bg-bg/95",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between px-5 pt-[max(0.75rem,env(safe-area-inset-top))]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-base font-medium",
				children: t.history
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "ghost",
				size: "iconSm",
				"aria-label": t.close,
				onClick: () => useVoice.getState().setHistoryOpen(false),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-5" })
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex-1 overflow-y-auto px-5 py-4",
			children: history.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: t.emptyHistory
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "flex flex-col gap-4",
				children: history.map((turn) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex flex-col gap-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[11px] font-medium tracking-wide text-subtle uppercase",
						children: turn.role === "user" ? t.you : t.grok
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						dir: "auto",
						className: "text-sm leading-relaxed text-fg",
						children: turn.text
					})]
				}, turn.id))
			})
		})]
	});
}
function VoicePicker() {
	const uiLang = useVoice((s) => s.uiLang);
	const voiceId = useVoice((s) => s.voiceId);
	const t = COPY[uiLang];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "absolute inset-0 z-30 grid place-items-end bg-bg/70",
		onClick: () => useVoice.getState().setPickerOpen(false),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-lg rounded-t-3xl bg-surface px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 shadow-[var(--shadow-border)]",
			onClick: (e) => e.stopPropagation(),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mx-auto mb-4 h-1 w-10 rounded-full bg-fg/15" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mb-3 text-base font-medium",
					children: t.pickVoice
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "grid grid-cols-2 gap-2",
					children: VOICES.map((v) => {
						const active = v.id === voiceId;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: cn("flex h-16 w-full flex-col items-start justify-center rounded-xl px-3 text-left transition-[transform,background-color] duration-150 ease-out active:scale-[0.96]", active ? "bg-fg text-accent-fg" : "bg-surface-2 text-fg"),
							onClick: () => {
								useVoice.getState().setVoice(v.id);
								useVoice.getState().setPickerOpen(false);
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm font-medium",
								children: uiLang === "fa" ? v.nameFa : v.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: cn("text-xs", active ? "text-accent-fg/70" : "text-subtle"),
								children: uiLang === "fa" ? v.toneFa : v.tone
							})]
						}) }, v.id);
					})
				})
			]
		})
	});
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
	const label = spokenLang === "auto" ? t.auto : spokenLang === "fa" ? t.persian : t.english;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick: cycle,
		className: "h-9 rounded-full bg-surface-2 px-3 text-xs font-medium text-muted shadow-[var(--shadow-border)] transition-[transform,background-color] duration-150 ease-out hover:text-fg active:scale-[0.96]",
		children: label
	});
}
function StatusPulse({ state, amp, tint }) {
	const scale = 1 + Math.min(.08, amp * .12);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full opacity-30 blur-3xl",
		style: {
			transform: `translateX(-50%) scale(${scale})`,
			background: `rgb(${Math.floor(tint[0] * 255)} ${Math.floor(tint[1] * 255)} ${Math.floor(tint[2] * 255)})`,
			opacity: state === "speaking" ? .4 : .18
		}
	});
}
async function startCall(engineRef) {
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
		}
	});
	engineRef.current = engine;
	await engine.start({
		voiceId: store.voiceId,
		spokenLang: store.spokenLang,
		uiFa: store.uiLang === "fa"
	});
}
function endCall(engineRef) {
	engineRef.current?.stop();
	engineRef.current = null;
	useVoice.getState().resetCall();
}
function toggleMute(engineRef) {
	const next = !useVoice.getState().muted;
	useVoice.getState().setMuted(next);
	engineRef.current?.setMuted(next);
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VoiceApp, {});
}
//#endregion
export { Home as component };
