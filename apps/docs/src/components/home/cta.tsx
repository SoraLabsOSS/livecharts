"use client";

import { ArrowRight } from "@workspace/ui/components/sora-ui/icons/arrow-right";
import Image from "next/image";
import Link from "next/link";
import styles from "./home.module.css";

export function HomeCta() {
  return (
    <div className="w-full border-fd-border border-t">
      <div className="mx-auto max-w-7xl border-fd-border border-x bg-fd-foreground text-fd-background">
        <section className="relative flex min-h-96 w-full flex-col items-center justify-center overflow-hidden px-8 py-14">
          <div
            className={`${styles.fadeUp} relative z-10 mx-auto flex max-w-xl flex-col items-center justify-center text-center`}
          >
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded">
              <Image
                alt=""
                className="rounded-full"
                height={50}
                src="/logo.jpg"
                width={50}
              />
            </div>
            <h2 className="mb-3 font-bold text-2xl leading-tight tracking-tight sm:text-3xl">
              Ready to ship live charts?
            </h2>
            <p className="mb-7 max-w-sm text-sm leading-relaxed opacity-70 sm:text-base">
              Drop in the canvas engine or React bindings and stream data at
              60fps.
            </p>
            <Link
              className="group inline-flex items-center gap-2 rounded-lg bg-fd-background px-6 py-2.5 font-semibold text-fd-foreground text-sm transition-all duration-200 hover:opacity-90 active:scale-95"
              href="/docs/react/"
            >
              Get Started
              <ArrowRight size={16} strokeWidth={2.5} />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
