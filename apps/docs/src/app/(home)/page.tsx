"use client";

import { Button } from "@workspace/ui/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
      <h1 className="font-bold text-2xl">LiveCharts</h1>
      <p className="max-w-md text-fd-muted-foreground">
        Real-time canvas charts for React. Open{" "}
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
        <Button
          onClick={() => router.push("/demo")}
          type="button"
          variant="outline"
        >
          Open demo
        </Button>
      </div>
    </div>
  );
}
