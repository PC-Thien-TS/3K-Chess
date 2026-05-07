import { OnlineWarRoom, Faction, OnlineRoomSlot } from './types';
import { CreateRoomPayload, JoinRoomPayload, JoinSlotPayload, SlotActionPayload, AddBotPayload, SetReadyPayload, SubmitMovePayload } from './protocol';
import { DEFAULT_GAME_MODE, GAME_MODE_RULESETS } from '../shared/gameModes';

/**
 * TODO: Backend v2 - Implement server-authoritative chess rule validation.
 * Currently, moves are validated by the client and broadcasted by the server.
 */

class RoomManager {
  private rooms: Map<string, OnlineWarRoom> = new Map();

  createRoom(payload: CreateRoomPayload, clientId: string): OnlineWarRoom {
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const gameMode = payload.gameMode || DEFAULT_GAME_MODE;
    
    const slots: OnlineWarRoom['slots'] = {
      Shu: { faction: 'Shu', occupantType: 'empty', ready: false },
      Wei: { faction: 'Wei', occupantType: 'empty', ready: false },
      Wu: { faction: 'Wu', occupantType: 'empty', ready: false }
    };

    slots[payload.preferredFaction as Exclude<Faction, 'None'>] = {
      faction: payload.preferredFaction,
      occupantType: 'human',
      playerName: payload.hostName,
      clientId: clientId,
      ready: true
    };

    if (payload.allowBots) {
      (Object.keys(slots) as Exclude<Faction, 'None'>[]).forEach(f => {
        if (f !== payload.preferredFaction) {
          slots[f] = {
            faction: f,
            occupantType: 'bot',
            botDifficulty: payload.botDifficultyDefault,
            ready: true
          };
        }
      });
    }

    const room: OnlineWarRoom = {
      roomCode,
      hostName: payload.hostName,
      hostClientId: clientId,
      createdAt: new Date().toISOString(),
      status: 'waiting',
      slots,
      roomRules: {
        ruleset: GAME_MODE_RULESETS[gameMode],
        gameMode,
        allowBots: payload.allowBots,
        botDifficultyDefault: payload.botDifficultyDefault
      }
    };

    this.rooms.set(roomCode, room);
    return room;
  }

  getRoom(roomCode: string): OnlineWarRoom | null {
    const normalized = roomCode.toUpperCase();
    return this.rooms.get(normalized) || null;
  }

  joinRoom(payload: JoinRoomPayload, clientId: string): OnlineWarRoom {
    const room = this.getRoom(payload.roomCode);
    if (!room) throw new Error("Chamber not found in active archives.");
    
    // Check if clientId is already in a slot
    const existingSlot = (['Shu', 'Wei', 'Wu'] as const).find(f => room.slots[f].clientId === clientId);
    if (existingSlot) {
      return room; // Already in a slot, just return the state
    }

    // Automatically try to join an empty slot if possible
    const firstEmpty = (['Shu', 'Wei', 'Wu'] as const).find(f => room.slots[f].occupantType === 'empty');
    if (firstEmpty) {
      room.slots[firstEmpty] = {
        faction: firstEmpty,
        occupantType: 'human',
        playerName: payload.playerName,
        clientId: clientId,
        ready: false
      };
    }

    return room;
  }

  joinSlot(payload: JoinSlotPayload, clientId: string): OnlineWarRoom {
    const room = this.getRoom(payload.roomCode);
    if (!room) throw new Error("Strategic Chamber not found");
    
    const slot = room.slots[payload.faction as Exclude<Faction, 'None'>];
    if (slot.occupantType !== 'empty') throw new Error("Sector already occupied");

    room.slots[payload.faction as Exclude<Faction, 'None'>] = {
      faction: payload.faction,
      occupantType: 'human',
      playerName: payload.playerName,
      clientId: clientId,
      ready: false
    };

    return room;
  }

  leaveSlot(payload: SlotActionPayload, clientId: string): OnlineWarRoom {
    const room = this.getRoom(payload.roomCode);
    if (!room) throw new Error("Room not found");
    
    const slot = room.slots[payload.faction as Exclude<Faction, 'None'>];
    if (slot.clientId !== clientId && room.hostClientId !== clientId) throw new Error("Unauthorized tactical adjustment");

    room.slots[payload.faction as Exclude<Faction, 'None'>] = {
      faction: payload.faction,
      occupantType: 'empty',
      ready: false
    };

    return room;
  }

  addBot(payload: AddBotPayload, clientId: string): OnlineWarRoom {
    const room = this.getRoom(payload.roomCode);
    if (!room) throw new Error("Room not found");
    if (room.hostClientId !== clientId) throw new Error("Only host can deploy Strategic Automata");
    if (!room.roomRules.allowBots) throw new Error("Automata prohibited in this chamber");

    room.slots[payload.faction as Exclude<Faction, 'None'>] = {
      faction: payload.faction,
      occupantType: 'bot',
      botDifficulty: payload.difficulty,
      ready: true
    };

    return room;
  }

  removeBot(payload: SlotActionPayload, clientId: string): OnlineWarRoom {
    const room = this.getRoom(payload.roomCode);
    if (!room) throw new Error("Room not found");
    if (room.hostClientId !== clientId) throw new Error("Only host can rescind Automata");

    room.slots[payload.faction as Exclude<Faction, 'None'>] = {
      faction: payload.faction,
      occupantType: 'empty',
      ready: false
    };

    return room;
  }

  setReady(payload: SetReadyPayload, clientId: string): OnlineWarRoom {
    const room = this.getRoom(payload.roomCode);
    if (!room) throw new Error("Room not found");
    
    const slot = room.slots[payload.faction as Exclude<Faction, 'None'>];
    if (slot.clientId !== clientId) throw new Error("Cannot signal readiness for another commander");

    slot.ready = payload.ready;
    return room;
  }

  startMatch(roomCode: string, clientId: string): OnlineWarRoom {
    const room = this.getRoom(roomCode);
    if (!room) throw new Error("Room not found");
    if (room.hostClientId !== clientId) throw new Error("Only host can initiate the incursion");

    const slots = Object.values(room.slots);
    if (slots.some(s => s.occupantType === 'empty')) throw new Error("All kingdom fronts must be occupied");
    if (slots.some(s => !s.ready)) throw new Error("All commanders must signal readiness");
    
    const humanCount = slots.filter(s => s.occupantType === 'human').length;
    if (humanCount === 0) throw new Error("Strategic Error: Zero human commanders present");

    room.status = 'playing';
    return room;
  }

  leaveRoom(clientId: string): { roomCode: string; room: OnlineWarRoom | null } | null {
    for (const [code, room] of this.rooms.entries()) {
      let changed = false;
      const factions = Object.keys(room.slots) as Exclude<Faction, 'None'>[];
      
      factions.forEach(f => {
        if (room.slots[f].clientId === clientId) {
          room.slots[f] = {
            faction: f,
            occupantType: 'empty',
            ready: false
          };
          changed = true;
        }
      });
      
      if (changed) {
        if (room.hostClientId === clientId) {
          const nextHuman = Object.values(room.slots).find(s => s.occupantType === 'human');
          if (nextHuman && nextHuman.clientId) {
            room.hostClientId = nextHuman.clientId;
            room.hostName = nextHuman.playerName || "New Strategist";
          } else {
            this.rooms.delete(code);
            return { roomCode: code, room: null };
          }
        }
        return { roomCode: code, room };
      }
    }
    return null;
  }
}

export const roomManager = new RoomManager();
