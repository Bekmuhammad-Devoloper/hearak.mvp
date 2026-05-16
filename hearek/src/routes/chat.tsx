import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { useEffect, useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { useActiveChild, useChat, useSendChat } from "@/lib/queries";
import { toast } from "sonner";
import { Logomark } from "@/components/brand-icons";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/chat")({ component: Chat });

function Chat() {
  const { child } = useActiveChild();
  const chat = useChat(child?.id);
  const send = useSendChat(child?.id);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const t = useT();

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chat.data?.messages?.length]);

  const onSend = async () => {
    const text = input.trim();
    if (!text || !child || send.isPending) return;
    setInput("");
    try {
      await send.mutateAsync(text);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Yuborilmadi");
      setInput(text);
    }
  };

  const msgs = chat.data?.messages ?? [];

  return (
    <MobileShell>
      <header className="flex items-center gap-3 px-5 pt-12 pb-4">
        <div className="grid size-11 place-items-center rounded-2xl bg-primary-soft">
          <Logomark className="h-7 w-7 text-primary" duotone={false} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {t("aiHelper")}
          </p>
          <h1 className="font-display text-[19px] leading-tight font-semibold tracking-tight">
            {t("aiAssistant")}
          </h1>
        </div>
        <span className="relative grid place-items-center">
          <span className="absolute size-2 rounded-full bg-success/40 animate-ping" />
          <span className="relative size-2 rounded-full bg-success" />
        </span>
      </header>

      <div className="px-5 pb-36 space-y-2.5" aria-live="polite">
        {chat.isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
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
