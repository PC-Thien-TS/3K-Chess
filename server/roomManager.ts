import { OnlineWarRoom, OnlineRoomSlot, CreateRoomPayload, JoinRoomPayload, JoinSlotPayload, SlotActionPayload, AddBotPayload, SetReadyPayload, SubmitMovePayload } from './protocol';
import { Faction } from '../src/rules/threeKingdomRules';
import { generateRoomCode, validateWarRoom } from '../src/storage/warRooms';

class RoomManager {
  private rooms: Map<string, OnlineWarRoom> = new Map();

  createRoom(payload: CreateRoomPayload, clientId: string): OnlineWarRoom {
    const roomCode = generateRoomCode();
    
    const slots: Record<Exclude<Faction, 'None'>, OnlineRoomSlot> = {
      Shu: { faction: 'Shu', occupantType: 'empty', ready: false },
      Wei: { faction: 'Wei', occupantType: 'empty', ready: false },
      Wu: { faction: 'Wu', occupantType: 'empty', ready: false }
    };

    slots[payload.preferredFaction] = {
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
        ruleset: '3K_CHESS_STANDARD_V1',
        allowBots: payload.allowBots,
        botDifficultyDefault: payload.botDifficultyDefault
      }
    };

    this.rooms.set(roomCode, room);
    return room;
  }

  getRoom(roomCode: string): OnlineWarRoom | null {
    return this.rooms.get(roomCode) || null;
  }

  joinRoom(payload: JoinRoomPayload, clientId: string): OnlineWarRoom {
    const room = this.rooms.get(payload.roomCode);
    if (!room) throw new Error("Chamber not found in active archives.");
    
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
    const room = this.rooms.get(payload.roomCode);
    if (!room) throw new Error("Room not found");
    
    const slot = room.slots[payload.faction];
    if (slot.occupantType !== 'empty') throw new Error("Sector already occupied");

    room.slots[payload.faction] = {
      faction: payload.faction,
      occupantType: 'human',
      playerName: payload.playerName,
      clientId: clientId,
      ready: false
    };

    return room;
  }

  leaveSlot(payload: SlotActionPayload, clientId: string): OnlineWarRoom {
    const room = this.rooms.get(payload.roomCode);
    if (!room) throw new Error("Room not found");
    
    const slot = room.slots[payload.faction];
    if (slot.clientId !== clientId && room.hostClientId !== clientId) throw new Error("Unauthorized slot modification");

    room.slots[payload.faction] = {
      faction: payload.faction,
      occupantType: 'empty',
      ready: false
    };

    return room;
  }

  addBot(payload: AddBotPayload, clientId: string): OnlineWarRoom {
    const room = this.rooms.get(payload.roomCode);
    if (!room) throw new Error("Room not found");
    if (room.hostClientId !== clientId) throw new Error("Only host can deploy bots");
    if (!room.roomRules.allowBots) throw new Error("Bots forbidden in this room");

    room.slots[payload.faction] = {
      faction: payload.faction,
      occupantType: 'bot',
      botDifficulty: payload.difficulty,
      ready: true
    };

    return room;
  }

  removeBot(payload: SlotActionPayload, clientId: string): OnlineWarRoom {
    const room = this.rooms.get(payload.roomCode);
    if (!room) throw new Error("Room not found");
    if (room.hostClientId !== clientId) throw new Error("Only host can rescind bots");

    room.slots[payload.faction] = {
      faction: payload.faction,
      occupantType: 'empty',
      ready: false
    };

    return room;
  }

  setReady(payload: SetReadyPayload, clientId: string): OnlineWarRoom {
    const room = this.rooms.get(payload.roomCode);
    if (!room) throw new Error("Room not found");
    
    const slot = room.slots[payload.faction];
    if (slot.clientId !== clientId) throw new Error("Cannot signal readiness for another");

    slot.ready = payload.ready;
    return room;
  }

  startMatch(roomCode: string, clientId: string): OnlineWarRoom {
    const room = this.rooms.get(roomCode);
    if (!room) throw new Error("Room not found");
    if (room.hostClientId !== clientId) throw new Error("Only host can initiate incursion");

    const slots = Object.values(room.slots);
    if (slots.some(s => s.occupantType === 'empty')) throw new Error("All sectors must be occupied");
    if (slots.some(s => !s.ready)) throw new Error("All commanders must be ready");

    room.status = 'playing';
    return room;
  }

  leaveRoom(clientId: string): { roomCode: string; room: OnlineWarRoom } | null {
    for (const [code, room] of this.rooms.entries()) {
      let changed = false;
      (Object.keys(room.slots) as Exclude<Faction, 'None'>[]).forEach(f => {
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
          // If host leaves, try to assign new host or delete
          const nextHuman = Object.values(room.slots).find(s => s.occupantType === 'human');
          if (nextHuman && nextHuman.clientId) {
            room.hostClientId = nextHuman.clientId;
            room.hostName = nextHuman.playerName || "New Host";
          } else {
            this.rooms.delete(code);
            return { roomCode: code, room: null as any };
          }
        }
        return { roomCode: code, room };
      }
    }
    return null;
  }
}

export const roomManager = new RoomManager();
