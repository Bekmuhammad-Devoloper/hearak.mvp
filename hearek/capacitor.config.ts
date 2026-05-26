import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Nutq Yo'li mobile (Android) konfiguratsiyasi.
 *
 * appId — Google Play uchun yagona identifikator.
 * webDir — SPA build output papkasi ("npm run build:apk" yaratadi).
 * Backend API'ga ulanish — frontend kodida `VITE_API_BASE_URL=https://hearak.yuksalish.dev`
 * env qiymati ishlatiladi (`.env.apk` orqali).
 */
const config: CapacitorConfig = {
  appId: "uz.hearak.app",
  appName: "Nutq Yo'li",
  webDir: "dist-spa",
  // Native splash screen / status bar sozlamalari
  android: {
    allowMixedContent: false,
    // captureInput: true Android'da ba'zi telefonlarda softkeyboard'ning
    // Backspace tugmasini bloklaydi — input maydonida xato yozilsa, foydalanuvchi
    // o'chira olmay qolardi. Default (false) — yumshoq klaviatura to'g'ri ishlaydi.
    captureInput: false,
    webContentsDebuggingEnabled: false,
  },
  // Foydalanuvchi yuklab olganda dastlabki rasm + status bar rangi
  backgroundColor: "#fbfbfb",
};

export default config;
