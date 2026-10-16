# Sourov Mondol — Personal Website

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![pnpm](https://img.shields.io/badge/pnpm-9-F69220?logo=pnpm&logoColor=white)](https://pnpm.io)
[![Vercel](https://img.shields.io/badge/deployed%20on-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

Premium personal website — portfolio, writing, and consulting conversion
engine. Built as a static-first Next.js application with a server-side contact
pipeline.

---

## Table of contents

- [Highlights](#highlights)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [Project structure](#project-structure)
- [Content authoring](#content-authoring)
- [Testing & quality gates](#testing--quality-gates)
- [Deployment](#deployment)
- [Security posture](#security-posture)
- [Performance & SEO](#performance--seo)
- [License](#license)

## Highlights

- **Static-first App Router** — every marketing page, case study, and article
  is statically generated (SSG) at build time; only `/api/contact`, `/rss.xml`,
  and the dynamic OG-image endpoint run server-side.
- **Full security header suite** — CSP, HSTS, and companion headers enforced in
  `next.config.ts` (see [Security posture](#security-posture)).
- **Hardened contact pipeline** — zod validation, honeypot, time-trap, and
  Upstash-backed rate limiting with a graceful in-memory fallback, wired to
  Resend for delivery.
- **Sanitized markdown** — authored content is sanitized server-side
  (`sanitize-html`) before rendering.
- **SEO out of the box** — sitemap, robots, RSS feed, JSON-LD
  (Person/CreativeWork/Article/BreadcrumbList), and dynamic Open Graph images.
- **Performance & a11y built in** — self-hosted variable fonts, AVIF/WebP
  output, WCAG 2.2 AA-minded markup, skip link, reduced-motion support.
- **CI quality gates** — lint, strict typecheck, unit tests, production build,
  and Playwright end-to-end tests across Chromium and WebKit. Failure diagnostics
  are retained as GitHub Actions artifacts. Lighthouse budgets are configured for
  manual runs with `pnpm lhci`; Lighthouse is not currently a blocking CI job.

## Tech stack

| Layer         | Choice                                                                                       |
| ------------- | -------------------------------------------------------------------------------------------- |
| Framework     | [Next.js 15](https://nextjs.org) (App Router)                                                |
| UI            | React 19, [Tailwind CSS v4](https://tailwindcss.com)                                         |
| Language      | TypeScript (strict, zero `any`)                                                              |
| Content       | Markdown/MDX frontmatter via `gray-matter` + `marked`, validated with [zod](https://zod.dev) |
| Forms         | [react-hook-form](https://react-hook-form.com) + zod resolver                                |
| Email         | [Resend](https://resend.com) (server-only)                                                   |
| Rate limiting | [Upstash Redis](https://upstash.com) (`@upstash/ratelimit`) with in-memory fallback          |
| Motion        | [Motion](https://motion.dev) + [Lenis](https://lenis.darkroom.engineering) (smooth scroll)   |
| Theming       | [next-themes](https://github.com/pacocoursey/next-themes) (light/dark/system)                |
| Tests         | Vitest (unit) · [Playwright](https://playwright.dev) (e2e) · Lighthouse CI                   |
| Tooling       | ESLint 9, Prettier, Husky + lint-staged, pnpm                                                |

## Getting started

### Prerequisites

- **Node.js ≥ 20** (this repo is pinned to `pnpm@9.12.0` via `packageManager`)
- **pnpm** — `corepack enable` (Node 20+ ships corepack) or
  `npm i -g pnpm@9`

### Install & run

```bash
pnpm install        # install dependencies
pnpm dev            # http://localhost:3000
```

Production build:

```bash
pnpm build          # optimized production build
pnpm start          # serve the build on http://localhost:3000
```

> The contact form works in dev without credentials — the API logs instead of
> failing. Wire real values once you set up Resend (see below).

## Environment variables

Copy `.env.example` to `.env.local` and fill in the server-side settings you use:

```bash
cp .env.example .env.local
```

Site identity, canonical domain, and public metadata are read from
`src/lib/site.config.ts`. The previously listed `NEXT_PUBLIC_*` values were
not consumed by the application, so they are intentionally not presented as
working configuration options.

| Variable                   | Required                | Scope       | Purpose                                                              |
| -------------------------- | ----------------------- | ----------- | -------------------------------------------------------------------- |
| `RESEND_API_KEY`           | for email               | server-only | Resend API key for the contact form                                  |
| `UPSTASH_REDIS_REST_URL`   | for durable rate limits | server-only | Upstash Redis REST URL                                               |
| `UPSTASH_REDIS_REST_TOKEN` | for durable rate limits | server-only | Upstash Redis REST token                                             |
| `CONTACT_TO_EMAIL`         | optional                | server-only | Recipient for contact submissions (falls back to `siteConfig.email`) |

> Secrets are only ever read server-side (`server-only` guard in
> `src/lib/contact.ts`). Never commit real values — `.env*.local` is
> git-ignored.

## Scripts

| Command                             | Purpose                                                 |
| ----------------------------------- | ------------------------------------------------------- |
| `pnpm dev`                          | Start the dev server with hot reload                    |
| `pnpm build`                        | Production build (`next build`)                         |
| `pnpm start`                        | Serve the production build                              |
| `pnpm lint` / `pnpm lint:fix`       | ESLint (flat config, no `any` policy)                   |
| `pnpm typecheck`                    | TypeScript strict, no emit                              |
| `pnpm format` / `pnpm format:check` | Prettier                                                |
| `pnpm test` / `pnpm test:watch`     | Vitest unit tests                                       |
| `pnpm check`                        | **Everything**: lint + typecheck + unit tests           |
| `pnpm e2e`                          | Playwright end-to-end tests (builds + starts server)    |
| `pnpm lhci`                         | Lighthouse CI audit against `lighthouserc.json` budgets |
| `pnpm new-post`                     | Scaffold a new writing post                             |
| `pnpm check-content`                | Validate all content frontmatter                        |

## Project structure

```
.
├── content/                 # Markdown/MDX content (work case studies, writing)
│   ├── work/                #   frontmatter validated by zod schema
│   └── writing/
├── data/                    # Static data (e.g. testimonials)
├── public/                  # Static assets (icon.svg, …)
├── scripts/                 # Authoring helpers (new-post, check-content)
├── src/
│   ├── app/                 # App Router: pages, routes, metadata, API
│   │   ├── (marketing)/     #   about · contact · services
│   │   ├── api/contact/     #   POST endpoint (rate-limited, validated)
│   │   ├── og/[...slug]/    #   dynamic Open Graph images
│   │   └── work|writing/    #   index + [slug] case study/article pages
│   ├── components/
│   │   ├── layout/          #   Header, Footer, nav, theming
│   │   ├── motion/          #   Reveal, Marquee, StaggerGroup, Lenis
│   │   ├── sections/        #   Page sections (Hero, WorkFilterList, …)
│   │   └── ui/              #   Design-system primitives (Button, Input, …)
│   └── lib/                 # content loader, zod schemas, SEO, contact, config
├── tests/
│   ├── unit/                # Vitest suites (content, schemas, utils)
│   └── e2e/                 # Playwright critical-path specs
├── .github/workflows/ci.yml # CI: lint → typecheck → tests → build → e2e
├── .husky/pre-commit        # lint-staged gate
├── next.config.ts           # Build config + security headers
├── vercel.json              # Vercel deployment settings
└── pnpm-lock.yaml           # Lockfile (install with --frozen-lockfile)
```

## Content authoring

All site copy lives as Markdown/MDX in `content/` with a zod-validated
frontmatter contract (`src/lib/schema.ts`).

- **Writing**: `pnpm new-post` scaffolds a draft, or copy
  `content/writing/_template.md`. Set `draft: true` to hide a post from
  indexes, feeds, and sitemaps without deleting it.
- **Work**: mirror `content/work/_template.md`; `featured: true` promotes an
  item to the home page, `gallery`/`cover` accept public image paths.
- **Validation**: `pnpm check-content` lints every file's frontmatter; invalid
  entries are skipped with a warning and never shipped.

Content is rendered with `marked` and sanitized server-side with
`sanitize-html` before reaching the DOM — event handlers, `javascript:` URLs,
and scripts are stripped even though the author is trusted.

## Testing & quality gates

Every push on `main` (and every PR) runs these CI checks:

1. `pnpm lint` — ESLint flat config, `no-explicit-any` is an error
2. `pnpm typecheck` — strict TypeScript checks
3. `pnpm test` — Vitest unit suites
4. `pnpm build` — production build
5. `pnpm e2e` — Playwright critical paths in Chromium and WebKit

On E2E runs, the HTML report, traces, screenshots, and browser diagnostics are
uploaded as a seven-day GitHub Actions artifact, including when tests fail. This
helps distinguish a genuine interaction bug from browser/runtime or failed-asset
problems without hiding WebKit failures or weakening assertions.

Run `pnpm check` for lint, typecheck, and unit tests; run `pnpm build`
separately. Lighthouse budgets in `lighthouserc.json` are currently manual via
`pnpm lhci`, not part of the blocking CI workflow: performance ≥ 0.95,
accessibility ≥ 0.98, SEO ≥ 0.98, and best practices ≥ 0.95.

## Deployment

### Vercel (recommended)

The repo includes `vercel.json` (framework auto-detection, frozen-lockfile
install, `pnpm build`, primary region `iad1`). Deploy is push-to-main; no
server configuration needed.

1. Import the repo on Vercel.
2. Add the required server-side values from
   [Environment variables](#environment-variables) in the project settings
   (production + preview). Set site identity and domain in
   `src/lib/site.config.ts` before deploying.
3. Create the Upstash Redis database and Resend API key, then configure the
   server values.
4. Point your custom domain at the deployment and enable HTTPS.

### Any Node host

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm start        # serves the standalone-capable build on PORT (default 3000)
```

## Security posture

| Control                 | Implementation                                                                                                                                                                |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Content-Security-Policy | `default-src 'self'`; scripts styles img font connect restricted; `frame-ancestors 'none'`; `object-src 'none'`; HSTS-preload compatible; `upgrade-insecure-requests` in prod |
| Clickjacking            | `X-Frame-Options: DENY` + CSP `frame-ancestors`                                                                                                                               |
| Sniffing / leakage      | `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`                                                                                         |
| API abuse               | zod input validation, honeypot field, minimum-fill time-trap, rate limiting (Upstash Redis when configured, in-memory fallback)                                               |
| XSS                     | Server-side markdown sanitization + CSP without remote script origins; no user-generated HTML                                                                                 |
| Secrets                 | Server-only env access (`server-only` module), nothing shipped to the client                                                                                                  |
| Fingerprinting          | `poweredByHeader: false`, `Permissions-Policy` lockdown                                                                                                                       |

> Known trade-off: `script-src` includes `'unsafe-inline'` because App Router
> streaming and `next-themes` emit inline bootstrap scripts. The upgrade path
> is nonce-based CSP via middleware — tracked in the `next.config.ts` comments.

## Performance & SEO

- 18 statically generated pages, ~102 kB shared JS (first load)
- AVIF/WebP image formats, self-hosted variable fonts (zero runtime font CDN)
- JSON-LD: Person, CreativeWork (case studies), Article (writing),
  BreadcrumbList
- Dynamic `og:image` generation (`/og/[...slug]`)
- `sitemap.xml` (static + content routes with real `lastModified`),
  `robots.txt` (disallows `/api/` and `/og/`), `rss.xml` feed,
  `manifest.webmanifest`

## License

This project is licensed under the MIT License. See [`LICENSE`](LICENSE) for
the complete license text.

---

_Site configuration (name, domain, socials, availability) lives in one place:
`src/lib/site.config.ts`._
