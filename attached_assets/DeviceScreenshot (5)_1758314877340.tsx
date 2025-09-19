import React from "react";

/**
 * DeviceScreenshot renders a pixel‑perfect screenshot without transforms.
 * - Keep the image upright (no rotate) to avoid antialiasing blur.
 * - Supply 1x/2x/3x images that match the fixed CSS width (240px mobile, 304px desktop).
 * - Optional bezel/outline is drawn OUTSIDE the bitmap so it doesn't soften the image.
 */

export type Variant = {
  x1: string;   // 1x image (exact CSS render size)
  x2: string;   // 2x image (for DPR=2)
  x3?: string;  // 3x image (for DPR=3)
  width: number;
  height: number;
};

type Props = {
  alt: string;
  mobile: Variant;
  desktop: Variant;
  className?: string;
  priority?: boolean;
  showFrame?: boolean;          // draws a phone-like bezel/outline
  frameClassName?: string;      // customize bezel (e.g., no shadow)
};

function buildSrcSet(v: Variant) {
  const parts = [`${v.x1} 1x`, `${v.x2} 2x`];
  if (v.x3) parts.push(`${v.x3} 3x`);
  return parts.join(", ");
}

export default function DeviceScreenshot({
  alt,
  mobile,
  desktop,
  className = "",
  priority = false,
  showFrame = true,
  frameClassName = "rounded-[2.2rem] border border-slate-200 bg-white shadow-sm p-2",
}: Props) {
  const imgEl = (
    <img
      src={mobile.x1}
      srcSet={buildSrcSet(mobile)}
      sizes="(min-width: 768px) 304px, 240px"
      width={mobile.width}
      height={mobile.height}
      alt={alt}
      decoding={priority ? "sync" : "async"}
      loading={priority ? "eager" : "lazy"}
      // Use the lowercase attribute the browser understands. Some React versions warn otherwise.
      {...(priority ? { /* @ts-ignore */ fetchpriority: "high" } : {})}
      className="block w-[240px] md:w-[304px] h-auto select-none pointer-events-none"
      style={{ imageRendering: "auto" }}
      draggable={false}
    />
  );

  return (
    <picture className={className}>
      <source media="(min-width: 768px)" srcSet={buildSrcSet(desktop)} />
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