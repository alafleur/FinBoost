
import React from "react";

/**
 * DeviceScreenshot v2
 * - Width descriptors (240w/480w/720w, 304w/608w)
 * - Explicit sizes so the browser picks the correct asset
 * - Locks CSS width to 240px (mobile) / 304px (md+)
 * - No transforms on the bitmap; bezel drawn outside
 */

export type Variant = {
  x1: string;   // 1x asset (e.g., 240×431 or 304×547)
  x2: string;   // 2x asset (e.g., 480×862 or 608×1094)
  x3?: string;  // 3x asset (e.g., 720×1293)
  width: number;
  height: number;
};

type Props = {
  alt: string;
  mobile: Variant;   // base 240×431
  desktop: Variant;  // base 304×547
  className?: string;
  priority?: boolean;
  showFrame?: boolean;
  frameClassName?: string;
};

function buildWidthSet(v: Variant) {
  const parts = [`${v.x1} ${v.width}w`, `${v.x2} ${v.width * 2}w`];
  if (v.x3) parts.push(`${v.x3} ${v.width * 3}w`);
  return parts.join(", ");
}

export default function DeviceScreenshot({
  alt,
  mobile,
  desktop,
  className = "",
  priority = false,
  showFrame = true,
  frameClassName = "rounded-[2.2rem] border border-slate-200 bg-white p-2",
}: Props) {
  const imgEl = (
    <img
      src={mobile.x1}
      srcSet={buildWidthSet(mobile)}
      sizes="(min-width: 768px) 304px, 240px"
      width={mobile.width}
      height={mobile.height}
      alt={alt}
      decoding={priority ? "sync" : "async"}
      loading={priority ? "eager" : "lazy"}
      {...(priority ? { /* @ts-ignore */ fetchpriority: "high" } : {})}
      className="block w-[240px] md:w-[304px] h-auto select-none pointer-events-none"
      style={{ imageRendering: "auto" }}
      draggable={false}
    />
  );

  return (
    <picture className={className}>
      <source media="(min-width: 768px)" srcSet={buildWidthSet(desktop)} sizes="304px" />
      {showFrame ? (
        <span className={`inline-flex ${frameClassName}`} aria-hidden="true">
          <span className="rounded-[1.9rem] overflow-hidden">{imgEl}</span>
        </span>
      ) : (
        imgEl
      )}
    </picture>
  );
}
