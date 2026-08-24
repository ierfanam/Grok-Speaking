export type VoiceId =
  | "eve"
  | "ara"
  | "leo"
  | "rex"
  | "sal"
  | "carina"
  | "luna"
  | "orion"
  | "helix"
  | "sirius";

export type VoiceInfo = {
  id: VoiceId;
  name: string;
  nameFa: string;
  tone: string;
  toneFa: string;
  tint: [number, number, number];
};

export const VOICES: VoiceInfo[] = [
  {
    id: "eve",
    name: "Eve",
    nameFa: "ایو",
    tone: "Energetic and upbeat",
    toneFa: "پرانرژی و سرزنده",
    tint: [0.92, 0.95, 1],
  },
  {
    id: "ara",
    name: "Ara",
    nameFa: "آرا",
    tone: "Warm and conversational",
    toneFa: "گرم و خودمانی",
    tint: [1, 0.93, 0.88],
  },
  {
    id: "leo",
    name: "Leo",
    nameFa: "لئو",
    tone: "Authoritative and strong",
    toneFa: "قاطع و محکم",
    tint: [0.88, 0.92, 1],
  },
  {
    id: "rex",
    name: "Rex",
    nameFa: "رکس",
    tone: "Clear and professional",
    toneFa: "شفاف و حرفه‌ای",
    tint: [0.94, 0.94, 0.96],
  },
  {
    id: "sal",
    name: "Sal",
    nameFa: "سال",
    tone: "Smooth and balanced",
    toneFa: "آرام و متعادل",
    tint: [0.9, 0.96, 0.98],
  },
  {
    id: "carina",
    name: "Carina",
    nameFa: "کارینا",
    tone: "Soft and empathetic",
    toneFa: "نرم و همدل",
    tint: [0.98, 0.92, 0.96],
  },
  {
    id: "luna",
    name: "Luna",
    nameFa: "لونا",
    tone: "Gentle and patient",
    toneFa: "آرام و صبور",
    tint: [0.9, 0.94, 1],
  },
  {
    id: "orion",
    name: "Orion",
    nameFa: "اوریون",
    tone: "Rich and cinematic",
    toneFa: "عمیق و سینمایی",
    tint: [0.86, 0.9, 1],
  },
  {
    id: "helix",
    name: "Helix",
    nameFa: "هلیکس",
    tone: "Bold and dynamic",
    toneFa: "جسور و پویا",
    tint: [0.95, 0.95, 1],
  },
  {
    id: "sirius",
    name: "Sirius",
    nameFa: "سیریوس",
    tone: "Quick-witted and playful",
    toneFa: "شوخ و تیز",
    tint: [0.93, 0.97, 1],
  },
];

export function getVoice(id: string): VoiceInfo {
  return VOICES.find((v) => v.id === id) ?? VOICES[0]!;
}

export const DEFAULT_VOICE: VoiceId = "eve";
