// ═══════════════════════════════════════════════════════════
//  FILE LOCATION: frontend/src/config/echo.js
// ═══════════════════════════════════════════════════════════
//
//  Laravel Echo client wired to the Reverb WebSocket server.
//
//  This app is JWT-only (Bearer token via the shared `api` axios instance
//  in src/api/axios.js) — no cookies/sessions. Echo's default authorizer
//  would POST to /broadcasting/auth with no auth header, which 401s
//  against our auth:api guard. So every channel here uses a custom
//  `authorizer` that delegates to the shared `api` instance instead —
//  this reuses the same interceptors that attach the current token and
//  silently refresh it on 401, so channel auth never goes stale.
//
// ═══════════════════════════════════════════════════════════

import Echo from "laravel-echo";
import Pusher from "pusher-js";
import api from "../api/axios";

window.Pusher = Pusher;

let echoInstance = null;

function jwtAuthorizer(channel) {
  return {
    authorize(socketId, callback) {
      api
        .post("/broadcasting/auth", {
          socket_id: socketId,
          channel_name: channel.name,
        })
        .then((response) => callback(false, response.data))
        .catch((error) => callback(true, error));
    },
  };
}

/**
 * Create (or return the existing) Echo instance. Call once a token exists
 * — an unauthenticated socket has no private channels to subscribe to.
 */
export function initEcho() {
  if (echoInstance) return echoInstance;

  const port = Number(import.meta.env.VITE_REVERB_PORT) || 443;
  const scheme = import.meta.env.VITE_REVERB_SCHEME || "https";

  echoInstance = new Echo({
    broadcaster: "reverb",
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: port,
    wssPort: port,
    forceTLS: scheme === "https",
    enabledTransports: ["ws", "wss"],
    authorizer: jwtAuthorizer,
  });

  // TEMPORARY DEBUG: expose Echo on window so we can test channel
  // subscriptions directly from the browser console. Remove once the
  // presence-channel 403 investigation is done.
  window.__echoDebug = echoInstance;

  return echoInstance;
}

/** Return the current Echo instance, or null if not yet initialized. */
export function getEcho() {
  return echoInstance;
}

/** Disconnect and clear the Echo instance. Call on logout. */
export function disconnectEcho() {
  if (echoInstance) {
    echoInstance.disconnect();
    echoInstance = null;
  }
}
