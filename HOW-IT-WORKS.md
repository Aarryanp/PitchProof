# How it works

Simple explanations of each part, added as we build. Use this to explain the code to the judges.

For each part, write:
- **What it does** (one or two sentences)
- **Files**
- **How to test it**

---

## Setup
- What it does: the empty Next.js app (the website and its server code) with Tailwind and shadcn/ui for styling, plus three ready-made ways to talk to the Supabase database: from the browser, from the server as the signed-in student, and from the server with full access (for the agent steps).
- Files: `package.json` (the list of libraries), `app/layout.tsx` and `app/page.tsx` (the first page), `app/globals.css` (colours, one deep-blue accent), `components.json` (shadcn/ui settings), `lib/utils.ts`, `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/admin.ts`, `.env.example` (names of every key, no values).
- How to test it: run `npm install`, then `npm run dev` and open http://localhost:3000. You should see "Setup is working". `npm run build` should finish with no errors.

## Screens (built before the agent steps)
- What it does: all seven screens from the blueprint. Sign in (email link, no password), Profile, New search, Pipeline board, Pitch review, Results, Settings, and the public company page `/p/[slug]`. Profile and New search save to Supabase for a signed-in student. The other screens show real rows when they exist and otherwise show made-up sample businesses with a yellow "Sample data" label. The Pitch review screen checks the email against the pitch rules (60–100 words, banned phrases, one link, a way to say no, plain text) on every keystroke, and Approve stays off until they all pass. Approve only marks the pitch approved; nothing is sent until Gmail sending (step 9) is built. Company pages tell search engines not to list them, and the "Not interested" link marks the pitch declined.
- Files: `app/sign-in/`, `app/auth/` (email link landing and sign-out), `app/(app)/` (the student screens and their shared menu), `app/p/[slug]/` (company page), `components/` (buttons, cards and other building blocks), `lib/data.ts` (reads data for the screens), `lib/sample-data.ts` (the made-up businesses), `lib/pitch-rules.ts` (email checks), `lib/types.ts`, `proxy.ts` (keeps the student signed in).
- How to test it: `npm run dev`, then open http://localhost:3000. Without signing in you see every screen with sample data. Open a card in "Needs approval" and type "leverage" into the email: the banned-phrase check turns red and Approve turns off. Open http://localhost:3000/p/sample on your phone size to see the company page. To sign in, use your email on /sign-in and click the link in your inbox.

## Step 1: Find companies
- What it does:
- Files:
- How to test it:

## Step 2–3: Read and measure the website
- What it does:
- Files:
- How to test it:

## Step 4: Judge + quality gate
- What it does:
- Files:
- How to test it:

## Step 5: Find the person
- What it does:
- Files:
- How to test it:

## Step 6: Make the fix
- What it does:
- Files:
- How to test it:

## Step 7: Company page
- What it does:
- Files:
- How to test it:

## Step 8: Write the email
- What it does:
- Files:
- How to test it:

## Step 9: Approve and send
- What it does:
- Files:
- How to test it:

## Step 10: Follow-ups (n8n)
- What it does:
- Where it lives:
- How to test it:
