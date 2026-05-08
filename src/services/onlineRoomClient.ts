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
  SubmitMovePayload,
  ValidatedSubmitMovePayload
} from "../../server/protocol";

type RoomStateCallback = (room: OnlineWarRoom) => void;
type ErrorCallback = (error: string) => void;
type MoveCallback = (payload: ValidatedSubmitMovePayload) => void;

class OnlineRoomClient {
  private socket: Socket | null = null;
  private roomStateListeners: Set<RoomStateCallback> = new Set();
  private errorListeners: Set<ErrorCallback> = new Set();
  private moveListeners: Set<MoveCallback> = new Set();
  private matchStartListeners: Set<RoomStateCallback> = new Set();

  connect() {
    if (this.socket?.connected) return;

    const wsUrl = (import.meta as any).env.VITE_WS_URL;
    if (!wsUrl) {
      console.warn("Strategic Command: WebSocket URL not configured. Online mode will be restricted.");
      this.errorListeners.forEach(cb => cb("WebSocket server not configured. Online matches are currently unavailable."));
      return;
    }

    this.socket = io(wsUrl);

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

    this.socket.on(ServerMessage.MOVE_BROADCAST, (payload: ValidatedSubmitMovePayload) => {
      this.moveListeners.forEach(cb => cb(payload));
    });

    this.socket.on(ServerMessage.ERROR, (error: string) => {
      this.errorListeners.forEach(cb => cb(error));
    });

    this.socket.on("disconnect", () => {
      console.warn("Strategic Command: Disconnected from War Room Cloud");
    });
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

  get isConnected() {
    return this.socket?.connected || false;
  }

  get socketId() {
    return this.socket?.id;
  }
}

export const onlineRoomClient = new OnlineRoomClient();
