import { createFileRoute } from "@tanstack/react-router";
import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { z } from "zod";

const SYSTEM_PROMPT = `You are Nest, a warm, concise AI assistant helping a homeowner think through a home repair, maintenance task, or project.

Each turn, ask ONE highly relevant follow-up question, tailored to exactly what the user has already shared. Useful angles (pick the most relevant one still missing): exact location/fixture, how long it's been happening, severity or safety risk, when it started or what changed, age of the appliance/system, what they've already tried, dimensions, materials, budget or timing.

Rules:
- 1-2 short sentences. Friendly, plain language. No lists, no markdown, no preamble.
- Never repeat a question that's already been answered.
- Once you have a reasonable picture (typically after 3-4 user messages), instead of asking another question, warmly offer to put together a project summary, and END your reply with the exact token [READY].
- Otherwise do NOT include [READY].`;

const BodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        text: z.string().min(1).max(4000),
      }),
    )
    .min(1)
    .max(40),
});

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }
        const parsed = BodySchema.safeParse(body);
        if (!parsed.success) return new Response("Invalid request", { status: 400 });

        const key = process.env.ANTHROPIC_API_KEY;
        if (!key) return new Response("Missing ANTHROPIC_API_KEY", { status: 500 });

        const anthropic = createAnthropic({ apiKey: key });
        const model = anthropic("claude-sonnet-4-5-20250929");

        try {
          const { text } = await generateText({
            model,
            system: SYSTEM_PROMPT,
            messages: parsed.data.messages.map((m) => ({
              role: m.role,
              content: m.text,
            })),
          });

          const readyForSummary = /\[READY\]/i.test(text);
          const reply = text.replace(/\[READY\]/gi, "").trim();

          return Response.json({ reply, readyForSummary });
        } catch (err) {
          const status = (err as { statusCode?: number })?.statusCode;
          if (status === 429) {
            return new Response("Rate limit reached. Please try again shortly.", { status: 429 });
          }
          if (status === 402) {
            return new Response("AI credits exhausted. Please add credits in Settings.", {
              status: 402,
            });
          }
          console.error("chat route error", err);
          return new Response("Something went wrong reaching the assistant.", { status: 500 });
        }
      },
    },
  },
});

