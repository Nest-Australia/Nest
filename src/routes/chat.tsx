import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/nest/Logo";
import { useNestStore, type ChatMessage } from "@/lib/nest/store";
import type { ProjectSummary } from "@/lib/nest/store";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Chat with Nest" },
      {
        name: "description",
        content:
          "Tell Nest what's happening around your home and get a clear next step.",
      },
      { property: "og:title", content: "Chat with Nest" },
      {
        property: "og:description",
        content: "Describe a home issue and Nest helps you plan the next step.",
      },
    ],
  }),
  component: ChatPage,
});

function ChatPage() {
  const navigate = useNavigate();
  const messages = useNestStore((s) => s.messages);
  const turnCount = useNestStore((s) => s.turnCount);
  const addMessage = useNestStore((s) => s.addMessage);
  const bumpTurn = useNestStore((s) => s.bumpTurn);
  const setSummary = useNestStore((s) => s.setSummary);

  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [summarising, setSummarising] = useState(false);
  const [readyForSummary, setReadyForSummary] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const initialRan = useRef(false);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, typing]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // If user landed via example seed, generate the first assistant follow-up.
  useEffect(() => {
    if (initialRan.current) return;
    initialRan.current = true;
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (lastUser && turnCount === 1) {
      void respond(messages);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const respond = async (history: ChatMessage[]) => {
    setTyping(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role, text: m.text })),
        }),
      });
      if (!res.ok) {
        const msg = await res.text();
        addMessage({
          role: "assistant",
          text: msg || "Sorry, I'm having trouble right now. Please try again.",
        });
        return;
      }
      const data = (await res.json()) as { reply: string; readyForSummary: boolean };
      addMessage({ role: "assistant", text: data.reply });
      setReadyForSummary(Boolean(data.readyForSummary));
    } catch {
      addMessage({
        role: "assistant",
        text: "Sorry, I couldn't reach the assistant. Please try again.",
      });
    } finally {
      setTyping(false);
      inputRef.current?.focus();
    }
  };

  const send = () => {
    const trimmed = input.trim();
    if (!trimmed || typing) return;
    const userMsg: ChatMessage = {
      id: `${Date.now()}-u`,
      role: "user",
      text: trimmed,
    };
    const nextHistory = [...messages, userMsg];
    addMessage({ role: "user", text: trimmed });
    setInput("");
    bumpTurn();
    void respond(nextHistory);
  };

  const onSummarise = async () => {
    if (summarising) return;
    setSummarising(true);
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages.map((m) => ({ role: m.role, text: m.text })),
        }),
      });
      if (!res.ok) {
        const msg = await res.text();
        addMessage({
          role: "assistant",
          text: msg || "I couldn't put the brief together. Mind trying again?",
        });
        return;
      }
      const summary = (await res.json()) as ProjectSummary;
      setSummary(summary);
      navigate({ to: "/summary" });
    } catch {
      addMessage({
        role: "assistant",
        text: "Sorry, I couldn't reach Nest to build the brief. Please try again.",
      });
    } finally {
      setSummarising(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border/70 bg-background/85 px-5 py-3 backdrop-blur">
        <Logo />
        <button
          onClick={() => navigate({ to: "/" })}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Close
        </button>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-5 pb-32 pt-6"
      >
        <div className="mx-auto flex max-w-xl flex-col gap-5">
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className={
                  m.role === "user"
                    ? "flex justify-end"
                    : "flex items-start gap-3"
                }
              >
                {m.role === "assistant" && (
                  <span className="mt-1 h-6 w-6 shrink-0 rounded-full bg-primary/90" />
                )}
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-[15px] leading-relaxed text-primary-foreground"
                      : "max-w-[90%] text-[16px] leading-relaxed text-foreground"
                  }
                >
                  {m.text}
                </div>
              </motion.div>
            ))}
            {typing && (
              <motion.div
                key="typing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-start gap-3"
              >
                <span className="mt-1 h-6 w-6 shrink-0 rounded-full bg-primary/90" />
                <div className="flex items-center gap-1.5 py-2">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="h-2 w-2 rounded-full bg-muted-foreground/50"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        delay: i * 0.18,
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {readyForSummary && !typing && (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={onSummarise}
              disabled={summarising}
              className="mt-2 self-start rounded-full border border-primary/30 bg-primary-soft px-4 py-2 text-sm font-medium text-primary hover:bg-primary/15 disabled:opacity-50"
            >
              {summarising ? "Preparing brief…" : "Yes, build the job brief →"}
            </motion.button>
          )}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-border/70 bg-background/95 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder="Describe what's happening…"
            className="max-h-32 min-h-[48px] flex-1 resize-none rounded-2xl border border-border bg-card px-4 py-3 text-[15px] text-foreground placeholder:text-muted-foreground/70 focus:border-primary/50 focus:outline-none"
          />
          <button
            onClick={send}
            disabled={!input.trim() || typing}
            aria-label="Send"
            className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5" />
              <path d="m5 12 7-7 7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
