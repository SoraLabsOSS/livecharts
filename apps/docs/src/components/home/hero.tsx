"use client";

import { ArrowUpRight, Github } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { gitConfig } from "@/lib/shared";
import styles from "./home.module.css";

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
        className="mx-auto max-w-7xl border-gray-200 border-x px-6 pt-10"
        style={{
          background: `
            radial-gradient(circle, rgba(0,0,0,0.08) 1px, transparent 1px)
          `,
          backgroundColor: "#ffffff",
          backgroundSize: "20px 20px",
        }}
      >
        <div className="relative flex flex-1 flex-col items-center justify-center gap-7 p-10 px-6 text-center md:px-12">
          <div className={styles.fadeUp} style={{ animationDelay: "0.05s" }}>
            <div
              className="inline-flex items-center overflow-hidden"
              style={{
                background: "rgba(0,0,0,0.02)",
                border: "1px solid rgba(0,0,0,0.1)",
                borderRadius: "999px",
              }}
            >
              <span
                style={{
                  borderRight: "1px solid rgba(0,0,0,0.1)",
                  color: "#000",
                  fontSize: "10px",
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                  padding: "6px 16px",
                }}
              >
                Introducing LiveCharts
              </span>
              <Link
                className="transition-colors duration-150 hover:text-black"
                href="/docs/"
                style={{
                  alignItems: "center",
                  color: "rgb(41 43 42 / 0.81)",
                  display: "inline-flex",
                  fontSize: "10px",
                  gap: "5px",
                  padding: "6px 16px",
                  textDecoration: "none",
                }}
              >
                Open Source, Built Together
                <ArrowUpRight size={16} />
              </Link>
            </div>
          </div>

          <h1
            className={styles.fadeUp}
            style={{
              animationDelay: "0.13s",
              color: "rgba(0,0,0,0.5)",
              fontSize: "clamp(36px, 7.8vw, 50px)",
              fontWeight: 700,
              letterSpacing: "-0.04em",
              lineHeight: 1.05,
              margin: 0,
            }}
          >
            Real-time animated canvas charts
            <br />
            for <span style={{ color: "#000" }}>React, Vue and more.</span>
          </h1>

          <p
            className={styles.fadeUp}
            style={{
              animationDelay: "0.22s",
              color: "rgba(0,0,0,0.55)",
              fontSize: "clamp(14px, 1.5vw, 16px)",
              lineHeight: 1.7,
              margin: 0,
              maxWidth: "540px",
            }}
          >
            Built for streaming data, dashboards
            <br />
            and high-performance visualizations.
          </p>

          <div
            className={`${styles.fadeUp} mb-10 flex flex-wrap items-center justify-center gap-3`}
            style={{ animationDelay: "0.3s" }}
          >
            <Link
              className="inline-flex h-12 items-center rounded-full bg-black px-7 font-semibold text-sm text-white transition-all hover:bg-gray-800 active:scale-95"
              href="/docs/"
              style={{ letterSpacing: "-0.01em" }}
            >
              Get Started
            </Link>
            <a
              className="inline-flex h-12 items-center gap-2 rounded-full px-7 font-semibold text-black/80 text-sm transition-all hover:border-black/40 hover:text-black active:scale-95"
              href={`https://github.com/${gitConfig.user}/${gitConfig.repo}`}
              rel="noopener noreferrer"
              style={{
                border: "1px solid rgba(0,0,0,0.15)",
                letterSpacing: "-0.01em",
              }}
              target="_blank"
            >
              <Github size={16} />
              <span>GitHub</span>
              <span
                className="inline-flex items-center justify-center rounded-full bg-black/5 px-2 py-0.5 font-semibold text-[11px]"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                ★ {stars.toLocaleString()}
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
