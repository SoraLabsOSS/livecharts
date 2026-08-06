"use client";

import { Github } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { appName, gitConfig } from "@/lib/shared";

const NAV_LINKS = [
  { href: "/docs/", label: "Docs" },
  { href: "/demo/", label: "Demo" },
] as const;

export function HomeNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [stars, setStars] = useState<number | null>(null);

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
    <>
      <div className="sticky top-0 z-50 w-full border-gray-200 border-b bg-white/95 backdrop-blur-sm">
        <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between border-gray-200 border-x px-6 md:px-8">
          <div className="flex shrink-0 items-center gap-2">
            <Link className="flex items-center gap-2" href="/">
              <Image
                alt=""
                className="shrink-0 rounded-full"
                height={20}
                priority
                src="/logo.jpg"
                width={20}
              />
              <span className="font-semibold text-[15px] text-black tracking-tight">
                {appName}
              </span>
            </Link>
            <a
              className="text-[13px] text-gray-400 transition-colors hover:text-black"
              href="https://soralabs.io.vn"
              rel="noopener noreferrer"
              target="_blank"
            >
              by Sora Labs
            </a>
          </div>

          <div className="hidden items-center gap-7 md:flex">
            {NAV_LINKS.map((item) => (
              <Link
                className="group relative inline-flex font-medium text-gray-500 text-sm transition-colors hover:text-black"
                href={item.href}
                key={item.href}
              >
                {item.label}
                <span className="absolute bottom-[-2px] left-0 h-[1.5px] w-0 bg-black transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <a
              className="hidden items-center gap-1.5 rounded-full border border-black/10 px-3 py-1.5 font-medium text-gray-600 text-xs transition-colors hover:border-black/30 hover:text-black sm:inline-flex"
              href={`https://github.com/${gitConfig.user}/${gitConfig.repo}`}
              rel="noopener noreferrer"
              target="_blank"
            >
              <Github size={14} />
              {stars === null ? "GitHub" : stars.toLocaleString()}
            </a>
            <button
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              className="p-2 text-black md:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              type="button"
            >
              {mobileOpen ? "✕" : "☰"}
            </button>
          </div>
        </nav>
      </div>

      <div
        className={`fixed inset-0 z-40 flex-col bg-white px-6 pt-24 pb-10 md:hidden ${
          mobileOpen ? "flex" : "hidden"
        }`}
      >
        <nav className="flex flex-1 flex-col gap-1">
          {NAV_LINKS.map((item) => (
            <Link
              className="py-3 font-extrabold text-[38px] text-black leading-none tracking-tight transition-opacity hover:opacity-60"
              href={item.href}
              key={item.href}
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
