/**
 * Fallback database URL when you are not using plantivity-firebase-config.js
 * (REST only, no Email auth). Prefer filling PLANTIVITY_FIREBASE_CONFIG there:
 * the same databaseURL is applied automatically after firebase.initializeApp.
 *
 * With Email/Password auth, use Realtime Database rules such as:
 *
 * {
 *   "rules": {
 *     "plantivity": {
 *       "profiles": {
 *         ".read": "auth != null",
 *         "$uid": {
 *           ".write": "auth != null && auth.uid == $uid"
 *         }
 *       }
 *     }
 *   }
 * }
 *
 * Open rules (read/write true on profiles) only for local testing without Auth.
 */
if (typeof window.PLANTIVITY_RTDB_URL === "undefined") {
  window.PLANTIVITY_RTDB_URL =
    "https://plantivity-64869-default-rtdb.firebaseio.com"; // <-- Corrected URL
}

