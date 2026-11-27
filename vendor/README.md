# vendor/ — demo-only dependencies

These files power the **glisse liquid-glass island** on the demo page
(`index.html`, section "Liquid glass, for real"). They are **not** part of the
captier library itself — the library stays dependency-free and under 2 KB.

- `react.mjs`, `jsx-runtime.mjs`, `react-dom.mjs`, `react-dom-client.mjs`,
  `scheduler.mjs` — **React 19.3.1**, jsDelivr `+esm` builds
  (CJS converted to ESM, minified), with cross-package imports rewritten to
  bare specifiers and resolved by the `importmap` in `index.html`.
- `glisse.mjs` — **glisse 0.6.0** ("Apple's Liquid Glass for the web",
  <https://github.com/0kzh/glisse>), same treatment. Its styles are inlined
  in the bundle and injected at runtime, so no separate CSS file is needed.

The island is loaded **lazily and only when the tier is `high`**
(`Captier.tier() === "high"`): on `low`/`mid` none of these files is ever
fetched. To update, re-download the `+esm` builds and re-apply the rewrites.
