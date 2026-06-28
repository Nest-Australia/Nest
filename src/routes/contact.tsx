import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Logo } from "@/components/nest/Logo";
import { AddressAutocomplete } from "@/components/nest/AddressAutocomplete";
import { useNestStore, type ContactDetails } from "@/lib/nest/store";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Get connected — Nest" },
      {
        name: "description",
        content: "Leave your details and Nest will connect you with the right professional.",
      },
      { property: "og:title", content: "Get connected — Nest" },
      {
        property: "og:description",
        content: "A few quick details and we'll match you with a trusted pro.",
      },
    ],
  }),
  component: ContactPage,
});

const schema = z.object({
  name: z.string().min(2, "Please enter your name"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(6, "Enter a valid phone number"),
  address: z.string().min(5, "Enter your address"),
});

type FormValues = z.infer<typeof schema>;

function ContactPage() {
  const navigate = useNavigate();
  const setContact = useNestStore((s) => s.setContact);
  const summary = useNestStore((s) => s.summary);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { address: "" } });
  const addressValue = watch("address") ?? "";

  const onSubmit = async (values: FormValues) => {
    const payload: ContactDetails = values;
    setContact(payload);

    try {
      const res = await fetch("/api/public/submit-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact: payload, summary: summary ?? {} }),
      });
      if (!res.ok) {
        console.error("submit-request failed", res.status, await res.text());
      }
    } catch (err) {
      console.error("submit-request error", err);
    }

    navigate({ to: "/success" });
  };

  return (
    <div className="min-h-dvh">
      <header className="flex items-center justify-between px-5 pt-6">
        <Logo />
        <button
          onClick={() => navigate({ to: "/summary" })}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Back
        </button>
      </header>

      <main className="mx-auto max-w-xl px-5 pb-16 pt-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-display text-3xl tracking-tight text-foreground sm:text-4xl">
            Let's get you connected.
          </h1>
          <p className="mt-3 text-muted-foreground">
            Leave your details and we'll help connect you with the right professional.
          </p>
        </motion.div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 flex flex-col gap-4">
          <Field label="Name" error={errors.name?.message}>
            <input
              {...register("name")}
              autoComplete="name"
              placeholder="Alex Morgan"
              className="input-base"
            />
          </Field>
          <Field label="Email" error={errors.email?.message}>
            <input
              {...register("email")}
              type="email"
              autoComplete="email"
              placeholder="you@email.com"
              className="input-base"
            />
          </Field>
          <Field label="Phone number" error={errors.phone?.message}>
            <input
              {...register("phone")}
              type="tel"
              autoComplete="tel"
              placeholder="0400 000 000"
              className="input-base"
            />
          </Field>
          <Field label="Address" error={errors.address?.message}>
            <input type="hidden" {...register("address")} />
            <AddressAutocomplete
              value={addressValue}
              onChange={(v) =>
                setValue("address", v, { shouldValidate: true, shouldDirty: true })
              }
              placeholder="Start typing your address…"
              className="input-base"
            />
          </Field>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-4 inline-flex h-14 items-center justify-center rounded-2xl bg-primary px-6 text-base font-semibold text-primary-foreground shadow-[0_10px_30px_-12px_oklch(0.52_0.115_295/0.45)] transition-opacity disabled:opacity-60"
          >
            {isSubmitting ? "Sending…" : "Submit Request"}
          </button>
          <p className="text-center text-xs text-muted-foreground">
            We'll only use these details to connect you with a professional.
          </p>
        </form>
      </main>

      <style>{`
        .input-base {
          width: 100%;
          height: 52px;
          border-radius: 1rem;
          border: 1px solid var(--color-border);
          background: var(--color-card);
          padding: 0 1rem;
          font-size: 15px;
          color: var(--color-foreground);
          transition: border-color 0.15s ease;
        }
        .input-base::placeholder { color: oklch(0.65 0.015 280); }
        .input-base:focus { outline: none; border-color: color-mix(in oklab, var(--color-primary) 55%, transparent); }
      `}</style>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </label>
  );
}
