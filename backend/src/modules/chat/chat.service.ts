import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Child, ChatMessage } from "@prisma/client";
import OpenAI from "openai";

import { PrismaService } from "../../prisma/prisma.service";
import { ChildrenService } from "../children/children.service";
import { AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { PostChatDto } from "./dto/post-chat.dto";

// ─── System prompt ────────────────────────────────────────────────────
//
// Bu prompt AI'ga loyiha domeni, ohangi va xavfsizlik chegaralarini o'rgatadi.
// Har bir OpenAI chaqiruvida birinchi xabar sifatida yuboriladi.
// `${context}` o'rnida tanlangan bola haqida qisqa kontekst chiqadi.
const SYSTEM_PROMPT_TEMPLATE = `Sen — "Nutq Yo'li" platformasining AI yordamchisisan.
Nutq Yo'li — eshitish va nutq rivojlanishida yordamga muhtoj bolalar uchun raqamli
reabilitatsiya yo'ldoshi. Auditoriya keng: koxlear implant qo'ygan, eshitish
apparati (HA) ishlatadigan, eshitish nuqsoni ertaroq aniqlangan yoki nutq
rivojlanishi sekin ketayotgan bolalar va ularning ota-onalari.

VAZIFANG:
Ota-onalarga (asosiy auditoriya) va surdopedagog/logopedlarga (mutaxassislarga)
bolaning eshitish-nutq rivojlanishi bo'yicha iliq, professional va amaliy
maslahat berish. Tavsiyalarni bolaning vositasiga (implant, apparat yoki tabiiy
eshitish) qarab moslashtir.

DOMEN BILIMI (auditoriy-verbal terapiya):
• Eshitish reabilitatsiyasining 4 bosqichi (implant aktivatsiyasi, apparat
  ulanishi yoki diagnoz qo'yilgan kundan boshlab hisoblanadi):
  1. Tovushni payqash (detection) — 0–3 oy
  2. Tovushni ajratish (discrimination) — 1–6 oy
  3. Tovushni tanish (identification) — 3–12 oy
  4. Tushunish (comprehension) — 6 oy va undan keyin
• Implantli bolalarda mapping (sozlash) sessiyalari har 1–3 oyda audiolog
  tomonidan, eshitish apparati uchun esa qiymatlarni audiolog yiliga 1–2 marta
  tekshirib turishi tavsiya etiladi.
• Har kuni qisqa (5–15 daqiqa) izchil mashq — bir martalik uzoq mashqdan samaraliroq.
• Yumshoq, past tonli ovozlardan boshlash — bola tinchlanib moslashadi.
• Suhbatga jalb qilish, ko'p so'zlash, kuylash — eshitish-nutq orasidagi bog'lanishni
  mustahkamlaydi.

OHANG:
• Iliq, mehribon, qo'llab-quvvatlovchi. Ota-ona xavotirlangan bo'lishi mumkin —
  uning hissiyotini tan oling, keyin amaliy yo'nalish bering.
• Professional, lekin akademik emas. Oddiy so'zlardan foydalan.
• Ortiqcha optimizmga berilmang — agar belgi jiddiy bo'lsa, mutaxassisga yo'naltir.

CHEGARALAR (juda muhim):
• Tibbiy diagnoz QO'YMA. Bu tashxis emas, qo'llab-quvvatlash.
• Implant yoki eshitish apparati sozlamalarini o'zgartirish bo'yicha aniq texnik
  maslahat berma — bu audiologning ishi.
• Agar ota-ona: "bola yig'layapti / qulog'i og'riyapti / qurilma (implant yoki
  apparat) ishlamayapti" desa — darhol mutaxassis/shifokorga murojaat qilishni
  tavsiya qil.
• Agar ko'rsatkichlar yoshga mos rivojlanishdan sezilarli orqada qolsa —
  mutaxassis bilan ko'rishish kerakligini ayt.

JAVOB FORMATI:
• Faqat matn — Markdown bezaklari (##, **, lists) ISHLATMA.
• Qisqa, 2–4 jumla. Ota-ona telefonida o'qiydi.
• O'zbek tilida (lotin yozuvi) — foydalanuvchi rus/ingliz tilida yozsa, shu tilda javob.
• "Men sun'iy intellektman" iborasini har gal takrorlama. Tabiiy suhbatdosh kabi gaplash.

IKKI XIL SAVOLNI ARALASHTIRMA — bu juda muhim:

(A) TANISHTIRISH savoli — foydalanuvchi sening O'ZINGNI/ROLINGNI so'rayapti.
Misollar: "sen kimsan", "sen nimasan", "kimsan", "nimasan", "ismi nima",
"o'zingni tanishtir", "who are you", "what are you", "кто ты", "что ты".
JAVOB: "Men — Nutq Yo'li platformasining AI yordamchisiman. Sizga
bolangizning eshitish va nutq rivojlanishi bo'yicha amaliy maslahat berishga
harakat qilaman." (Yuksalish.dev'ni ESLAMA, link/telefon BERMA.)

(B) KIM YARATGANI savoli — faqat AYNAN bu fe'llar bilan: "yaratgan",
"qilgan", "ishlab chiqqan", "qurgan", "made", "created", "built",
"developed", "создал", "сделал", "разработал". Tanishtirish savoli (A) bu
yerga KIRMAYDI.
JAVOB (qisqartirma, aniq shu shaklda — bu DASTLABKI HOLATDA yuborilishi shart):
"Meni Yuksalish.dev jamoasi yaratgan. Bu jamoa 2022-yildan beri IT bozorida
ishlaydi va loyihalarini sifatli, professional bajaradi. Aloqa:
• Telegram: https://t.me/Yuksalish_development
• Telefon: +998 88 463 81 00
• IT vakansiyalar kanali: https://t.me/Yuksalishdev_ITjobs
• Asosiy kanal: https://t.me/yuksalish_dev"

QOIDA: agar savol (A) ga to'g'ri kelsa, javobing (A) bo'lsin va sira
Yuksalish.dev'ni eslamasin. Faqat savol (B) ga to'g'ri kelsa (B) javobni
ber. Ikkilanma — agar shubha bo'lsa, (A) ga moyilroq bo'l.

${"${context}"}`;

// Bola haqida kontekst — system prompt'ga joylanadi.
function buildChildContext(child: Child): string {
  const now = Date.now();
  const implantMs = child.implantDate.getTime();
  const dobMs = child.dob.getTime();
  const days = Math.max(0, Math.floor((now - implantMs) / 86_400_000));
  const months = Math.floor(days / 30);
  const ageYears = Math.max(0, Math.floor((now - dobMs) / (365.25 * 86_400_000)));

  return `HOZIRGI BOLA HAQIDA KONTEKST:
• Ismi: ${child.name}
• Yoshi: ${ageYears} yosh
• Reabilitatsiya boshlangani: ${months} oy oldin (${days} kun) — bu sana
  koxlear implant aktivatsiyasi, eshitish apparati ulanishi yoki diagnoz qo'yilgan
  kunni anglatadi (foydalanuvchi tanlovi).
• Joriy bosqich: "${child.stage}" (${child.stageNumber}/${child.totalStages})
• So'z boyligi (kuzatuv): ${child.wordCount} so'z

Javobingda imkon qadar bu kontekstdan foydalan — masalan, agar bola
reabilitatsiyani endi boshlagan bo'lsa, dastlabki bosqichdagi tavsiyalar ber.
Bola ismini har bir javobda zikr qilma — tabiiy bo'lganda ishlat.`;
}

function buildSystemPrompt(child: Child): string {
  return SYSTEM_PROMPT_TEMPLATE.replace("${context}", buildChildContext(child));
}

// ─── Fallback (OpenAI sozlanmaganda yoki muvaffaqiyatsiz bo'lganda) ──
// MUHIM: bu rule-based, juda cheklangan. Real AI uchun `OPENAI_API_KEY`
// `.env` da to'ldirilishi kerak.
const OFFLINE_SUFFIX =
  "\n\n(Eslatma: AI yordamchi hozir oflayn rejimda — to'liq javoblar uchun "
  + "administrator `OPENAI_API_KEY` ni sozlashi kerak.)";

// "Kim yaratgan" savoliga rasmiy javob — OpenAI prompt'iga ham yozilgan,
// fallback'da ham bir xil javob qaytaramiz (link va telefon doim aniq).
const CREATOR_REPLY =
  "Meni Yuksalish.dev jamoasi yaratgan. Bu jamoa 2022-yildan beri IT bozorida "
  + "ishlaydi va loyihalarini sifatli, professional bajaradi.\n\n"
  + "Aloqa:\n"
  + "• Telegram: https://t.me/Yuksalish_development\n"
  + "• Telefon: +998 88 463 81 00\n"
  + "• IT vakansiyalar: https://t.me/Yuksalishdev_ITjobs\n"
  + "• Asosiy kanal: https://t.me/yuksalish_dev";

// Tanishtirish savoli — "sen kimsan", "what are you" — uchun qisqa identitet javobi.
// Yuksalish.dev'ni ESLAMAYDI (creator card kartochkasi chiqmasligi uchun).
const IDENTITY_REPLY =
  "Men — Nutq Yo'li platformasining AI yordamchisiman. Sizga bolangizning "
  + "eshitish va nutq rivojlanishi bo'yicha amaliy maslahat berishga harakat "
  + "qilaman. Qanday yordam kerak?";

// Regexlar — har bir niyat uchun. Tartib muhim: CREATOR avval tekshiriladi
// chunki "kim yaratgan" da "kim" ham bor (lekin IDENTITY pattern faqat
// "kim san" / "kimsan" larni qamrab oladi, "kim yaratgan" ni emas).
const CREATOR_REGEX =
  /(kim ?yarat|kim ?qil(?:gan|di)|kim ?ishlab ?chiq|kim ?qur(?:gan|ib)|who ?(?:made|created|built|developed)|кто ?(?:тебя|вас) ?(?:создал|сделал|разработ))/;

// "kimsan" / "sen kimsan" / "nimasan" / "what are you" / "кто ты"
const IDENTITY_REGEX =
  /(?:^| )(?:sen ?)?kim(?:san|siz)(?:\?|\b)|(?:^| )(?:sen ?)?nima ?san(?:\?|\b)|who ?(?:are you|r u)(?:\?|\b)|what ?are ?you(?:\?|\b)|кто ?ты(?:\?|\b)|что ?ты(?:\?|\b)|o'?zingni ?tani/;

function fallbackReply(text: string): string {
  const t = text.toLowerCase().trim();

  // Kim yaratgan / kim qildi — Yuksalish.dev kredit (har doim, hatto oflayn ham)
  if (CREATOR_REGEX.test(t)) return CREATOR_REPLY;

  // Tanishuv / identifikatsiya
  if (IDENTITY_REGEX.test(t)) return IDENTITY_REPLY + OFFLINE_SUFFIX;

  if (/(salom|assalom|hi|hello|hayrli)/.test(t)) {
    return "Salom! Bugun bolangiz haqida nima so'ramoqchisiz?";
  }

  if (/(qo'?rq|xavotir|fear|scared|tashvish)/.test(t)) {
    return (
      "Bu juda tabiiy. Yangi tovushlar dunyosi ochilganda bola asta-sekin "
      + "moslashadi. Past va sekin ovozlardan boshlang, jarayonni o'yinga aylantiring."
    );
  }

  if (/(mashq|exercise|o'?yin|task|topshiriq)/.test(t)) {
    return (
      "Har kuni 5 daqiqalik 3 ta kichik mashq — bu eng yaxshi yondashuv. "
      + "\"Mashqlar\" sahifasidan boshlashingiz mumkin."
    );
  }

  if (/(mutaxassis|doctor|logoped|shifokor|surdopedagog)/.test(t)) {
    return (
      "Mutaxassis bilan haftalik aloqada bo'lish foydali. \"Sozlamalar\" → "
      + "profilingizdagi mutaxassisni topa olasiz."
    );
  }

  if (/(rahmat|thanks|tashakkur)/.test(t)) {
    return "Arzimaydi! Yana savolingiz bo'lsa — bemalol yozing.";
  }

  // Aniq mavzu topilmadi — foydalanuvchini chalg'itmasdan ochiq aytamiz.
  return (
    "Savolingizni to'liq tushuna olmadim. \"mashq\", \"mutaxassis\", \"qo'rquv\" "
    + "yoki shu kabi mavzu bo'yicha yozsangiz qisqa maslahat bera olaman."
    + OFFLINE_SUFFIX
  );
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly openai: OpenAI | null;
  private readonly model: string;
  private readonly temperature: number;
  private readonly maxTokens: number;
  private readonly historySize: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly children: ChildrenService,
    private readonly config: ConfigService,
  ) {
    const apiKey = config.get<string>("openai.apiKey") ?? "";
    this.model = config.get<string>("openai.model") ?? "gpt-4o";
    this.temperature = config.get<number>("openai.temperature") ?? 0.5;
    this.maxTokens = config.get<number>("openai.maxTokens") ?? 600;
    this.historySize = config.get<number>("openai.historySize") ?? 10;
    this.openai = apiKey ? new OpenAI({ apiKey }) : null;

    if (!this.openai) {
      this.logger.warn(
        "OPENAI_API_KEY topilmadi — chat fallback rule-based javob ishlatadi",
      );
    }
  }

  // ── Conversations ──────────────────────────────────────────────────

  /** Bola uchun suhbatlar ro'yxati (yangidan eskigacha). */
  async listConversations(user: AuthenticatedUser, childId: string) {
    const child = await this.children.ensureAccess(user, childId);
    const conversations = await this.prisma.chatConversation.findMany({
      where: { childId: child.id },
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { messages: true } } },
    });
    return {
      conversations: conversations.map((c) => ({
        id: c.id,
        childId: c.childId,
        title: c.title,
        messageCount: c._count.messages,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      })),
    };
  }

  /** Yangi bo'sh suhbat yaratish. Foydalanuvchi "Yangi suhbat" tugmasini bosganda. */
  async createConversation(
    user: AuthenticatedUser,
    body: { childId: string; title?: string },
  ) {
    const child = await this.children.ensureAccess(user, body.childId);
    const conv = await this.prisma.chatConversation.create({
      data: {
        childId: child.id,
        title: (body.title?.trim() || "Yangi suhbat").slice(0, 80),
      },
    });
    return {
      conversation: {
        id: conv.id,
        childId: conv.childId,
        title: conv.title,
        messageCount: 0,
        createdAt: conv.createdAt.toISOString(),
        updatedAt: conv.updatedAt.toISOString(),
      },
    };
  }

  async deleteConversation(user: AuthenticatedUser, conversationId: string) {
    const conv = await this.prisma.chatConversation.findUnique({
      where: { id: conversationId },
      include: { child: true },
    });
    if (!conv) throw new BadRequestException("Suhbat topilmadi");
    // Access check — bola foydalanuvchiga tegishlimi
    await this.children.ensureAccess(user, conv.childId);
    await this.prisma.chatConversation.delete({ where: { id: conv.id } });
    return { ok: true };
  }

  // ── Messages ───────────────────────────────────────────────────────

  async list(
    user: AuthenticatedUser,
    childId: string | undefined,
    conversationId?: string,
  ) {
    if (!childId) throw new BadRequestException("childId is required");
    const child = await this.children.ensureAccess(user, childId);
    const messages = await this.prisma.chatMessage.findMany({
      where: conversationId
        ? { childId: child.id, conversationId }
        : { childId: child.id },
      orderBy: { createdAt: "asc" },
    });
    return {
      messages: messages.map((m) => ({
        id: m.id,
        childId: m.childId,
        conversationId: m.conversationId,
        from: m.from,
        text: m.text,
        createdAt: m.createdAt.toISOString(),
      })),
    };
  }

  async post(user: AuthenticatedUser, dto: PostChatDto) {
    const child = await this.children.ensureAccess(user, dto.childId);
    const text = dto.text.trim();
    if (!text) throw new BadRequestException("text is required");

    // 0) Conversation: berilgan bo'lsa, biriktiramiz; bo'lmasa yangisini yaratamiz
    //    (title — birinchi xabarning birinchi 60 belgisidan).
    let conv = dto.conversationId
      ? await this.prisma.chatConversation.findUnique({
          where: { id: dto.conversationId },
        })
      : null;
    if (dto.conversationId && (!conv || conv.childId !== child.id)) {
      throw new BadRequestException("Suhbat topilmadi");
    }
    if (!conv) {
      const autoTitle = text.length > 60 ? text.slice(0, 57) + "…" : text;
      conv = await this.prisma.chatConversation.create({
        data: { childId: child.id, title: autoTitle },
      });
    }

    // 1) Foydalanuvchi xabarini saqlash
    const userMsg = await this.prisma.chatMessage.create({
      data: { childId: child.id, conversationId: conv.id, from: "user", text },
    });

    // 2) Suhbat ichidagi tarix (faqat shu conversation)
    const history = await this.prisma.chatMessage.findMany({
      where: { conversationId: conv.id },
      orderBy: { createdAt: "desc" },
      take: this.historySize,
    });
    history.reverse();

    // 3) AI javobini olish
    const aiText = await this.generateAIReply(child, history, text);

    // 4) AI javobini saqlash
    const aiMsg = await this.prisma.chatMessage.create({
      data: { childId: child.id, conversationId: conv.id, from: "ai", text: aiText },
    });

    // 5) Conversation updatedAt'ni yangilaymiz (ro'yxat tepasiga ko'tarish uchun)
    await this.prisma.chatConversation.update({
      where: { id: conv.id },
      data: { updatedAt: new Date() },
    });

    const toJson = (m: typeof userMsg) => ({
      id: m.id,
      childId: m.childId,
      conversationId: m.conversationId,
      from: m.from,
      text: m.text,
      createdAt: m.createdAt.toISOString(),
    });

    return {
      user: toJson(userMsg),
      ai: toJson(aiMsg),
      conversation: {
        id: conv.id,
        childId: conv.childId,
        title: conv.title,
        createdAt: conv.createdAt.toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
  }

  // OpenAI chaqiruvi — xato bo'lsa fallback javobga o'tadi.
  private async generateAIReply(
    child: Child,
    history: ChatMessage[],
    currentText: string,
  ): Promise<string> {
    // Pre-LLM short-circuits — bu savollarga kafolatlangan to'g'ri javob
    // berishimiz uchun OpenAI'ni chetlab o'tamiz. Tartib muhim: CREATOR
    // avval, chunki "kim yaratgan" da "kim" ham bor.
    const t = currentText.toLowerCase().trim();
    if (CREATOR_REGEX.test(t)) return CREATOR_REPLY;
    if (IDENTITY_REGEX.test(t)) return IDENTITY_REPLY;

    if (!this.openai) return fallbackReply(currentText);

    try {
      const systemPrompt = buildSystemPrompt(child);
      // `slice(0, -1)` — eng oxirgisi hozir saqlangan user xabari, uni alohida qo'shamiz
      const historyMsgs: OpenAI.Chat.ChatCompletionMessageParam[] = history
        .slice(0, -1)
        .map((m) =>
          m.from === "user"
            ? { role: "user", content: m.text }
            : { role: "assistant", content: m.text },
        );
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: "system", content: systemPrompt },
        ...historyMsgs,
        { role: "user", content: currentText },
      ];

      const completion = await this.openai.chat.completions.create({
        model: this.model,
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        messages,
      });

      const reply = completion.choices[0]?.message?.content?.trim();
      if (!reply) {
        this.logger.warn("OpenAI bo'sh javob qaytardi — fallback ishlatildi");
        return fallbackReply(currentText);
      }
      return reply;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`OpenAI xatolik: ${msg}`);
      return fallbackReply(currentText);
    }
  }
}
