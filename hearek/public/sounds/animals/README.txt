Hayvon ovozlari va rasmlari (o'zingiz yuklang)
================================================

Bu papkaga MP3 va rasm fayllarini joylasangiz, "Ovozni topish" o'yini ularni
avtomatik ishlatadi. Fayl topilmasa — emoji va onomatopoeik TTS fallback'i
chiqadi.

OVOZLAR (mp3)
─────────────
1–3 soniyalik, mono yoki stereo, < 100 KB tavsiya etiladi:

  dog.mp3    — it (vov vov)
  cat.mp3    — mushuk (miyov)
  bird.mp3   — qush (chiy chiy)
  cow.mp3    — sigir (mu-u-u)
  frog.mp3   — qurbaqa (qurr qurr)
  lion.mp3   — sher (rrrr)

RASMLAR (png / webp / jpg)
──────────────────────────
Kvadrat ko'rinishda, 256×256 yoki 512×512, shaffof PNG yaxshi:

  dog.png    yoki dog.webp / dog.jpg
  cat.png
  bird.png
  cow.png
  frog.png
  lion.png

Kod birinchi navbatda .png, keyin .webp, keyin .jpg ni sinab ko'radi.
Hech qaysisi topilmasa — emoji (🐶, 🐱, 🐦, 🐮, 🐸, 🦁) ko'rinadi.

QAYERDAN OLISH MUMKIN (bepul, royalty-free)
───────────────────────────────────────────

Ovozlar:
  • https://pixabay.com/sound-effects/search/animal/
  • https://freesound.org  (CC0 filtri bilan)
  • https://mixkit.co/free-sound-effects/animals/

Rasmlar:
  • https://www.flaticon.com  (free user uchun atribut talab qiladi)
  • https://pixabay.com/illustrations/search/animal/
  • https://www.freepik.com   (free + atribut)
  • https://undraw.co         (CC0 illyustratsiyalar)

QO'SHISH KETMA-KETLIGI
─────────────────────
1. Fayllarni yuklab oling va bu papkaga ko'chiring
   (hearek/public/sounds/animals/)
2. Fayl nomlari to'g'ri bo'lishi shart: dog.mp3, cat.png va h.k.
3. `npm run build` qiling (yoki dev server allaqachon ishlayotgan bo'lsa
   sahifani Ctrl+Shift+R bilan yangilang)
4. APK uchun: `npm run cap:sync` va keyin qayta build

Fayl yo'q paytida o'yin to'liq ishlaydi — siz bemalol bittadan qo'shsangiz
ham bo'ladi (masalan, faqat dog.mp3 va dog.png qo'ysangiz — it uchun real
ovoz/rasm chiqadi, qolganlari fallback'da qoladi).
