import React from "react";

/**
 * DeviceScreenshot renders a pixel-perfect screenshot without browser resampling blur.
 *
 * Now supports optional 3x assets for DPR=3 phones (e.g., many iPhones).
 *
 * Usage:
 *   <DeviceScreenshot
 *     alt="Step 1 — Learn & earn"
 *     mobile={{ x1: step1_m240, x2: step1_m480, x3: step1_m720, width: 240, height: 431 }}
 *     desktop={{ x1: step1_s304, x2: step1_s608, x3: step1_s912, width: 304, height: 547 }}
 *     className="md:rotate-[8deg]" // consider removing rotate for absolute crispness
 *     priority
 *   />
 *
 * Notes:
 * - Keep CSS widths exact: w-[240px] md:w-[304px]. Do NOT use percentages.
 * - Provide 3x assets if you want perfect sharpness on DPR=3 devices.
 * - Rotation will always introduce a bit of interpolation; consider no rotation.
 */

export type Variant = {
  x1: string;   // 1x image (exact CSS render size)
  x2: string;   // 2x image (for DPR=2)
  x3?: string;  // 3x image (optional, for DPR=3)
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

function buildSrcSet(v: Variant) {
  const parts = [`${v.x1} 1x`, `${v.x2} 2x`];
  if (v.x3) parts.push(`${v.x3} 3x`);
  return parts.join(", ");
}

export default function DeviceScreenshot({ alt, mobile, desktop, className, priority }: Props) {
  return (
    <picture className={className}>
      {/* Desktop first: screens >= 768px */}
      <source
        media="(min-width: 768px)"
        srcSet={buildSrcSet(desktop)}
      />
      {/* Mobile fallback */}
      <img
        src={mobile.x1}
        srcSet={buildSrcSet(mobile)}
        sizes="(min-width: 768px) 304px, 240px"
        width={mobile.width}
        height={mobile.height}
        alt={alt}
        decoding={priority ? "sync" : "async"}
        loading={priority ? "eager" : "lazy"}
        {...(priority && { fetchPriority: "high" })}
        className="block w-[240px] md:w-[304px] h-auto select-none pointer-events-none will-change-transform"
        draggable={false}
      />
    </picture>
  );
}
