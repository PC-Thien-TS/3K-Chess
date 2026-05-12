# Three Kingdoms Chess: WebSocket Backend v1

This documentation outlines the minimal WebSocket backend implemented for online room synchronization.

## Technology Stack
- **Server:** Node.js + Express
- **Real-time:** Socket.io
- **Development Loader:** tsx (TypeScript Execute)
- **Integration:** runs alongside the Vite frontend on `http://localhost:5173`, with the backend on `http://localhost:8787`

## How to Run
The project is configured as a full-stack application.
1. Install dependencies: `npm install`
2. Start the frontend: `npm run dev`
3. Start the WebSocket backend: `npm run server`
4. For local Classic online play, point the frontend to:

```env
VITE_WS_URL=http://localhost:8787
```

## WebSocket Protocol
The communication uses defined messages in `server/protocol.ts`.

### Client to Server
- `CREATE_ROOM`: Establishes a new tactical chamber.
- `JOIN_ROOM`: Accesses a chamber by code.
- `JOIN_SLOT`: Occupies a specific kingdom front (Shu/Wei/Wu).
- `LEAVE_SLOT`: Vacates a kingdom front.
- `ADD_BOT` / `REMOVE_BOT`: Host-only commands to manage AI agents.
- `SET_READY`: Signals readiness for incursion.
- `START_MATCH`: Host-only command to begin the battle.
- `SUBMIT_MOVE`: Submits a Classic move for server-side validation and broadcast.
- `REQUEST_ROOM_SNAPSHOT`: Restores lobby state during refresh or reconnect.
- `REQUEST_MATCH_SNAPSHOT`: Restores live Classic match state during refresh or reconnect.

### Server to Client
- `ROOM_CREATED` / `ROOM_JOINED`: Confirmation of entry.
- `ROOM_STATE`: Full synchronization of the room's tactical layout.
- `ROOM_SNAPSHOT`: Lobby snapshot recovery payload.
- `MATCH_STARTED`: Broadcast to initialize the battlefield.
- `MATCH_SNAPSHOT`: Live board snapshot recovery payload.
- `MOVE_BROADCAST`: Relays validated maneuvers to all clients.
- `PLAYER_LEFT`: Notification of a commander's departure.
- `ERROR`: Feedback on unauthorized or invalid strategic actions.

## Authority Model
- The backend is authoritative for Classic online move submission.
- Before broadcasting a move, it validates room existence, room membership, faction ownership, turn order, duplicate move ids, and Classic move legality against the authoritative server board state.
- Reconnect restoration is playerName/session based. There is no strong authentication layer yet.

## Limitations & Current Scope
- **Storage:** In-memory only. Rooms are lost if the server restarts.
- **Authentication:** no accounts, no strong identity, and no database persistence yet.
- **Bots:** Tactical Bots are driven by the Host client.
- **Connection:** Designed for development and private testing.
- **Mode scope:** Modern 3K remains local-only and does not use this backend.

## Future Roadmap (Backend v2)
- Persistent room archives (Firestore/Database).
- Turn-based timeout enforcement.
- Integrated Chat system.
- Spectator mode support.
