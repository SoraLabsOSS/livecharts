"use client";

import { Button } from "@workspace/ui/components/ui/button";
import { useTheme } from "fumadocs-ui/provider/base";
import { LiveChart } from "livecharts/react";
import { ArrowUpRight } from "lucide-react";
import { useWalker } from "@/app/demo/walk";
import styles from "./home.module.css";

export function HomeCatalog() {
  const { resolvedTheme } = useTheme();
  const chartTheme = resolvedTheme === "dark" ? "dark" : "light";
  const { data, value } = useWalker(
    {
      damping: 0.95,
      start: 125,
      volatility: 0.012,
    },
    250
  );

  return (
    <div className="w-full border-fd-border border-t">
      <section className="mx-auto max-w-7xl border-fd-border border-x px-6 py-10 md:py-20">
        <div className="mb-8 flex flex-col gap-4 md:mb-16 md:gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-3 font-semibold text-fd-muted-foreground text-xs uppercase tracking-widest md:mb-4">
              Catalog
            </p>
            <h2
              className="mb-3 font-bold text-2xl text-fd-foreground leading-tight md:mb-5 md:text-6xl"
              style={{ letterSpacing: "-0.02em" }}
            >
              A taste of what&apos;s inside
            </h2>
            <p className="max-w-lg text-base text-fd-muted-foreground leading-relaxed md:text-lg">
              One live preview to keep the homepage light — open the interactive
              article for the full suite.
            </p>
          </div>
          <Button
            aria-disabled
            className="pointer-events-none whitespace-nowrap"
            disabled
            size="sm"
            type="button"
            variant="ghost"
          >
            See the demo <ArrowUpRight className="mt-0.5" size={16} />
          </Button>
        </div>

        <div className={styles.fadeUp} style={{ animationDelay: "0.1s" }}>
          <div aria-disabled className="pointer-events-none block opacity-80">
            <div className="relative mb-3 aspect-video overflow-hidden rounded-lg border border-fd-border bg-fd-muted">
              <div className="absolute inset-0 p-4 md:p-6">
                <LiveChart
                  color="#2563eb"
                  data={data}
                  fill
                  grid
                  padding={{ left: 0, right: 56 }}
                  pulse
                  theme={chartTheme}
                  value={value}
                  window={30}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-fd-muted-foreground text-sm">
                Live line chart
              </span>
              <span className="ml-2 whitespace-nowrap text-fd-muted-foreground text-xs tabular-nums">
                Coming soon
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
