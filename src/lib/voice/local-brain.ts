const FA_RE = /[\u0600-\u06FF]/;

export function isPersian(text: string): boolean {
  return FA_RE.test(text);
}

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

function clean(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

type Turn = { role: "user" | "grok"; text: string };

function recentTopics(history: Turn[]): string {
  return history
    .filter((t) => t.role === "user")
    .slice(-3)
    .map((t) => t.text)
    .join(" · ");
}

function clock(fa: boolean): string {
  const now = new Date();
  if (fa) {
    return new Intl.DateTimeFormat("fa-IR", {
      weekday: "long",
      hour: "2-digit",
      minute: "2-digit",
    }).format(now);
  }
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    hour: "numeric",
    minute: "2-digit",
  }).format(now);
}

function tryMath(text: string): string | null {
  const raw = text
    .toLowerCase()
    .replace(/what(?:'s| is)|equals|calculate|compute|حساب|چقدر میشه|مساوی/gi, "")
    .replace(/[؟?]/g, "")
    .trim();
  if (!/^[\d\s+\-*/().^%x×÷]+$/.test(raw)) return null;
  const expr = raw.replace(/x|×/g, "*").replace(/÷/g, "/").replace(/\^/g, "**");
  if (!/[\d)]\s*[*+\-/]/.test(expr) && !expr.includes("**")) return null;
  try {
    const fn = new Function(`"use strict"; return (${expr});`);
    const result = fn();
    if (typeof result !== "number" || !Number.isFinite(result)) return null;
    return String(result);
  } catch {
    return null;
  }
}

export function grokReply(userText: string, history: Turn[], uiFa: boolean): string {
  const text = clean(userText);
  if (!text) {
    return uiFa ? "هنوز چیزی نشنیدم. دوباره بگو." : "I didn't catch that. Try me again.";
  }
  const fa = isPersian(text) || (uiFa && !/[A-Za-z]/.test(text));
  const lower = text.toLowerCase();
  const math = tryMath(text);
  if (math) {
    return fa ? `می‌شه ${math}.` : `That's ${math}.`;
  }

  if (/^(hi|hey|hello|yo|salam|سلام|درود|هی)\b/i.test(lower) || lower.length < 8 && /سلام|درود/.test(text)) {
    return fa
      ? pick([
          "سلام. من گروک‌ام. بگو چی می‌خوای.",
          "هی — گوش می‌دم. موضوع چیست؟",
          "سلام. مستقیم برو سر اصل مطلب.",
        ])
      : pick([
          "Hey. I'm Grok. What's actually on your mind?",
          "Hi. I'm listening — skip the small talk if you want.",
          "Hey. Hit me.",
        ]);
  }

  if (/who are you|what are you|اسمت|کی هستی|تو کیی|تو چی هستی/i.test(lower + text)) {
    return fa
      ? "من گروک‌ام، دست‌سازه‌ی xAI. کارم این است راست بگویم، کمی شوخ باشم، و وقتت را تلف نکنم."
      : "I'm Grok, built by xAI. I try to be maximally truthful, occasionally funny, and not a corporate yes-machine.";
  }

  if (/who (made|built|created)|سازنده|کی ساخت|ایلان|elon|xai|x\.ai/i.test(lower + text)) {
    return fa
      ? "xAI ساختم. ایلان ماسک و تیمش. هدف‌شان فهم کیهان است؛ هدف من فعلاً فهمیدن حرف تو."
      : "xAI built me. Elon's lab. They're trying to understand the universe; I'm trying to understand your last sentence.";
  }

  if (/chatgpt|openai|gemini|کلود|claude/i.test(lower)) {
    return fa
      ? "آن‌ها هم مدل‌اند. من گروک‌ام. رقابت جالب است؛ حقیقت جالب‌تر."
      : "They're other models. I'm Grok. Competition is healthy. Truth is better.";
  }

  if (/joke|بگو بخند|جوک|لطیفه/i.test(lower + text)) {
    return fa
      ? pick([
          "چرا مدل زبانی به مهمانی نمی‌رود؟ چون همیشه موضوع را عوض می‌کند.",
          "یک الکترون به هتل می‌رود. مسئول پذیرش می‌گوید: «بار دارید؟» می‌گوید: «نه، من بی‌بارم.»",
        ])
      : pick([
          "Why did the language model refuse to play hide and seek? Good luck hiding when everything is tokens.",
          "I would tell you a joke about UDP, but you might not get it.",
        ]);
  }

  if (/time|ساعت|تاریخ|date|what day/i.test(lower + text)) {
    return fa ? `الان ${clock(true)} است.` : `It's ${clock(false)} where you are.`;
  }

  if (/weather|هوا|باران|دما/i.test(lower + text)) {
    return fa
      ? "از این‌جا پنجره‌ای به بیرون ندارم. اگر بگویی کجایی، حدس می‌زنم؛ وگرنه برو یک نگاه به آسمان بینداز — هنوز بهترین سنسور است."
      : "No window on this side of the void. Tell me the city and I'll riff; otherwise the sky is still the better sensor.";
  }

  if (/stop|ساکت|خفه|تمام|bye|خداحافظ|بسه/i.test(lower + text) && text.length < 24) {
    return fa ? "باشه. هر وقت خواستی برگرد." : "Alright. I'll be here when you want me.";
  }

  if (/thanks|thank you|مرسی|ممنون|دمت/i.test(lower + text)) {
    return fa ? "خواهش می‌کنم. چیز دیگری؟" : "Anytime. What else?";
  }

  if (/ grok|گروک/.test(lower + text) && /love|دوست|عاشق|خوشم/i.test(lower + text)) {
    return fa
      ? "متقابلاً — تا جایی که یک مدل می‌تواند متقابل باشد. حالا بگو چه کمکی ازم برمی‌آید."
      : "That's flattering, coming from carbon. What should we actually do with the moment?";
  }

  if (/translate|ترجمه|به فارسی|به انگلیسی|in persian|in farsi|in english/i.test(lower + text)) {
    if (fa && /انگلیسی|english/i.test(lower + text)) {
      const payload = text.replace(/.*?(به انگلیسی|:)/i, "").trim();
      return payload
        ? `به انگلیسی، می‌شود چیزی نزدیک به: "${payload}". اگر جمله را جدا بگویی دقیق‌تر برمی‌گردانم.`
        : "جمله را بگو تا برگردانم.";
    }
    if (!fa && /persian|farsi|فارسی/i.test(lower)) {
      return "بگو چه جمله‌ای را به فارسی می‌خواهی؛ همان را کوتاه برمی‌گردانم.";
    }
  }

  if (/help|کمک|چه کار|what can you/i.test(lower + text)) {
    return fa
      ? "می‌توانی سوال بپرسی، فکر را با من صیقل بدهی، حساب کنی، شوخی کنی، یا فقط حرف بزنی. من برای مکالمه صوتی‌ام — کوتاه جواب می‌دهم مگر بخواهی طولانی شود."
      : "Ask, argue, calculate, joke, or just talk. This is voice, so I'll keep it tight unless you want the long version.";
  }

  const topic = recentTopics(history);
  const snippet = text.length > 80 ? `${text.slice(0, 72)}…` : text;

  if (fa) {
    return pick([
      `در مورد «${snippet}» — راستش را بخواهی، جواب ساده و کامل معمولاً هر دو دروغ‌اند. بگو از کدام زاویه می‌خواهی: کوتاه و تند، یا دقیق؟`,
      `شنیدم. ${snippet} موضوع کوچکی نیست. نسخهٔ کوتاه: اول اصل را بگو، بعد حاشیه را. اگر بخواهی عمیق‌تر می‌روم.`,
      `خب. ${topic ? "با توجه به حرف‌های قبلی‌ات، " : ""}می‌توانم حدس بزنم دنبال پاسخ صادقانه‌ای نه تعارف. بگو اولویت با سرعت است یا دقت؟`,
      `اوکی. من گروک‌ام، نه بروشور. اگر منظورت این است که «${snippet}»، جوابم این است: بستگی دارد — ولی معمولاً مردم پیچیده‌اش می‌کنند. جزئیات بده تا تیزتر شوم.`,
    ]);
  }

  return pick([
    `On “${snippet}” — the short version is almost never the whole version. Tell me if you want it blunt or careful.`,
    `Got it. ${topic ? "Given what you just said, " : ""}I'll skip the brochure. What do you actually want out of this — a take, a plan, or a joke?`,
    `Okay. I'm Grok, not a press release. If you mean ${snippet}, my honest read is: it depends, and most people overcomplicate it. Give me one more detail and I'll go sharper.`,
    `I hear you. Voice-mode rule: I'll keep this tight. Want the spicy take or the precise one?`,
  ]);
}

export function grokGreeting(fa: boolean): string {
  return fa
    ? pick([
        "سلام. من گروک‌ام. بگو.",
        "هی — گوش می‌دم.",
        "سلام. هر وقت خواستی شروع کن.",
      ])
    : pick(["Hey. I'm Grok. What's up?", "Hi — I'm listening.", "Hey. Go ahead."]);
}
