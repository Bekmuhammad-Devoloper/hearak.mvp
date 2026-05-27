# Nutq Yo'li

Eshitish va nutq rivojlanishida yordamga muhtoj bolalar (koxlear implant qo'ygan, eshitish apparati ishlatadigan yoki nutq nuqsoni bo'lgan) uchun raqamli reabilitatsiya platformasi — erta aniqlash, uy mashqlari, AI logoped yordamchi va mutaxassis paneli bitta tizimda.

## Tuzilma

```
hearek/                — frontend (React + TanStack Start + Tailwind v4)
backend/               — NestJS REST API + Prisma (SQLite default, PostgreSQL ready)
tz.txt                 — texnik topshiriq (loyiha konsepsiyasi)
```

## Tez ishga tushirish

### Backend
```bash
cd backend
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run start:dev          # http://localhost:3001
```

### Frontend
```bash
cd hearek
npm install
npm run dev                # http://localhost:5173
```

Vite dev server `/api/*` so'rovlarini avtomatik `http://localhost:3001` ga proxy qiladi — telefonda LAN orqali (`http://<laptop-ip>:5173`) ham ishlaydi.

## Demo hisoblar

`npm run db:seed` faqat admin hisobini yaratadi. Ota-ona va mutaxassis hisoblari
oddiy ro'yxatdan o'tish orqali yaratiladi (`/auth` sahifasi). Mutaxassis hisobi
admin tomonidan tasdiqlanmaguncha tizimga kira olmaydi.

| Email             | Parol      | Rol   |
|-------------------|------------|-------|
| admin@misol.uz    | admin1234  | Admin |

## Stack

**Frontend** — React 19, TanStack Start (file-based router), TanStack Query, Tailwind v4 (OKLCh palitra), shadcn/ui, Fraunces + Nunito font'lari.

**Backend** — NestJS 10, Prisma 5, JWT + bcrypt, class-validator, modulli arxitektura (12 ta domen modul).

## Asosiy xususiyatlar

- 5–10 savolli onlayn diagnostika
- Reabilitatsiya boshlangan sanadan (koxlear implant, eshitish apparati yoki diagnoz kuni) avtomatik AI rivojlanish xaritasi (6 bosqich)
- "Bugungi 5 daqiqa" — har kuni 3 ta mashq (o'yin / nutq / eshitish)
- 4 ta mini o'yin: ovoz topish, yo'nalish, rasm tanlash, takrorlash
- AI logoped yordamchi (rule-based, LLM'ga oson kengaytiriladi)
- Nutq faolligini mikrofon orqali kuzatish
- Early Risk Alert — rivojlanish ko'rsatkichlari past bo'lsa avtomatik ogohlantirish
- Mutaxassis paneli: bemorlar, qaydlar, haftalik topshiriqlar

## Litsenziya

Shaxsiy / o'quv loyihasi.
