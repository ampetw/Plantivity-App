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

  function playHappyTune() {
    ensureAudio();
    if (!ctx || !master) return;

    var t0 = now();
    var notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
    var dur = 0.95;

    // Soft pluck-like tone: triangle -> lowpass -> envelope
    var filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2400, t0);
    filter.Q.setValueAtTime(0.7, t0);
    filter.connect(master);

    for (var i = 0; i < notes.length; i += 1) {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = "triangle";

      var start = t0 + i * 0.14;
      var end = start + 0.22;

      osc.frequency.setValueAtTime(notes[i], start);
      // quick pitch dip for a “bouncy” feel
      osc.frequency.exponentialRampToValueAtTime(notes[i] * 0.992, end);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.22, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);

      osc.connect(gain);
      gain.connect(filter);
      osc.start(start);
      osc.stop(end + 0.03);
    }

    // Tiny bell sparkle at the end.
    var bellOsc = ctx.createOscillator();
    var bellGain = ctx.createGain();
    bellOsc.type = "sine";
    bellOsc.frequency.setValueAtTime(1567.98, t0 + 0.62); // G6-ish
    bellGain.gain.setValueAtTime(0.0001, t0 + 0.62);
    bellGain.gain.exponentialRampToValueAtTime(0.12, t0 + 0.64);
    bellGain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    bellOsc.connect(bellGain);
    bellGain.connect(master);
    bellOsc.start(t0 + 0.62);
    bellOsc.stop(t0 + dur + 0.03);
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
        playHappyTune();
        return;
      }

      if (isButtonClick(t)) {
        playLeafCrunch();
      }
    },
    { capture: true }
  );

  // Expose for debugging / manual triggers.
  window.PlantivitySfx = {
    playHappyTune: playHappyTune,
    playLeafCrunch: playLeafCrunch,
  };
})();

