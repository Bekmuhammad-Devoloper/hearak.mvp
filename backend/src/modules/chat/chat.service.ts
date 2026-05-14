import { BadRequestException, Injectable } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";
import { ChildrenService } from "../children/children.service";
import { AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { PostChatDto } from "./dto/post-chat.dto";

// Rule-based assistant placeholder. Swap for a real LLM call (OpenAI/Anthropic) in production.
function aiReply(text: string): string {
  const t = text.toLowerCase();
  if (/(qo'?rq|qo'?rqi|fear|scared)/.test(t)) {
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
  return "Rahmat savolingiz uchun. Mutaxassis tez orada javob beradi, shu orada bu yerda umumiy maslahat berishim mumkin.";
}

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly children: ChildrenService,
  ) {}

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

    const userMsg = await this.prisma.chatMessage.create({
      data: { childId: child.id, from: "user", text },
    });

    const aiText = aiReply(text);
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
}
