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
  if (_unlocked) return;
  const ctx = getCtx();
  if (!ctx) return;
  try {
    if (ctx.state === "suspended") await ctx.resume();
    // Silent ping — ba'zi WebView'larda haqiqiy audio "ishlatilmaguncha" suspended qoladi
    const buffer = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(ctx.destination);
    src.start(0);
    _unlocked = true;
  } catch {
    /* ignore */
  }
}

/** Sodda tone (chastota + davomiylik). Optional stereo pan ([-1..+1]). */
export async function playTone(
  frequency: number,
  durationMs: number,
  options: { pan?: number; type?: OscillatorType } = {},
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
  const now = ctx.currentTime;
  gain.gain.linearRampToValueAtTime(0.3, now + 0.02);
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

const _audioCache = new Map<string, HTMLAudioElement>();

/**
 * Audio fayldan ovoz chalish. Fayl topilmasa yoki yuklab bo'lmasa, fallback
 * funksiyaga o'tadi. Real hayvon/predmet tovushlari uchun ishlatiladi.
 */
export async function playSoundFile(
  src: string,
  fallback?: () => void | Promise<void>,
): Promise<void> {
  try {
    let audio = _audioCache.get(src);
    if (!audio) {
      audio = new Audio(src);
      audio.preload = "auto";
      _audioCache.set(src, audio);
    }
    audio.currentTime = 0;
    await audio.play();
  } catch {
    if (fallback) await fallback();
  }
}
