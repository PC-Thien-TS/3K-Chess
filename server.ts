import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { ClientMessage, ServerMessage } from "./server/protocol";
import { roomManager } from "./server/roomManager";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock localStorage for server-side execution of shared code
if (typeof global.localStorage === 'undefined') {
  (global as any).localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {}
  };
}

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // WebSocket logic
  io.on("connection", (socket) => {
    console.log(`Command: Client connected [${socket.id}]`);

    socket.on(ClientMessage.CREATE_ROOM, (payload) => {
      try {
        const room = roomManager.createRoom(payload, socket.id);
        socket.join(room.roomCode);
        socket.emit(ServerMessage.ROOM_CREATED, room);
      } catch (err: any) {
        socket.emit(ServerMessage.ERROR, err.message);
      }
    });

    socket.on(ClientMessage.JOIN_ROOM, (payload) => {
      try {
        const room = roomManager.joinRoom(payload, socket.id);
        socket.join(room.roomCode);
        io.to(room.roomCode).emit(ServerMessage.ROOM_STATE, room);
        socket.emit(ServerMessage.ROOM_JOINED, room);
      } catch (err: any) {
        socket.emit(ServerMessage.ERROR, err.message);
      }
    });

    socket.on(ClientMessage.JOIN_SLOT, (payload) => {
      try {
        const room = roomManager.joinSlot(payload, socket.id);
        io.to(room.roomCode).emit(ServerMessage.ROOM_STATE, room);
      } catch (err: any) {
        socket.emit(ServerMessage.ERROR, err.message);
      }
    });

    socket.on(ClientMessage.LEAVE_SLOT, (payload) => {
      try {
        const room = roomManager.leaveSlot(payload, socket.id);
        io.to(room.roomCode).emit(ServerMessage.ROOM_STATE, room);
      } catch (err: any) {
        socket.emit(ServerMessage.ERROR, err.message);
      }
    });

    socket.on(ClientMessage.ADD_BOT, (payload) => {
      try {
        const room = roomManager.addBot(payload, socket.id);
        io.to(room.roomCode).emit(ServerMessage.ROOM_STATE, room);
      } catch (err: any) {
        socket.emit(ServerMessage.ERROR, err.message);
      }
    });

    socket.on(ClientMessage.REMOVE_BOT, (payload) => {
      try {
        const room = roomManager.removeBot(payload, socket.id);
        io.to(room.roomCode).emit(ServerMessage.ROOM_STATE, room);
      } catch (err: any) {
        socket.emit(ServerMessage.ERROR, err.message);
      }
    });

    socket.on(ClientMessage.SET_READY, (payload) => {
      try {
        const room = roomManager.setReady(payload, socket.id);
        io.to(room.roomCode).emit(ServerMessage.ROOM_STATE, room);
      } catch (err: any) {
        socket.emit(ServerMessage.ERROR, err.message);
      }
    });

    socket.on(ClientMessage.START_MATCH, (payload) => {
      try {
        const room = roomManager.startMatch(payload.roomCode, socket.id);
        io.to(room.roomCode).emit(ServerMessage.MATCH_STARTED, room);
      } catch (err: any) {
        socket.emit(ServerMessage.ERROR, err.message);
      }
    });

    socket.on(ClientMessage.SUBMIT_MOVE, (payload) => {
      try {
        const room = roomManager.getRoom(payload.roomCode);
        if (room && room.status === 'playing') {
          // Broadcast move to everyone else in the room
          socket.to(room.roomCode).emit(ServerMessage.MOVE_BROADCAST, payload);
        }
      } catch (err: any) {
        socket.emit(ServerMessage.ERROR, err.message);
      }
    });

    socket.on(ClientMessage.LEAVE_ROOM, (payload) => {
      const result = roomManager.leaveRoom(socket.id);
      if (result) {
        if (result.room) {
          io.to(result.roomCode).emit(ServerMessage.ROOM_STATE, result.room);
        } else {
          io.to(result.roomCode).emit(ServerMessage.PLAYER_LEFT, "Room disbanded");
        }
        socket.leave(result.roomCode);
      }
    });

    socket.on("disconnect", () => {
      const result = roomManager.leaveRoom(socket.id);
      if (result) {
        if (result.room) {
          io.to(result.roomCode).emit(ServerMessage.ROOM_STATE, result.room);
        } else {
          io.to(result.roomCode).emit(ServerMessage.PLAYER_LEFT, "Room disbanded");
        }
      }
      console.log(`Command: Client disconnected [${socket.id}]`);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Command: Server running on http://localhost:${PORT}`);
  });
}

startServer();
