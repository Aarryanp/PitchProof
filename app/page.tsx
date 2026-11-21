// Placeholder home page. Replaced by the Sign in and Profile screens
// (docs/06-blueprint.md, section 1) in the next sessions.
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-4 px-6 py-24">
      <p className="text-sm text-muted-foreground">Homingo Hack Days · Edition 01</p>
      <h1 className="text-3xl font-semibold tracking-tight">Setup is working</h1>
      <p className="text-lg text-muted-foreground">
        The app is live. Next: sign-in, then the Profile screen.
      </p>
    </main>
  );
}
