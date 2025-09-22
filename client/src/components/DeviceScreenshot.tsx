import React from "react";

type Variant = {
  x1: string; // 1x
  x2: string; // 2x
  x3?: string; // 3x
  width: number;
  height: number;
};

type Props = {
  alt: string;
  mobile: Variant;
  className?: string;
  priority?: boolean;
  showFrame?: boolean;
  frameClassName?: string;
  /** how to choose the asset */
  mode?: "dpr" | "force2x" | "force3x";
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
  mode = "dpr",
}: Props) {
  // Decide source selection strategy
  const useForce2x = mode === "force2x";
  const useForce3x = mode === "force3x" && !!mobile.x3;

  const imgProps: React.ImgHTMLAttributes<HTMLImageElement> = {
    width: mobile.width,
    height: mobile.height,
    alt,
    decoding: priority ? "sync" : "async",
    loading: priority ? "eager" : "lazy",
    draggable: false,
    className:
      "block w-[240px] md:w-[304px] h-auto select-none pointer-events-none",
    style: { transform: "none", imageRendering: "auto" } as React.CSSProperties,
    // @ts-ignore
    ...(priority ? { fetchpriority: "high" } : {}),
  };

  if (useForce3x) {
    imgProps.src = mobile.x3!;
  } else if (useForce2x) {
    imgProps.src = mobile.x2;
  } else {
    imgProps.src = mobile.x1;
    imgProps.srcSet = densitySet(mobile);
  }

  const img = <img {...imgProps} />;

  return (
    <div
      className={(className ? className + " " : "") + "hero-shot inline-flex items-center justify-center"}
    >
      {showFrame ? (
        <span className={frameClassName} aria-hidden="true">
          <span className="rounded-[1.8rem] overflow-hidden block">{img}</span>
        </span>
      ) : (
        img
      )}
    </div>
  );
}