import { Suspense, ViewTransition } from "react";

// Wraps the content of each screen so moving between screens animates:
// tabs fade up gently, opening a lead slides in from the right, and going
// back slides in from the left. Other updates (like saving) do not animate.
export function Screen({ children }: { children: React.ReactNode }) {
  const types = { tab: "tab", "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" };
  return (
    <ViewTransition enter={types} exit={types} default="none">
      <div>{children}</div>
    </ViewTransition>
  );
}

// Shows a shimmer placeholder while data loads, then lets the real content
// rise in smoothly instead of popping in.
export function Reveal({ fallback, children }: { fallback: React.ReactNode; children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <ViewTransition exit="skeleton-out" default="none">
          <div>{fallback}</div>
        </ViewTransition>
      }
    >
      <ViewTransition enter="content-in" default="none">
        <div>{children}</div>
      </ViewTransition>
    </Suspense>
  );
}
