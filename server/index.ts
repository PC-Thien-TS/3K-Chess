import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { roomManager } from './roomManager';
import { ClientMessage, ServerMessage } from './protocol';

const app = express();
const httpServer = createServer(app);

// CORS Configuration
const defaultOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://3-k-chess.vercel.app'
];

const envOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : [];

const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('TACTICAL BREACH: Origin not allowed by CORS archive'));
    }
  },
  methods: ['GET', 'POST'],
  credentials: true
}));

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const PORT = process.env.PORT || 8787;

// Health Endpoint
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    service: '3k-chess-ws',
    uptime: process.uptime()
  });
});

// WebSocket Integration
io.on('connection', (socket) => {
  console.log(`[Strategic Command] Commander Linked: ${socket.id}`);

  socket.on(ClientMessage.CREATE_ROOM, (payload) => {
    try {
      const room = roomManager.createRoom(payload, socket.id);
      socket.join(room.roomCode);
      socket.emit(ServerMessage.ROOM_CREATED, room);
      console.log(`[Strategic Command] Chamber Established: ${room.roomCode}`);
    } catch (err: any) {
      console.error(`[Strategic Command] CREATE_ROOM Error: ${err.message}`, { id: socket.id, payload });
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
      console.error(`[Strategic Command] JOIN_ROOM Error: ${err.message}`, { id: socket.id, payload });
      socket.emit(ServerMessage.ERROR, err.message);
    }
  });

  socket.on(ClientMessage.JOIN_SLOT, (payload) => {
    try {
      const room = roomManager.joinSlot(payload, socket.id);
      io.to(room.roomCode).emit(ServerMessage.ROOM_STATE, room);
    } catch (err: any) {
      console.error(`[Strategic Command] JOIN_SLOT Error: ${err.message}`, { id: socket.id, payload });
      socket.emit(ServerMessage.ERROR, err.message);
    }
  });

  socket.on(ClientMessage.LEAVE_SLOT, (payload) => {
    try {
      const room = roomManager.leaveSlot(payload, socket.id);
      io.to(room.roomCode).emit(ServerMessage.ROOM_STATE, room);
    } catch (err: any) {
      console.error(`[Strategic Command] LEAVE_SLOT Error: ${err.message}`, { id: socket.id, payload });
      socket.emit(ServerMessage.ERROR, err.message);
    }
  });

  socket.on(ClientMessage.ADD_BOT, (payload) => {
    try {
      const room = roomManager.addBot(payload, socket.id);
      io.to(room.roomCode).emit(ServerMessage.ROOM_STATE, room);
    } catch (err: any) {
      console.error(`[Strategic Command] ADD_BOT Error: ${err.message}`, { id: socket.id, payload });
      socket.emit(ServerMessage.ERROR, err.message);
    }
  });

  socket.on(ClientMessage.REMOVE_BOT, (payload) => {
    try {
      const room = roomManager.removeBot(payload, socket.id);
      io.to(room.roomCode).emit(ServerMessage.ROOM_STATE, room);
    } catch (err: any) {
      console.error(`[Strategic Command] REMOVE_BOT Error: ${err.message}`, { id: socket.id, payload });
      socket.emit(ServerMessage.ERROR, err.message);
    }
  });

  socket.on(ClientMessage.SET_READY, (payload) => {
    try {
      const room = roomManager.setReady(payload, socket.id);
      io.to(room.roomCode).emit(ServerMessage.ROOM_STATE, room);
    } catch (err: any) {
      console.error(`[Strategic Command] SET_READY Error: ${err.message}`, { id: socket.id, payload });
      socket.emit(ServerMessage.ERROR, err.message);
    }
  });

  socket.on(ClientMessage.START_MATCH, (payload) => {
    try {
      const room = roomManager.startMatch(payload.roomCode, socket.id);
      io.to(room.roomCode).emit(ServerMessage.MATCH_STARTED, room);
    } catch (err: any) {
      console.error(`[Strategic Command] START_MATCH Error: ${err.message}`, { id: socket.id, payload });
      socket.emit(ServerMessage.ERROR, err.message);
    }
  });

  socket.on(ClientMessage.SUBMIT_MOVE, (payload) => {
    try {
      const room = roomManager.getRoom(payload.roomCode);
      const joinedSocketRoom = !!room && socket.rooms.has(room.roomCode);
      const { room: validatedRoom, validatedPayload } = roomManager.validateSubmittedMove(payload, socket.id, joinedSocketRoom);
      io.to(validatedRoom.roomCode).emit(ServerMessage.MOVE_BROADCAST, validatedPayload);
    } catch (err: any) {
      console.error(`[Strategic Command] SUBMIT_MOVE Error: ${err.message}`, { id: socket.id, payload });
      socket.emit(ServerMessage.ERROR, err.message);
    }
  });

  socket.on(ClientMessage.LEAVE_ROOM, () => {
    const result = roomManager.leaveRoom(socket.id);
    if (result) {
      if (result.room) {
        io.to(result.roomCode).emit(ServerMessage.ROOM_STATE, result.room);
      } else {
        io.to(result.roomCode).emit(ServerMessage.PLAYER_LEFT, "Dynasty Dissolved");
      }
      socket.leave(result.roomCode);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Strategic Command] Commander Delinked: ${socket.id}`);
    const result = roomManager.leaveRoom(socket.id);
    if (result) {
      if (result.room) {
        io.to(result.roomCode).emit(ServerMessage.ROOM_STATE, result.room);
      } else {
        io.to(result.roomCode).emit(ServerMessage.PLAYER_LEFT, "Dynasty Dissolved");
      }
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`[Strategic Command] 3K Chess WebSocket server listening on port ${PORT}`);
  console.log(`[Strategic Command] Battlefield Cloud active at http://localhost:${PORT}`);
  console.log(`[Strategic Command] Allowed Origins: ${allowedOrigins.join(', ')}`);
});

// Safe Error Logging for unhandled errors
process.on('uncaughtException', (err) => {
  console.error('[Strategic Command] CRITICAL UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Strategic Command] UNHANDLED REJECTION at:', promise, 'reason:', reason);
});
