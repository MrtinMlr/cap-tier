---
name: captier
description: Add capability tiers to a website with captier — detect device power (low/mid/high) before first paint and gate blur, heavy animation, 3D, and heavy JS imports so weak devices get a lighter experience. Use when a site uses backdrop-filter, heavy CSS animations, or 3D effects and must stay fast on low-end phones. Install via CDN or local files; no build step, no dependencies.
---

# captier

A 1.8 KB snippet that sets `data-tier="low|mid|high"` on `<html>` **before first paint**, so CSS can turn off expensive effects on weak devices and JS can skip heavy imports entirely. No dependencies, no network, no build step.

## What it does — and what it doesn't

**It does:** measure the visitor's device (CPU cores, RAM, connection, live FPS) and expose the result as one tier, `low` / `mid` / `high`, that CSS and JS can branch on.

**It doesn't:** scan the site, measure page weight, compress images, lazy-load anything, or decide which parts of a page are heavy. **You** decide what is heavy by marking elements with classes or writing `[data-tier]` rules. captier only measures the device; your CSS/JS reacts.

**It doesn't reduce payload.** It gates *effects*, not downloads. It will not fix a 2 MB page — it makes a well-built page cheaper to render on a weak phone.

## Install

Two tags in `<head>`. The script **must** come before your CSS — the tier has to be set before first paint, otherwise users see one flash of heavy effects.

```html
<script src="https://cdn.jsdelivr.net/gh/MrtinMlr/captier@main/captier.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/MrtinMlr/captier@main/captier.css">
```

Or download `captier.js` / `captier.min.js` / `captier.css` from the repo and self-host them. `npm install captier` is not published yet — use the CDN until then.

## Usage — three steps

### 1. Put the script first in `<head>`

Before any render-blocking CSS. If it loads after first paint, the tier still works, but users may see a flash of heavy effects.

### 2. Add the companion CSS after your stylesheet

It maps tiers to plain CSS. Define `--glass-fallback` to choose the solid color low-tier devices get instead of blur:

```css
:root { --glass-fallback: rgba(20, 20, 28, .94); }
```

### 3. Mark what's heavy

Use the built-in classes, or write your own `[data-tier]` rules:

```css
/* Built-in classes: .glass, .anim-heavy, .anim-3d */
[data-tier="low"] .glass { backdrop-filter: none; background: var(--glass-fallback); }
[data-tier="low"] .hero-video { display: none; }
[data-tier="mid"] .marquee { animation: none; }
```

```js
// Skip heavy work entirely on weak devices
if (Captier.tier() !== "low") {
  import("./heavy-3d.js");
}
```

## CSS hooks

| Hook | Behavior |
| --- | --- |
| `.glass` | `backdrop-filter` blur on `mid`/`high`; solid `--glass-fallback` tint on `low` |
| `.anim-heavy` | Animation runs only on `high`; frozen on `low` and `mid` |
| `.anim-3d` | 3D transforms kept on `mid`/`high`; flattened (`transform: none`) on `low` |
| `[data-tier="low"]` | Any custom rule for weak devices |
| `.cap-low` / `.cap-mid` / `.cap-high` | Class on `<html>`, same tiers as `data-tier` |

Tier effects at a glance:

| Tier | Blur | Heavy animation | 3D | Heavy JS imports |
| --- | --- | --- | --- | --- |
| `low` | solid tint | off | off | skip |
| `mid` | kept | off | kept | your call |
| `high` | kept | kept | kept | load |

## JS API

| Call | Does what |
| --- | --- |
| `Captier.tier()` | returns `"low" \| "mid" \| "high"` |
| `Captier.set("low")` | forces a tier, remembers it in `localStorage` |
| `Captier.recheck()` | re-runs the ~2 s FPS check on demand (downgrade-only) |
| `?cap=low` | URL override — handy for testing |

## How the tier is decided

1. **Initial tier (static signals):** `hardwareConcurrency` + `deviceMemory` (+ `saveData` / slow `effectiveType`). `prefers-reduced-motion: reduce` forces `low`. The Chromium-only signals are guarded — other browsers fall back to mid-range defaults.
2. **Runtime check (FPS):** ~2 s of `requestAnimationFrame` sampling after `load`. Average FPS under 30 drops the tier **one level**. It can only downgrade, never upgrade — the page never flickers back to heavy effects. `Captier.recheck()` re-runs the check on demand (e.g. after a heavy view opens).
3. **Manual override wins:** `?cap=low|mid|high`, `localStorage["captier"]`, or `Captier.set()`. An override locks the tier — no FPS downgrade happens while locked.

Thresholds: cores ≤ 4 **and** memory ≤ 2 GB → `low`; cores ≤ 6 **or** memory ≤ 4 GB → `mid`; otherwise `high`.

## Testing

- **Per tier:** open the page with `?cap=low`, `?cap=mid`, `?cap=high` and check each tier looks right. The override locks the tier, so clear it (`localStorage.removeItem("captier")`) before testing the automatic path.
- **The FPS path:** the live demo at <https://mrtinmlr.github.io/captier/> has a stress test — it burns ~45 ms per frame so FPS falls under 30, then `Captier.recheck()` drops the tier one level. Verify the tier drops and never comes back up.
- **What to check on each tier:** no flash of heavy effects on load; glass goes solid on `low`; heavy animations stop on `low`/`mid`; 3D flattens on `low`; heavy JS (3D libraries, video) does not load on `low`; layout does not shift between tiers (only effects change, never layout).
- **Weak-device check:** test on a real low-end Android phone (≤2 GB RAM) when possible — emulators and DevTools throttling do not reproduce real low-end rendering.

## Applying captier to an existing site

1. **Find the heavy effects.** Count `backdrop-filter` uses, list continuous CSS animations, 3D transforms, and heavy JS (3D libraries, canvas, video backgrounds).
2. **Add the script + CSS** (step 1–2 above). No other code changes yet.
3. **Mark the heavy elements** with `.glass` / `.anim-heavy` / `.anim-3d`, or write `[data-tier="low"]` rules for the specific elements. Define `--glass-fallback` to match the site's scrolled-header tint if it has one.
4. **Gate heavy JS** with `if (Captier.tier() !== "low")` around imports that are decoration, not content.
5. **Test all three tiers** with `?cap=` and confirm the design still looks intentional on `low` — flat and calm, not broken.

## Common mistakes

1. **Script after CSS (or at the end of `<body>`).** The tier is set after first paint → users see a flash of heavy effects. Fix: script first in `<head>`.
2. **Using it to hide essential content.** Never gate text, buttons, navigation, or images people need. Gate only decoration: blur, animation, 3D, video backgrounds.
3. **Expecting smaller downloads.** captier does not lazy-load or compress anything. If the page is heavy to *download*, fix the payload separately.
4. **Forgetting `--glass-fallback`.** Without it, low-tier glass falls back to a dark default that may clash with a light theme. Always define it.
5. **Testing only on a strong machine.** The automatic tier on a dev laptop is `high`. Always test with `?cap=low` and `?cap=mid`.
6. **Assuming the tier can go back up.** It can't — downgrade-only by design. If a test needs a fresh start, clear the override and reload.
7. **Relying on `deviceMemory` / `effectiveType` everywhere.** They are Chromium-only. Other browsers get mid-range defaults and rely on the FPS check — don't treat the static signals as universal.

## Reference

- Demo + docs: <https://mrtinmlr.github.io/captier/>
- Repo: <https://github.com/MrtinMlr/captier>
- README (English): <https://github.com/MrtinMlr/captier/blob/main/README.md>
- README (Persian): <https://github.com/MrtinMlr/captier/blob/main/README-fa.md>
