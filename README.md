# cap-tier

**Tiny capability tiers for the web — `low` / `mid` / `high`, under 2 KB.**

A snippet that sets `data-tier="low|mid|high"` on `<html>` **before first paint**, so your CSS can turn off blur, heavy animation and 3D on weak devices — and your JS can skip heavy imports entirely. No dependencies, no network, no build step.

## Why

Mobile web performance is bad on low-end phones, and hundreds of millions of people browse on ≤2 GB Android devices — yet most sites ship the same heavy experience to everyone. Google built this exact idea in 2019 ("adaptive loading", web.dev) and the signals it relies on (`navigator.deviceMemory`, `hardwareConcurrency`, `connection.effectiveType`) are still Chromium-only, so it never became a standard library. The honest version of the idea is narrow: **gate effects, not payload.** This snippet does exactly that, and nothing more. It will not fix a 2 MB page — it makes a well-built page cheaper to render on a weak phone.

## Install

Copy `cap-tier.js` (or `cap-tier.min.js`) and `cap-tier.css` into your project. Put the script in `<head>` **before any render-blocking CSS**, so the tier is set before first paint:

```html
<head>
  <script src="cap-tier.min.js"></script>
  <link rel="stylesheet" href="your-styles.css">
  <link rel="stylesheet" href="cap-tier.css">
</head>
```

## How it works

1. **Initial tier (static signals):** `hardwareConcurrency` + `deviceMemory` (+ `saveData` / slow `effectiveType`). `prefers-reduced-motion: reduce` forces `low`. Chromium-only signals are guarded — on browsers that don't expose them, the defaults assume a mid-range device.
2. **Runtime check (FPS):** ~2 s of `requestAnimationFrame` sampling after `load`. If average FPS is under 30, the tier drops **one level**. It can only downgrade, never upgrade — so the page never flickers back to heavy effects.
3. **Manual override wins:** `?cap=low|mid|high`, `localStorage["cap-tier"]`, or `window.CapTier.set("low")`. An override locks the tier (no FPS downgrade).

```js
CapTier.tier();      // "low" | "mid" | "high"
CapTier.set("low");  // force low, remembers it in localStorage
```

## CSS hooks

The script sets both `data-tier` and a `cap-low` / `cap-mid` / `cap-high` class on `<html>`. The companion stylesheet (`cap-tier.css`) does the obvious thing:

- **low:** blur becomes a solid tint (`--glass-fallback`), heavy animation off, 3D transforms off.
- **mid:** blur kept, heavy animation off.
- **high:** everything as designed.

```css
[data-tier="low"] .glass { backdrop-filter: none; background: var(--glass-fallback, rgba(20,20,24,.92)); }
[data-tier="mid"] .anim-heavy { animation: none; }
```

## Size

| file | bytes |
| --- | --- |
| `cap-tier.js` | 2,305 |
| `cap-tier.min.js` | 1,663 (with license banner) |
| `cap-tier.css` | 648 |

## Status — v0.1, prototype

- Static tier detection is smoke-tested (weak 2-core/2 GB → `low`, strong 8-core/8 GB → `high`, `?cap=low` overrides, `prefers-reduced-motion` and `saveData` force `low`).
- **The FPS downgrade path is written but not yet tested in a real browser.** Don't trust it until it is.
- Not production-hardened. Use it, break it, tell us what happened.

Try it: open [`demo.html`](demo.html) (or the GitHub Pages page) and force tiers with `?cap=low`.

## License

MIT — see [LICENSE](LICENSE).
