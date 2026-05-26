/**
 * Nutqni tanish — brauzer va Capacitor APK uchun yagona interfeys.
 *
 * Brauzerda: window.SpeechRecognition / webkitSpeechRecognition (Chrome'da bor).
 * APK'da: @capacitor-community/speech-recognition (Google Speech Services'ga
 *         murojaat qiladigan native plagin).
 *
 * Ikkala backend ham bir xil API'ni taqdim etadi:
 *   const session = await startSpeech({ lang: "uz-UZ", onPartial, onError });
 *   ...
 *   await session.stop();
 *
 * Session.stop() yakuniy tahlil uchun to'plangan transkriptni qaytaradi
 * (final natijalar birlashtirilgan ko'rinishda).
 */

import { Capacitor } from "@capacitor/core";
import { SpeechRecognition } from "@capacitor-community/speech-recognition";

export type SpeechResultAlternative = {
  transcript: string;
  confidence?: number;
};

export type SpeechResult = ArrayLike<SpeechResultAlternative> & { isFinal?: boolean };

export type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  abort: () => void;
  stop: () => void;
  onresult:
    | ((e: { results: ArrayLike<SpeechResult>; resultIndex: number }) => void)
    | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
};

export type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

export function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const isNative = Capacitor.isNativePlatform();

export async function isSpeechRecognitionSupported(): Promise<boolean> {
  if (isNative) {
    try {
      const r = await SpeechRecognition.available();
      return Boolean(r.available);
    } catch {
      return false;
    }
  }
  return getSpeechRecognitionCtor() !== null;
}

export type StartSpeechOpts = {
  lang: string;
  /// Har keystroke (oraliq + final) chaqiriladi. `isFinal` faqat brauzer
  /// rejimida true bo'lishi mumkin — APK'da natijalar barchasi `partialResults`
  /// orqali oqib keladi va session.stop() yakuniyni qaytaradi.
  onPartial?: (text: string, isFinal: boolean) => void;
  onError?: (code: string) => void;
};

export type SpeechSession = {
  /// Sessiyani to'xtatadi va yakuniy transkriptni qaytaradi (so'zlar bo'sh
  /// joy bilan ajratilgan, trimlangan).
  stop: () => Promise<string>;
};

/// Brauzer rejimi: Web Speech API orqali.
function startSpeechWeb(opts: StartSpeechOpts): SpeechSession | null {
  const SRctor = getSpeechRecognitionCtor();
  if (!SRctor) return null;

  const finalChunks: string[] = [];
  let liveInterim = "";
  let stopped = false;
  let langFallbackTried = false;
  let recognition: SpeechRecognitionLike | null = null;

  const startRecognition = (lang: string) => {
    const rec = new SRctor();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const alt = res?.[0];
        if (!alt) continue;
        const text = alt.transcript ?? "";
        if (res.isFinal) {
          finalChunks.push(text);
          opts.onPartial?.(text, true);
        } else {
          interim += text;
        }
      }
      liveInterim = interim;
      const combined = (finalChunks.join(" ") + " " + liveInterim).trim();
      opts.onPartial?.(combined, false);
    };

    rec.onerror = (e) => {
      if (e.error === "language-not-supported" && !langFallbackTried) {
        langFallbackTried = true;
        try {
          rec.abort();
        } catch {
          /* ignore */
        }
        startRecognition("ru-RU");
        return;
      }
      // 'no-speech' va 'aborted' — odatiy, e'tibor bermaymiz.
      if (e.error !== "no-speech" && e.error !== "aborted") {
        opts.onError?.(e.error);
      }
    };

    rec.onend = () => {
      // continuous rejimda brauzer ba'zan o'zi to'xtatadi — biz to'xtatmagan
      // bo'lsak, qayta yoqamiz.
      if (!stopped) {
        try {
          rec.start();
        } catch {
          /* ignore */
        }
      }
    };

    try {
      rec.start();
    } catch {
      /* ignore */
    }
    recognition = rec;
  };

  startRecognition(opts.lang);

  return {
    stop: async () => {
      stopped = true;
      try {
        recognition?.stop();
      } catch {
        /* ignore */
      }
      // SR onresult ba'zan stop()'dan keyin ham final natijani uzatadi —
      // qisqa kutib turamiz.
      await new Promise((res) => setTimeout(res, 350));
      return (finalChunks.join(" ") + " " + liveInterim).trim();
    },
  };
}

/// APK rejimi: @capacitor-community/speech-recognition orqali.
async function startSpeechNative(opts: StartSpeechOpts): Promise<SpeechSession | null> {
  // Avval qurilmada nutqni tanish mavjudligini tekshiramiz — yo'q bo'lsa
  // Google Speech Services o'rnatilmagan yoki o'chirilgan.
  try {
    const a = await SpeechRecognition.available();
    if (!a.available) {
      opts.onError?.("service-not-installed");
      return null;
    }
  } catch (err) {
    opts.onError?.(
      "available-check-failed: " + (err instanceof Error ? err.message : "unknown"),
    );
    return null;
  }

  // Ruxsat: birinchi marta foydalanuvchidan so'raymiz.
  try {
    const perm = await SpeechRecognition.checkPermissions();
    if (perm.speechRecognition !== "granted") {
      const req = await SpeechRecognition.requestPermissions();
      if (req.speechRecognition !== "granted") {
        opts.onError?.("not-allowed");
        return null;
      }
    }
  } catch (err) {
    // Permission API mavjud bo'lmasligi mumkin — keyingi start() haqiqiy
    // xatoni qaytarib beradi, lekin diagnostika uchun loglaymiz.
    opts.onError?.(
      "permission-check-failed: " + (err instanceof Error ? err.message : "unknown"),
    );
  }

  let lastPartial = "";
  let stopped = false;
  // Joriy ishlatilayotgan til — fallback bo'lsa o'zgaradi.
  let currentLang = opts.lang;
  // Til qo'llanmasa qaysilarga o'tishimiz mumkin (uz-UZ → ru-RU → en-US).
  const langCandidates = Array.from(
    new Set([opts.lang, "ru-RU", "en-US"].filter(Boolean)),
  );

  const handlePartial = (data: { matches?: string[] }) => {
    const text = data.matches?.[0]?.trim();
    if (!text) return;
    lastPartial = text;
    opts.onPartial?.(text, false);
  };

  const tryStart = async (lang: string): Promise<boolean> => {
    try {
      await SpeechRecognition.start({
        language: lang,
        maxResults: 1,
        prompt: "",
        partialResults: true,
        popup: false,
      });
      return true;
    } catch {
      return false;
    }
  };

  const startWithFallback = async (): Promise<boolean> => {
    for (const lang of langCandidates) {
      if (stopped) return false;
      const ok = await tryStart(lang);
      if (ok) {
        currentLang = lang;
        return true;
      }
    }
    return false;
  };

  // `listeningState` orqali plagin o'z-o'zidan to'xtaganini bilamiz —
  // Android'da SpeechRecognizer jimlik yoki vaqt tugashida o'zi yakunlaydi.
  // Foydalanuvchi to'xtatmagan bo'lsa, joriy til bilan qayta yoqamiz.
  const handleListeningState = (data: { status: "started" | "stopped" }) => {
    if (data.status === "stopped" && !stopped) {
      void tryStart(currentLang).then((ok) => {
        if (!ok && !stopped) {
          opts.onError?.("audio-capture");
        }
      });
    }
  };

  const partialListener = await SpeechRecognition.addListener("partialResults", handlePartial);
  const stateListener = await SpeechRecognition.addListener(
    "listeningState",
    handleListeningState,
  );

  if (!(await startWithFallback())) {
    void partialListener.remove();
    void stateListener.remove();
    opts.onError?.("language-not-supported");
    return null;
  }

  return {
    stop: async () => {
      stopped = true;
      // Ba'zi qurilmalarda SpeechRecognition.stop() osilib qoladi —
      // 800ms dan ko'p kutmaymiz, baribir UI'ga natijani qaytaramiz.
      const withTimeout = <T,>(p: Promise<T>, ms: number) =>
        Promise.race([
          p,
          new Promise<T>((res) => setTimeout(() => res(undefined as unknown as T), ms)),
        ]);
      try {
        await withTimeout(SpeechRecognition.stop(), 800);
      } catch {
        /* ignore */
      }
      try {
        await withTimeout(partialListener.remove(), 200);
        await withTimeout(stateListener.remove(), 200);
      } catch {
        /* ignore */
      }
      return lastPartial.trim();
    },
  };
}

export async function startSpeech(opts: StartSpeechOpts): Promise<SpeechSession | null> {
  if (isNative) return startSpeechNative(opts);
  return startSpeechWeb(opts);
}

/** "Yo'lda" → "yolda", "Qo'l" → "qol" — yumshoq belgilarni olib tashlash. */
export function normalizeWord(s: string): string {
  return s
    .toLowerCase()
    .replace(/['ʻʼ`'`ʹ]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}
