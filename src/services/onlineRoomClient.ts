import { io, Socket } from "socket.io-client";
import { 
  ClientMessage, 
  ServerMessage, 
  OnlineWarRoom, 
  CreateRoomPayload, 
  JoinRoomPayload, 
  JoinSlotPayload, 
  SlotActionPayload, 
  AddBotPayload, 
  SetReadyPayload, 
  SubmitMovePayload 
} from "../../server/protocol";

type RoomStateCallback = (room: OnlineWarRoom) => void;
type ErrorCallback = (error: string) => void;
type MoveCallback = (payload: SubmitMovePayload) => void;

const WS_NOT_CONFIGURED_MESSAGE = "WebSocket server not configured. Set VITE_WS_URL to enable online rooms.";

const getConfiguredWebSocketUrl = () => {
  const env = (import.meta as any).env as Record<string, string | undefined> | undefined;
  const url = env?.VITE_WS_URL?.trim();
  return url ? url : null;
};

class OnlineRoomClient {
  private socket: Socket | null = null;
  private roomStateListeners: Set<RoomStateCallback> = new Set();
  private errorListeners: Set<ErrorCallback> = new Set();
  private moveListeners: Set<MoveCallback> = new Set();
  private matchStartListeners: Set<RoomStateCallback> = new Set();

  connect() {
    if (this.socket) {
      return { ok: true as const };
    }

    const url = getConfiguredWebSocketUrl();
    if (!url) {
      return { ok: false as const, error: WS_NOT_CONFIGURED_MESSAGE };
    }

    this.socket = io(url);

    this.socket.on("connect", () => {
      console.log("Strategic Command: Connected to War Room Cloud");
    });

    this.socket.on(ServerMessage.ROOM_STATE, (room: OnlineWarRoom) => {
      this.roomStateListeners.forEach(cb => cb(room));
    });

    this.socket.on(ServerMessage.ROOM_CREATED, (room: OnlineWarRoom) => {
      this.roomStateListeners.forEach(cb => cb(room));
    });

    this.socket.on(ServerMessage.ROOM_JOINED, (room: OnlineWarRoom) => {
      this.roomStateListeners.forEach(cb => cb(room));
    });

    this.socket.on(ServerMessage.MATCH_STARTED, (room: OnlineWarRoom) => {
      this.matchStartListeners.forEach(cb => cb(room));
    });

    this.socket.on(ServerMessage.MOVE_BROADCAST, (payload: SubmitMovePayload) => {
      this.moveListeners.forEach(cb => cb(payload));
    });

    this.socket.on(ServerMessage.ERROR, (error: string) => {
      this.errorListeners.forEach(cb => cb(error));
    });

    this.socket.on("connect_error", () => {
      this.errorListeners.forEach(cb =>
        cb(`Unable to reach WebSocket server at ${url}. Check VITE_WS_URL and confirm the backend is running.`),
      );
    });

    this.socket.on("disconnect", () => {
      console.warn("Strategic Command: Disconnected from War Room Cloud");
    });

    return { ok: true as const };
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  createRoom(payload: CreateRoomPayload) {
    this.socket?.emit(ClientMessage.CREATE_ROOM, payload);
  }

  joinRoom(payload: JoinRoomPayload) {
    this.socket?.emit(ClientMessage.JOIN_ROOM, payload);
  }

  joinSlot(payload: JoinSlotPayload) {
    this.socket?.emit(ClientMessage.JOIN_SLOT, payload);
  }

  leaveSlot(payload: SlotActionPayload) {
    this.socket?.emit(ClientMessage.LEAVE_SLOT, payload);
  }

  addBot(payload: AddBotPayload) {
    this.socket?.emit(ClientMessage.ADD_BOT, payload);
  }

  removeBot(payload: SlotActionPayload) {
    this.socket?.emit(ClientMessage.REMOVE_BOT, payload);
  }

  setReady(payload: SetReadyPayload) {
    this.socket?.emit(ClientMessage.SET_READY, payload);
  }

  startMatch(roomCode: string) {
    this.socket?.emit(ClientMessage.START_MATCH, { roomCode });
  }

  submitMove(payload: SubmitMovePayload) {
    this.socket?.emit(ClientMessage.SUBMIT_MOVE, payload);
  }

  leaveRoom(roomCode: string) {
    this.socket?.emit(ClientMessage.LEAVE_ROOM, { roomCode });
  }

  subscribeToRoomState(cb: RoomStateCallback) {
    this.roomStateListeners.add(cb);
    return () => this.roomStateListeners.delete(cb);
  }

  subscribeToMatchStart(cb: RoomStateCallback) {
    this.matchStartListeners.add(cb);
    return () => this.matchStartListeners.delete(cb);
  }

  subscribeToMove(cb: MoveCallback) {
    this.moveListeners.add(cb);
    return () => this.moveListeners.delete(cb);
  }

  subscribeToErrors(cb: ErrorCallback) {
    this.errorListeners.add(cb);
    return () => this.errorListeners.delete(cb);
  }

  get configurationError() {
    return getConfiguredWebSocketUrl() ? null : WS_NOT_CONFIGURED_MESSAGE;
  }

  get isConnected() {
    return this.socket?.connected || false;
  }

  get socketId() {
    return this.socket?.id;
  }
}

export const onlineRoomClient = new OnlineRoomClient();
