import { Faction, BotDifficulty, RecordedMove } from '../src/rules/threeKingdomRules';
import { WarRoom, RoomFactionSlot } from '../src/storage/warRooms';

export enum ClientMessage {
  CREATE_ROOM = 'CREATE_ROOM',
  JOIN_ROOM = 'JOIN_ROOM',
  JOIN_SLOT = 'JOIN_SLOT',
  LEAVE_SLOT = 'LEAVE_SLOT',
  ADD_BOT = 'ADD_BOT',
  REMOVE_BOT = 'REMOVE_BOT',
  SET_READY = 'SET_READY',
  START_MATCH = 'START_MATCH',
  SUBMIT_MOVE = 'SUBMIT_MOVE',
  LEAVE_ROOM = 'LEAVE_ROOM',
}

export enum ServerMessage {
  ROOM_CREATED = 'ROOM_CREATED',
  ROOM_JOINED = 'ROOM_JOINED',
  ROOM_STATE = 'ROOM_STATE',
  MATCH_STARTED = 'MATCH_STARTED',
  MOVE_BROADCAST = 'MOVE_BROADCAST',
  PLAYER_LEFT = 'PLAYER_LEFT',
  ERROR = 'ERROR',
}

export interface OnlineRoomSlot extends RoomFactionSlot {
  clientId?: string;
}

export interface OnlineWarRoom extends Omit<WarRoom, 'slots'> {
  hostClientId: string;
  slots: Record<Exclude<Faction, 'None'>, OnlineRoomSlot>;
}

export interface CreateRoomPayload {
  hostName: string;
  preferredFaction: Exclude<Faction, 'None'>;
  allowBots: boolean;
  botDifficultyDefault: BotDifficulty;
}

export interface JoinRoomPayload {
  roomCode: string;
  playerName: string;
}

export interface SlotActionPayload {
  roomCode: string;
  faction: Exclude<Faction, 'None'>;
}

export interface JoinSlotPayload extends SlotActionPayload {
  playerName: string;
}

export interface AddBotPayload extends SlotActionPayload {
  difficulty: BotDifficulty;
}

export interface SetReadyPayload extends SlotActionPayload {
  ready: boolean;
}

export interface SubmitMovePayload {
  roomCode: string;
  move: RecordedMove;
  clientGameState?: {
    currentTurn: Faction;
    eliminatedFactions: Faction[];
    winner: Faction | null;
    status: 'PLAYING' | 'FINISHED';
  };
}
