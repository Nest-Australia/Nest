import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { Logo } from "@/components/nest/Logo";
import { useNestStore, type ProjectSummary } from "@/lib/nest/store";

export const Route = createFileRoute("/summary")({
  head: () => ({
    meta: [
      { title: "Your job brief — Nest" },
      {
        name: "description",
        content: "Review and refine the job brief Nest prepared from your conversation.",
      },
      { property: "og:title", content: "Your job brief — Nest" },
      {
        property: "og:description",
        content: "A structured job brief ready to share with a tradesperson.",
      },
    ],
  }),
  component: SummaryPage,
});

const FALLBACK: ProjectSummary = {
  title: "Home project",
  category: "General",
  overview:
    "We don't have enough information yet to write a full brief. Keep chatting with Nest so we can capture the detail a tradesperson would need.",
  scopeOfWork: ["To be confirmed with homeowner"],
  keyDetails: [{ label: "Status", value: "Awaiting more details" }],
  accessAndLocation: "To be confirmed with homeowner",
  timing: "Flexible — to be confirmed with homeowner",
  additionalNotes: "",
  openQuestions: [],
};

function SummaryPage() {
  const navigate = useNavigate();
  const stored = useNestStore((s) => s.summary);
  const setSummary = useNestStore((s) => s.setSummary);
  

  const [draft, setDraft] = useState<ProjectSummary>(stored ?? FALLBACK);
  const [editing, setEditing] = useState(false);

  const update = <K extends keyof ProjectSummary>(key: K, value: ProjectSummary[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));




  const confirmAndContinue = () => {
    setSummary(draft);
    navigate({ to: "/contact" });
  };

  return (
    <div className="min-h-dvh pb-16">
      <header className="flex items-center justify-between px-5 pt-6">
        <Logo />
        <Link to="/chat" className="text-sm text-muted-foreground hover:text-foreground">
          Keep chatting
        </Link>
      </header>

      <main className="mx-auto max-w-xl px-5 pt-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Job brief
          </span>
          <h1 className="font-display mt-3 text-3xl tracking-tight text-foreground sm:text-4xl">
            Review the brief.
          </h1>
          <p className="mt-3 text-muted-foreground">
            Nest drafted this from your conversation. Tweak anything that's off, then we'll share it with the right pro.
          </p>
        </motion.div>


        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08 }}
          className="mt-6 overflow-hidden rounded-3xl border border-border bg-card shadow-[0_20px_60px_-30px_oklch(0.26_0.012_280/0.25)]"
        >
          <div className="flex items-start justify-between gap-3 border-b border-border/70 px-6 py-5">
            <div className="flex-1">
              {editing ? (
                <input
                  value={draft.title}
                  onChange={(e) => update("title", e.target.value)}
                  className="w-full bg-transparent text-lg font-semibold text-foreground focus:outline-none"
                />
              ) : (
                <h2 className="text-lg font-semibold text-foreground">{draft.title}</h2>
              )}
              {editing ? (
                <input
                  value={draft.category}
                  onChange={(e) => update("category", e.target.value)}
                  className="mt-1 w-full bg-transparent text-sm text-muted-foreground focus:outline-none"
                />
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">{draft.category}</p>
              )}
            </div>
          </div>

          <Section label="Overview">
            <EditableText
              editing={editing}
              value={draft.overview}
              onChange={(v) => update("overview", v)}
              rows={4}
            />
          </Section>

          <Section label="Scope of work">
            <EditableList
              editing={editing}
              items={draft.scopeOfWork}
              onChange={(items) => update("scopeOfWork", items)}
              placeholder="Add a task…"
            />
          </Section>

          <Section label="Key details">
            {editing ? (
              <div className="flex flex-col gap-2">
                {draft.keyDetails.map((d, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      value={d.label}
                      onChange={(e) => {
                        const next = [...draft.keyDetails];
                        next[i] = { ...next[i], label: e.target.value };
                        update("keyDetails", next);
                      }}
                      className="w-1/3 rounded-md border border-border bg-background px-2 py-1.5 text-sm focus:border-primary/50 focus:outline-none"
                    />
                    <input
                      value={d.value}
                      onChange={(e) => {
                        const next = [...draft.keyDetails];
                        next[i] = { ...next[i], value: e.target.value };
                        update("keyDetails", next);
                      }}
                      className="flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm focus:border-primary/50 focus:outline-none"
                    />
                    <button
                      onClick={() => update("keyDetails", draft.keyDetails.filter((_, j) => j !== i))}
                      className="text-xs text-muted-foreground hover:text-foreground"
                      aria-label="Remove"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => update("keyDetails", [...draft.keyDetails, { label: "", value: "" }])}
                  className="self-start text-sm font-medium text-primary hover:underline"
                >
                  + Add detail
                </button>
              </div>
            ) : (
              <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 text-[15px]">
                {draft.keyDetails.map((d, i) => (
                  <div key={i} className="contents">
                    <dt className="text-muted-foreground">{d.label}</dt>
                    <dd className="text-foreground/90">{d.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </Section>

          <Section label="Access & location">
            <EditableText
              editing={editing}
              value={draft.accessAndLocation}
              onChange={(v) => update("accessAndLocation", v)}
              rows={2}
            />
          </Section>

          <Section label="Timing">
            <EditableText
              editing={editing}
              value={draft.timing}
              onChange={(v) => update("timing", v)}
              rows={2}
            />
          </Section>

          {(editing || draft.additionalNotes) && (
            <Section label="Additional notes">
              <EditableText
                editing={editing}
                value={draft.additionalNotes}
                onChange={(v) => update("additionalNotes", v)}
                rows={2}
                placeholder="Anything else worth mentioning…"
              />
            </Section>
          )}

          {(editing || draft.openQuestions.length > 0) && (
            <Section label="To confirm with homeowner" last>
              <EditableList
                editing={editing}
                items={draft.openQuestions}
                onChange={(items) => update("openQuestions", items)}
                placeholder="Add a question…"
                emptyText="Nothing outstanding — ready to quote."
              />
            </Section>
          )}
        </motion.section>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.16 }}
          className="mt-6 flex justify-end"
        >
          <button
            onClick={() => setEditing((e) => !e)}
            className="text-sm font-medium text-primary hover:underline"
          >
            {editing ? "Done editing" : "Edit details"}
          </button>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.22 }}
          onClick={confirmAndContinue}
          className="mt-4 inline-flex h-14 w-full items-center justify-center rounded-2xl bg-primary px-6 text-base font-semibold text-primary-foreground shadow-[0_10px_30px_-12px_oklch(0.52_0.115_295/0.45)] transition-transform active:scale-[0.99]"
        >
          Looks good — find me a pro
        </motion.button>

      </main>
    </div>
  );
}

function Section({
  label,
  children,
  last,
}: {
  label: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-2 px-6 py-5 ${last ? "" : "border-b border-border/70"}`}>
      <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      <div className="text-[15px] leading-relaxed text-foreground/90">{children}</div>
    </div>
  );
}

function EditableText({
  editing,
  value,
  onChange,
  rows = 2,
  placeholder,
}: {
  editing: boolean;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  if (editing) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full resize-none rounded-md border border-border bg-background px-2 py-1.5 text-[15px] focus:border-primary/50 focus:outline-none"
      />
    );
  }
  return <p className="whitespace-pre-wrap">{value || <span className="text-muted-foreground">—</span>}</p>;
}

function EditableList({
  editing,
  items,
  onChange,
  placeholder,
  emptyText,
}: {
  editing: boolean;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  emptyText?: string;
}) {
  if (editing) {
    return (
      <div className="flex flex-col gap-2">
        {items.map((it, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={it}
              onChange={(e) => {
                const next = [...items];
                next[i] = e.target.value;
                onChange(next);
              }}
              className="flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm focus:border-primary/50 focus:outline-none"
            />
            <button
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="text-xs text-muted-foreground hover:text-foreground"
              aria-label="Remove"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          onClick={() => onChange([...items, ""])}
          className="self-start text-sm font-medium text-primary hover:underline"
        >
          + {placeholder ?? "Add item"}
        </button>
      </div>
    );
  }
  if (items.length === 0) {
    return <p className="text-muted-foreground">{emptyText ?? "—"}</p>;
  }
  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((it, i) => (
        <li key={i} className="flex gap-2">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}
