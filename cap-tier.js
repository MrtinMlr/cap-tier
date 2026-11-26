/*! cap-tier v0.1 — tiny capability-tier switch (<2 KB).
 * Sets data-tier="low|mid|high" on <html> BEFORE first paint, so CSS
 * can kill blur/animations/3D and JS can skip heavy imports entirely.
 * Initial tier: static signals (Chromium-only ones guarded). Then a
 * runtime FPS check can only DOWNGRADE — never flicker upward.
 * Manual override wins: ?cap=low|mid|high, localStorage "cap-tier",
 * or window.CapTier.set("low"). Respects prefers-reduced-motion.
 * CapTier.recheck() re-runs the FPS check on demand (e.g. after a
 * heavy view opens). No dependencies, no network, no fingerprinting
 * beyond what the browser already exposes. MIT — prototype, not
 * production-hardened. */
(function () {
  var d = document.documentElement, KEY = "cap-tier";
  function param() { try { return new URLSearchParams(location.search).get("cap"); } catch (e) { return null; } }
  function stored() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function valid(t) { return t === "low" || t === "mid" || t === "high" ? t : null; }
  function apply(t) { d.setAttribute("data-tier", t); d.classList.remove("cap-low", "cap-mid", "cap-high"); d.classList.add("cap-" + t); }
  function guess() {
    var n = navigator, cores = n.hardwareConcurrency || 4, mem = n.deviceMemory || 4;
    var slowNet = (n.connection && (n.connection.saveData || /^(slow-2g|2g)$/.test(n.connection.effectiveType || "")));
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || slowNet) return "low";
    if (cores <= 4 && mem <= 2) return "low";
    if (cores <= 6 || mem <= 4) return "mid";
    return "high";
  }
  var tier = valid(param()) || valid(stored()) || guess(), locked = !!(valid(param()) || valid(stored()));
  apply(tier);
  // Runtime check: ~2 s of rAF; <30 fps avg => drop one tier. Downgrade only.
  var sampling = false;
  function sample() {
    if (locked || tier === "low" || sampling) return;
    sampling = true;
    var frames = 0, start = 0;
    function tick(ts) {
      if (!start) start = ts;
      frames++;
      if (ts - start < 2000) return requestAnimationFrame(tick);
      sampling = false;
      if (frames / ((ts - start) / 1000) < 30) { tier = tier === "high" ? "mid" : "low"; apply(tier); }
    }
    requestAnimationFrame(tick);
  }
  window.CapTier = {
    tier: function () { return tier; },
    set: function (t) { t = valid(t); if (!t) return; tier = t; locked = true; try { localStorage.setItem(KEY, t); } catch (e) {} apply(t); },
    recheck: function () { sample(); }
  };
  addEventListener("load", function () { sample(); });
})();
