export type { OnlineWarRoom };
import { Faction, OnlineWarRoom } from './types';

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

export interface CreateRoomPayload {
  hostName: string;
  preferredFaction: Faction;
  allowBots: boolean;
  botDifficultyDefault: "easy" | "normal" | "hard";
}

export interface JoinRoomPayload {
  roomCode: string;
  playerName: string;
}

export interface SlotActionPayload {
  roomCode: string;
  faction: Faction;
}

export interface JoinSlotPayload extends SlotActionPayload {
  playerName: string;
}

export interface AddBotPayload extends SlotActionPayload {
  difficulty: "easy" | "normal" | "hard";
}

export interface SetReadyPayload extends SlotActionPayload {
  ready: boolean;
}

export interface SubmitMovePayload {
  roomCode: string;
  move: any; 
  clientGameState?: {
    currentTurn: any;
    eliminatedFactions: any[];
    winner: any;
    status: string;
  };
}
