
## Nest — MVP Plan

A mobile-first, light-mode, premium consumer web app with a linear 5-screen flow. No backend, no auth, no persistence — all state lives in memory for this MVP. AI responses are simulated with scripted logic. Built on the existing TanStack Start + Tailwind v4 + shadcn stack.

## Screens & Routes

```
/                  Landing page (hero + example cards + CTA)
/chat              Conversational intake with Nest
/summary           Project summary card + "Help me find a professional"
/contact           Contact form (name, email, phone, postcode)
/success           Confirmation + "Start another project"
```

Each route gets its own `head()` with unique title/description/og tags. Flow state (chat transcript, derived summary, contact details) is held in a lightweight in-memory store so navigating between screens preserves context within a session; refreshing resets — acceptable for MVP.

## Design System

Update `src/styles.css` tokens (light mode only, no `.dark` work needed for MVP):

- `--background`: warm white (~oklch(0.985 0.005 85))
- `--foreground`: soft charcoal (~oklch(0.25 0.01 270))
- `--primary`: muted purple (~oklch(0.55 0.12 295)) + `--primary-foreground` warm white
- `--muted`, `--border`: subtle warm greys
- `--radius`: 1rem for soft rounded corners
- Typography: pair a refined display (e.g. Fraunces or Instrument Serif for headline accents) with Inter/Geist for body — loaded via Google Fonts in `__root.tsx` head.

Generous whitespace, max-width ~520px content column centered, large touch targets, calm motion (subtle fade/slide via Framer Motion on screen transitions and chat bubbles).

## Screen Details

**1. Landing (`/`)**
- Centered hero: small Nest wordmark, headline ("From repairs to renovations, Nest helps you get it done."), subheading, large purple primary CTA "Get Started" → `/chat`, supporting microcopy.
- Three example cards below in a vertical stack on mobile (grid on larger screens): "Fix a leaking tap", "Repair my air conditioner", "Build a new deck". Tapping a card routes to `/chat` and pre-seeds the first user message.

**2. Chat (`/chat`)**
- Header: small "Nest" mark + subtle back/close.
- Conversation area: assistant and user bubbles (assistant has no bubble background per chat contract — plain text on warm white with subtle avatar dot; user messages in a soft purple-tinted bubble with high-contrast charcoal text).
- Opening assistant message: "Hi, I'm Nest. Tell me what's happening around your home and I'll help you figure out the next step."
- Sticky bottom composer: rounded textarea + send button (purple, icon-only, fixed-size).
- Typing indicator (animated three dots) while simulated response is "thinking".
- Smooth auto-scroll to latest message; textarea stays focused.
- Simulated AI logic: a small scripted state machine that asks 2–3 follow-ups (e.g. "How long has this been happening?", "Is it getting worse?", "Any photos or extra detail?") regardless of input, then surfaces a "Ready to summarise?" affordance → routes to `/summary`. Keyword matching against a small dictionary (tap/leak → Plumbing, AC/heater → HVAC, deck/pergola/paint → Renovation, ceiling/crack → Structural, etc.) drives the summary inference.

**3. Summary (`/summary`)**
- Single elegant card with labeled rows: Issue, Category, Priority (Low/Medium/High inferred), Suggested Next Step.
- Derived from chat state; falls back to sensible defaults if user landed here directly.
- Primary CTA: "Help Me Find a Professional" → `/contact`. Secondary text link: "Keep chatting" → `/chat`.

**4. Contact (`/contact`)**
- Form with Name, Email, Phone, Postcode using shadcn `Input` + `Label` + `react-hook-form` + `zod` validation (already available patterns).
- Copy block above form.
- Submit button stores submission in the in-memory store + console.log for now, then routes to `/success`. Clear TODO comment marking the Supabase insertion point.

**5. Success (`/success`)**
- Centered checkmark/illustration (simple SVG, no Sparkles), "You're all set." headline, body copy, "Start Another Project" button that resets the in-memory store and routes to `/`.

## Technical Notes

- New deps: `framer-motion` for transitions, `react-hook-form` + `@hookform/resolvers` + `zod` if not present.
- State: a single `useNestStore` (Zustand or a plain React context with reducer — Zustand is lighter and fits this scope). Holds `messages`, `summary`, `contact`, plus `reset()`.
- File layout:
  ```
  src/routes/index.tsx           Landing
  src/routes/chat.tsx            Chat
  src/routes/summary.tsx         Summary
  src/routes/contact.tsx         Contact form
  src/routes/success.tsx         Success
  src/components/nest/           Hero, ExampleCard, ChatBubble, Composer, TypingDots, SummaryCard, Logo
  src/lib/nest/store.ts          Zustand store
  src/lib/nest/simulate.ts       Scripted assistant + categorisation
  ```
- Replace placeholder index. Each route sets distinct meta. No Supabase enabled in this pass — the prompt says "prepare for later", which I'll interpret as keeping data shapes clean and isolated in the store with a clearly marked persistence boundary.
- Light mode forced (no theme toggle); `<html>` never gets `.dark`.
- Preview viewport set to mobile during build for accurate visual review.

## Out of Scope (per brief)

Auth, accounts, payments, scheduling, messaging, marketplace, real AI calls, persistence, dark mode, dashboards, side nav.
