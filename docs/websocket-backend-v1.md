# Three Kingdoms Chess: WebSocket Backend v1

This documentation outlines the minimal WebSocket backend implemented for online room synchronization.

## Technology Stack
- **Server:** Node.js + Express
- **Real-time:** Socket.io
- **Development Loader:** tsx (TypeScript Execute)
- **Integration:** Runs alongside Vite on port 3000

## How to Run
The project is configured as a full-stack application.
1. Install dependencies: `npm install`
2. Start development server: `npm run dev`
   - Start the frontend with `npm run dev` and the WebSocket backend with `npm run server:dev`.

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
- `SUBMIT_MOVE`: Broadcasts a legal move to all other commanders.

### Server to Client
- `ROOM_CREATED` / `ROOM_JOINED`: Confirmation of entry.
- `ROOM_STATE`: Full synchronization of the room's tactical layout.
- `MATCH_STARTED`: Broadcast to initialize the battlefield.
- `MOVE_BROADCAST`: Relays enemy maneuvers to all clients.
- `PLAYER_LEFT`: Notification of a commander's departure.
- `ERROR`: Feedback on unauthorized or invalid strategic actions.

## Limitations & Current Scope
- **Storage:** In-memory only. Rooms are lost if the server restarts.
- **Authentication:** None. Identity is derived from Socket IDs and provided names.
- **Rules:** No server-authoritative chess rule validation in v1. Rules are enforced by the client engine.
- **Bots:** Tactical Bots are driven by the Host client.
- **Connection:** Designed for development and private testing.

## Future Roadmap (Backend v2)
- Server-authoritative move validation.
- Persistent room archives (Firestore/Database).
- Turn-based timeout enforcement.
- Integrated Chat system.
- Spectator mode support.
