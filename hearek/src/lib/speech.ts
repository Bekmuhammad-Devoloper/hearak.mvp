/**
 * Web Speech API helperlari — brauzer va Capacitor WebView uchun.
 *
 * Eslatma: Web Speech API stabil ravishda Chrome va Chromium-asosli WebView'larda
 * (Google Speech Services o'rnatilgan Android'da) ishlaydi. iOS Safari'da yo'q.
 * Production APK uchun keyinroq @capacitor-community/speech-recognition plagini
 * tavsiya etiladi.
 */

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

export function isSpeechRecognitionSupported(): boolean {
  return getSpeechRecognitionCtor() !== null;
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
