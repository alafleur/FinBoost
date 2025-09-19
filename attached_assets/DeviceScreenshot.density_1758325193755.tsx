
import React from "react";

/**
 * DeviceScreenshot (density descriptors edition)
 * Use when your @1x/@2x/@3x images are the correct aspect ratio
 * but their pixel widths might not match 240/480/720 exactly.
 */

export type Variant = {
  x1: string;   // 1x asset
  x2: string;   // 2x asset
  x3?: string;  // 3x asset
  width: number;
  height: number;
};

type Props = {
  alt: string;
  mobile: Variant;   // renders 240px wide on mobile
  desktop: Variant;  // renders 304px wide on md+
  className?: string;
  priority?: boolean;
  showFrame?: boolean;
  frameClassName?: string;
};

function buildDensitySet(v: Variant) {
  const parts = [`${v.x1} 1x`, `${v.x2} 2x`];
  if (v.x3) parts.push(`${v.x3} 3x`);
  return parts.join(", ");
}

export default function DeviceScreenshotDensity({
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
      srcSet={buildDensitySet(mobile)}
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
      <source media="(min-width: 768px)" srcSet={buildDensitySet(desktop)} />
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
