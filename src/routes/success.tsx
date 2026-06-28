import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Logo } from "@/components/nest/Logo";
import { useNestStore } from "@/lib/nest/store";

export const Route = createFileRoute("/success")({
  head: () => ({
    meta: [
      { title: "Request received — Nest" },
      { name: "description", content: "Your request has been received. Nest will be in touch soon." },
      { property: "og:title", content: "Request received — Nest" },
      { property: "og:description", content: "Thanks — we'll be in touch shortly." },
    ],
  }),
  component: SuccessPage,
});

function SuccessPage() {
  const navigate = useNavigate();
  const reset = useNestStore((s) => s.reset);

  const startAnother = () => {
    reset();
    navigate({ to: "/" });
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="px-5 pt-6">
        <Logo />
      </header>

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-5 py-12 text-center">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="grid h-20 w-20 place-items-center rounded-full bg-primary-soft text-primary"
        >
          <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12.5 10 18.5 20 6.5" />
          </svg>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="font-display mt-7 text-3xl tracking-tight text-foreground sm:text-4xl"
        >
          You're all set.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="mt-3 max-w-sm text-muted-foreground"
        >
          Thanks. We'll review your request and be in touch soon.
        </motion.p>

        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          onClick={startAnother}
          className="mt-10 inline-flex h-14 items-center justify-center rounded-2xl bg-primary px-6 text-base font-semibold text-primary-foreground shadow-[0_10px_30px_-12px_oklch(0.52_0.115_295/0.45)] transition-transform active:scale-[0.98]"
        >
          Start Another Project
        </motion.button>
      </main>
    </div>
  );
}
