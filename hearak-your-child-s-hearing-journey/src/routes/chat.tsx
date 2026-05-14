import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { useEffect, useRef, useState } from "react";
import { Loader2, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useActiveChild, useChat, useSendChat } from "@/lib/queries";
import { toast } from "sonner";

export const Route = createFileRoute("/chat")({ component: Chat });

function Chat() {
  const { child } = useActiveChild();
  const chat = useChat(child?.id);
  const send = useSendChat(child?.id);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

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
      <div className="px-5 pt-10 pb-4 flex items-center gap-3">
        <div className="size-10 rounded-2xl bg-primary-soft flex items-center justify-center">
          <Sparkles className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="font-display text-xl font-semibold">Hearak yordamchisi</h1>
          <p className="text-xs text-muted-foreground">Doim yoningizda</p>
        </div>
      </div>

      <div className="px-5 space-y-3 pb-32" aria-live="polite">
        {chat.isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        )}
        {msgs.map((m) => (
          <div key={m.id} className={cn("flex", m.from === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[85%] px-4 py-3 rounded-3xl text-sm leading-relaxed shadow-card",
                m.from === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-card rounded-bl-md",
              )}
            >
              {m.text}
            </div>
          </div>
        ))}
        {send.isPending && (
          <div className="flex justify-start">
            <div className="bg-card rounded-3xl rounded-bl-md px-4 py-3 shadow-card text-sm text-muted-foreground">
              <span className="inline-flex gap-1">
                <span className="size-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="size-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="size-1.5 bg-current rounded-full animate-bounce" />
              </span>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <div className="fixed bottom-20 left-0 right-0 mx-auto max-w-md px-4">
        <div className="flex gap-2 bg-card border border-border rounded-full p-1.5 shadow-soft">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            placeholder="Biror narsa so'rang..."
            aria-label="Xabar matni"
            disabled={!child}
            className="flex-1 bg-transparent px-4 outline-none text-sm disabled:opacity-50"
          />
          <button
            type="button"
            onClick={onSend}
            disabled={!input.trim() || send.isPending || !child}
            aria-label="Yuborish"
            className="size-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50"
          >
            <Send className="size-4" />
          </button>
        </div>
      </div>
    </MobileShell>
  );
}
