/**
 * Web app values from Firebase: Project settings → Your apps → Web app → Config.
 * Authentication → Sign-in method: enable Email/Password.
 */
window.PLANTIVITY_FIREBASE_CONFIG = {
  apiKey: "AIzaSyAIEJVvzrzlD9Jqz3FiCdsx9lMjqFZCRxo",
  authDomain: "plantivity-64869.firebaseapp.com",
  databaseURL: "https://plantivity-64869-default-rtdb.firebaseio.com",
  projectId: "plantivity-64869",
  storageBucket: "plantivity-64869.firebasestorage.app",
  messagingSenderId: "895511325063",
  appId: "1:895511325063:web:8d685644f12996079f8b22",
  measurementId: "G-GWQ12JP1CK",
};

(function () {
  var root =
    typeof globalThis !== "undefined"
      ? globalThis
      : typeof window !== "undefined"
        ? window
        : typeof self !== "undefined"
          ? self
          : {};
  var cfg = root.PLANTIVITY_FIREBASE_CONFIG;
  if (cfg && cfg.databaseURL) {
    root.PLANTIVITY_RTDB_URL = String(cfg.databaseURL).replace(/\/+$/, "");
  }
  var fb = root.firebase;
  if (typeof fb === "undefined" || !fb || !cfg || !String(cfg.apiKey || "").trim()) {
    return;
  }
  if (fb.apps && fb.apps.length > 0) return;
  try {
    fb.initializeApp(cfg);
  } catch (e) {
    if (typeof console !== "undefined" && console.error) {
      console.error(
        "Plantivity: Firebase initializeApp failed. Copy the web config from Firebase Console → Project settings → Your apps, and ensure this site’s domain is listed under Authentication → Settings → Authorized domains.",
        e
      );
    }
  }
})();
