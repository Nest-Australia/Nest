import { createFileRoute } from "@tanstack/react-router";
import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { z } from "zod";


const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  text: z.string().min(1).max(4000),
});

const SummarySchema = z.object({
  title: z.string().min(1).max(120),
  category: z.string().min(1).max(60),
  overview: z.string().min(1).max(800),
  scopeOfWork: z.array(z.string().min(1).max(300)).max(12),
  keyDetails: z
    .array(
      z.object({
        label: z.string().min(1).max(60),
        value: z.string().min(1).max(300),
      }),
    )
    .max(12),
  accessAndLocation: z.string().max(400),
  timing: z.string().max(300),
  additionalNotes: z.string().max(500),
  openQuestions: z.array(z.string().min(1).max(300)).max(8),
});



const BodySchema = z.object({
  messages: z.array(MessageSchema).min(1).max(40),
  previous: SummarySchema.partial().optional(),
  refinement: z.string().max(500).optional(),
});

const SYSTEM_PROMPT = `You convert a homeowner's conversation with an assistant into a structured job brief that a tradesperson can quote from.

Be specific, factual, and only use information present in the conversation. Do NOT invent details (no fake brands, dimensions, ages, or prices). If something important is missing, leave it vague and add it to openQuestions instead.

Write in clear plain English, no marketing language, no emojis. Bullet items should be short and concrete. Aim for a brief that gives a tradesperson enough context to decide whether to quote and what to ask.`;

export const Route = createFileRoute("/api/summarize")({
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

        const transcript = parsed.data.messages
          .map((m) => `${m.role === "user" ? "Homeowner" : "Assistant"}: ${m.text}`)
          .join("\n");

        const promptParts = [
          `Conversation transcript:\n${transcript}`,
        ];
        if (parsed.data.previous) {
          promptParts.push(
            `\nThe homeowner has already reviewed this draft brief:\n${JSON.stringify(parsed.data.previous, null, 2)}`,
          );
        }
        if (parsed.data.refinement?.trim()) {
          promptParts.push(
            `\nThe homeowner asked you to update the brief with this instruction:\n"${parsed.data.refinement.trim()}"\n\nApply the instruction faithfully. Keep everything else intact unless the instruction implies a change.`,
          );
        }
        promptParts.push(
          `\nReturn ONLY a JSON object (no markdown, no code fences, no commentary) with EXACTLY these keys and types:
{
  "title": string,
  "category": string,
  "overview": string,
  "scopeOfWork": string[],
  "keyDetails": { "label": string, "value": string }[],
  "accessAndLocation": string,
  "timing": string,
  "additionalNotes": string,
  "openQuestions": string[]
}
Use the exact key names above. Use "" for unknown strings and [] for unknown arrays. Do not add or rename keys.`,
        );

        try {
          const { text } = await generateText({
            model,
            system: SYSTEM_PROMPT,
            prompt: promptParts.join("\n"),
          });
          const cleaned = text
            .trim()
            .replace(/^```(?:json)?\s*/i, "")
            .replace(/```$/i, "")
            .trim();
          let raw: unknown;
          try {
            raw = JSON.parse(cleaned);
          } catch {
            console.error("summarize: invalid JSON from model", cleaned.slice(0, 500));
            return new Response("The assistant returned an unexpected response. Please try again.", { status: 502 });
          }
          const validated = SummarySchema.safeParse(raw);
          if (!validated.success) {
            console.error("summarize: schema mismatch", validated.error.issues);
            return new Response("The assistant returned an unexpected response. Please try again.", { status: 502 });
          }
          return Response.json(validated.data);

        } catch (err) {
          const status = (err as { statusCode?: number })?.statusCode;
          if (status === 429) return new Response("Rate limit reached. Please try again shortly.", { status: 429 });
          if (status === 402) return new Response("AI credits exhausted. Please add credits in Settings.", { status: 402 });
          console.error("summarize route error", err);
          return new Response("Couldn't generate the job brief.", { status: 500 });
        }
      },
    },
  },
});
