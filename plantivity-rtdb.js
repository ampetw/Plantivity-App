/**
 * Community sync uses Firebase Realtime Database REST (CORS-friendly).
 *
 * Create a Realtime Database in the Firebase console, then set rules so
 * `plantivity/profiles` is readable and each client can write its own key
 * (test rules for a class demo):
 *
 * {
 *   "rules": {
 *     "plantivity": {
 *       "profiles": {
 *         ".read": true,
 *         ".write": true
 *       }
 *     }
 *   }
 * }
 *
 * If the default project URL is not yours, change it below to the
 * "database URL" shown in Firebase (no trailing slash).
 */
if (typeof window.PLANTIVITY_RTDB_URL === "undefined") {
  window.PLANTIVITY_RTDB_URL =
    "https://plantivity-64869-default-rtdb.firebaseio.com"; // <-- Corrected URL
}

