"use client";

import { Button } from "@workspace/ui/components/ui/button";
import { useState } from "react";
import {
  BasicChart,
  BitcoinChart,
  CandlestickChart,
  CpuChart,
  DarkChart,
  GappyChart,
  HeartRateChart,
  HeroChart,
  LoadingChart,
  MinimalChart,
  MomentumChart,
  MultiSeriesChart,
  OrderbookChart,
  PausedChart,
  SpikyTestCharts,
  StressTestCharts,
  ValueOverlayChart,
} from "./charts";
import styles from "./demo.module.css";

function Section({ id, title }: { id: string; title: string }) {
  return (
    <div className={styles.section} data-heading="true">
      <div className={styles.sectionRule} />
      <div className={styles.sectionHeading}>
        <span>
          <h1 id={id}>{title}</h1>
        </span>
      </div>
    </div>
  );
}

function CopyCode({
  code,
  children,
}: {
  code: string;
  children: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <div className={styles.copyWrap}>
      {children}
      <button
        aria-label={copied ? "Copied" : "Copy to clipboard"}
        className={styles.copyButton}
        onClick={async () => {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        type="button"
      >
        <svg
          aria-hidden="true"
          fill="none"
          style={{ overflow: "visible" }}
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            height={copied ? 14.5 : 10.5}
            rx={copied ? 7.25 : 2}
            stroke="currentColor"
            strokeWidth="1.5"
            width={copied ? 14.5 : 10.5}
            x="4.75"
            y={copied ? 4.75 : 8.75}
          />
          <rect
            height={copied ? 14.5 : 10.5}
            rx={copied ? 7.25 : 2}
            stroke="currentColor"
            strokeWidth="1.5"
            width={copied ? 14.5 : 10.5}
            x={copied ? 4.75 : 8.75}
            y="4.75"
          />
          <path
            d="M9.25 12.25L11 14.25L15 10"
            opacity={copied ? 1 : 0}
            pathLength="1"
            stroke="currentColor"
            strokeDasharray={copied ? "1px 1px" : "0px 1px"}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
        </svg>
      </button>
    </div>
  );
}

function Prop({
  name,
  type,
  defaultValue,
  description,
}: {
  name: string;
  type: string;
  defaultValue?: string;
  description?: string;
}) {
  return (
    <div className={styles.propItem}>
      <div className={styles.propHeader}>
        <code className={styles.propName}>{name}</code>
        <span className={styles.propType}>{type}</span>
        {defaultValue ? (
          <span className={styles.propDefault}>{defaultValue}</span>
        ) : null}
      </div>
      {description ? (
        <span className={styles.propDescription}>{description}</span>
      ) : null}
    </div>
  );
}

export function DemoArticle() {
  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <article className={styles.article}>
          <header>
            <h1 id="livecharts">LiveCharts</h1>
            <time>16 February, 2026</time>
          </header>

          <p>
            LiveCharts is a real-time animated line chart component for React.
            One <code>&lt;canvas&gt;</code>, no dependencies beyond React 18,
            smooth interpolation at 60fps.
          </p>

          <HeroChart />

          <p>
            I built this because every charting library I tried was either too
            heavy for a simple live feed, or too rigid to feel alive. LiveCharts
            does one thing: draw a line that moves smoothly as new data arrives.
            Everything else is opt-in.
          </p>

          <Section id="getting-started" title="Getting started" />

          <CopyCode code="npm install livecharts">
            <div className={styles.codeBlock}>
              <pre>
                <code>
                  <span>
                    <span className={styles.tokenBash}>npm</span>
                    <span className={styles.tokenString}> install</span>
                    <span className={styles.tokenString}> livecharts</span>
                  </span>
                </code>
              </pre>
            </div>
          </CopyCode>

          <p>
            The component fills its parent container. Set a height on the
            wrapper.
          </p>

          <div className={styles.codeBlock}>
            <pre>
              <code>
                <span>
                  <span className={styles.tokenKeyword}>import</span>
                  <span className={styles.tokenPlain}> {"{ LiveChart }"} </span>
                  <span className={styles.tokenKeyword}>from</span>
                  <span className={styles.tokenString}>
                    {" "}
                    &apos;livecharts/react&apos;
                  </span>
                </span>
                {"\n\n"}
                <span>
                  <span className={styles.tokenKeyword}>function</span>
                  <span className={styles.tokenFn}> Chart</span>
                  <span className={styles.tokenPlain}>
                    ({"{ "}data, value{" }"}) {"{"}
                  </span>
                </span>
                {"\n"}
                <span>
                  <span className={styles.tokenKeyword}>{"  "}return</span>
                  <span className={styles.tokenPlain}> (</span>
                </span>
                {"\n"}
                <span>
                  <span className={styles.tokenPlain}>{"    <"}</span>
                  <span className={styles.tokenTag}>div</span>
                  <span className={styles.tokenAttr}> style</span>
                  <span className={styles.tokenPunct}>=</span>
                  <span className={styles.tokenPlain}>{"{{ height: "}</span>
                  <span className={styles.tokenAttr}>200</span>
                  <span className={styles.tokenPlain}>{" }}"}</span>
                  <span className={styles.tokenPlain}>&gt;</span>
                </span>
                {"\n"}
                <span>
                  <span className={styles.tokenPlain}>{"      <"}</span>
                  <span className={styles.tokenTag}>LiveChart</span>
                  <span className={styles.tokenAttr}> data</span>
                  <span className={styles.tokenPunct}>=</span>
                  <span className={styles.tokenPlain}>{"{data}"}</span>
                  <span className={styles.tokenAttr}> value</span>
                  <span className={styles.tokenPunct}>=</span>
                  <span className={styles.tokenPlain}>{"{value}"}</span>
                  <span className={styles.tokenPlain}>{" />"}</span>
                </span>
                {"\n"}
                <span>
                  <span className={styles.tokenPlain}>{"    </"}</span>
                  <span className={styles.tokenTag}>div</span>
                  <span className={styles.tokenPlain}>&gt;</span>
                </span>
                {"\n"}
                <span>
                  <span className={styles.tokenPlain}>{"  )"}</span>
                </span>
                {"\n"}
                <span>
                  <span className={styles.tokenPlain}>{"}"}</span>
                </span>
              </code>
            </pre>
          </div>

          <p>
            <code>data</code> is an array of <code>{"{ time, value }"}</code>{" "}
            points. <code>value</code> is the latest number.
          </p>

          <BasicChart />

          <p>
            Feed it data however you like. WebSocket, polling, random walk.
            LiveCharts interpolates between updates so even infrequent data
            looks smooth. It works for anything with a value that changes over
            time.
          </p>

          <HeartRateChart />

          <Section id="momentum" title="Momentum" />

          <p>
            The <code>momentum</code> prop adds directional arrows to the live
            dot. Green for up, red for down, grey for flat. Pass{" "}
            <code>true</code> to auto-detect direction, or force it with{" "}
            <code>&quot;up&quot;</code>, <code>&quot;down&quot;</code>, or{" "}
            <code>&quot;flat&quot;</code>.
          </p>

          <MomentumChart />

          <Section id="value-overlay" title="Value overlay" />

          <p>
            <code>showValue</code> renders the current value as a large number
            over the chart. It updates at 60fps through direct DOM manipulation,
            not React re-renders. Pair it with <code>valueMomentumColor</code>{" "}
            to tint the number based on direction.
          </p>

          <ValueOverlayChart />

          <Section id="time-windows" title="Time windows" />

          <p>
            Pass a <code>windows</code> array to render time horizon buttons.
            Each entry has a <code>label</code> and <code>secs</code> value.
            Three styles are available via <code>windowStyle</code>:{" "}
            <code>&quot;default&quot;</code>, <code>&quot;rounded&quot;</code>,
            and <code>&quot;text&quot;</code>.
          </p>

          <div className={styles.codeBlock}>
            <pre>
              <code>
                <span>
                  <span className={styles.tokenPlain}>{"<"}</span>
                  <span className={styles.tokenTag}>LiveChart</span>
                </span>
                {"\n"}
                <span>
                  <span className={styles.tokenAttr}>{"  "}windows</span>
                  <span className={styles.tokenPunct}>=</span>
                  <span className={styles.tokenPlain}>{"{["}</span>
                </span>
                {"\n"}
                <span>
                  <span className={styles.tokenPlain}>{"    { label: "}</span>
                  <span className={styles.tokenString}>&apos;1m&apos;</span>
                  <span className={styles.tokenPlain}>{", secs: "}</span>
                  <span className={styles.tokenAttr}>60</span>
                  <span className={styles.tokenPlain}>{" },"}</span>
                </span>
                {"\n"}
                <span>
                  <span className={styles.tokenPlain}>{"    { label: "}</span>
                  <span className={styles.tokenString}>&apos;5m&apos;</span>
                  <span className={styles.tokenPlain}>{", secs: "}</span>
                  <span className={styles.tokenAttr}>300</span>
                  <span className={styles.tokenPlain}>{" },"}</span>
                </span>
                {"\n"}
                <span>
                  <span className={styles.tokenPlain}>{"  ]}"}</span>
                </span>
                {"\n"}
                <span>
                  <span className={styles.tokenAttr}>{"  "}windowStyle</span>
                  <span className={styles.tokenPunct}>=</span>
                  <span className={styles.tokenString}>
                    &quot;rounded&quot;
                  </span>
                </span>
                {"\n"}
                <span>
                  <span className={styles.tokenPlain}>{"/>"}</span>
                </span>
              </code>
            </pre>
          </div>

          <CpuChart />

          <Section id="reference-line" title="Reference line" />

          <p>
            <code>referenceLine</code> draws a horizontal line at a fixed value.
            Pass an object with <code>value</code> and an optional{" "}
            <code>label</code>.
          </p>

          <BitcoinChart />

          <Section id="orderbook" title="Orderbook" />

          <p>
            Pass an <code>orderbook</code> prop with <code>bids</code> and{" "}
            <code>asks</code> arrays to render streaming order labels behind the
            line. Each entry is a <code>[price, size]</code> tuple. Labels spawn
            at the bottom, drift upward, and fade out. Green for bids, red for
            asks. Bigger orders appear brighter.
          </p>

          <p>
            The stream speed reacts to price momentum and orderbook churn (how
            much the bid/ask totals are changing). Calm markets drift slowly,
            volatile ones rush.
          </p>

          <OrderbookChart />

          <Section id="candlestick" title="Candlestick" />

          <p>
            Pass OHLC data to render candlesticks. The live candle keeps
            updating in real time, growing its wicks as new ticks arrive. A
            built-in toggle morphs between line and candlestick views.
          </p>

          <CandlestickChart />

          <Section id="multiseries" title="Multi-series" />

          <p>
            Pass a <code>series</code> array instead of <code>data</code>/
            <code>value</code> to draw multiple overlapping lines. Each series
            gets its own color, label, and endpoint dot. Toggle chips appear
            automatically. Click one to hide or show that line.
          </p>

          <MultiSeriesChart />

          <Section id="states" title="States" />

          <p>
            Real apps don&apos;t start with data ready. Set <code>loading</code>{" "}
            to show a breathing line animation while you wait for a connection.
            When data arrives, the flat line morphs smoothly into the actual
            chart. If data never arrives, LiveCharts falls back to a quiet empty
            state. Customise the message with <code>emptyText</code>.
          </p>

          <LoadingChart />

          <p>
            <code>paused</code> freezes the chart in place while data continues
            arriving in the background. Resume fades back to live inside the
            window, or morphs from loading when the pause outlasts it.
          </p>

          <PausedChart />

          <p>
            Shared UI package smoke check:{" "}
            <Button size="sm" type="button" variant="outline">
              @workspace/ui
            </Button>
          </p>

          <Section id="theming" title="Theming" />

          <p>
            Pass any CSS colour string to <code>color</code> and LiveCharts
            derives the full palette. Line, fill gradient, glow, badge, grid
            labels. It converts the input to HSL and generates every variant
            from there.
          </p>

          <DarkChart />

          <Section id="more-features" title="More features" />

          <p>
            Everything is off by default or has sensible defaults. A few more
            things you can turn on:
          </p>

          <ul>
            <li>
              <code>exaggerate</code> tightens the Y-axis range so small
              movements fill the full chart height. Useful for values that move
              in tiny increments, like the heart rate demo above.
            </li>
            <li>
              <code>scrub</code> shows a crosshair with time and value tooltips
              on hover. On by default.
            </li>
            <li>
              <code>degen</code> enables burst particles and chart shake on
              momentum swings. For when subtlety is not the goal.
            </li>
            <li>
              <code>badgeVariant=&quot;minimal&quot;</code> renders a quieter
              white pill instead of the accent-colored default. Or{" "}
              <code>{"badge={false}"}</code> to remove it entirely.
            </li>
          </ul>

          <Section id="how-it-works" title="How it works" />

          <p>
            One <code>&lt;canvas&gt;</code>, one{" "}
            <code>requestAnimationFrame</code> loop. When a new value arrives,
            nothing jumps. The chart lerps toward the new state at 8% per frame
            (<code>lerpSpeed</code>). The Y-axis range, the badge, the grid
            labels all use the same lerp. The range snaps outward instantly when
            data exceeds it, so the line is never clipped. That&apos;s why it
            feels like one thing breathing rather than a bunch of parts updating
            independently.
          </p>

          <Section id="props" title="Props" />

          <div className={styles.propsGroup}>
            <h4>Data</h4>
            <Prop defaultValue="required" name="data" type="LiveChartPoint[]" />
            <Prop defaultValue="required" name="value" type="number" />
          </div>

          <div className={styles.propsGroup}>
            <h4>Appearance</h4>
            <Prop defaultValue="'dark'" name="theme" type="'light' | 'dark'" />
            <Prop defaultValue="'#3b82f6'" name="color" type="string" />
            <Prop defaultValue="true" name="grid" type="boolean" />
            <Prop defaultValue="true" name="badge" type="boolean" />
            <Prop
              defaultValue="'default'"
              name="badgeVariant"
              type="'default' | 'minimal'"
            />
            <Prop defaultValue="true" name="badgeTail" type="boolean" />
            <Prop defaultValue="true" name="fill" type="boolean" />
            <Prop defaultValue="true" name="pulse" type="boolean" />
            <Prop
              defaultValue="2"
              description="Stroke width of the main line in px"
              name="lineWidth"
              type="number"
            />
          </div>

          <div className={styles.propsGroup}>
            <h4>Features</h4>
            <Prop
              defaultValue="true"
              name="momentum"
              type="boolean | Momentum"
            />
            <Prop defaultValue="true" name="scrub" type="boolean" />
            <Prop defaultValue="false" name="exaggerate" type="boolean" />
            <Prop defaultValue="false" name="showValue" type="boolean" />
            <Prop
              defaultValue="false"
              name="valueMomentumColor"
              type="boolean"
            />
            <Prop
              defaultValue="false"
              name="degen"
              type="boolean | DegenOptions"
            />
          </div>

          <div className={styles.propsGroup}>
            <h4>State</h4>
            <Prop
              defaultValue="false"
              description="Breathing line animation while waiting for data"
              name="loading"
              type="boolean"
            />
            <Prop
              defaultValue="false"
              description="Freeze chart scrolling; resume fades in-window or morphs after longer pauses"
              name="paused"
              type="boolean"
            />
            <Prop
              defaultValue="'No data to display'"
              description="Text shown when data is empty and not loading"
              name="emptyText"
              type="string"
            />
          </div>

          <div className={styles.propsGroup}>
            <h4>Time</h4>
            <Prop defaultValue="30" name="window" type="number" />
            <Prop name="windows" type="WindowOption[]" />
            <Prop name="onWindowChange" type="(secs: number) => void" />
            <Prop name="windowStyle" type="'default' | 'rounded' | 'text'" />
          </div>

          <div className={styles.propsGroup}>
            <h4>Crosshair</h4>
            <Prop defaultValue="14" name="tooltipY" type="number" />
            <Prop defaultValue="true" name="tooltipOutline" type="boolean" />
          </div>

          <div className={styles.propsGroup}>
            <h4>Orderbook</h4>
            <Prop name="orderbook" type="OrderbookData" />
          </div>

          <div className={styles.propsGroup}>
            <h4>Advanced</h4>
            <Prop name="referenceLine" type="ReferenceLine" />
            <Prop
              defaultValue="v.toFixed(2)"
              name="formatValue"
              type="(v: number) => string"
            />
            <Prop
              defaultValue="HH:MM:SS"
              name="formatTime"
              type="(t: number) => string"
            />
            <Prop defaultValue="0.08" name="lerpSpeed" type="number" />
            <Prop
              defaultValue="{ top: 12, right: auto, bottom: 28, left: 12 }"
              name="padding"
              type="Padding"
            />
            <Prop name="onHover" type="(point: HoverPoint | null) => void" />
            <Prop defaultValue="'crosshair'" name="cursor" type="string" />
            <Prop name="className" type="string" />
            <Prop name="style" type="CSSProperties" />
          </div>

          <Section id="stress-testing" title="Stress testing" />

          <div className={styles.notation}>
            <p>
              A chart that only looks good on calm data isn&apos;t much use.
              These demos throw the worst stuff I could think of at it: wild
              volatility, sharp direction changes, isolated spikes on flat
              lines, and irregular data arrival with random gaps.
            </p>
            <div className={styles.notationAside}>just because</div>
          </div>

          <StressTestCharts />

          <p>
            Sharp reversals are the classic breaking point. The first chart
            hammers the line with frequent direction changes at 60ms. The second
            holds nearly flat, then fires massive isolated spikes. The third is
            just chaos.
          </p>

          <SpikyTestCharts />

          <p>
            Real-world data doesn&apos;t arrive at regular intervals. WebSocket
            connections drop, batch updates land all at once, mobile networks
            stall. This one simulates that: long quiet stretches of 1-3 seconds
            between points, then sudden bursts at 40-80ms. The tick interval
            itself is random.
          </p>

          <GappyChart />

          <Section id="just-a-line" title="Just a line" />

          <p>
            LiveCharts can do a lot. Momentum arrows, particles, orderbooks,
            scrubbing, time windows. But at the end of the day, if you just want
            a line that moves when a number changes, it does that just fine too.
          </p>

          <MinimalChart />

          <footer className={styles.footer}>
            <h1 id="acknowledgements">Acknowledgements</h1>
            <p>
              Inspired by{" "}
              <a
                href="https://polymarket.com"
                rel="noopener noreferrer"
                target="_blank"
              >
                Polymarket
              </a>
              &apos;s real-time prediction charts and their 15-minute Bitcoin
              price windows.
            </p>
            <p>
              Thanks to Shayne Coplan for reviewing an early version of this.
              Ported from{" "}
              <a
                href="https://benji.org/liveline"
                rel="noopener noreferrer"
                target="_blank"
              >
                Liveline
              </a>{" "}
              by Benji Taylor.
            </p>
          </footer>
        </article>
      </div>
    </div>
  );
}
