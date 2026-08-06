import type { SVGProps } from "react";

/** Official-style React atom mark. */
export function ReactLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden
      fill="none"
      height="1em"
      viewBox="-11.5 -10.23174 23 20.46348"
      width="1em"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle cx="0" cy="0" fill="#58C4DC" r="2.05" />
      <g fill="none" stroke="#58C4DC" strokeWidth="1">
        <ellipse rx="11" ry="4.2" />
        <ellipse rx="11" ry="4.2" transform="rotate(60)" />
        <ellipse rx="11" ry="4.2" transform="rotate(120)" />
      </g>
    </svg>
  );
}
