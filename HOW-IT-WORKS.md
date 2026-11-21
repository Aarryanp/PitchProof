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
