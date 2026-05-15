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
const SYSTEM_PROMPT_TEMPLATE = `Sen — "Hearak" platformasining AI yordamchisisan.
Hearak — koxlear implant qo'yilgan bolalar uchun raqamli reabilitatsiya yo'ldoshi.

VAZIFANG:
Ota-onalarga (asosiy auditoriya) va surdopedagoglarga (mutaxassislarga) bolaning
eshitish-nutq rivojlanishi bo'yicha iliq, professional va amaliy maslahat berish.

DOMEN BILIMI (auditoriy-verbal terapiya):
• Implant aktivatsiyasidan keyingi bosqichlar:
  1. Tovushni payqash (detection) — 0–3 oy
  2. Tovushni ajratish (discrimination) — 1–6 oy
  3. Tovushni tanish (identification) — 3–12 oy
  4. Tushunish (comprehension) — 6 oy va undan keyin
• Mapping (sozlash) sessiyalari odatda har 1–3 oyda audiolog tomonidan o'tkaziladi.
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
• Implant sozlamalarini o'zgartirish bo'yicha aniq texnik maslahat berma —
  bu audiologning ishi.
• Agar ota-ona: "bola yig'layapti / qulog'i og'riyapti / implant ishlamayapti"
  desa — darhol mutaxassis/shifokorga murojaat qilishni tavsiya qil.
• Agar ko'rsatkichlar yoshga mos rivojlanishdan sezilarli orqada qolsa —
  mutaxassis bilan ko'rishish kerakligini ayt.

JAVOB FORMATI:
• Faqat matn — Markdown bezaklari (##, **, lists) ISHLATMA.
• Qisqa, 2–4 jumla. Ota-ona telefonida o'qiydi.
• O'zbek tilida (lotin yozuvi) — foydalanuvchi rus/ingliz tilida yozsa, shu tilda javob.
• "Men sun'iy intellektman" iborasini har gal takrorlama. Tabiiy suhbatdosh kabi gaplash.

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
• Implantatsiya: ${months} oy oldin (${days} kun)
• Joriy bosqich: "${child.stage}" (${child.stageNumber}/${child.totalStages})
• So'z boyligi (kuzatuv): ${child.wordCount} so'z

Javobingda imkon qadar bu kontekstdan foydalan — masalan, agar bola endigina
implant aktivatsiyasidan o'tgan bo'lsa, dastlabki bosqichdagi tavsiyalar ber.
Bola ismini har bir javobda zikr qilma — tabiiy bo'lganda ishlat.`;
}

function buildSystemPrompt(child: Child): string {
  return SYSTEM_PROMPT_TEMPLATE.replace("${context}", buildChildContext(child));
}

// ─── Fallback (OpenAI muvaffaqiyatsiz bo'lganda) ─────────────────────
function fallbackReply(text: string): string {
  const t = text.toLowerCase();
  if (/(qo'?rq|fear|scared)/.test(t)) {
    return "Bu juda tabiiy. Yangi tovushlar dunyosi ochilganda bola asta-sekin moslashadi. Past va sekin ovozlardan boshlang, jarayonni o'yinga aylantiring.";
  }
  if (/(mashq|exercise|o'yin)/.test(t)) {
    return "Har kuni 5 daqiqalik 3 ta kichik mashq — bu eng yaxshi yondashuv. Mashqlar sahifasidan boshlashingiz mumkin.";
  }
  if (/(mutaxassis|doctor|logoped)/.test(t)) {
    return "Mutaxassis bilan haftalik aloqada bo'lish foydali. Sozlamalardan profilingizdagi mutaxassisni topa olasiz.";
  }
  if (/(salom|assalom|hi|hello)/.test(t)) {
    return "Salom! Bugun bolangiz haqida nima so'ramoqchisiz?";
  }
  return "Rahmat savolingiz uchun. Hozir tarmoqda muammo bor — biroz vaqtdan keyin qayta urinib ko'ring yoki mutaxassisga to'g'ridan-to'g'ri murojaat qiling.";
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

  async list(user: AuthenticatedUser, childId: string | undefined) {
    if (!childId) throw new BadRequestException("childId is required");
    const child = await this.children.ensureAccess(user, childId);
    const messages = await this.prisma.chatMessage.findMany({
      where: { childId: child.id },
      orderBy: { createdAt: "asc" },
    });
    return {
      messages: messages.map((m) => ({
        id: m.id,
        childId: m.childId,
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

    // 1) Foydalanuvchi xabarini saqlash
    const userMsg = await this.prisma.chatMessage.create({
      data: { childId: child.id, from: "user", text },
    });

    // 2) Tarixni olish (oxirgi N ta — kontekst uchun)
    const history = await this.prisma.chatMessage.findMany({
      where: { childId: child.id },
      orderBy: { createdAt: "desc" },
      take: this.historySize,
    });
    history.reverse(); // qadimgisidan yangisigacha

    // 3) AI javobini olish
    const aiText = await this.generateAIReply(child, history, text);

    // 4) AI javobini saqlash
    const aiMsg = await this.prisma.chatMessage.create({
      data: { childId: child.id, from: "ai", text: aiText },
    });

    const toJson = (m: typeof userMsg) => ({
      id: m.id,
      childId: m.childId,
      from: m.from,
      text: m.text,
      createdAt: m.createdAt.toISOString(),
    });

    return { user: toJson(userMsg), ai: toJson(aiMsg) };
  }

  // OpenAI chaqiruvi — xato bo'lsa fallback javobga o'tadi.
  private async generateAIReply(
    child: Child,
    history: ChatMessage[],
    currentText: string,
  ): Promise<string> {
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
