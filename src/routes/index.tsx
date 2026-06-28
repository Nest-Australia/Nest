import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Logo } from "@/components/nest/Logo";
import { useNestStore } from "@/lib/nest/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nest — From repairs to renovations" },
      {
        name: "description",
        content:
          "Describe a home problem, maintenance task or project. Nest helps you understand what to do next and connects you with the right professional.",
      },
      { property: "og:title", content: "Nest — Help for every home project" },
      {
        property: "og:description",
        content: "From repairs to renovations, Nest helps you get it done.",
      },
    ],
  }),
  component: Landing,
});

const EXAMPLES = [
  { label: "My tap's leaking", hint: "Plumbing" },
  { label: "My AC isn't working", hint: "HVAC" },
  { label: "I want a new deck", hint: "Outdoor" },
];

function Landing() {
  const navigate = useNavigate();
  const reset = useNestStore((s) => s.reset);
  const seed = useNestStore((s) => s.seedUserMessage);

  const startWith = (text?: string) => {
    reset();
    if (text) seed(text);
    navigate({ to: "/chat" });
  };

  return (
    <div className="min-h-dvh">
      <header className="px-5 pt-6">
        <Logo />
      </header>

      <main className="mx-auto flex max-w-xl flex-col px-5 pb-16 pt-10">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col"
        >
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Help for every home
          </span>
          <h1 className="font-display mt-4 text-[2.4rem] leading-[1.05] tracking-tight text-foreground sm:text-5xl">
            From leaky taps to full renos,{" "}
            <span className="text-primary">we'll sort it.</span>
          </h1>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Tell us what's going on and we'll figure out the next step — then
            connect you with the right person for the job.
          </p>

          <button
            onClick={() => startWith()}
            className="mt-8 inline-flex h-14 items-center justify-center rounded-2xl bg-primary px-6 text-base font-semibold text-primary-foreground shadow-[0_10px_30px_-12px_oklch(0.52_0.115_295/0.45)] transition-transform active:scale-[0.98]"
          >
            Get Started
          </button>
          <p className="mt-3 text-center text-sm text-muted-foreground">
            Taps, AC, decks, paint jobs — whatever needs doing.
          </p>
        </motion.section>

        <section className="mt-14">
          <h2 className="text-sm font-medium text-muted-foreground">
            Or try an example
          </h2>
          <div className="mt-3 flex flex-col gap-3">
            {EXAMPLES.map((ex, i) => (
              <motion.button
                key={ex.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.07, duration: 0.45 }}
                onClick={() => startWith(ex.label)}
                className="group flex items-center justify-between rounded-2xl border border-border bg-card px-5 py-4 text-left transition-colors hover:border-primary/40 hover:bg-accent/40"
              >
                <span className="flex flex-col">
                  <span className="font-medium text-foreground">{ex.label}</span>
                  <span className="text-xs text-muted-foreground">{ex.hint}</span>
                </span>
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="m13 6 6 6-6 6" />
                </svg>
              </motion.button>
            ))}
          </div>
        </section>

        <footer className="mt-16 text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">
            Help for every home.
          </Link>
        </footer>
      </main>
    </div>
  );
}
