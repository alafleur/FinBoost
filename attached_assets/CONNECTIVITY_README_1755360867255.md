# Connectivity Fix (Vite proxy + HMR on Replit)

## Files
- `client/vite.config.ts` — adds proxy for `/api` and `/socket.io` to `http://localhost:5000`, forces WSS HMR on Replit.
- `client/.env.development` — ensures the app uses relative `/` base for API requests so the proxy handles them.

## Why this fixes ERR_CONNECTION_REFUSED / WebSocket handshake failures
- When the front-end (Vite) and back-end (Express on :5000) run separately, the browser needs a proxy to reach the API from the Vite origin.
- On Replit, HMR needs a secure WebSocket (wss) to port 443. Without it, you get handshake errors.
- These settings align dev server, proxy, and HMR to Replit networking.

## How to apply
1. Put `vite.config.ts` into `client/vite.config.ts` (overwriting if one exists).
2. Put `.env.development` into `client/.env.development`.
3. Restart the Vite dev server (stop & start the front-end) and the Express server.
4. Hard refresh the browser (clear cache if needed).

## Notes
- Your code already calls `/api/...`. Keeping `VITE_API_BASE=/` ensures requests continue to hit the proxy.
- If you don’t use Socket.IO or custom WS paths, you can remove the `/socket.io` proxy block.
