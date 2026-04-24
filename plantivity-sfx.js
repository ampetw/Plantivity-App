/* Plantivity sound effects (no audio files needed).
   - Flower clicks: short happy tune (~1s)
   - Button clicks: leaf-crunch
*/
(function () {
  "use strict";

  var AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;

  var ctx = null;
  var master = null;

  function ensureAudio() {
    if (!ctx) {
      ctx = new AudioCtx();
      master = ctx.createGain();
      master.gain.value = 0.7;
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") {
      // Resume is required on iOS until user interaction; we're already in a click.
      ctx.resume().catch(function () {});
    }
  }

  function now() {
    return ctx.currentTime;
  }

  function playFlowerNote() {
    ensureAudio();
    if (!ctx || !master) return;

    var t0 = now();

    // Pick a pleasant note each click (C major pentatonic-ish).
    var choices = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5]; // C5 D5 E5 G5 A5 C6
    var freq = choices[Math.floor(Math.random() * choices.length)];

    var filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2600, t0);
    filter.Q.setValueAtTime(0.8, t0);
    filter.connect(master);

    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = "triangle";

    var dur = 0.22;
    osc.frequency.setValueAtTime(freq, t0);
    // tiny “pluck” drop
    osc.frequency.exponentialRampToValueAtTime(freq * 0.994, t0 + dur);

    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.22, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    osc.connect(gain);
    gain.connect(filter);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  }

  function playCongratsTune() {
    ensureAudio();
    if (!ctx || !master) return;

    var t0 = now();

    // 4-ish second “victory” phrase: C major with a gentle arpeggio + cadence.
    // (kept simple so it sounds good with WebAudio synths)
    var seq = [
      // freq, startOffset, length, gain
      [523.25, 0.0, 0.32, 0.22], // C5
      [659.25, 0.26, 0.32, 0.22], // E5
      [783.99, 0.52, 0.32, 0.22], // G5
      [1046.5, 0.78, 0.42, 0.24], // C6

      [987.77, 1.18, 0.26, 0.18], // B5
      [880.0, 1.40, 0.28, 0.18], // A5
      [783.99, 1.64, 0.32, 0.18], // G5
      [659.25, 1.92, 0.34, 0.18], // E5

      [783.99, 2.24, 0.30, 0.20], // G5
      [880.0, 2.50, 0.30, 0.20], // A5
      [987.77, 2.76, 0.30, 0.20], // B5
      [1046.5, 3.02, 0.60, 0.26], // C6 hold
    ];

    var filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2600, t0);
    filter.Q.setValueAtTime(0.75, t0);
    filter.connect(master);

    for (var i = 0; i < seq.length; i += 1) {
      var n = seq[i];
      var freq = n[0];
      var start = t0 + n[1];
      var len = n[2];
      var peak = n[3];
      var end = start + len;

      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = "triangle";

      osc.frequency.setValueAtTime(freq, start);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.996, end);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(peak, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);

      osc.connect(gain);
      gain.connect(filter);
      osc.start(start);
      osc.stop(end + 0.04);
    }

    // Soft sparkle layer throughout (very low volume).
    var sparkle = ctx.createOscillator();
    var sparkleGain = ctx.createGain();
    sparkle.type = "sine";
    sparkle.frequency.setValueAtTime(2093.0, t0 + 0.6); // C7-ish
    sparkleGain.gain.setValueAtTime(0.0001, t0 + 0.6);
    sparkleGain.gain.exponentialRampToValueAtTime(0.05, t0 + 0.66);
    sparkleGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 3.9);
    sparkle.connect(sparkleGain);
    sparkleGain.connect(master);
    sparkle.start(t0 + 0.6);
    sparkle.stop(t0 + 4.0);
  }

  function playLeafCrunch() {
    ensureAudio();
    if (!ctx || !master) return;

    var t0 = now();

    // Noise burst (crunch) using a short buffer.
    var sampleRate = ctx.sampleRate;
    var len = Math.floor(sampleRate * 0.16);
    var buf = ctx.createBuffer(1, len, sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < len; i += 1) {
      // Brown-ish noise: random * gentle decay
      var x = (Math.random() * 2 - 1) * (1 - i / len);
      data[i] = x;
    }

    var noise = ctx.createBufferSource();
    noise.buffer = buf;

    var hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.setValueAtTime(700, t0);
    hp.Q.setValueAtTime(0.6, t0);

    var lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(4200, t0);
    lp.Q.setValueAtTime(0.7, t0);

    var crunchGain = ctx.createGain();
    crunchGain.gain.setValueAtTime(0.0001, t0);
    crunchGain.gain.exponentialRampToValueAtTime(0.35, t0 + 0.01);
    crunchGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16);

    noise.connect(hp);
    hp.connect(lp);
    lp.connect(crunchGain);
    crunchGain.connect(master);
    noise.start(t0);
    noise.stop(t0 + 0.18);

    // Low “thunk” body.
    var thunk = ctx.createOscillator();
    var thunkGain = ctx.createGain();
    thunk.type = "sine";
    thunk.frequency.setValueAtTime(120, t0);
    thunk.frequency.exponentialRampToValueAtTime(70, t0 + 0.12);
    thunkGain.gain.setValueAtTime(0.0001, t0);
    thunkGain.gain.exponentialRampToValueAtTime(0.18, t0 + 0.01);
    thunkGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.14);
    thunk.connect(thunkGain);
    thunkGain.connect(master);
    thunk.start(t0);
    thunk.stop(t0 + 0.16);
  }

  function isFlowerClick(target) {
    if (!target) return false;
    return Boolean(
      target.closest(
        ".index-garden-tulip-link, .timer-card--link, .view-timer-flower-stage, .view-timer-flower-hero"
      )
    );
  }

  function isCongratsPage() {
    return Boolean(document.querySelector(".congrats-stack"));
  }

  function tryAutoplayCongrats() {
    if (!isCongratsPage()) return;
    // Attempt immediately; if blocked (suspended), we’ll try on first interaction.
    try {
      playCongratsTune();
    } catch (e) {}

    function onFirstTap() {
      document.removeEventListener("pointerdown", onFirstTap, true);
      document.removeEventListener("touchstart", onFirstTap, true);
      document.removeEventListener("click", onFirstTap, true);
      playCongratsTune();
    }

    document.addEventListener("pointerdown", onFirstTap, true);
    document.addEventListener("touchstart", onFirstTap, true);
    document.addEventListener("click", onFirstTap, true);
  }

  function isButtonClick(target) {
    if (!target) return false;
    if (target.closest(".index-garden-tulip-link, .timer-card--link")) return false;

    // Any semantic button, plus our “image buttons” implemented as links.
    if (target.closest("button")) return true;
    if (
      target.closest(
        ".choose-timer-leaf-link, .index-top-icon-link, .view-timer-delete-link, .index-new-timer-link, .profile-uname-label-btn, .profile-pack-btn, .community-carousel-btn, .community-card-link"
      )
    ) {
      return true;
    }

    return false;
  }

  // Event delegation so it works for dynamically created flower links too.
  document.addEventListener(
    "click",
    function (e) {
      var t = e && e.target ? e.target : null;
      if (!t) return;

      if (isFlowerClick(t)) {
        playFlowerNote();
        return;
      }

      if (isButtonClick(t)) {
        playLeafCrunch();
      }
    },
    { capture: true }
  );

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", tryAutoplayCongrats);
  } else {
    tryAutoplayCongrats();
  }

  // Expose for debugging / manual triggers.
  window.PlantivitySfx = {
    playFlowerNote: playFlowerNote,
    playLeafCrunch: playLeafCrunch,
    playCongratsTune: playCongratsTune,
  };
})();

