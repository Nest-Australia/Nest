import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Logo } from "@/components/nest/Logo";

export const Route = createFileRoute("/unsubscribe")({
  head: () => ({
    meta: [
      { title: "Unsubscribe — Nest" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: UnsubscribePage,
});

type Status =
  | "loading"
  | "ready"
  | "already"
  | "invalid"
  | "submitting"
  | "done"
  | "error";

function UnsubscribePage() {
  const [status, setStatus] = useState<Status>("loading");
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("token");
    setToken(t);
    if (!t) {
      setStatus("invalid");
      return;
    }
    fetch(`/email/unsubscribe?token=${encodeURIComponent(t)}`)
      .then(async (r) => {
        if (!r.ok) {
          setStatus("invalid");
          return;
        }
        const data = await r.json();
        if (data.valid) setStatus("ready");
        else if (data.reason === "already_unsubscribed") setStatus("already");
        else setStatus("invalid");
      })
      .catch(() => setStatus("error"));
  }, []);

  const confirm = async () => {
    if (!token) return;
    setStatus("submitting");
    try {
      const r = await fetch("/email/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await r.json();
      if (data.success) setStatus("done");
      else if (data.reason === "already_unsubscribed") setStatus("already");
      else setStatus("error");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="min-h-dvh">
      <header className="px-5 pt-6">
        <Logo />
      </header>
      <main className="mx-auto max-w-md px-5 py-16 text-center">
        {status === "loading" && (
          <p className="text-muted-foreground">Checking your link…</p>
        )}
        {status === "ready" && (
          <>
            <h1 className="font-display text-2xl text-foreground">
              Unsubscribe from Nest emails?
            </h1>
            <p className="mt-3 text-muted-foreground">
              You won't receive any more emails from us at this address.
            </p>
            <button
              onClick={confirm}
              className="mt-6 inline-flex h-12 items-center justify-center rounded-2xl bg-primary px-6 text-sm font-semibold text-primary-foreground"
            >
              Confirm unsubscribe
            </button>
          </>
        )}
        {status === "submitting" && (
          <p className="text-muted-foreground">Updating your preferences…</p>
        )}
        {status === "done" && (
          <>
            <h1 className="font-display text-2xl text-foreground">
              You're unsubscribed
            </h1>
            <p className="mt-3 text-muted-foreground">
              We won't email you again. Thanks for trying Nest.
            </p>
          </>
        )}
        {status === "already" && (
          <>
            <h1 className="font-display text-2xl text-foreground">
              Already unsubscribed
            </h1>
            <p className="mt-3 text-muted-foreground">
              This address is no longer receiving Nest emails.
            </p>
          </>
        )}
        {status === "invalid" && (
          <>
            <h1 className="font-display text-2xl text-foreground">
              Invalid or expired link
            </h1>
            <p className="mt-3 text-muted-foreground">
              We couldn't verify this unsubscribe link.
            </p>
          </>
        )}
        {status === "error" && (
          <>
            <h1 className="font-display text-2xl text-foreground">
              Something went wrong
            </h1>
            <p className="mt-3 text-muted-foreground">
              Please try again in a moment.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
