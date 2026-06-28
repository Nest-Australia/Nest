import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/debug-env")({
  server: {
    handlers: {
      GET: async () => {
        const keys = Object.keys(process.env).sort();
        return Response.json({
          hasAnthropicKey: Boolean(process.env.ANTHROPIC_API_KEY),
          anthropicKeyLength: process.env.ANTHROPIC_API_KEY?.length ?? 0,
          envKeys: keys,
        });
      },
    },
  },
});
