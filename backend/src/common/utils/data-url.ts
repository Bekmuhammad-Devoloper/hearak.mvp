import { BadRequestException } from '@nestjs/common';

/// Avatar (rasm) uchun maksimal data URL hajmi — base64 hisoblangan ~3 MB.
/// Brauzer tarafida 512px ga kichraytirilgan JPEG ~80 KB chiqadi, lekin
/// xom rasm yuborilishi mumkin — shu sababli toleranat bo'lamiz.
export const AVATAR_MAX_DATAURL = 3_000_000;

/// O'yin asseti (rasm yoki audio) uchun maksimal data URL hajmi — ~3 MB.
/// Brauzer 2 MB faylgacha qabul qiladi, base64 inflatsiyasi bilan ~2.7 MB.
export const ASSET_MAX_DATAURL = 3_000_000;

/// Berilgan data URL belgilangan hajmdan oshib ketmasligini tekshiradi.
/// Tezroq fail qilamiz — Express body parser limiti (5 MB) ga ham yetmasdan.
export function assertDataUrlSize(
  dataUrl: string | null | undefined,
  maxBytes: number,
  fieldName = 'dataUrl',
): void {
  if (!dataUrl) return;
  if (dataUrl.length > maxBytes) {
    throw new BadRequestException(
      `${fieldName} juda katta (${Math.round(dataUrl.length / 1024)} KB). Maks: ${Math.round(maxBytes / 1024)} KB`,
    );
  }
}
