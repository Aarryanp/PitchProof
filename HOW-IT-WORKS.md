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

## App feel: welcome, onboarding, tour, install
- What it does: makes the web app behave like a phone app. New visitors see a welcome screen where the logo draws itself and the three ideas of the app appear one by one. After the first sign-in, the student answers 7 short questions, one per screen (name, city, goal, skills, one line, projects, two sample messages); the answers fill the Profile. Then a 4-card tour explains Search, Leads, approving emails and Results. On phones the menu is a tab bar at the bottom (Leads, Search, Results, Me) and the Leads board shows one stage at a time; on computers the menu sits on the left. The app can be installed to the home screen (a "PWA") and then opens full screen.
- Files: `app/welcome/`, `app/onboarding/`, `app/tour/`, `app/(app)/layout.tsx` and `components/app-nav.tsx` (the frame and menus), `app/(app)/pipeline/phone-leads.tsx`, `components/logo.tsx`, `components/install-app.tsx`, `app/manifest.ts`, `app/icon.svg`, `app/apple-icon.png`, `public/icon-*.png`, the animations at the end of `app/globals.css`, and `proxy.ts` (sends "/" to the welcome screen or the app).
- How to test it: open the site in a private window: you land on the welcome screen. Sign in with a Google account that has no profile yet: you go through the questions, then the tour. On a phone in Chrome, Settings > "Install app" adds it to the home screen.

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

## Look and feel: "Soft cards" (22 Nov)

**What it does.** The whole app now uses the "Soft cards" look: a soft blue-grey background, white rounded cards that float, one blue accent, pill-shaped buttons and the Plus Jakarta Sans font. More importantly, it moves like a phone app:
- **Splash:** when you open the app, the logo springs in on a blue screen, the check draws itself, then it fades away. Only once per visit.
- **Press feel:** every button, card, chip and tab shrinks slightly while pressed and springs back.
- **Tab bar:** floats at the bottom; a soft blue pill slides to the tab you pick.
- **Screen changes:** tabs fade up gently; opening a lead slides in from the right; going back slides in from the left. The top bar and tab bar stay still.
- **Loading:** shimmer placeholders shaped like the content, then the real content rises in.
- **Lists:** cards settle in one after another. Switching stage chips replays it.
- **Approve:** a sheet slides up, a green circle pops in and a check draws itself (a small buzz on Android phones).
- Anyone who turns on "reduce motion" on their phone gets the same app without the movement.

**Which files.** `app/globals.css` (colours and all the animations), `app/layout.tsx` (font, splash script), `components/splash.tsx`, `components/screen.tsx` (screen-change wrapper), `components/loading.tsx` (shimmer), `components/avatar.tsx`, `components/app-nav.tsx` (sliding tab bar), `app/(app)/pitch/[id]/approved-sheet.tsx`, plus small style changes on every screen. No new libraries: the screen changes use React's built-in `<ViewTransition>`.

**How to test.** Open the app on your phone in a fresh tab: you should see the splash. Tap between tabs, open a lead and go back, then press "Approve and send" on a sample lead.

## The phone app (Flutter, 22 Nov)

**What it does.** The student side of Pitchproof is now a real phone app built with Flutter, in the `mobile/` folder. It has the same screens as the website: a splash where the logo springs in and the check draws itself, a welcome screen, sign-in (Google or an email link), seven setup questions, a four-slide tour, then four tabs (Leads, Search, Results, Me) with a floating tab bar whose blue pill slides to the open tab. Leads now shows the stages top to bottom in order (1 Found, 2 Audited, 3 Needs approval, 4 Sent, 5 Page opened, 6 Replied), with Skipped folded away at the end. Every button and card shrinks slightly when pressed, with a small vibration. Approving a pitch slides up a sheet with a green check. It reads and writes the same Supabase tables as the website, and shows labelled sample data when there is nothing real yet.

**What stays on the server.** The agent steps (finding businesses, website checks, writing emails) need secret keys, so they stay in the Next.js app on Vercel. So do the company pages, which businesses open in a normal browser.

**Which files.** `mobile/lib/main.dart` (start-up), `mobile/lib/theme.dart` (colours, spacing, motion), `mobile/lib/widgets/` (press feel, settle-in animation, shimmer, buttons, cards), `mobile/lib/screens/` (one file per screen), `mobile/lib/data/` (Supabase reads and writes, sample data, email rules), `mobile/test/pitch_rules_test.dart`, `.github/workflows/mobile.yml` (builds the APK).

**How to test.** See `mobile/README.md`: `flutter run --dart-define-from-file=env.json` with your phone plugged in. `flutter test` runs the email-rule tests.

## Phone app: less clutter (22 Nov)

**What changed:** each tab now shows only what it needs.
- **Leads** is one plain list. The ones waiting for your approval come first, then the furthest along. Each card has a small coloured label with its stage. No sample-data banner, and when you are signed in with no leads yet you see "No leads yet" with a New search button, instead of made-up businesses.
- **Results** is four blocks: Emails sent, Pages opened, Replies, Positive replies. Tap a block to see those companies. Under the blocks, every company you emailed is listed best first: positive replies, other replies, opened, then just sent. The four numbers are counted from that same list, so they always match.
- **Search** shows what happened right under the Run the agent button: the search is saved, and the next steps (find, check websites, draft emails) show as waiting until the agent steps are connected.
- **Me** looks like a profile on a job site: a coloured cover banner, your avatar over its edge, your name and details below, then your projects and settings.

**Files:** `mobile/lib/screens/leads.dart`, `results.dart`, `search.dart`, `me.dart`, `mobile/lib/data/models.dart` (new `Outcome` and `SentPitch`), `mobile/lib/data/repo.dart` (Results now reads each emailed company with its page views and replies), `mobile/lib/data/sample_data.dart`.

**How to test:** run the app, sign in, and open each tab. "Look around with sample data" on the Welcome screen still shows made-up businesses, without the banner.
