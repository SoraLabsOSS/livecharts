import Image from "next/image";
import Link from "next/link";
import { appName, gitConfig } from "@/lib/shared";

const FOOTER_PRODUCT = [
  { disabled: false, href: "/docs/react/", label: "Docs" },
  { disabled: false, href: "/docs/react/demo/", label: "Demo" },
  {
    disabled: false,
    href: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
    label: "GitHub",
  },
  {
    disabled: false,
    href: "https://www.npmjs.com/package/livecharts",
    label: "npm",
  },
] as const;

const FOOTER_MORE = [
  { href: "https://soralabs.io.vn", label: "Sora Labs" },
  { href: "https://ui.soralabs.io.vn", label: "Sora UI" },
] as const;

export function HomeFooter() {
  return (
    <div className="w-full border-fd-border border-t">
      <footer className="mx-auto max-w-7xl border-fd-border border-x px-6 pt-10">
        <div className="mb-14 grid grid-cols-2 gap-10 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <div className="mb-3 flex items-center gap-2">
              <Image
                alt=""
                className="rounded-full"
                height={16}
                src="/logo.jpg"
                width={16}
              />
              <span className="font-semibold text-fd-foreground text-sm">
                {appName}
              </span>
            </div>
            <p className="max-w-50 text-fd-muted-foreground text-xs leading-relaxed">
              Real-time animated canvas charts for React, Vue and more.
            </p>
          </div>
          <div>
            <p className="mb-4 font-semibold text-fd-muted-foreground text-xs uppercase tracking-widest">
              Product
            </p>
            <ul className="space-y-2.5">
              {FOOTER_PRODUCT.map((l) => (
                <li key={l.label}>
                  {l.disabled ? (
                    <span
                      aria-disabled
                      className="cursor-not-allowed text-fd-muted-foreground/50 text-sm"
                    >
                      {l.label}
                    </span>
                  ) : (
                    <Link
                      className="text-fd-muted-foreground text-sm transition-colors hover:text-fd-foreground"
                      href={l.href}
                      {...(l.href.startsWith("http")
                        ? { rel: "noopener noreferrer", target: "_blank" }
                        : {})}
                    >
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-4 font-semibold text-fd-muted-foreground text-xs uppercase tracking-widest">
              More
            </p>
            <ul className="space-y-2.5">
              {FOOTER_MORE.map((l) => (
                <li key={l.label}>
                  <a
                    className="text-fd-muted-foreground text-sm transition-colors hover:text-fd-foreground"
                    href={l.href}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-4 font-semibold text-fd-muted-foreground text-xs uppercase tracking-widest">
              Legal
            </p>
            <ul className="space-y-2.5">
              <li>
                <a
                  className="text-fd-muted-foreground text-sm transition-colors hover:text-fd-foreground"
                  href={`https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/main/packages/livecharts/LICENSE`}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  MIT License
                </a>
              </li>
              <li>
                <a
                  className="text-fd-muted-foreground text-sm transition-colors hover:text-fd-foreground"
                  href="https://github.com/benjitaylor/liveline"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Based on Liveline
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col items-start justify-between gap-6 border-fd-border border-t pt-8 md:flex-row md:items-center">
          <p className="mb-5 text-fd-muted-foreground text-xs">
            © {new Date().getFullYear()} {appName} — part of{" "}
            <a
              className="text-[13px] text-fd-muted-foreground underline underline-offset-4 transition-colors hover:text-fd-foreground"
              href="https://soralabs.io.vn"
              rel="noopener noreferrer"
              target="_blank"
            >
              Sora Labs OSS
            </a>
            . Engine based on{" "}
            <a
              className="text-[13px] text-fd-muted-foreground underline underline-offset-4 transition-colors hover:text-fd-foreground"
              href="https://github.com/benjitaylor/liveline"
              rel="noopener noreferrer"
              target="_blank"
            >
              Liveline
            </a>{" "}
            by Benji Taylor (MIT).
          </p>
        </div>
      </footer>
    </div>
  );
}
