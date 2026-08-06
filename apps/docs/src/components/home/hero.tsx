"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { gitConfig } from "@/lib/shared";
import styles from "./home.module.css";

function GitHubIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      fill="currentColor"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

export function HomeHero() {
  const [stars, setStars] = useState(0);

  useEffect(() => {
    fetch(`https://api.github.com/repos/${gitConfig.user}/${gitConfig.repo}`)
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.stargazers_count === "number") {
          setStars(data.stargazers_count);
        }
      })
      .catch(() => undefined);
  }, []);

  return (
    <section className="relative">
      <div
        className={`${styles.heroDots} mx-auto max-w-7xl border-fd-border border-x px-6`}
      >
        <div className="flex flex-col items-center gap-5 py-12 text-center md:gap-7 md:py-16">
          <div
            className={`${styles.fadeUp} w-full max-w-xl`}
            style={{ animationDelay: "0.05s" }}
          >
            <div className="mx-auto inline-flex max-w-full flex-wrap items-center justify-center overflow-hidden rounded-full border border-fd-border bg-fd-secondary">
              <span className="border-fd-border border-r px-3 py-1.5 font-semibold text-[10px] text-fd-foreground tracking-tight sm:px-4">
                Introducing LiveCharts
              </span>
              <Link
                className="inline-flex items-center gap-1 px-3 py-1.5 text-[10px] text-fd-muted-foreground transition-colors hover:text-fd-foreground sm:gap-1.5 sm:px-4"
                href="/docs/"
              >
                Open Source
                <ArrowUpRight className="size-3.5 shrink-0" />
              </Link>
            </div>
          </div>

          <h1
            className={`${styles.fadeUp} max-w-[18ch] text-balance font-bold text-[1.75rem] text-fd-muted-foreground leading-[1.12] tracking-[-0.04em] sm:max-w-none sm:text-4xl md:text-[50px] md:leading-[1.05]`}
            style={{ animationDelay: "0.13s" }}
          >
            Real-time animated canvas charts for{" "}
            <span className="text-fd-foreground">React, Vue and more.</span>
          </h1>

          <p
            className={`${styles.fadeUp} max-w-md text-pretty text-[15px] text-fd-muted-foreground leading-relaxed md:text-base`}
            style={{ animationDelay: "0.22s" }}
          >
            Built for streaming data, dashboards and high-performance
            visualizations.
          </p>

          <div
            className={`${styles.fadeUp} flex w-full max-w-sm flex-col items-stretch gap-3 sm:max-w-none sm:flex-row sm:items-center sm:justify-center`}
            style={{ animationDelay: "0.3s" }}
          >
            <Link
              className="inline-flex h-11 items-center justify-center rounded-full bg-fd-primary px-6 font-semibold text-fd-primary-foreground text-sm tracking-tight transition-all hover:opacity-90 active:scale-95 md:h-12 md:px-7"
              href="/docs/"
            >
              Get Started
            </Link>
            <a
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-fd-border px-6 font-semibold text-fd-foreground text-sm tracking-tight transition-all hover:bg-fd-accent hover:text-fd-accent-foreground active:scale-95 md:h-12 md:px-7"
              href={`https://github.com/${gitConfig.user}/${gitConfig.repo}`}
              rel="noopener noreferrer"
              target="_blank"
            >
              <GitHubIcon size={16} />
              <span>GitHub</span>
              <span className="inline-flex items-center justify-center rounded-full bg-fd-muted px-2 py-0.5 font-semibold text-[11px] tabular-nums">
                ★ {stars.toLocaleString()}
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
