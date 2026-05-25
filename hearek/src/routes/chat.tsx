import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { useEffect, useRef, useState } from "react";
import { Loader2, Menu, MessageSquarePlus, Phone, Send, Send as TelegramIcon, Sparkles, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useActiveChild,
  useChat,
  useChatConversations,
  useDeleteChatConversation,
  useSendChat,
  type ChatConversation as ChatConv,
} from "@/lib/queries";
import { toast } from "sonner";
import { Logomark } from "@/components/brand-icons";
import { useT } from "@/lib/i18n";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

/** Bekend "kim yaratgan" javobi shu prefiks bilan boshlanadi (chat.service.ts). */
const CREATOR_REPLY_PREFIX = "Meni Yuksalish.dev jamoasi yaratgan";

function isCreatorReply(text: string): boolean {
  return text.trimStart().startsWith(CREATOR_REPLY_PREFIX);
}

export const Route = createFileRoute("/chat")({ component: Chat });

function Chat() {
  const { child } = useActiveChild();
  // null = "Yangi suhbat" (hali yaratilmagan, post paytida avto-yaratiladi)
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const chat = useChat(child?.id, activeConvId);
  const send = useSendChat(child?.id, activeConvId);
  const conversations = useChatConversations(child?.id);
  const deleteConv = useDeleteChatConversation(child?.id);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const t = useT();

  // Bola o'zgarsa — yangi suhbatga qaytamiz
  useEffect(() => {
    setActiveConvId(null);
  }, [child?.id]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chat.data?.messages?.length]);

  const onSend = async () => {
    const text = input.trim();
    if (!text || !child || send.isPending) return;
    setInput("");
    try {
      const result = await send.mutateAsync(text);
      // Yangi conversation tug'ilgan bo'lsa — uni faol qilamiz
      if (!activeConvId && result.conversation?.id) {
        setActiveConvId(result.conversation.id);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Yuborilmadi");
      setInput(text);
    }
  };

  const startNewConversation = () => {
    setActiveConvId(null);
    setDrawerOpen(false);
  };

  const switchConversation = (conv: ChatConv) => {
    setActiveConvId(conv.id);
    setDrawerOpen(false);
  };

  const handleDelete = async (conv: ChatConv, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`"${conv.title}" suhbati o'chirilsinmi?`)) return;
    try {
      await deleteConv.mutateAsync(conv.id);
      if (activeConvId === conv.id) setActiveConvId(null);
      toast.success("Suhbat o'chirildi");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "O'chirib bo'lmadi");
    }
  };

  const msgs = chat.data?.messages ?? [];
  const convList = conversations.data?.conversations ?? [];

  return (
    <MobileShell>
      <header className="flex items-center gap-3 px-5 pt-12 pb-4">
        {/* Drawer trigger — suhbatlar ro'yxati */}
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              aria-label="Suhbatlar"
              className="press grid size-11 place-items-center rounded-2xl bg-primary-soft text-primary"
            >
              <Menu className="size-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[88%] max-w-sm p-0">
            <SheetHeader className="px-5 pt-5 pb-3">
              <SheetTitle className="font-display text-[18px] tracking-tight">Suhbatlar</SheetTitle>
              <SheetDescription className="sr-only">
                Oldingi suhbatlaringizni ko'rish va yangi suhbat boshlash uchun ro'yxat.
              </SheetDescription>
            </SheetHeader>
            <div className="px-3 pb-2">
              <button
                type="button"
                onClick={startNewConversation}
                className="press w-full flex items-center gap-2.5 rounded-2xl bg-primary text-primary-foreground px-4 py-3 text-sm font-semibold shadow-glow"
              >
                <MessageSquarePlus className="size-4" /> Yangi suhbat
              </button>
            </div>
            <div className="px-3 pb-6 overflow-y-auto max-h-[calc(100vh-180px)] space-y-1">
              {conversations.isLoading && (
                <div className="flex justify-center py-6">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              )}
              {!conversations.isLoading && convList.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                  Hozircha suhbatlar yo'q. Birinchi savolingizni yozing.
                </p>
              )}
              {convList.map((c) => {
                const isActive = c.id === activeConvId;
                return (
                  <div
                    key={c.id}
                    role="button"
                    onClick={() => switchConversation(c)}
                    className={cn(
                      "press group flex items-start gap-2 rounded-2xl px-3 py-2.5 cursor-pointer transition-colors",
                      isActive
                        ? "bg-primary-soft ring-1 ring-primary/30"
                        : "hover:bg-muted/60",
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div
                        className={cn(
                          "text-[13.5px] font-semibold leading-snug truncate",
                          isActive ? "text-primary" : "text-foreground",
                        )}
                      >
                        {c.title}
                      </div>
                      <div className="text-[10.5px] text-muted-foreground tabular-nums mt-0.5">
                        {formatConvDate(c.updatedAt)}
                        {typeof c.messageCount === "number" && ` · ${c.messageCount} xabar`}
                      </div>
                    </div>
                    <SheetClose asChild>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(c, e)}
                        aria-label="Suhbatni o'chirish"
                        className="press shrink-0 grid size-7 place-items-center rounded-full text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-destructive-soft hover:text-destructive transition-opacity"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </SheetClose>
                  </div>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>

        <div className="grid size-11 place-items-center rounded-2xl bg-primary-soft">
          <Logomark className="h-7 w-7 text-primary" duotone={false} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {t("aiHelper")}
          </p>
          <h1 className="font-display text-[16px] leading-tight font-semibold tracking-tight truncate">
            {activeConvId
              ? convList.find((c) => c.id === activeConvId)?.title ?? t("aiAssistant")
              : "Yangi suhbat"}
          </h1>
        </div>
        <button
          type="button"
          onClick={startNewConversation}
          aria-label="Yangi suhbat"
          className="press grid size-9 place-items-center rounded-full bg-card shadow-xs hover:bg-muted/60"
        >
          <MessageSquarePlus className="size-4 text-primary" />
        </button>
      </header>

      <div className="px-5 pb-36 space-y-2.5" aria-live="polite">
        {chat.isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        )}
        {!chat.isLoading && msgs.length === 0 && !send.isPending && (
          <ChatEmptyState
            childName={child?.name}
            onPickPrompt={(prompt) => {
              setInput(prompt);
            }}
          />
        )}
        {msgs.map((m, idx) => {
          const isUser = m.from === "user";
          const prev = msgs[idx - 1];
          const groupStart = !prev || prev.from !== m.from;
          return (
            <div
              key={m.id}
              className={cn(
                "flex animate-in fade-in slide-in-from-bottom-1 duration-300",
                isUser ? "justify-end" : "justify-start",
                groupStart ? "mt-3 first:mt-0" : "mt-1",
              )}
              style={{ animationTimingFunction: "var(--ease-emphasized)" }}
            >
              {!isUser && isCreatorReply(m.text) ? (
                <CreatorCard />
              ) : (
                <div
                  className={cn(
                    "max-w-[82%] px-4 py-2.5 text-[14.5px] leading-relaxed shadow-xs",
                    isUser
                      ? cn(
                          "bg-primary text-primary-foreground rounded-[20px]",
                          groupStart ? "rounded-br-md" : "rounded-br-md rounded-tr-md",
                        )
                      : cn(
                          "bg-card text-foreground rounded-[20px] ring-1 ring-border/60",
                          groupStart ? "rounded-bl-md" : "rounded-bl-md rounded-tl-md",
                        ),
                  )}
                >
                  {m.text}
                </div>
              )}
            </div>
          );
        })}
        {send.isPending && (
          <div className="flex justify-start mt-3">
            <div className="rounded-[20px] rounded-bl-md bg-card px-4 py-3 ring-1 ring-border/60 shadow-xs">
              <span className="inline-flex gap-1 text-muted-foreground">
                <span className="size-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="size-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="size-1.5 bg-current rounded-full animate-bounce" />
              </span>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Composer */}
      <div className="fixed bottom-24 left-0 right-0 z-30 mx-auto max-w-md px-4 safe-bottom">
        <div className="flex items-center gap-1.5 rounded-full border border-border/60 bg-card/95 p-1.5 shadow-soft backdrop-blur-xl">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            placeholder={t("askSomething")}
            aria-label={t("send")}
            disabled={!child}
            className="flex-1 bg-transparent px-4 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
          />
          <button
            type="button"
            onClick={onSend}
            disabled={!input.trim() || send.isPending || !child}
            aria-label={t("send")}
            className="press grid size-10 place-items-center rounded-full bg-primary text-primary-foreground shadow-glow transition-opacity disabled:opacity-40 disabled:shadow-none"
          >
            {send.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" strokeWidth={2.25} />
            )}
          </button>
        </div>
      </div>
    </MobileShell>
  );
}

/**
 * Bo'sh suhbat ekrani — yangi suhbat boshlash uchun salomlash + bir nechta
 * tayyor savol takliflari. Tugma bosilganda input maydoniga matn yoziladi
 * (avtomatik yubormaydi — foydalanuvchi tahrir qilib yuborishi mumkin).
 */
const PROMPT_SUGGESTIONS = [
  "Bolam bir oydan beri implant bilan, qaysi mashqlardan boshlash kerak?",
  "Bola tovushlarga reaksiya bildirmayapti, nima qilay?",
  "Kunlik mashqlar uchun eng yaxshi vaqt qachon?",
  "Bola so'zlarni takrorlashga qiziqmayapti — yordam bering",
];

function ChatEmptyState({
  childName,
  onPickPrompt,
}: {
  childName?: string;
  onPickPrompt: (prompt: string) => void;
}) {
  return (
    <div className="flex flex-col items-center text-center px-4 pt-8 pb-4">
      <div className="grid size-16 place-items-center rounded-3xl bg-primary-soft text-primary mb-4 ring-1 ring-primary/15">
        <Sparkles className="size-7" strokeWidth={2} />
      </div>
      <h2 className="font-display text-[20px] font-semibold tracking-tight">
        {childName ? `Salom! ${childName} haqida nima so'ramoqchisiz?` : "Salom!"}
      </h2>
      <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground max-w-[28ch]">
        Eshitish-nutq rivojlanishi bo'yicha savollar bering — qisqa va amaliy
        maslahat beraman.
      </p>
      <div className="mt-5 w-full grid gap-2">
        {PROMPT_SUGGESTIONS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPickPrompt(p)}
            className="press text-left rounded-2xl bg-card px-4 py-3 text-[13px] leading-snug ring-1 ring-border/50 shadow-xs hover:bg-muted/40 transition-colors"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Suhbat sanasi — bugun "12:34", kecha "Kecha", boshqa kun "25 May" formatida. */
function formatConvDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (isToday) {
    return d.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate();
  if (isYesterday) return "Kecha";
  return d.toLocaleDateString("uz-UZ", { day: "numeric", month: "short" });
}

// ── "Kim seni yaratgan" javobi uchun maxsus boy karta ──────────────────
// Backend bu xabarni aniq prefiks bilan qaytaradi. Bu kartada:
//   1) Logo (yoki fallback ikon)
//   2) Qisqa matn
//   3) Aloqa tugmalari — tap bilan Telegram/qo'ng'iroq ochiladi
//
// Logo `public/yuksalish-logo.png` dan o'qiladi (foydalanuvchi qo'lda saqlashi
// kerak). Fayl topilmasa, Code2 ikon fallback.

type CreatorLink = {
  label: string;
  href: string;
  Icon: typeof TelegramIcon;
  tone: "primary" | "warm" | "accent" | "success";
};

const CREATOR_LINKS: CreatorLink[] = [
  {
    label: "Telegram (aloqa)",
    href: "https://t.me/Yuksalish_development",
    Icon: TelegramIcon,
    tone: "primary",
  },
  {
    label: "+998 88 463 81 00",
    href: "tel:+998884638100",
    Icon: Phone,
    tone: "success",
  },
  {
    label: "IT vakansiyalar kanali",
    href: "https://t.me/Yuksalishdev_ITjobs",
    Icon: TelegramIcon,
    tone: "accent",
  },
  {
    label: "Asosiy Telegram kanal",
    href: "https://t.me/yuksalish_dev",
    Icon: TelegramIcon,
    tone: "warm",
  },
];

const linkToneClasses: Record<CreatorLink["tone"], string> = {
  primary: "bg-primary-soft text-primary ring-primary/25 hover:bg-primary/15",
  accent: "bg-accent-soft text-accent-foreground ring-accent/30 hover:bg-accent/20",
  warm: "bg-warm-soft text-warm-foreground ring-warm/30 hover:bg-warm/20",
  success: "bg-success-soft text-success ring-success/30 hover:bg-success/15",
};

/**
 * Yuksalish.dev logosi. Fallback tartibi:
 *   1. `/Yuksalish-logo.jpeg` — foydalanuvchi qo'lda public/ ga saqlagan rasm (eng to'g'ri)
 *   2. `/yuksalish-logo.png` — boshqa nomdagi rasm (qo'shimcha variant)
 *   3. `/yuksalish-logo.svg` — repo ichidagi vektor versiya (har doim mavjud)
 */
const LOGO_FALLBACKS = [
  "/Yuksalish-logo.jpeg",
  "/yuksalish-logo.png",
  "/yuksalish-logo.svg",
];

function YuksalishLogo({ className }: { className?: string }) {
  const [idx, setIdx] = useState(0);
  const src = LOGO_FALLBACKS[idx];
  return (
    <img
      src={src}
      alt="Yuksalish.dev"
      draggable={false}
      className={cn(
        "size-24 rounded-2xl object-contain bg-white p-1.5 ring-1 ring-border/40 shadow-xs",
        className,
      )}
      onError={() => {
        if (idx < LOGO_FALLBACKS.length - 1) setIdx((i) => i + 1);
      }}
    />
  );
}

function CreatorCard() {
  return (
    <div className="max-w-[88%] rounded-[24px] bg-card p-5 shadow-soft ring-1 ring-border/60">
      {/* Logo */}
      <div className="flex items-center justify-center mb-3">
        <YuksalishLogo />
      </div>

      {/* Matn */}
      <p className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Mahsulot egasi
      </p>
      <h3 className="mt-1 text-center font-display text-[19px] font-semibold tracking-tight">
        Yuksalish.dev jamoasi
      </h3>
      <p className="mt-2 text-center text-[13px] leading-relaxed text-muted-foreground">
        2022-yildan beri IT bozorida — loyihalarni sifatli va professional
        bajaradi.
      </p>

      {/* Aloqa tugmalari — bir ustun, matn to'liq ko'rinadi */}
      <div className="mt-4 flex flex-col gap-2">
        {CREATOR_LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            target={link.href.startsWith("tel:") ? undefined : "_blank"}
            rel="noopener noreferrer"
            className={cn(
              "press flex items-center gap-2.5 rounded-2xl px-4 py-3 text-[13px] font-semibold ring-1 transition-colors",
              linkToneClasses[link.tone],
            )}
          >
            <link.Icon className="size-4 shrink-0" strokeWidth={2.25} />
            <span className="flex-1 min-w-0">{link.label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
