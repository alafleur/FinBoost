# Hero Phone – Pixel‑Perfect Fix (Drop‑in)

This component eliminates the sizing drift by fixing the **inner screen** to exact
pixel sizes (240×431 mobile, 304×547 desktop). The outer frame keeps padding for
the soft bezel, but **no longer controls width** — so padding can’t shrink the screen.

## Install

1) Save `HeroPhone.tsx` to `client/src/components/HeroPhone.tsx`.

2) In `client/src/pages/HomeV3.tsx`:
   - Add at the top:
     ```ts
     import HeroPhone from "@/components/HeroPhone";
     ```
   - Find the existing phone mockup block (the gradient frame with `p-2` and an `<img>` inside)
     and replace that whole block with:
     ```tsx
     <div className="order-2 lg:order-2">
       <HeroPhone shot={screenshots[activeScreenshot]} />
     </div>
     ```
     (Keep the text content block as `order-1` so the headline appears **above** the phone on mobile
     and the phone sits to the **right** on desktop).

3) Make sure your pixel‑perfect assets are available on each screenshot object:
   - `m240` (240×431), `m480` (480×862), `s304` (304×547), `s608` (608×1094).
   If any are missing, the component falls back to `screenshotPath`.

## Why this works

- The inner `<div>` uses `w-[240px] h-[431px] lg:w-[304px] lg:h-[547px]` so the image has a
  **1:1 match** with the actual pixel assets (no browser resampling).
- The outer frame keeps your `p-2` padding and rounded corners, but we **don’t set width on it**,
  so padding never reduces the screen area.
- `sizes="(min-width: 1024px) 304px, 240px"` stays **literal** for Tailwind/SSR correctness.

## Quick QA

- In DevTools (mobile): selected `<img>` should show rendered width **240px**; desktop: **304px**.
- `currentSrc` should be `240w/304w` (or `480w/608w` on retina).
- Headline is **before** the phone on mobile (order-1 vs order-2).

