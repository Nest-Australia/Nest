import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/debug-env")({
  server: {
    handlers: {
      GET: async () => {
        const keys = Object.keys(process.env).sort();
        const rawEnv = (globalThis as Record<string, unknown>).__env__ as
          | Record<string, unknown>
          | undefined;
        const rawKeys = rawEnv ? Object.keys(rawEnv).sort() : null;
        return Response.json({
          hasAnthropicKey: Boolean(process.env.ANTHROPIC_API_KEY),
          anthropicKeyLength: process.env.ANTHROPIC_API_KEY?.length ?? 0,
          envKeys: keys,
          rawEnvKeys: rawKeys,
          rawHasAnthropicKey: Boolean(rawEnv?.ANTHROPIC_API_KEY),
        });
      },
    },
  },
});
