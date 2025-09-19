import React from "react";

/**
 * DeviceScreenshot renders a pixel-perfect screenshot without browser resampling blur.
 * Usage:
 *   <DeviceScreenshot
 *     alt="Step 1 — Learn & earn"
 *     mobile={{ x1: step1_m240, x2: step1_m480, width: 240, height: 431 }}
 *     desktop={{ x1: step1_s304, x2: step1_s608, width: 304, height: 547 }}
 *     className="md:rotate-[8deg]" // optional; remove on mobile to keep absolute crispness
 *     priority
 *   />
 *
 * Notes:
 * - Ensure your Tailwind (or CSS) sets exact pixel widths that match these assets (w-[240px] md:w-[304px]).
 * - If you rotate, expect slight softness (transform interpolation). Consider only rotating >= md.
 */

export type Variant = {
  x1: string;   // 1x image (exact CSS render size)
  x2: string;   // 2x image (for DPR=2)
  width: number;
  height: number;
};

type Props = {
  alt: string;
  mobile: Variant;
  desktop: Variant;
  className?: string;
  priority?: boolean; // if true, eager load & high fetch priority for LCP
};

export default function DeviceScreenshot({ alt, mobile, desktop, className, priority }: Props) {
  return (
    <picture className={className}>
      {/* Desktop first: screens >= 768px */}
      <source
        media="(min-width: 768px)"
        srcSet={`${desktop.x1} 1x, ${desktop.x2} 2x`}
      />
      {/* Mobile fallback */}
      <img
        src={mobile.x1}
        srcSet={`${mobile.x1} 1x, ${mobile.x2} 2x`}
        sizes="(min-width: 768px) 304px, 240px"
        width={mobile.width}
        height={mobile.height}
        alt={alt}
        decoding={priority ? "sync" : "async"}
        loading={priority ? "eager" : "lazy"}
        {...(priority && { fetchPriority: "high" })}
        className="block w-[240px] md:w-[304px] h-auto select-none pointer-events-none"
        draggable={false}
      />
    </picture>
  );
}
