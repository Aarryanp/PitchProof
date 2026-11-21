# Homingo Hack Days: project folder

Everything about the hackathon and our project in one place, ready to start building with Claude Code.
Prepared 21 Nov 2026 (day 1 of the build phase).

## Key facts

- **Submit by:** Fri 4 Dec (our target) · hard deadline **Sun 6 Dec 2026, 11:59 PM IST**
- **Track:** LLM apps · framed as **C1, The $15-an-hour expert**
- **Team:** Applied Intelligence
- **App name:** Pitchproof
- **Idea:** an app that finds businesses that need a student's skill, proves it with real website checks, makes a small fix, builds a page for that company, and drafts a short email the student approves
- **Stack:** Next.js + TypeScript + Tailwind/shadcn on Vercel, Supabase, Gemini, Crustdata, Olostep, PageSpeed Insights, Gmail API, n8n
- **Dashboard:** https://hackathon.homingo.co.in/me

## What's in here

| File | What it holds |
| --- | --- |
| `CLAUDE.md` | Instructions Claude Code reads first: project summary, stack, rules |
| `HOW-IT-WORKS.md` | Simple explanations of each part, filled in as you build (for the judges) |
| `.env.example` | Names of every API key needed (no values) |
| `supabase/schema.sql` | Draft database tables and security rules |
| `docs/01-hackathon-overview.md` | What the hackathon is, my registration, rules, judging, submission |
| `docs/02-dates-and-deadlines.md` | Every date and deadline, plus our build calendar |
| `docs/03-perks.md` | Each perk: claimed or not, how to claim, deadlines, codes |
| `docs/04-problem-statements.md` | All 9 statements (summaries) and our choice |
| `docs/05-our-idea.md` | The idea, why we chose it, what it isn't, risks |
| `docs/06-blueprint.md` | Screens, architecture, database, agent steps, skill packs, pitch rules, build order, open decisions |
| `docs/07-tech-stack-and-setup.md` | Stack decisions, services, setup steps (milestone 1) |
| `docs/08-timeline-and-checklists.md` | Day-by-day plan, today's checklist, measuring results, guardrails, submission and demo |
| `docs/09-design-guide.md` | How the app and company page should look |
| `docs/10-whats-next.md` | Future features (not built during the hackathon) |
| `docs/11-sources-and-links.md` | All links: hackathon, partners, emails, research, tool docs |
| `docs/submission-readme-template.md` | The README to fill in before submitting |

## How to start in Claude Code

1. Do milestone 1 in `docs/07-tech-stack-and-setup.md` (create the Next.js app, GitHub, Vercel, Supabase).
2. Copy this folder's `CLAUDE.md`, `HOW-IT-WORKS.md`, `.env.example`, `docs/` and `supabase/` into the app folder.
3. Open the app folder in Claude Code. A good first prompt:

   > Read CLAUDE.md and docs/06-blueprint.md. Then write a script in scripts/ that runs agent steps 1–4 (find companies, read and measure the website, judge with the quality gate) on 3 companies, and prints the result. Explain each part in simple words before we move on.

4. After each working step: commit, and add a short entry to `HOW-IT-WORKS.md`.
