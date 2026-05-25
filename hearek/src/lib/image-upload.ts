/**
 * Brauzer'da rasmni avatar uchun tayyorlash: data URL'ga aylantirib,
 * 512px ichida sig'ishi uchun kichraytiradi, JPEG sifatida saqlaydi.
 *
 * Backend'ning `5mb` JSON limiti uchun yetarli — ~50–80 KB chiqadi.
 */

const AVATAR_MAX_PX = 512;
const AVATAR_QUALITY = 0.85;

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

export async function shrinkImage(dataUrl: string): Promise<string> {
  const img = new Image();
  await new Promise<void>((res, rej) => {
    img.onload = () => res();
    img.onerror = () => rej(new Error("Rasm o'qib bo'lmadi"));
    img.src = dataUrl;
  });
  const ratio = img.width / img.height;
  let w = img.width;
  let h = img.height;
  if (w > h && w > AVATAR_MAX_PX) {
    w = AVATAR_MAX_PX;
    h = Math.round(w / ratio);
  } else if (h >= w && h > AVATAR_MAX_PX) {
    h = AVATAR_MAX_PX;
    w = Math.round(h * ratio);
  }
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", AVATAR_QUALITY);
}

/** Qulayligi uchun bitta yagona helper: file → kichraytirilgan data URL. */
export async function fileToAvatarDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Faqat rasm fayli (jpg, png, webp)");
  }
  const dataUrl = await readFileAsDataUrl(file);
  return shrinkImage(dataUrl);
}
