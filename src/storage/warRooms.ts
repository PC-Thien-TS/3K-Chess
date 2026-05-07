import { Faction, BotDifficulty } from '../rules/threeKingdomRules';

export type RoomFactionSlot = {
  faction: Faction;
  occupantType: 'empty' | 'human' | 'bot';
  playerName?: string;
  botDifficulty?: BotDifficulty;
  ready: boolean;
};

export interface WarRoom {
  roomCode: string;
  hostName: string;
  createdAt: string;
  status: 'waiting' | 'playing' | 'finished';
  slots: Record<Exclude<Faction, 'None'>, RoomFactionSlot>;
  roomRules: {
    ruleset: '3K_CHESS_STANDARD_V1';
    allowBots: boolean;
    botDifficultyDefault: BotDifficulty;
  };
}

const STORAGE_KEY = 'threeKingdomsChess.warRooms.v1';

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const prefix = ['SHU', 'WEI', 'WU'][Math.floor(Math.random() * 3)];
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${code}`;
}

export function saveWarRoom(room: WarRoom) {
  const rooms = listWarRooms();
  const index = rooms.findIndex(r => r.roomCode === room.roomCode);
  let updated;
  if (index >= 0) {
    updated = [...rooms];
    updated[index] = room;
  } else {
    updated = [room, ...rooms].slice(0, 20);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function getWarRoom(roomCode: string): WarRoom | null {
  const rooms = listWarRooms();
  return rooms.find(r => r.roomCode === roomCode) || null;
}

export function listWarRooms(): WarRoom[] {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  try {
    const raw = JSON.parse(data);
    if (!Array.isArray(raw)) return [];
    // Only return rooms that pass basic validation to avoid UI crashes
    return raw.filter(r => validateWarRoom(r).valid);
  } catch (e) {
    console.error("Corrupt War Room data detected - skipping local archives", e);
    return [];
  }
}

export function deleteWarRoom(roomCode: string) {
  const rooms = listWarRooms();
  const updated = rooms.filter(r => r.roomCode !== roomCode);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function validateWarRoom(room: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!room || typeof room !== 'object') {
    return { valid: false, errors: ["Invalid room reference"] };
  }

  if (!room.roomCode || typeof room.roomCode !== 'string') errors.push("Missing or invalid room code");
  if (!room.hostName) errors.push("Missing host name");
  if (!room.status || !['waiting', 'playing', 'finished'].includes(room.status)) errors.push("Invalid room status");

  const factions: Faction[] = ['Shu', 'Wei', 'Wu'];
  if (!room.slots) {
    errors.push("Missing faction slots container");
  } else {
    factions.forEach(f => {
      const slot = room.slots[f];
      if (!slot) {
        errors.push(`Missing slot for ${f}`);
      } else {
        if (!['empty', 'human', 'bot'].includes(slot.occupantType)) {
          errors.push(`Invalid occupant type for ${f}`);
        }
        if (slot.occupantType === 'human' && !slot.playerName) {
          errors.push(`Human strategist in ${f} lacks a name`);
        }
        if (slot.occupantType === 'bot' && !slot.botDifficulty) {
          errors.push(`Tactical bot in ${f} lacks difficulty setting`);
        }
      }
    });
  }

  if (!room.roomRules || room.roomRules.ruleset !== '3K_CHESS_STANDARD_V1') {
    errors.push("Invalid ruleset configuration");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Mapping helper for starting a match from a War Room.
 * Ensures the room configuration maps correctly to the game engine setup.
 */
export function mapWarRoomToMatchSetup(room: WarRoom) {
  const validation = validateWarRoom(room);
  if (!validation.valid) {
    throw new Error(`Cannot map invalid War Room: ${validation.errors.join(', ')}`);
  }

  const humanCount = Object.values(room.slots).filter(s => s.occupantType === 'human').length;
  if (humanCount === 0) {
    throw new Error("Match requires at least one human strategist.");
  }

  const emptyCount = Object.values(room.slots).filter(s => s.occupantType === 'empty').length;
  if (emptyCount > 0) {
    throw new Error("All faction sectors must be occupied before incursion.");
  }

  const unreadyHumans = Object.values(room.slots).filter(s => s.occupantType === 'human' && !s.ready);
  if (unreadyHumans.length > 0) {
    throw new Error("All human commanders must signal readiness.");
  }

  const factionsConfig: Record<string, { control: 'Human' | 'Bot'; difficulty: BotDifficulty }> = {};
  
  (['Shu', 'Wei', 'Wu'] as const).forEach(f => {
    const slot = room.slots[f];
    factionsConfig[f] = {
      control: slot.occupantType === 'human' ? 'Human' : 'Bot',
      difficulty: slot.botDifficulty || room.roomRules.botDifficultyDefault
    };
  });

  // Default neutral faction
  factionsConfig.None = { control: 'Human', difficulty: 'normal' };

  return {
    factions: factionsConfig,
    primaryKingdom: 'Shu' as Faction
  };
}
