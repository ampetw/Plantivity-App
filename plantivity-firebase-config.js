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
  var cfg = window.PLANTIVITY_FIREBASE_CONFIG;
  if (typeof firebase === "undefined" || !cfg || !String(cfg.apiKey || "").trim()) {
    return;
  }
  if (firebase.apps && firebase.apps.length > 0) return;
  firebase.initializeApp(cfg);
  if (cfg.databaseURL) {
    window.PLANTIVITY_RTDB_URL = String(cfg.databaseURL).replace(/\/+$/, "");
  }
})();
