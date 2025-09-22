
import React from "react";

/**
 * DeviceScreenshot (simple, density descriptors)
 * - Uses 1x/2x/3x (DPR-based) selection
 * - Locks render width to 240px (mobile) / 304px (md+)
 * - No <picture/>, no transforms on the bitmap
 * - Exported as default DeviceScreenshot (matches existing imports)
 */

type Variant = {
  x1: string; // 1x asset
  x2: string; // 2x asset
  x3?: string; // 3x asset
  width: number;   // intrinsic width of 1x (e.g., 240)
  height: number;  // intrinsic height of 1x (e.g., 431)
};

type Props = {
  alt: string;
  mobile: Variant;
  className?: string;
  priority?: boolean;
  showFrame?: boolean;
  frameClassName?: string;
};

function densitySet(v: Variant) {
  const out = [`${v.x1} 1x`, `${v.x2} 2x`];
  if (v.x3) out.push(`${v.x3} 3x`);
  return out.join(", ");
}

export default function DeviceScreenshot({
  alt,
  mobile,
  className = "",
  priority = true,
  showFrame = true,
  frameClassName = "rounded-[2rem] border border-slate-200 bg-white p-2 shadow-sm",
}: Props) {
  const img = (
    <img
      src={mobile.x1}
      srcSet={densitySet(mobile)}
      width={mobile.width}
      height={mobile.height}
      alt={alt}
      decoding={priority ? "sync" : "async"}
      loading={priority ? "eager" : "lazy"}
      {...(priority ? { /* @ts-ignore */ fetchpriority: "high" } : {})}
      className="block w-[240px] md:w-[304px] h-auto select-none pointer-events-none"
      draggable={false}
      style={{ transform: "none", imageRendering: "auto" }}
    />
  );

  return (
    <div className={(className ? className + " " : "") + "hero-shot inline-flex items-center justify-center"}>
      {showFrame ? (
        <span className={frameClassName} aria-hidden="true">
          <span className="rounded-[1.8rem] overflow-hidden block">
            {img}
          </span>
        </span>
      ) : (
        img
      )}
    </div>
  );
}
