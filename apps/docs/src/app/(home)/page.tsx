"use client";

import { Button, buttonVariants } from "@workspace/ui/components/ui/button";
import { cn } from "@workspace/ui/lib/utils";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
      <h1 className="font-bold text-2xl">LiveCharts</h1>
      <p className="max-w-md text-fd-muted-foreground">
        Real-time canvas charts with a framework-agnostic engine. Open{" "}
        <Link className="font-medium text-fd-foreground underline" href="/docs">
          /docs
        </Link>{" "}
        to get started, or try the interactive{" "}
        <Link className="font-medium text-fd-foreground underline" href="/demo">
          /demo
        </Link>{" "}
        article.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button type="button">Default</Button>
        <Button type="button" variant="secondary">
          Secondary
        </Button>
        <Link
          className={cn(buttonVariants({ variant: "outline" }))}
          href="/demo"
        >
          Open demo
        </Link>
      </div>
    </div>
  );
}
