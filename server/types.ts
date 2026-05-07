export type Faction = "Shu" | "Wei" | "Wu" | "None";

export interface OnlineRoomSlot {
  faction: Faction;
  occupantType: "empty" | "human" | "bot";
  clientId?: string;
  playerName?: string;
  botDifficulty?: "easy" | "normal" | "hard";
  ready: boolean;
}

export interface OnlineWarRoom {
  roomCode: string;
  hostClientId: string;
  hostName: string;
  createdAt: string;
  status: "waiting" | "playing" | "finished";
  slots: Record<Exclude<Faction, 'None'>, OnlineRoomSlot>;
  roomRules: {
    ruleset: "3K_CHESS_STANDARD_V1";
    allowBots: boolean;
    botDifficultyDefault: "easy" | "normal" | "hard";
  };
}

export type RoomStatus = "waiting" | "playing" | "finished";
