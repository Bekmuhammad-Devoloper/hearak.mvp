# Hayvon ovozlari — backend statik fayllar

Bu papkadagi `*.wav` fayllar **backend orqali xizmatga chiqariladi**:

```
GET /audio/animals/dog.wav
GET /audio/animals/cat.wav
...
```

Frontend (`games.tsx → playAnimalSound`) ulardan **2-darajali zaxira**
sifatida foydalanadi:

1. Admin yuklagan asset (DB'dan, `data:audio/...`)
2. **Shu papkadagi `.wav` fayl** ← siz hozir o'qiyotgan
3. `hearek/public/sounds/animals/{id}.mp3` (eski yo'l)
4. Web Speech API onomatopoeya
5. Synth toni

## Joriy fayllar

Hammasi `scripts/generate-animal-sounds.mjs` skripti orqali sintez yo'li bilan
generatsiya qilingan (qisqa, ~1.5 sek, 22 050 Hz mono PCM). Real recording'lar
bilan almashtirish uchun shunchaki bir xil nomli `.wav` faylni yozib qo'ying:

| Fayl       | Hayvon        |
|------------|---------------|
| `dog.wav`  | It (vov vov)  |
| `cat.wav`  | Mushuk (miyov)|
| `bird.wav` | Qush (chir)   |
| `cow.wav`  | Sigir (mu-u-u)|
| `frog.wav` | Qurbaqa (qurr)|
| `lion.wav` | Sher (rrrr)   |

## Regeneratsiya

```bash
cd backend
node scripts/generate-animal-sounds.mjs
```

## Real audio bilan almashtirish

Bepul royalty-free manbalar:
- https://pixabay.com/sound-effects/search/animal/
- https://freesound.org (CC0 filtri bilan)
- https://mixkit.co/free-sound-effects/animals/

Yuklab oling → `.wav` (yoki `.mp3` — fayl nomini moslang) sifatida saqlang
→ shu papkaga qo'ying → backend restartdan keyin ishlaydi.
