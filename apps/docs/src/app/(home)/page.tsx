import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col justify-center text-center">
      <h1 className="mb-4 font-bold text-2xl">LiveCharts</h1>
      <p className="text-fd-muted-foreground">
        Real-time canvas charts for React. Open{" "}
        <Link className="font-medium text-fd-foreground underline" href="/docs">
          /docs
        </Link>{" "}
        to get started.
      </p>
    </div>
  );
}
