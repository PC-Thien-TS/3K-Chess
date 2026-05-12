# Three Kingdoms Chess

Three Kingdoms Chess is a two-mode strategy project built around a 3-player Xiangqi experience:

- `Classic 3-Player Xiangqi`
  - the main mode for local play, online rooms, bots, replay, and archive flows
- `Modern 3K`
  - an Authentic Modern Three Kingdoms Xiangqi local mode with Han court and alliance mechanics

## Modes

### Classic 3-Player Xiangqi
- Local playable
- Online room flow over WebSocket
- Bot support
- Replay support
- Archive support
- Server-authoritative online move validation
- Reconnect and snapshot recovery

### Modern 3K
- Local playable
- Local bot support
- Authentic `SANGUO_YANYI_QI_V1` rules
- Han court, alliance, and check-priority mechanics

## Features

### Classic
- Local practice matches
- Online room creation and join flow
- Human and bot factions
- Replay playback for saved matches
- Local archive for saved/exported records

### Modern 3K
- Local-only setup and play
- Human/Bot control selection for Wu, Wei, and Shu
- Authentic rule enforcement
- Local replay support for saved archive records
- Local UX support for move history, status, and rules help

## Local Setup

### Prerequisites
- Node.js
- npm

### Install

```bash
npm install
```

### Run Frontend

```bash
npm run dev
```

Default Vite frontend:

- `http://localhost:5173`

### Run Backend

```bash
npm run server
```

Default WebSocket backend:

- `http://localhost:8787`

## Environment

For local frontend-to-backend online testing, use:

```env
VITE_WS_URL=http://localhost:8787
```

Local backend defaults:

```env
PORT=8787
CORS_ORIGIN=http://localhost:5173,http://localhost:5174,https://3-k-chess.vercel.app
```

Production backend example:

```env
VITE_WS_URL=https://your-render-backend.onrender.com
```

Notes:

- `VITE_WS_URL` should point at the WebSocket backend origin.
- The frontend can still run without a backend, but Classic online room features will show offline/error states.
- Modern 3K does not use the backend.

## Testing and Verification

Run the current verification suite with:

```bash
npm run test
npm run lint
npm run build
npm run test:e2e
```

What these cover:

- reducer and replay tests
- Authentic rules tests
- Classic online authority and reconnect tests
- Playwright route, local, archive, and Classic online room flows
- TypeScript typecheck
- production build verification

## Deployment

### Frontend
- Deploy on `Vercel`
- SPA fallback is configured in [vercel.json](./vercel.json)

### Backend
- Deploy on `Render` or another Node host
- Start the backend with:

```bash
npm run server
```

Current backend scope:

- server-authoritative validation for Classic online move submission
- reconnect and snapshot recovery
- no database persistence or strong authentication yet

### Health Endpoint

The backend exposes:

- `/health`

Example:

- `https://your-render-backend.onrender.com/health`

Expected response shape:

```json
{
  "ok": true,
  "service": "3k-chess-ws"
}
```

## Online QA Checklist

Use this checklist before shipping Classic online updates:

1. Create a Classic online room.
2. Open a second tab and join the room.
3. Claim a faction slot in each tab.
4. Mark players ready and start the match.
5. Make a human move and verify live sync.
6. Verify bot move sync if bots are enabled.
7. Verify duplicate moves are not applied twice.
8. Verify the wrong faction cannot move.
9. Refresh in the lobby and confirm slot recovery.
10. Refresh during a live board state and confirm snapshot recovery.

## Mode Limitations

### Modern 3K
- Local-only
- Online rooms are not available yet
- Local replay is supported for replay-ready archive records
- Online archive/reconnect flows are not available yet

### Classic
- Online play requires a reachable backend

## Scripts

```bash
npm run dev
npm run server
npm run test
npm run lint
npm run build
```

## Release Notes

Current release state:

- Classic is the full-feature mode: local, online, bot, replay, and archive
- Modern 3K is the authentic local mode: local play plus local bot support
- Frontend is optimized with lazy-loaded routes
- Backend exposes room sync, snapshots, reconnect support, and `/health`
