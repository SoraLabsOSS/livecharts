"use client";

import { LiveChart } from "livecharts/react";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useWalker } from "@/app/demo/walk";
import styles from "./home.module.css";

export function HomeCatalog() {
  const { data, value } = useWalker({
    damping: 0.95,
    intervalMs: 250,
    start: 125,
    volatility: 0.012,
  });

  return (
    <div className="w-full border-gray-200 border-t">
      <section className="px-6 md:px-12 lg:px-16">
        <div className="mx-auto max-w-7xl border-gray-200 border-x px-6 py-16 md:py-20">
          <div className="mb-16 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-4 font-semibold text-slate-400 text-xs uppercase tracking-widest">
                Catalog
              </p>
              <h2
                className="mb-5 font-bold text-2xl text-slate-950 leading-tight md:text-6xl"
                style={{ letterSpacing: "-0.02em" }}
              >
                A taste of what&apos;s inside
              </h2>
              <p className="max-w-lg text-lg text-slate-600 leading-relaxed">
                One live preview to keep the homepage light — open the
                interactive article for the full suite.
              </p>
            </div>
            <Link
              className="inline-flex items-center gap-2 whitespace-nowrap font-semibold text-slate-950 text-sm transition-colors hover:text-slate-700"
              href="/demo/"
            >
              See the demo <ArrowUpRight className="mt-0.5" size={16} />
            </Link>
          </div>

          <div className={styles.fadeUp} style={{ animationDelay: "0.1s" }}>
            <Link className="group block" href="/demo/">
              <div className="relative mb-3 aspect-[16/9] overflow-hidden rounded-lg border border-gray-200 bg-gray-50 transition-all duration-200 group-hover:border-gray-400 group-hover:shadow-md">
                <div className="absolute inset-0 p-4 md:p-6">
                  <LiveChart
                    color="#2563eb"
                    data={data}
                    fill
                    grid
                    padding={{ left: 0, right: 56 }}
                    pulse
                    theme="light"
                    value={value}
                    window={30}
                  />
                </div>
                <div className="absolute inset-0 bg-black/0 transition-colors duration-200 group-hover:bg-black/[0.03]" />
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900 text-sm transition-colors group-hover:text-black">
                  Live line chart
                </span>
                <span className="ml-2 whitespace-nowrap text-gray-400 text-xs tabular-nums">
                  1 demo
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
