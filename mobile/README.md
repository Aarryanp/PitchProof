# Pitchproof phone app (Flutter)

The student side of Pitchproof as a real phone app. It talks to the same
Supabase database as the website, with the same row-level security rules.
The agent steps and the company pages (`/p/...`) stay on the Next.js server.

## Run it on your phone

1. Copy `env.example.json` to `env.json` and fill in the two values from
   `.env.local` in the main folder (`NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`). `env.json` stays out of git.
2. Plug in your phone (or start a simulator), then:

```
cd mobile
flutter pub get
flutter run --dart-define-from-file=env.json
```

Without `env.json` the app still runs and shows sample data only.

## Sign-in

Google and the email link send people back to `app.pitchproof://login-callback`,
which opens the app. That address must be in Supabase:
Authentication → URL Configuration → Redirect URLs.

## Builds

`.github/workflows/mobile.yml` builds an Android APK and the web version on
every push that changes `mobile/`. Download them from the run's
"Artifacts" section on GitHub (Actions tab).

## Libraries

- Flutter and Dart (Google)
- `supabase_flutter` (sign-in and database)
- Plus Jakarta Sans font, bundled in `assets/fonts` (Open Font License)
