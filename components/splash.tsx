// Branded splash shown when the app is first opened (once per visit), like a
// native app's launch screen: the logo springs in, then the screen fades away.
// A tiny script in app/layout.tsx hides it on later screens of the same visit.
export function Splash() {
  return (
    <div className="splash" aria-hidden style={{ viewTransitionName: "splash" }}>
      <div className="flex flex-col items-center gap-4">
        <svg viewBox="0 0 32 32" className="size-20 drop-shadow-[0_12px_24px_rgb(0_0_0/0.18)]">
          <rect width="32" height="32" rx="9" fill="white" />
          <path
            d="M9.5 16.5l4.5 4.5 8.5-9.5"
            fill="none"
            stroke="#3b5bdb"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pp-draw"
            style={{ animationDelay: "380ms" }}
          />
        </svg>
        <span className="pp-rise text-xl font-bold tracking-tight text-white" style={{ animationDelay: "250ms" }}>
          Pitchproof
        </span>
      </div>
    </div>
  );
}
