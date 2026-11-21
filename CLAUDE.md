# CLAUDE.md: instructions for Claude Code

## The project

**Pitchproof** is an app for Homingo Hack Days (Edition 01, track LLM apps, framed as problem statement C1). It finds businesses that need what a student can do (web development and design in version 1), proves the need with real website checks, makes a small fix, builds a private page for that company, and drafts a short email in the student's voice. The student approves every email before it is sent. Follow-ups run once a day.

Read these before building anything:
- `docs/06-blueprint.md`: screens, architecture, database, agent steps, skill packs, pitch rules, build order (the source of truth)
- `docs/07-tech-stack-and-setup.md`: stack and setup
- `docs/08-timeline-and-checklists.md`: what is due when, guardrails
- `docs/09-design-guide.md`: how it should look
- `AGENTS.md`: notes from Next.js 16 (it differs from older versions; check `node_modules/next/dist/docs/` before writing Next.js code)

## About me

I build with AI and don't write much code by hand. Explain every change in simple words, and avoid jargon or spell it out.

## Stack (don't change without asking)

- TypeScript everywhere
- Next.js (App Router) on Vercel
- Tailwind CSS + shadcn/ui, Lucide icons
- Supabase (Postgres, Auth, Storage), row-level security on
- Gemini API for all model calls
- Crustdata, Olostep, Google PageSpeed Insights, Gmail API
- n8n only for the daily follow-up job (outside this repo)

## How to work with me

1. **One feature per session.** Say what you'll change before changing it.
2. **Script first, screen second.** Make each agent step work as a script in `scripts/` before building its screen.
3. **Small diffs.** After each working step, tell me to commit, with a suggested commit message.
4. **Explain in simple words** what you built and why, and add a short entry to `HOW-IT-WORKS.md` (what it does, which files, how to test it).
5. **Ask before** adding a new library, changing the database schema, or changing the folder structure.
6. **Keep it simple.** No extra features outside the blueprint. New ideas go in `docs/10-whats-next.md`.

## Hard rules

- **Never put API keys or secrets in code.** Use environment variables (`process.env.X`), listed in `.env.example` with empty values. `.env.local` stays out of git.
- **Server-only calls:** Crustdata, Olostep, PageSpeed, Gemini and Gmail are called only from server code (API routes or server actions), never from the browser.
- **Nothing sends email without the student pressing Approve.** Respect the daily limit (15 new pitches) and stop follow-ups on any reply or "no".
- **One student per company** (`companies.claimed_by`).
- **The quality gate is strict:** no pitch unless at least one problem has hard evidence (a number or a clear yes/no). Real numbers come from tools, never from the model.
- **Emails follow the pitch rules** in `docs/06-blueprint.md` section 6, including the banned-phrase check.
- **Company pages** (`/p/[slug]`) are unlisted, `noindex`, fast on phones, and deletable when a company says no.
- **Original work:** all code is new from 21 Nov 2026. Don't copy code from other projects of mine.
- **Track every AI tool, model and library** used, for the README table.

## Folder layout (target)

```
app/                 Next.js routes (screens, /p/[slug], api/)
components/          UI components
lib/                 clients and helpers (supabase, gemini, crustdata, olostep, pagespeed, gmail)
lib/skill-packs/     one file per skill pack: checks, fix template, pitch style
scripts/             standalone scripts for testing each agent step
supabase/schema.sql  database schema
docs/                plans and reference (read-only unless I ask)
HOW-IT-WORKS.md      simple explanations, updated as we build
```

## Tests

Keep at least 3 small tests on the core flow: (1) the quality gate rejects a site with no hard-evidence problem, (2) the email draft passes the banned-phrase check and length limit, (3) a pitch can't be sent without approval.
