"use client";

import Image from "next/image";
import Link from "next/link";
import styles from "./home.module.css";

export function HomeCta() {
  return (
    <div className="w-full border-gray-200 border-t">
      <div className="mx-auto max-w-7xl border-gray-200 border-x bg-black">
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
            <h2 className="mb-3 font-bold text-2xl text-white leading-tight tracking-tight sm:text-3xl">
              Ready to ship live charts?
            </h2>
            <p className="mb-7 max-w-sm text-gray-300 text-sm leading-relaxed sm:text-base">
              Drop in the canvas engine or React bindings and stream data at
              60fps.
            </p>
            <Link
              className="group inline-flex items-center gap-2 rounded-lg bg-white px-6 py-2.5 font-semibold text-black text-sm transition-all duration-200 hover:bg-gray-100 active:scale-95"
              href="/docs/"
            >
              Get Started
              <svg
                className="transition-transform duration-200 group-hover:translate-x-0.5"
                fill="none"
                height="16"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
                width="16"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
