"use client";

import { useEffect, useState } from "react";
import { Download, Share } from "lucide-react";
import { Button } from "@/components/ui/button";

type InstallEvent = Event & { prompt: () => Promise<void> };

// "Install app" button. Android and desktop Chrome can install directly;
// iPhone needs Share > Add to Home Screen, so we show that instead.
export function InstallApp() {
  const [event, setEvent] = useState<InstallEvent | null>(null);
  const [mode, setMode] = useState<"unknown" | "installed" | "ios" | "other">("unknown");

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    // Reading the browser only after the page loads, so this can't run on the server.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMode(standalone ? "installed" : ios ? "ios" : "other");
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (mode === "installed") return <p className="text-sm text-muted-foreground">Installed. You&apos;re using the app.</p>;
  if (mode === "ios")
    return (
      <p className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        In Safari, tap <Share className="inline size-4" /> Share, then “Add to Home Screen”.
      </p>
    );
  if (event)
    return (
      <Button variant="secondary" onClick={() => event.prompt()}>
        <Download /> Install app
      </Button>
    );
  return <p className="text-sm text-muted-foreground">Open this page in Chrome on your phone, then use “Install app” or “Add to Home screen” from the menu.</p>;
}
