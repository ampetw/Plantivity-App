/* Time-of-day sky tint for My Garden + Public Garden. */
(function () {
  "use strict";

  function getPhase(d) {
    var h = d.getHours() + d.getMinutes() / 60;
    // Simple local-time buckets (user’s timezone).
    // night: 20:00–05:00, sunrise: 05:00–08:00, day: 08:00–17:00, sunset: 17:00–20:00
    if (h >= 20 || h < 5) return "night";
    if (h >= 5 && h < 8) return "sunrise";
    if (h >= 8 && h < 17) return "day";
    return "sunset";
  }

  function apply() {
    // Only on garden screens that have the background stack.
    if (!document.querySelector(".index-main .index-bg-stack")) return;

    var phase = getPhase(new Date());
    var body = document.body;
    if (!body) return;

    body.classList.remove("sky-day", "sky-sunset", "sky-night", "sky-sunrise");
    body.classList.add("sky-" + phase);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", apply);
  } else {
    apply();
  }

  // Re-evaluate periodically (covers crossing sunrise/sunset while open).
  window.setInterval(apply, 5 * 60 * 1000);
})();

