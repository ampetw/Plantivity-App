(function (global) {
  var STORAGE_DEVICE = "plantivityDeviceId";
  var STORAGE_USERNAME = "plantivityProfileUsername";
  var STORAGE_FLOWER = "plantivityProfileFlower";

  var GARDEN_KEYS = [
    { key: "plantivityGardenTulips", flower: "tulip" },
    { key: "plantivityGardenDaisies", flower: "daisy" },
    { key: "plantivityGardenIrises", flower: "iris" },
    { key: "plantivityGardenConeflowers", flower: "coneflower" },
  ];

  var DEFAULT_DURATION_MS = {
    tulip: 60000,
    daisy: 30000,
    iris: 300000,
    coneflower: 600000,
  };

  var FLOWER_IMG = {
    tulip: "assets/tulip_quilt.svg",
    daisy: "assets/daisy_quilt.svg",
    iris: "assets/iris_quilt.svg",
    coneflower: "assets/pink_quilt.svg",
  };

  function useFirebaseSdk() {
    var fb = global.firebase;
    if (!fb || typeof fb.app !== "function") return false;
    try {
      fb.app();
      return true;
    } catch (e) {
      return false;
    }
  }

  function getRtdbRoot() {
    if (useFirebaseSdk()) {
      var url = global.firebase.app().options.databaseURL;
      if (url) return String(url).replace(/\/+$/, "");
    }
    var u =
      global.PLANTIVITY_RTDB_URL && String(global.PLANTIVITY_RTDB_URL).trim();
    if (!u) return "";
    return u.replace(/\/+$/, "");
  }

  function rtdbUrl(path) {
    return getRtdbRoot() + path + ".json";
  }

  function getAuthUid() {
    if (!useFirebaseSdk()) return null;
    var u = global.firebase.auth().currentUser;
    return u && u.uid ? String(u.uid) : null;
  }

  function getMyProfileKey() {
    var uid = getAuthUid();
    if (uid) return uid;
    return getOrCreateDeviceId();
  }

  function safeParseJson(raw) {
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function readGardenList(key) {
    var raw = global.localStorage.getItem(key);
    var parsed = safeParseJson(raw);
    return Array.isArray(parsed) ? parsed : [];
  }

  var GARDEN_REMOTE_KEYS = {
    plantivityGardenTulips: "tulips",
    plantivityGardenDaisies: "daisies",
    plantivityGardenIrises: "irises",
    plantivityGardenConeflowers: "coneflowers",
  };

  function buildGardenCloudPayload() {
    var out = {
      tulips: readGardenList("plantivityGardenTulips"),
      daisies: readGardenList("plantivityGardenDaisies"),
      irises: readGardenList("plantivityGardenIrises"),
      coneflowers: readGardenList("plantivityGardenConeflowers"),
      updatedAt: Date.now(),
    };
    return out;
  }

  function normalizeGardenFromRemote(val) {
    if (!val || typeof val !== "object") {
      return {
        tulips: [],
        daisies: [],
        irises: [],
        coneflowers: [],
        updatedAt: 0,
      };
    }
    function pickArr(key) {
      var a = val[key];
      return Array.isArray(a) ? a : [];
    }
    return {
      tulips: pickArr("tulips"),
      daisies: pickArr("daisies"),
      irises: pickArr("irises"),
      coneflowers: pickArr("coneflowers"),
      updatedAt: val.updatedAt || 0,
    };
  }

  function readListFromGardenObject(garden, localGardenKey) {
    var g = normalizeGardenFromRemote(garden);
    var rk = GARDEN_REMOTE_KEYS[localGardenKey];
    if (!rk) return [];
    var a = g[rk];
    return Array.isArray(a) ? a : [];
  }

  function syncMyGardenToCloud() {
    if (!useFirebaseSdk()) return Promise.resolve();
    var uid = getAuthUid();
    if (!uid) return Promise.resolve();
    var payload = buildGardenCloudPayload();
    return global.firebase
      .database()
      .ref("plantivity/gardens/" + uid)
      .set(payload);
  }

  function loadUserGarden(uid) {
    var id = uid != null ? String(uid).trim() : "";
    if (!id) return Promise.reject(new Error("no_uid"));
    if (useFirebaseSdk()) {
      var cur = global.firebase.auth().currentUser;
      if (!cur) return Promise.reject(new Error("auth_required"));
      return cur
        .getIdToken(false)
        .then(function () {
          return global.firebase
            .database()
            .ref("plantivity/gardens/" + id)
            .once("value");
        })
        .then(function (snap) {
          return normalizeGardenFromRemote(snap.val());
        })
        .catch(function (err) {
          var e = new Error(
            err && err.message ? err.message : "firebase_garden_read_failed"
          );
          if (err && err.code) e.code = err.code;
          return Promise.reject(e);
        });
    }
    var root = getRtdbRoot();
    if (!root) return Promise.reject(new Error("no_rtdb"));
    return global
      .fetch(rtdbUrl("/plantivity/gardens/" + encodeURIComponent(id)), {
        cache: "no-store",
      })
      .then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok) {
            var err = new Error("garden_http");
            err.data = data;
            throw err;
          }
          return normalizeGardenFromRemote(data);
        });
      });
  }

  function sendPasswordResetEmail(email) {
    if (!useFirebaseSdk()) {
      return Promise.reject(new Error("firebase_not_configured"));
    }
    return global.firebase.auth().sendPasswordResetEmail(String(email).trim());
  }

  function itemDurationMs(entry, flowerFallback) {
    if (!entry || typeof entry !== "object") return 0;
    var n = parseInt(entry.durationMs, 10);
    if (!isNaN(n) && n > 0) return n;
    var f = entry.flower || flowerFallback;
    return DEFAULT_DURATION_MS[f] || 0;
  }

  function getGardenStats() {
    var totalFlowers = 0;
    var totalMs = 0;
    for (var i = 0; i < GARDEN_KEYS.length; i += 1) {
      var g = GARDEN_KEYS[i];
      var list = readGardenList(g.key);
      for (var j = 0; j < list.length; j += 1) {
        var it = list[j];
        if (!it || !it.id) continue;
        totalFlowers += 1;
        totalMs += itemDurationMs(it, g.flower);
      }
    }
    return { totalFlowers: totalFlowers, totalMs: totalMs };
  }

  function formatGardenDuration(totalMs) {
    var sec = Math.round(Math.max(0, totalMs) / 1000);
    if (sec <= 0) return "0 sec";

    if (sec < 60) return sec + " sec";

    var m = Math.floor(sec / 60);
    var s = sec % 60;
    if (m < 60) {
      if (s === 0) return m + " min";
      return m + " min " + s + " sec";
    }

    var h = Math.floor(m / 60);
    var rm = m % 60;
    if (rm === 0 && s === 0) return h + (h === 1 ? " hr" : " hrs");
    if (s === 0) return h + " hr " + rm + " min";
    if (rm === 0) return h + " hr " + s + " sec";
    return h + " hr " + rm + " min " + s + " sec";
  }

  function getOrCreateDeviceId() {
    var existing = global.localStorage.getItem(STORAGE_DEVICE);
    if (existing && String(existing).length > 4) return String(existing);
    var id =
      global.crypto && global.crypto.randomUUID
        ? global.crypto.randomUUID()
        : "pv_" + String(Date.now()) + "_" + String(Math.floor(Math.random() * 1e9));
    global.localStorage.setItem(STORAGE_DEVICE, id);
    return id;
  }

  function getProfileUsername() {
    return String(global.localStorage.getItem(STORAGE_USERNAME) || "").trim();
  }

  function setProfileUsername(name) {
    global.localStorage.setItem(STORAGE_USERNAME, String(name || "").trim());
  }

  function getProfileFlower() {
    var f = String(global.localStorage.getItem(STORAGE_FLOWER) || "tulip").toLowerCase();
    if (!FLOWER_IMG[f]) return "tulip";
    return f;
  }

  function setProfileFlower(flower) {
    var f = String(flower || "tulip").toLowerCase();
    if (!FLOWER_IMG[f]) f = "tulip";
    global.localStorage.setItem(STORAGE_FLOWER, f);
  }

  function profilesPayloadFromRtdb(data) {
    if (data === null) return [];
    if (!data || typeof data !== "object") return [];
    if (data.error) return [];
    var out = [];
    var ids = Object.keys(data);
    for (var i = 0; i < ids.length; i += 1) {
      var id = ids[i];
      var row = data[id];
      if (!row || typeof row !== "object") continue;
      var u = String(row.username || "").trim();
      if (!u) continue;
      var fl = String(row.flower || "tulip").toLowerCase();
      if (!FLOWER_IMG[fl]) fl = "tulip";
      out.push({
        deviceId: id,
        username: u,
        flower: fl,
        flowerImg: FLOWER_IMG[fl],
        updatedAt: row.updatedAt || 0,
      });
    }
    out.sort(function (a, b) {
      if (a.username.toLowerCase() !== b.username.toLowerCase()) {
        return a.username.localeCompare(b.username, undefined, {
          sensitivity: "base",
        });
      }
      return String(a.deviceId).localeCompare(String(b.deviceId));
    });
    return out;
  }

  function loadCommunityProfiles() {
    if (useFirebaseSdk()) {
      if (!getAuthUid()) {
        return Promise.reject(new Error("auth_required"));
      }
      return global.firebase
        .database()
        .ref("plantivity/profiles")
        .once("value")
        .then(function (snap) {
          return profilesPayloadFromRtdb(snap.val());
        });
    }

    var root = getRtdbRoot();
    if (!root) {
      return Promise.reject(new Error("no_rtdb"));
    }
    return global
      .fetch(rtdbUrl("/plantivity/profiles"), { cache: "no-store" })
      .then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok) {
            var err = new Error("community_http");
            err.data = data;
            throw err;
          }
          return profilesPayloadFromRtdb(data);
        });
      });
  }

  function upsertMyPublicProfile(options) {
    var rawName =
      options && options.username != null
        ? options.username
        : getProfileUsername();
    var flower = (options && options.flower) || getProfileFlower();
    var trimmed = String(rawName || "").trim();

    if (useFirebaseSdk()) {
      var uid = getAuthUid();
      if (!uid) {
        return Promise.reject(new Error("not_signed_in"));
      }
      var ref = global.firebase.database().ref("plantivity/profiles/" + uid);
      if (!trimmed) {
        return ref.remove();
      }
      return ref.set({
        username: trimmed,
        flower: flower,
        updatedAt: Date.now(),
      });
    }

    var root = getRtdbRoot();
    if (!root) {
      return Promise.resolve();
    }
    var deviceId = getOrCreateDeviceId();
    var childUrl = rtdbUrl("/plantivity/profiles/" + encodeURIComponent(deviceId));

    if (!trimmed) {
      return global.fetch(childUrl, { method: "DELETE", cache: "no-store" }).then(
        function (res) {
          if (!res.ok && res.status !== 404) throw new Error("delete_failed");
        }
      );
    }

    return global
      .fetch(childUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: trimmed,
          flower: flower,
          updatedAt: Date.now(),
        }),
        cache: "no-store",
      })
      .then(function (res) {
        if (!res.ok) {
          return res.json().then(function (body) {
            var err = new Error("put_failed");
            err.data = body;
            throw err;
          });
        }
      });
  }

  function pullRemoteProfileToLocal() {
    var uid = getAuthUid();
    if (!uid || !useFirebaseSdk()) {
      return Promise.resolve();
    }
    return global.firebase
      .database()
      .ref("plantivity/profiles/" + uid)
      .once("value")
      .then(function (snap) {
        var v = snap.val();
        if (v && typeof v === "object") {
          if (v.username != null) setProfileUsername(String(v.username));
          if (v.flower != null) setProfileFlower(String(v.flower));
        }
      });
  }

  function signInWithEmailPassword(email, password) {
    if (!useFirebaseSdk()) {
      return Promise.reject(new Error("firebase_not_configured"));
    }
    return global.firebase
      .auth()
      .signInWithEmailAndPassword(String(email).trim(), String(password));
  }

  function signUpWithEmailPassword(email, password) {
    if (!useFirebaseSdk()) {
      return Promise.reject(new Error("firebase_not_configured"));
    }
    return global.firebase
      .auth()
      .createUserWithEmailAndPassword(String(email).trim(), String(password));
  }

  function signOutFirebase() {
    if (!useFirebaseSdk()) return Promise.resolve();
    return global.firebase.auth().signOut();
  }

  function onAuthStateChanged(cb) {
    if (!useFirebaseSdk()) {
      global.setTimeout(function () {
        cb(null);
      }, 0);
      return function () {};
    }
    return global.firebase.auth().onAuthStateChanged(cb);
  }

  global.PlantivitySocial = {
    useFirebaseSdk: useFirebaseSdk,
    getRtdbRoot: getRtdbRoot,
    getAuthUid: getAuthUid,
    getMyProfileKey: getMyProfileKey,
    FLOWER_IMG: FLOWER_IMG,
    GARDEN_KEYS: GARDEN_KEYS,
    getOrCreateDeviceId: getOrCreateDeviceId,
    getGardenStats: getGardenStats,
    formatGardenDuration: formatGardenDuration,
    getProfileUsername: getProfileUsername,
    setProfileUsername: setProfileUsername,
    getProfileFlower: getProfileFlower,
    setProfileFlower: setProfileFlower,
    flowerImageFor: function (flower) {
      var f = String(flower || "tulip").toLowerCase();
      return FLOWER_IMG[f] || FLOWER_IMG.tulip;
    },
    upsertMyPublicProfile: upsertMyPublicProfile,
    loadCommunityProfiles: loadCommunityProfiles,
    pullRemoteProfileToLocal: pullRemoteProfileToLocal,
    signInWithEmailPassword: signInWithEmailPassword,
    signUpWithEmailPassword: signUpWithEmailPassword,
    signOutFirebase: signOutFirebase,
    onAuthStateChanged: onAuthStateChanged,
    syncMyGardenToCloud: syncMyGardenToCloud,
    loadUserGarden: loadUserGarden,
    readListFromGardenObject: readListFromGardenObject,
    sendPasswordResetEmail: sendPasswordResetEmail,
  };
})(window);
