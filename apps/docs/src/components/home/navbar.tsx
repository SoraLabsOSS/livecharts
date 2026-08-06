"use client";

import { Button } from "@workspace/ui/components/ui/button";
import { ThemeSwitch } from "fumadocs-ui/layouts/shared/slots/theme-switch";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { appName, gitConfig } from "@/lib/shared";

function GitHubIcon({ size = 14 }: { size?: number }) {
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

const githubUrl = `https://github.com/${gitConfig.user}/${gitConfig.repo}`;

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
      <div className="sticky top-0 z-50 w-full border-fd-border border-b bg-fd-background/95 backdrop-blur-sm">
        <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between border-fd-border border-x px-6">
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
              <span className="font-semibold text-[15px] text-fd-foreground tracking-tight">
                {appName}
              </span>
            </Link>
            <a
              className="text-[13px] text-fd-muted-foreground transition-colors hover:text-fd-foreground"
              href="https://soralabs.io.vn"
              rel="noopener noreferrer"
              target="_blank"
            >
              by Sora Labs
            </a>
          </div>

          <div className="flex items-center gap-2">
            <ThemeSwitch
              className="me-1 hidden md:inline-flex"
              mode="light-dark-system"
            />
            <div className="hidden items-center gap-2 md:flex">
              <Button
                className="rounded-full"
                nativeButton={false}
                render={<Link href="/docs/react/" />}
                size="sm"
                variant="default"
              >
                Docs
              </Button>
              <Button
                className="rounded-full"
                nativeButton={false}
                render={
                  <a
                    href={githubUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                  />
                }
                size="sm"
                variant="outline"
              >
                <GitHubIcon size={14} />
                {stars === null ? "GitHub" : stars.toLocaleString()}
              </Button>
            </div>
            <Button
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              className="md:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              {mobileOpen ? "✕" : "☰"}
            </Button>
          </div>
        </nav>
      </div>

      <div
        className={`fixed inset-0 z-40 flex-col bg-fd-background px-6 pt-24 pb-10 md:hidden ${
          mobileOpen ? "flex" : "hidden"
        }`}
      >
        <nav className="flex flex-1 flex-col gap-3">
          <Button
            className="justify-start rounded-full"
            nativeButton={false}
            onClick={() => setMobileOpen(false)}
            render={<Link href="/docs/react/" />}
            size="lg"
            variant="default"
          >
            Docs
          </Button>
          <Button
            className="justify-start rounded-full"
            nativeButton={false}
            onClick={() => setMobileOpen(false)}
            render={
              <a href={githubUrl} rel="noopener noreferrer" target="_blank" />
            }
            size="lg"
            variant="outline"
          >
            <GitHubIcon size={16} />
            GitHub
          </Button>
        </nav>
      </div>
    </>
  );
}
