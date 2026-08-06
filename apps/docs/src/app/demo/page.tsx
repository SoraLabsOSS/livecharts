"use client";

import { useEffect } from "react";

/** Old `/demo` URL — send visitors to the docs walkthrough. */
export default function DemoRedirectPage() {
  useEffect(() => {
    window.location.replace("/docs/react/demo/");
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-fd-background px-6 text-fd-foreground">
      <p className="text-fd-muted-foreground text-sm">
        The demo moved into the docs.
      </p>
      <a
        className="font-medium text-fd-primary text-sm underline"
        href="/docs/react/demo/"
      >
        Continue to /docs/demo
      </a>
    </main>
  );
}
