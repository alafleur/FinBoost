# Hero Section Update — Drop-in Files

This package contains **only** the new/updated hero-related components so we don't touch the rest of your landing page.

**Files included**
```
client/src/components/HeroLearnToEarn.tsx
client/src/components/EarlyAccessGuarantee.tsx
```

## How to apply

1) Copy both files into your project at the same paths:
```
client/src/components/HeroLearnToEarn.tsx
client/src/components/EarlyAccessGuarantee.tsx
```

> Your existing `HomeV3.tsx` already imports these components. No other edits should be necessary. If you previously inlined the hero, keep the imports and remove the old markup.

2) (Optional) Preload the LCP hero image. Add this to `index.html` inside `<head>`:

```html
<link rel="preload" as="image" href="/assets/screenshots/step1_m240.png"
  imagesrcset="/assets/screenshots/step1_m240.png 240w, /assets/screenshots/step1_m480.png 480w, /assets/screenshots/step1_s304.png 304w, /assets/screenshots/step1_s608.png 608w"
  imagesizes="(min-width:1024px) 304px, 240px"
  fetchpriority="high">
```

3) (Optional) Remove noisy debug logs in the "How it works" phone preview inside `HomeV3.tsx` (`onLoad` handler printing "PIXEL-PERFECT TEST"). That code isn't harmful, but it's best to keep production logs clean.

## Notes

- We kept **one `<h1>`** on the page and moved the rest of headings to `<h2>` for SEO and a11y.
- Phone image uses width-based `srcSet` + exact `sizes` so screenshots stay crisp on mobile & desktop, including retina.
- All animations are **opacity/translate only** to avoid any resampling blur.
- Styling uses your existing blue→indigo gradient tokens and rounded-XL/2XL radii to match the rest of the page.
