import { z } from "zod";

export const outcomeSchema = z.object({
  label: z.string(),
  value: z.string(),
  suffix: z.string().optional().default(""),
  delta: z.string().optional(),
});

export const workFrontmatterSchema = z.object({
  title: z.string(),
  client: z.string().optional(),
  year: z.number().int(),
  role: z.string(),
  timeline: z.string(),
  stack: z.array(z.string()).default([]),
  discipline: z.array(z.string()).default([]),
  industry: z.array(z.string()).default([]),
  summary: z.string().max(160),
  outcomes: z.array(outcomeSchema).default([]),
  cover: z.string().nullable().default(null),
  featured: z.boolean().default(false),
  published: z.string(),
  draft: z.boolean().default(false),
  testimonial: z.string().optional(),
  gallery: z.array(z.string()).default([]),
});

export type WorkFrontmatter = z.infer<typeof workFrontmatterSchema>;
export type Work = WorkFrontmatter & { slug: string; body: string };

export const noteFrontmatterSchema = z.object({
  title: z.string(),
  published: z.string(),
  updated: z.string().optional(),
  tags: z.array(z.string()).default([]),
  summary: z.string().max(160),
  draft: z.boolean().default(false),
  series: z.string().optional(),
});

export type NoteFrontmatter = z.infer<typeof noteFrontmatterSchema>;
export type Note = NoteFrontmatter & {
  slug: string;
  body: string;
  readingTimeMinutes: number;
};

export const contactFormSchema = z.object({
  name: z.string().min(2, "Please enter your name.").max(100),
  email: z.string().email("Please enter a valid email."),
  budget: z.string().optional(),
  message: z
    .string()
    .min(20, "Give me a bit more detail (20 characters minimum).")
    .max(4000),
  // Honeypot: must stay empty. Bots that fill every field trip this.
  company: z.string().max(0, "").optional(),
});

// The API normalizes the optional honeypot and requires the server-side
// timestamp so the time-trap cannot be bypassed by omitting it.
export const contactSchema = contactFormSchema.extend({
  company: z.string().max(0, "").optional().default(""),
  renderedAt: z.number(),
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
