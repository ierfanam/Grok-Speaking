import { useEffect, useRef } from "react";
import type { CallState } from "@/lib/voice/store";

type OrbProps = {
  amp: number;
  state: CallState;
  tint: [number, number, number];
  size?: number;
};

export function VoiceOrb({ amp, state, tint, size = 280 }: OrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ampRef = useRef(amp);
  const stateRef = useRef(state);
  const tintRef = useRef(tint);

  ampRef.current = amp;
  stateRef.current = state;
  tintRef.current = tint;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl2", {
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
    });
    if (gl) {
      return startWebgl(canvas, gl, ampRef, stateRef, tintRef);
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    return startCanvas2d(canvas, ctx, ampRef, stateRef, tintRef);
  }, []);

  return (
    <div
      className="relative grid place-items-center"
      style={{ width: size, height: size }}
    >
      <div
        className="pointer-events-none absolute inset-[-18%] rounded-full opacity-70 blur-3xl transition-opacity duration-[400ms]"
        style={{
          background:
            state === "speaking" || state === "listening"
              ? "radial-gradient(circle, color-mix(in oklab, var(--color-glow) 34%, transparent), transparent 70%)"
              : "radial-gradient(circle, color-mix(in oklab, var(--color-glow) 18%, transparent), transparent 68%)",
        }}
      />
      <canvas
        ref={canvasRef}
        className="relative h-full w-full"
        aria-hidden="true"
      />
    </div>
  );
}

function startWebgl(
  canvas: HTMLCanvasElement,
  gl: WebGL2RenderingContext,
  ampRef: { current: number },
  stateRef: { current: CallState },
  tintRef: { current: [number, number, number] },
) {
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
  if (!vs || !fs) return startCanvas2d(canvas, canvas.getContext("2d")!, ampRef, stateRef, tintRef);
  const prog = gl.createProgram();
  if (!prog) return;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    return startCanvas2d(canvas, canvas.getContext("2d")!, ampRef, stateRef, tintRef);
  }
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
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

  const stateNum = (s: CallState) =>
    s === "idle" ? 0 : s === "connecting" || s === "thinking" ? 2 : s === "speaking" ? 3 : 1;

  const frame = (now: number) => {
    const t = (now - t0) / 1000;
    const idle = stateRef.current === "idle" ? 0.1 + 0.06 * Math.sin(t * 1.15) : 0;
    smoothAmp += (Math.max(ampRef.current, idle) - smoothAmp) * 0.12;
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, (now - t0) / 1000);
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

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
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

function startCanvas2d(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  ampRef: { current: number },
  stateRef: { current: CallState },
  tintRef: { current: [number, number, number] },
) {
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

  const frame = (now: number) => {
    const t = (now - t0) / 1000;
    const idle = stateRef.current === "idle" ? 0.1 + 0.06 * Math.sin(t * 1.15) : 0;
    smooth += (Math.max(ampRef.current, idle) - smooth) * 0.12;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2;
    const cy = h / 2;
    const [tr, tg, tb] = tintRef.current;
    const R = Math.min(w, h) * (0.28 + smooth * 0.06);
    const blobs = 6;
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < blobs; i++) {
      const a = t * (0.6 + i * 0.07) + i * 1.3;
      const rad = R * (0.55 + 0.22 * Math.sin(t * 1.4 + i));
      const x = cx + Math.cos(a) * R * (0.18 + smooth * 0.22);
      const y = cy + Math.sin(a * 0.9) * R * (0.16 + smooth * 0.2);
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
      const alpha = 0.18 + smooth * 0.2;
      g.addColorStop(0, `rgba(${Math.floor(tr * 255)},${Math.floor(tg * 255)},${Math.floor(tb * 255)},${alpha})`);
      g.addColorStop(0.45, `rgba(${Math.floor(tr * 220)},${Math.floor(tg * 230)},${Math.floor(tb * 255)},${alpha * 0.35})`);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
    const core = ctx.createRadialGradient(cx - R * 0.2, cy - R * 0.25, R * 0.05, cx, cy, R * 1.05);
    core.addColorStop(0, "rgba(255,255,255,0.95)");
    core.addColorStop(0.35, `rgba(${Math.floor(tr * 230)},${Math.floor(tg * 235)},${Math.floor(tb * 255)},0.7)`);
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
