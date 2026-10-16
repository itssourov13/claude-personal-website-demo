import { describe, expect, it } from "vitest";

import {
  contactFormSchema,
  contactSchema,
  workFrontmatterSchema,
} from "@/lib/schema";

describe("contactFormSchema", () => {
  const formFields = {
    name: "Jamie Rivera",
    email: "jamie@example.com",
    message: "I'd like to talk about a project for our team, please.",
  };

  it("accepts valid browser form fields without server metadata", () => {
    expect(contactFormSchema.safeParse(formFields).success).toBe(true);
  });

  it("rejects invalid browser form fields", () => {
    expect(
      contactFormSchema.safeParse({ ...formFields, email: "not-an-email" })
        .success,
    ).toBe(false);
  });
});

describe("contactSchema", () => {
  const base = {
    name: "Jamie Rivera",
    email: "jamie@example.com",
    message: "I'd like to talk about a project for our team, please.",
    renderedAt: Date.now(),
  };

  it("accepts a valid submission including server metadata", () => {
    expect(contactSchema.safeParse(base).success).toBe(true);
  });

  it("requires server-side time-trap metadata", () => {
    const { renderedAt: _renderedAt, ...withoutTimestamp } = base;
    expect(contactSchema.safeParse(withoutTimestamp).success).toBe(false);
  });

  it("rejects a short message", () => {
    const result = contactSchema.safeParse({ ...base, message: "hi" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = contactSchema.safeParse({ ...base, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects a non-empty honeypot field", () => {
    const result = contactSchema.safeParse({ ...base, company: "x" });
    expect(result.success).toBe(false);
  });
});

describe("workFrontmatterSchema", () => {
  it("applies defaults for optional array fields", () => {
    const parsed = workFrontmatterSchema.parse({
      title: "Test project",
      year: 2026,
      role: "Designer",
      timeline: "4 weeks",
      summary: "A short summary.",
      published: "2026-01-01",
    });

    expect(parsed.stack).toEqual([]);
    expect(parsed.outcomes).toEqual([]);
    expect(parsed.draft).toBe(false);
  });
});
