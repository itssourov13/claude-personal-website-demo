"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import Spinner from "@/components/ui/Spinner";
import Textarea from "@/components/ui/Textarea";
import { contactFormSchema, type ContactFormInput } from "@/lib/schema";

type SubmitState = "idle" | "submitting" | "success" | "error";

export default function ContactForm() {
  const [renderedAt, setRenderedAt] = useState(0);
  const [state, setState] = useState<SubmitState>("idle");
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => setRenderedAt(Date.now()), []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormInput>({
    resolver: zodResolver(contactFormSchema),
  });

  async function onSubmit(values: ContactFormInput) {
    setState("submitting");
    setServerError(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, renderedAt }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        throw new Error(
          body?.message ?? "Something went wrong. Please try again.",
        );
      }

      setState("success");
      reset();
    } catch (error) {
      setState("error");
      setServerError(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    }
  }

  if (state === "success") {
    return (
      <p role="status" className="text-success text-lg">
        Thanks — that&apos;s sent. I&apos;ll get back to you within two business
        days.
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-5"
    >
      {/* Honeypot — hidden from sighted/keyboard users, visible to bots that
          fill every field. Real users never see or touch this. */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label htmlFor="company">Company</label>
        <input
          id="company"
          tabIndex={-1}
          autoComplete="off"
          {...register("company")}
        />
      </div>

      <Field label="Name" htmlFor="name" error={errors.name?.message}>
        <Input id="name" autoComplete="name" {...register("name")} />
      </Field>

      <Field label="Email" htmlFor="email" error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          {...register("email")}
        />
      </Field>

      <Field label="Budget (optional)" htmlFor="budget">
        <Input
          id="budget"
          placeholder="e.g. $10k–20k"
          {...register("budget")}
        />
      </Field>

      <Field
        label="Project details"
        htmlFor="message"
        error={errors.message?.message}
      >
        <Textarea id="message" {...register("message")} />
      </Field>

      {serverError ? (
        <p role="alert" className="text-danger text-sm">
          {serverError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={state === "submitting"}
        className="bg-accent hover:bg-accent-strong flex min-h-11 items-center justify-center gap-2 rounded-full px-6 py-3 font-medium text-white disabled:opacity-60"
      >
        {state === "submitting" ? <Spinner /> : null}
        {state === "submitting" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
