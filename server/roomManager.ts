import { OnlineWarRoom, Faction, OnlineRoomSlot, OnlineRoomGameState } from './types';
import { CreateRoomPayload, JoinRoomPayload, JoinSlotPayload, SlotActionPayload, AddBotPayload, SetReadyPayload, SubmitMovePayload, ValidatedSubmitMovePayload } from './protocol';
import { DEFAULT_GAME_MODE, GAME_MODE_RULESETS } from '../shared/gameModes';

/**
 * TODO: Backend v2 - Implement server-authoritative chess rule validation.
 * Currently, moves are validated by the client and broadcasted by the server.
 */

class RoomManager {
  private rooms: Map<string, OnlineWarRoom> = new Map();
  private processedMoveIds: Map<string, Set<string>> = new Map();
  private roomGameStates: Map<string, OnlineRoomGameState> = new Map();

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
    this.processedMoveIds.set(roomCode, new Set());
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
    this.processedMoveIds.set(room.roomCode, new Set());
    this.roomGameStates.set(room.roomCode, {
      currentTurn: 'Shu',
      moveNumber: 0,
      eliminatedFactions: [],
      winner: null
    });
    return room;
  }

  validateSubmittedMove(payload: SubmitMovePayload, clientId: string): { room: OnlineWarRoom; validatedPayload: ValidatedSubmitMovePayload } {
    const room = this.getRoom(payload.roomCode);
    if (!room) {
      throw new Error('ROOM_NOT_FOUND');
    }

    if (room.status !== 'playing') {
      throw new Error('ROOM_NOT_PLAYING');
    }

    const move = payload.move;
    if (!this.isValidMoveShape(move)) {
      throw new Error('MALFORMED_MOVE');
    }

    const currentState = this.roomGameStates.get(room.roomCode);
    if (!currentState) {
      throw new Error('ROOM_NOT_PLAYING');
    }

    const moveId = move.id.trim();
    const processedMoveIds = this.processedMoveIds.get(room.roomCode) ?? new Set<string>();
    this.processedMoveIds.set(room.roomCode, processedMoveIds);
    if (processedMoveIds.has(moveId)) {
      throw new Error('DUPLICATE_MOVE');
    }

    const senderSlot = (Object.keys(room.slots) as Exclude<Faction, 'None'>[]).find(
      (faction) => room.slots[faction].clientId === clientId
    );
    if (!senderSlot && room.hostClientId !== clientId) {
      throw new Error('NOT_IN_ROOM');
    }

    if (move.faction !== currentState.currentTurn) {
      throw new Error('UNAUTHORIZED_FACTION');
    }

    const actingSlot = room.slots[move.faction];
    if (!actingSlot) {
      throw new Error('UNAUTHORIZED_FACTION');
    }

    const isHumanMove =
      actingSlot.occupantType === 'human' &&
      actingSlot.clientId === clientId;
    const isHostBotMove =
      actingSlot.occupantType === 'bot' &&
      room.hostClientId === clientId;

    if (!isHumanMove && !isHostBotMove) {
      throw new Error('UNAUTHORIZED_FACTION');
    }

    const nextState = this.validateClientGameState(payload.clientGameState);
    processedMoveIds.add(moveId);

    const nextEliminated = nextState?.eliminatedFactions ?? currentState.eliminatedFactions;
    const nextWinner = nextState?.winner ?? currentState.winner;
    const computedNextTurn = nextWinner
      ? currentState.currentTurn
      : this.getNextActiveFaction(currentState.currentTurn, nextEliminated);

    const normalizedGameState: OnlineRoomGameState = {
      currentTurn: computedNextTurn,
      moveNumber: currentState.moveNumber + 1,
      eliminatedFactions: nextEliminated,
      winner: nextWinner
    };

    this.roomGameStates.set(room.roomCode, normalizedGameState);

    if (nextWinner) {
      room.status = 'finished';
    }

    const validatedPayload: ValidatedSubmitMovePayload = {
      ...payload,
      move: {
        ...move,
        id: moveId
      },
      clientGameState: {
        ...normalizedGameState,
        status: nextWinner ? 'FINISHED' : 'PLAYING'
      }
    };

    return { room, validatedPayload };
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
            this.processedMoveIds.delete(code);
            this.roomGameStates.delete(code);
            return { roomCode: code, room: null };
          }
        }
        return { roomCode: code, room };
      }
    }
    return null;
  }

  private isValidMoveShape(move: SubmitMovePayload['move'] | undefined): move is SubmitMovePayload['move'] {
    if (!move || typeof move !== 'object') return false;
    if (typeof move.id !== 'string' || move.id.trim().length === 0) return false;
    if (!['Shu', 'Wei', 'Wu'].includes(move.faction)) return false;
    if (typeof move.pieceId !== 'string' || move.pieceId.trim().length === 0) return false;
    if (typeof move.pieceType !== 'string' || move.pieceType.trim().length === 0) return false;
    if (!this.isValidPoint(move.from) || !this.isValidPoint(move.to)) return false;
    return true;
  }

  private isValidPoint(point: { x: number; y: number } | undefined): boolean {
    return !!point &&
      Number.isInteger(point.x) &&
      Number.isInteger(point.y) &&
      point.x >= 0 &&
      point.x <= 16 &&
      point.y >= 0 &&
      point.y <= 16;
  }

  private validateClientGameState(
    state: SubmitMovePayload['clientGameState']
  ): (OnlineRoomGameState & { status: 'PLAYING' | 'FINISHED' }) | undefined {
    if (!state) return undefined;
    if (!['Shu', 'Wei', 'Wu'].includes(state.currentTurn)) {
      throw new Error('MALFORMED_MOVE');
    }
    if (!Array.isArray(state.eliminatedFactions) || state.eliminatedFactions.some((faction) => !['Shu', 'Wei', 'Wu'].includes(faction))) {
      throw new Error('MALFORMED_MOVE');
    }
    if (state.winner !== null && !['Shu', 'Wei', 'Wu'].includes(state.winner)) {
      throw new Error('MALFORMED_MOVE');
    }
    if (state.status !== 'PLAYING' && state.status !== 'FINISHED') {
      throw new Error('MALFORMED_MOVE');
    }
    if (state.moveNumber !== undefined && (!Number.isInteger(state.moveNumber) || state.moveNumber < 0)) {
      throw new Error('MALFORMED_MOVE');
    }

    return {
      currentTurn: state.currentTurn as Exclude<Faction, 'None'>,
      moveNumber: state.moveNumber ?? 0,
      eliminatedFactions: state.eliminatedFactions as Exclude<Faction, 'None'>[],
      winner: state.winner as Exclude<Faction, 'None'> | null,
      status: state.status
    };
  }

  private getNextActiveFaction(
    currentTurn: Exclude<Faction, 'None'>,
    eliminatedFactions: Exclude<Faction, 'None'>[]
  ): Exclude<Faction, 'None'> {
    const order: Exclude<Faction, 'None'>[] = ['Shu', 'Wei', 'Wu'];
    const active = order.filter((faction) => !eliminatedFactions.includes(faction));
    if (active.length === 0) {
      return currentTurn;
    }
    if (active.length === 1) {
      return active[0];
    }

    const currentIndex = order.indexOf(currentTurn);
    for (let step = 1; step <= order.length; step++) {
      const candidate = order[(currentIndex + step) % order.length];
      if (!eliminatedFactions.includes(candidate)) {
        return candidate;
      }
    }

    return currentTurn;
  }
}

export const roomManager = new RoomManager();
