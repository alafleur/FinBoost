HeroLearnToEarn.tsx (drop-in)

1) Place this file at:
   client/src/components/HeroLearnToEarn.tsx

2) No other files need changes. HomeV3.tsx can keep its current import/usage.

What this fixes
- Locks the screenshot to EXACT sizes: 240×431 (mobile) and 304×547 (desktop).
- Uses width-based srcSet (240/480/304/608) with sizes="(min-width:1024px) 304px, 240px".
- Recreates the frameless mockup, vertical subject chips, and ticket badge.
- Keeps headline first on mobile and centers the screenshot.

If chips need nudging: adjust the class on the chips container (-left-40 top-6).
