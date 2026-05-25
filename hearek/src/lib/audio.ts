/**
 * Audio helpers — brauzerlar va Capacitor WebView (Android) uchun.
 *
 * Asosiy muammolar:
 *   • Android WebView'da AudioContext "suspended" holatda yaratiladi —
 *     birinchi `resume()` chaqirig'i user gesture (tap) kontekstida bo'lishi shart.
 *   • SpeechSynthesis voices ro'yxati birinchi marta darhol bo'sh — `voiceschanged`
 *     event'ini kutib turish kerak.
 *   • `uz-UZ` voice ko'pgina qurilmalarda yo'q — eng yaqin variant tanlanadi.
 */

let _ctx: AudioContext | null = null;
let _unlocked = false;

/** Bitta global AudioContext (yangidan ochilavermasin). */
function getCtx(): AudioContext | null {
  if (_ctx) return _ctx;
  const w = window as unknown as {
    AudioContext?: typeof AudioContext;
    webkitAudioContext?: typeof AudioContext;
  };
  const Ctor = w.AudioContext ?? w.webkitAudioContext;
  if (!Ctor) return null;
  _ctx = new Ctor();
  return _ctx;
}

/**
 * Birinchi user tap'da chaqiring (yoki sahifa mount paytidayoq) — AudioContext'ni
 * `resume()` qiladi va keyingi `playTone()`'lar darhol ishlaydi.
 */
export async function unlockAudio(): Promise<void> {
  const ctx = getCtx();
  if (ctx) {
    try {
      if (ctx.state === "suspended") await ctx.resume();
      // Silent ping — ba'zi WebView'larda haqiqiy audio "ishlatilmaguncha" suspended qoladi
      const buffer = ctx.createBuffer(1, 1, 22050);
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.connect(ctx.destination);
      src.start(0);
      // Faqat ctx haqiqatan resume bo'lganidan keyin latch qilamiz, aks holda
      // keyingi gesture chaqirig'i ham erta chiqib ketadi va audio jim qoladi.
      if (ctx.state === "running") _unlocked = true;
    } catch {
      /* ignore */
    }
  }
  // HTMLAudio'ni ham unlock qilamiz — ba'zi mobil brauzerlar HTMLAudioElement
  // uchun alohida user-gesture talab qiladi (AudioContext bilan birga emas).
  try {
    const probe = new Audio();
    probe.muted = true;
    probe.src =
      "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
    await probe.play().catch(() => {});
    probe.pause();
  } catch {
    /* ignore */
  }
}

/** Sodda tone (chastota + davomiylik). Optional stereo pan ([-1..+1]) va volume (0..1). */
export async function playTone(
  frequency: number,
  durationMs: number,
  options: { pan?: number; type?: OscillatorType; volume?: number } = {},
): Promise<void> {
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      return;
    }
  }
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = options.type ?? "sine";
  osc.frequency.value = frequency;
  gain.gain.value = 0;
  const peak = Math.max(0, Math.min(1, options.volume ?? 0.3));
  const now = ctx.currentTime;
  gain.gain.linearRampToValueAtTime(peak, now + 0.02);
  gain.gain.linearRampToValueAtTime(0, now + durationMs / 1000);

  let target: AudioNode = ctx.destination;
  if (typeof options.pan === "number" && typeof ctx.createStereoPanner === "function") {
    const pan = ctx.createStereoPanner();
    pan.pan.value = Math.max(-1, Math.min(1, options.pan));
    pan.connect(ctx.destination);
    target = pan;
  }
  osc.connect(gain).connect(target);
  osc.start();
  osc.stop(now + durationMs / 1000 + 0.05);
}

// ─── SFX kutubxonasi (Web Audio orqali sintez qilingan) ─────────────────
//
// "Qaysi tomondan?" o'yini uchun har xil tovushlar — baraban, shiqqildoq,
// mashina signali, qo'ng'iroq, hushtak, qarsak. Hammasi stereo pan
// (chap/o'ng) bilan ishlaydi va WebView'da MP3 kerak emas.

export type SfxName =
  | "drum"
  | "rattle"
  | "horn"
  | "bell"
  | "whistle"
  | "clap"
  | "phone"
  | "knock"
  | "splash"
  | "siren"
  | "ding";

export const SFX_LABELS_UZ: Record<SfxName, string> = {
  drum: "Baraban",
  rattle: "Shiqqildoq",
  horn: "Mashina signali",
  bell: "Qo'ng'iroq",
  whistle: "Hushtak",
  clap: "Qarsak",
  phone: "Telefon jiringlashi",
  knock: "Eshik taqilladi",
  splash: "Suv chayqalishi",
  siren: "Sirena",
  ding: "Yengil dingg",
};

function makeNoiseBuffer(ctx: AudioContext, durationSec: number): AudioBuffer {
  const len = Math.max(1, Math.floor(ctx.sampleRate * durationSec));
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

export async function playSfx(
  name: SfxName,
  options: { pan?: number; volume?: number; pitch?: number } = {},
): Promise<void> {
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      return;
    }
  }
  const master = ctx.createGain();
  master.gain.value = Math.max(0, Math.min(1.5, options.volume ?? 1));
  let target: AudioNode = ctx.destination;
  if (typeof options.pan === "number" && typeof ctx.createStereoPanner === "function") {
    const pan = ctx.createStereoPanner();
    pan.pan.value = Math.max(-1, Math.min(1, options.pan));
    pan.connect(ctx.destination);
    target = pan;
  }
  master.connect(target);

  // Pitch multiplier — chap/o'ng farqini naushniksiz ham eshitish uchun
  // chastotalarni siljitish (masalan, left=0.85, right=1.18). 1 = o'zgartirish yo'q.
  const p = Math.max(0.3, Math.min(3, options.pitch ?? 1));
  const now = ctx.currentTime;

  switch (name) {
    case "drum": {
      // Past chastotali "thud" — pitch tushib boradi
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(160 * p, now);
      osc.frequency.exponentialRampToValueAtTime(40 * p, now + 0.25);
      gain.gain.setValueAtTime(0.9, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.connect(gain).connect(master);
      osc.start(now);
      osc.stop(now + 0.5);
      break;
    }
    case "horn": {
      // Ikki ovozli mashina signali (square + minor 6'a yaqin)
      const dur = 0.7;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.35, now + 0.02);
      gain.gain.setValueAtTime(0.35, now + dur - 0.06);
      gain.gain.linearRampToValueAtTime(0, now + dur);
      gain.connect(master);
      [440, 523].forEach((f) => {
        const osc = ctx.createOscillator();
        osc.type = "square";
        osc.frequency.value = f * p;
        osc.connect(gain);
        osc.start(now);
        osc.stop(now + dur + 0.05);
      });
      break;
    }
    case "bell": {
      // Sinusoidlar bilan qoplangan qo'ng'iroq, eksponensial decay
      const dur = 1.4;
      [880, 1320, 1760, 2640].forEach((f, i) => {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = f * p;
        const gain = ctx.createGain();
        const amp = 0.35 / (i + 1);
        gain.gain.setValueAtTime(amp, now);
        gain.gain.exponentialRampToValueAtTime(0.0008, now + dur);
        osc.connect(gain).connect(master);
        osc.start(now);
        osc.stop(now + dur);
      });
      break;
    }
    case "whistle": {
      // Yuqori chastotaga sweep
      const dur = 0.55;
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(800 * p, now);
      osc.frequency.linearRampToValueAtTime(1700 * p, now + dur);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.35, now + 0.04);
      gain.gain.linearRampToValueAtTime(0, now + dur);
      osc.connect(gain).connect(master);
      osc.start(now);
      osc.stop(now + dur + 0.05);
      break;
    }
    case "rattle": {
      // Bir nechta qisqa shovqin portlashlari — shaker/shiqqildoq
      const noise = makeNoiseBuffer(ctx, 0.5);
      const burstCount = 7;
      for (let i = 0; i < burstCount; i++) {
        const src = ctx.createBufferSource();
        src.buffer = noise;
        const filter = ctx.createBiquadFilter();
        filter.type = "highpass";
        filter.frequency.value = 2500 * p;
        const gain = ctx.createGain();
        const t0 = now + i * 0.11;
        gain.gain.setValueAtTime(0, t0);
        gain.gain.linearRampToValueAtTime(0.6, t0 + 0.006);
        gain.gain.linearRampToValueAtTime(0, t0 + 0.07);
        src.connect(filter).connect(gain).connect(master);
        src.start(t0);
        src.stop(t0 + 0.1);
      }
      break;
    }
    case "clap": {
      // Yagona shovqin portlashi
      const noise = makeNoiseBuffer(ctx, 0.2);
      const src = ctx.createBufferSource();
      src.buffer = noise;
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 1200 * p;
      filter.Q.value = 0.7;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      src.connect(filter).connect(gain).connect(master);
      src.start(now);
      src.stop(now + 0.22);
      break;
    }
    case "phone": {
      // Klassik telefon: 2 marta ring — har biri 0.35s, ikki tonli (900 va 700 Hz)
      const ringDur = 0.35;
      for (let r = 0; r < 2; r++) {
        const t0 = now + r * 0.55;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, t0);
        gain.gain.linearRampToValueAtTime(0.3, t0 + 0.02);
        gain.gain.setValueAtTime(0.3, t0 + ringDur - 0.05);
        gain.gain.linearRampToValueAtTime(0, t0 + ringDur);
        gain.connect(master);
        [900, 700].forEach((f) => {
          const osc = ctx.createOscillator();
          osc.type = "sine";
          osc.frequency.value = f * p;
          osc.connect(gain);
          osc.start(t0);
          osc.stop(t0 + ringDur + 0.02);
        });
      }
      break;
    }
    case "knock": {
      // Eshik taqir-tuqur: 3 ta past chastotali zarb
      for (let i = 0; i < 3; i++) {
        const t0 = now + i * 0.16;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(120 * p, t0);
        osc.frequency.exponentialRampToValueAtTime(60 * p, t0 + 0.08);
        gain.gain.setValueAtTime(0.85, t0);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.12);
        osc.connect(gain).connect(master);
        osc.start(t0);
        osc.stop(t0 + 0.15);
      }
      break;
    }
    case "splash": {
      // Suv chayqalishi: filterlangan shovqin + past chastotali "bloop"
      const dur = 0.35;
      const noise = makeNoiseBuffer(ctx, dur);
      const src = ctx.createBufferSource();
      src.buffer = noise;
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(2800 * p, now);
      filter.frequency.exponentialRampToValueAtTime(500 * p, now + dur);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + dur);
      src.connect(filter).connect(gain).connect(master);
      src.start(now);
      src.stop(now + dur + 0.02);
      // Bonus: "bloop" tone
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(450 * p, now + 0.02);
      osc.frequency.exponentialRampToValueAtTime(180 * p, now + 0.2);
      oscGain.gain.setValueAtTime(0.35, now + 0.02);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(oscGain).connect(master);
      osc.start(now + 0.02);
      osc.stop(now + 0.3);
      break;
    }
    case "siren": {
      // Politsiya sirenasi — chastota yuqori va past bo'lib o'zgaradi
      const dur = 1.2;
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      const lowF = 500 * p;
      const highF = 1100 * p;
      osc.frequency.setValueAtTime(lowF, now);
      osc.frequency.linearRampToValueAtTime(highF, now + 0.3);
      osc.frequency.linearRampToValueAtTime(lowF, now + 0.6);
      osc.frequency.linearRampToValueAtTime(highF, now + 0.9);
      osc.frequency.linearRampToValueAtTime(lowF, now + 1.2);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
      gain.gain.setValueAtTime(0.3, now + dur - 0.1);
      gain.gain.linearRampToValueAtTime(0, now + dur);
      osc.connect(gain).connect(master);
      osc.start(now);
      osc.stop(now + dur + 0.05);
      break;
    }
    case "ding": {
      // Qisqa engil ding — yumshoq, do'stona
      const dur = 0.9;
      [1800, 2400].forEach((f, i) => {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = f * p;
        const gain = ctx.createGain();
        const amp = 0.4 / (i + 1);
        gain.gain.setValueAtTime(amp, now);
        gain.gain.exponentialRampToValueAtTime(0.0008, now + dur);
        osc.connect(gain).connect(master);
        osc.start(now);
        osc.stop(now + dur);
      });
      break;
    }
  }
}

// ─── SpeechSynthesis (TTS) ──────────────────────────────────────────────

let _voicesLoaded = false;
let _voices: SpeechSynthesisVoice[] = [];

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (_voicesLoaded && _voices.length) return Promise.resolve(_voices);
  if (typeof window === "undefined" || !window.speechSynthesis)
    return Promise.resolve([]);

  const current = window.speechSynthesis.getVoices();
  if (current.length > 0) {
    _voices = current;
    _voicesLoaded = true;
    return Promise.resolve(current);
  }

  return new Promise((resolve) => {
    const onChange = () => {
      _voices = window.speechSynthesis.getVoices();
      _voicesLoaded = true;
      window.speechSynthesis.removeEventListener("voiceschanged", onChange);
      resolve(_voices);
    };
    window.speechSynthesis.addEventListener("voiceschanged", onChange);
    // Failsafe — ba'zi WebView'lar event'ni o'tkazib yuboradi
    setTimeout(() => {
      if (!_voicesLoaded) {
        _voices = window.speechSynthesis.getVoices();
        _voicesLoaded = true;
        resolve(_voices);
      }
    }, 1500);
  });
}

function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  // Tartib: uz → kk → tr → ru → en → birinchi mavjud
  const langs = ["uz", "kk", "tr", "ru", "en"];
  for (const l of langs) {
    const v = voices.find((v) => v.lang.toLowerCase().startsWith(l));
    if (v) return v;
  }
  return voices[0];
}

/**
 * Matnni ovozda o'qish. WebView'larda ham ishlaydi (voice fallback bilan).
 *
 * Mobil WebView'lar uchun mustahkamlash:
 *  • Faqat speak qilishdan oldin cancel() — agar haqiqatan oldingi gap bor bo'lsa
 *  • Agar `uz-UZ` voice yo'q bo'lsa default lang ham sinab ko'riladi
 *  • `onerror` event'da fallback til bilan qayta urinish
 */
export async function speak(text: string, options: { rate?: number; pitch?: number } = {}): Promise<void> {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  try {
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      window.speechSynthesis.cancel();
    }
    const voices = await loadVoices();
    const voice = pickVoice(voices);

    const trySpeak = (lang: string, useVoice?: SpeechSynthesisVoice) => {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = lang;
      utter.rate = options.rate ?? 0.9;
      if (typeof options.pitch === "number") utter.pitch = options.pitch;
      if (useVoice) utter.voice = useVoice;
      // Volume ko'p WebView'da default 1, lekin ba'zilarida 0 bo'lib qoladi.
      utter.volume = 1;
      utter.onerror = () => {
        // Birinchi urinish muvaffaqiyatsiz bo'lsa — neytral til bilan qayta sinab ko'ramiz.
        if (lang !== "en-US") {
          try {
            const fallback = new SpeechSynthesisUtterance(text);
            fallback.lang = "en-US";
            fallback.rate = options.rate ?? 0.9;
            fallback.volume = 1;
            window.speechSynthesis.speak(fallback);
          } catch {
            /* ignore */
          }
        }
      };
      window.speechSynthesis.speak(utter);
    };

    trySpeak(voice?.lang || "uz-UZ", voice);
  } catch {
    /* ignore */
  }
}

// ─── Sound files ────────────────────────────────────────────────────────

let _currentAudio: HTMLAudioElement | null = null;

/** Barcha joriy ovozlarni to'xtatadi (HTMLAudio + TTS). */
export function stopAllSounds(): void {
  if (_currentAudio) {
    try {
      _currentAudio.pause();
      _currentAudio.currentTime = 0;
    } catch {
      /* ignore */
    }
    _currentAudio = null;
  }
  if (typeof window !== "undefined" && window.speechSynthesis) {
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      window.speechSynthesis.cancel();
    }
  }
}

/**
 * Audio fayldan ovoz chalish. Fayl topilmasa yoki yuklab bo'lmasa, fallback
 * funksiyaga o'tadi. Real hayvon/predmet tovushlari uchun ishlatiladi.
 *
 * Eslatma: Audio elementlari KESHLANMAYDI — cached element birinchi marta
 * autoplay-policy bilan rad etilsa, keyingi chaqiriqlarda ham xato holatda
 * qoladi. Har gal yangi `new Audio(src)` arzon, brauzer baribir resp'ni
 * HTTP cache'dan oladi.
 */
export async function playSoundFile(
  src: string,
  fallback?: () => void | Promise<void>,
): Promise<void> {
  if (!src) {
    if (fallback) await fallback();
    return;
  }
  // Avval AudioContext'ni unlock qilamiz — agar gesture konteksti yopilgan
  // bo'lsa ham, suspended'dan running'ga o'tkazishga urinish (zarari yo'q).
  await unlockAudio();
  const audio = new Audio(src);
  audio.preload = "auto";
  audio.volume = 1;
  // Oldingi ovozni to'xtatamiz, lekin _currentAudio'ga yangini darhol
  // bog'lamaymiz — play() promise tugagandan keyin xavfsizroq.
  if (_currentAudio && _currentAudio !== audio) {
    try {
      _currentAudio.pause();
      _currentAudio.currentTime = 0;
    } catch {
      /* ignore */
    }
  }
  try {
    await audio.play();
    _currentAudio = audio;
  } catch {
    _currentAudio = null;
    if (fallback) await fallback();
  }
}
