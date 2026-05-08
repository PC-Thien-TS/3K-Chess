import { OnlineWarRoom, Faction, OnlineRoomSlot, OnlineRoomGameState } from './types';
import {
  AddBotPayload,
  CreateRoomPayload,
  JoinRoomPayload,
  JoinSlotPayload,
  MatchSnapshotPayload,
  RoomSnapshotPayload,
  SetReadyPayload,
  SlotActionPayload,
  SnapshotRequestPayload,
  SubmitMovePayload,
  ValidatedSubmitMovePayload,
} from './protocol';
import { DEFAULT_GAME_MODE, GAME_MODE_RULESETS } from '../shared/gameModes';
import {
  CLASSIC_ACTIVE_FACTIONS,
  Piece,
  createClassicInitialPieces,
  getNextClassicFaction,
  isCheckmateDetailed,
  validateBoardIntegrity,
  validateMove,
} from '../src/rules/classicThreeKingdomRules';

/**
 * TODO: Backend v2 - Implement server-authoritative chess rule validation.
 * Currently, moves are validated by the client and broadcasted by the server.
 */

interface AuthoritativeClassicMatchState extends OnlineRoomGameState {
  pieces: Piece[];
}

type RoomChangeResult = { roomCode: string; room: OnlineWarRoom | null };
type RoomChangeHandler = (result: RoomChangeResult) => void;

class RoomManager {
  private rooms: Map<string, OnlineWarRoom> = new Map();
  private processedMoveIds: Map<string, Set<string>> = new Map();
  private roomGameStates: Map<string, AuthoritativeClassicMatchState> = new Map();
  private disconnectGraceTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private roomChangeHandler: RoomChangeHandler | null = null;
  private readonly disconnectGraceMs = 30_000;

  setRoomChangeHandler(handler: RoomChangeHandler) {
    this.roomChangeHandler = handler;
  }

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

    this.restoreCommanderSession(room, payload.playerName, clientId);
    return room;
  }

  getRoomSnapshot(payload: SnapshotRequestPayload, clientId: string): RoomSnapshotPayload {
    const room = this.getRoom(payload.roomCode);
    if (!room) {
      throw new Error('ROOM_NOT_FOUND');
    }

    const assignedFaction = this.restoreCommanderSession(room, payload.playerName, clientId);
    return {
      room,
      assignedFaction,
      isHost: room.hostClientId === clientId,
    };
  }

  getMatchSnapshot(payload: SnapshotRequestPayload, clientId: string): MatchSnapshotPayload {
    const room = this.getRoom(payload.roomCode);
    if (!room) {
      throw new Error('ROOM_NOT_FOUND');
    }

    if (room.roomRules.gameMode !== 'classic') {
      throw new Error('SERVER_STATE_ERROR');
    }

    const assignedFaction = this.restoreCommanderSession(room, payload.playerName, clientId);
    const matchState = this.roomGameStates.get(room.roomCode);

    return {
      room,
      assignedFaction,
      isHost: room.hostClientId === clientId,
      matchState: matchState
        ? {
            currentTurn: matchState.currentTurn,
            moveNumber: matchState.moveNumber,
            eliminatedFactions: [...matchState.eliminatedFactions],
            winner: matchState.winner,
            pieces: matchState.pieces.map((piece) => ({ ...piece })),
          }
        : null,
    };
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
    if (room.roomRules.gameMode !== 'classic') throw new Error("SERVER_STATE_ERROR");

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
      winner: null,
      pieces: createClassicInitialPieces(),
    });
    return room;
  }

  validateSubmittedMove(
    payload: SubmitMovePayload,
    clientId: string,
    joinedSocketRoom: boolean
  ): { room: OnlineWarRoom; validatedPayload: ValidatedSubmitMovePayload } {
    const room = this.getRoom(payload.roomCode);
    if (!room) {
      throw new Error('ROOM_NOT_FOUND');
    }

    if (room.status !== 'playing') {
      throw new Error('ROOM_NOT_PLAYING');
    }

    if (room.roomRules.gameMode !== 'classic') {
      throw new Error('SERVER_STATE_ERROR');
    }

    if (!joinedSocketRoom) {
      throw new Error('NOT_IN_ROOM');
    }

    const move = payload.move;
    if (!this.isValidMoveShape(move)) {
      throw new Error('MALFORMED_MOVE');
    }

    const currentState = this.roomGameStates.get(room.roomCode);
    if (!currentState) {
      throw new Error('SERVER_STATE_ERROR');
    }

    const boardIntegrity = validateBoardIntegrity(currentState.pieces, currentState.eliminatedFactions);
    if (!boardIntegrity.valid) {
      throw new Error('SERVER_STATE_ERROR');
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

    if (move.faction !== currentState.currentTurn) {
      throw new Error('NOT_YOUR_TURN');
    }

    const actingPiece = currentState.pieces.find((piece) => piece.id === move.pieceId);
    if (
      !actingPiece ||
      actingPiece.faction !== move.faction ||
      actingPiece.x !== move.from.x ||
      actingPiece.y !== move.from.y
    ) {
      throw new Error('ILLEGAL_MOVE');
    }

    const validation = validateMove(actingPiece, move.to, currentState.pieces, currentState.currentTurn);
    if (!validation.legal) {
      throw new Error('ILLEGAL_MOVE');
    }

    const targetPiece = currentState.pieces.find((piece) => piece.x === move.to.x && piece.y === move.to.y);
    let nextPieces = currentState.pieces.filter((piece) => piece.id !== actingPiece.id);
    if (targetPiece) {
      nextPieces = nextPieces.filter((piece) => piece.id !== targetPiece.id);
    }
    nextPieces.push({ ...actingPiece, x: move.to.x, y: move.to.y });

    processedMoveIds.add(moveId);

    const nextEliminated = [...currentState.eliminatedFactions];
    const newlyEliminated: Exclude<Faction, 'None'>[] = [];
    let checkmateHappened = false;

    CLASSIC_ACTIVE_FACTIONS.forEach((faction) => {
      if (faction === currentState.currentTurn || nextEliminated.includes(faction)) {
        return;
      }

      const detail = isCheckmateDetailed(faction, nextPieces);
      if (detail.checkmated) {
        nextEliminated.push(faction);
        newlyEliminated.push(faction);
        nextPieces = nextPieces.filter((piece) => piece.faction !== faction);
        checkmateHappened = true;
      }
    });

    const survivingFactions = CLASSIC_ACTIVE_FACTIONS.filter((faction) => !nextEliminated.includes(faction));
    const nextWinner = survivingFactions.length === 1 ? survivingFactions[0] : null;
    const computedNextTurn = nextWinner
      ? currentState.currentTurn
      : getNextClassicFaction(currentState.currentTurn, nextPieces, nextEliminated);

    const normalizedGameState: AuthoritativeClassicMatchState = {
      currentTurn: computedNextTurn || currentState.currentTurn,
      moveNumber: currentState.moveNumber + 1,
      eliminatedFactions: nextEliminated,
      winner: nextWinner,
      pieces: nextPieces,
    };

    this.roomGameStates.set(room.roomCode, normalizedGameState);

    if (nextWinner) {
      room.status = 'finished';
    }

    const validatedPayload: ValidatedSubmitMovePayload = {
      ...payload,
      move: {
        ...move,
        id: moveId,
        faction: currentState.currentTurn,
        pieceId: actingPiece.id,
        pieceType: actingPiece.type,
        from: { x: actingPiece.x, y: actingPiece.y },
        to: { ...move.to },
        capturedPiece: targetPiece ? { type: targetPiece.type, faction: targetPiece.faction } : undefined,
        givesCheck: validation.givesCheck,
        checkedFactions: validation.checkedFactions,
        checkmateHappened: checkmateHappened || move.checkmateHappened,
        eliminatedAfterMove: newlyEliminated,
        winnerAfterMove: nextWinner,
        turnNumber: currentState.moveNumber + 1,
        actorType: isHostBotMove ? 'bot' : 'human',
      },
      serverState: {
        currentTurn: normalizedGameState.currentTurn,
        moveNumber: normalizedGameState.moveNumber,
        eliminatedFactions: normalizedGameState.eliminatedFactions,
        winner: normalizedGameState.winner,
        status: nextWinner ? 'FINISHED' : 'PLAYING'
      }
    };

    return { room, validatedPayload };
  }

  leaveRoom(clientId: string): { roomCode: string; room: OnlineWarRoom | null } | null {
    this.clearDisconnectGrace(clientId);
    return this.finalizeClientDeparture(clientId, false);
  }

  handleDisconnect(clientId: string): { roomCode: string; room: OnlineWarRoom | null } | null {
    for (const [code, room] of this.rooms.entries()) {
      const factions = Object.keys(room.slots) as Exclude<Faction, 'None'>[];
      const ownsHumanSlot = factions.some((faction) => {
        const slot = room.slots[faction];
        return slot.clientId === clientId && slot.occupantType === 'human';
      });
      if (!ownsHumanSlot) {
        continue;
      }

      this.scheduleDisconnectGrace(clientId);
      return { roomCode: code, room };
    }
    return null;
  }

  private finalizeClientDeparture(clientId: string, notify: boolean): RoomChangeResult | null {
    for (const [code, room] of this.rooms.entries()) {
      let changed = false;
      const factions = Object.keys(room.slots) as Exclude<Faction, 'None'>[];

      factions.forEach((faction) => {
        if (room.slots[faction].clientId === clientId) {
          room.slots[faction] = {
            faction,
            occupantType: 'empty',
            ready: false,
          };
          changed = true;
        }
      });

      if (!changed) {
        continue;
      }

      const result = (() => {
        if (room.hostClientId === clientId) {
          const nextHuman = Object.values(room.slots).find((slot) => slot.occupantType === 'human');
          if (nextHuman && nextHuman.clientId) {
            room.hostClientId = nextHuman.clientId;
            room.hostName = nextHuman.playerName || 'New Strategist';
          } else {
            this.rooms.delete(code);
            this.processedMoveIds.delete(code);
            this.roomGameStates.delete(code);
            return { roomCode: code, room: null };
          }
        }
        return { roomCode: code, room };
      })();

      if (notify && this.roomChangeHandler) {
        this.roomChangeHandler(result);
      }
      return result;
    }
    return null;
  }

  private scheduleDisconnectGrace(clientId: string) {
    this.clearDisconnectGrace(clientId);
    const timer = setTimeout(() => {
      this.disconnectGraceTimers.delete(clientId);
      this.finalizeClientDeparture(clientId, true);
    }, this.disconnectGraceMs);
    this.disconnectGraceTimers.set(clientId, timer);
  }

  private clearDisconnectGrace(clientId: string) {
    const timer = this.disconnectGraceTimers.get(clientId);
    if (!timer) {
      return;
    }
    clearTimeout(timer);
    this.disconnectGraceTimers.delete(clientId);
  }

  private restoreCommanderSession(
    room: OnlineWarRoom,
    playerName: string | undefined,
    clientId: string
  ): Exclude<Faction, 'None'> | null {
    const currentFaction = (Object.keys(room.slots) as Exclude<Faction, 'None'>[]).find(
      (faction) => room.slots[faction].clientId === clientId
    );
    if (currentFaction) {
      this.clearDisconnectGrace(clientId);
      return currentFaction;
    }

    const normalizedName = playerName?.trim().toLowerCase();
    if (!normalizedName) {
      return null;
    }

    const matchedFaction = (Object.keys(room.slots) as Exclude<Faction, 'None'>[]).find((faction) => {
      const slot = room.slots[faction];
      return (
        slot.occupantType === 'human' &&
        typeof slot.playerName === 'string' &&
        slot.playerName.trim().toLowerCase() === normalizedName
      );
    });

    if (!matchedFaction) {
      return null;
    }

    const previousClientId = room.slots[matchedFaction].clientId;
    if (previousClientId && previousClientId !== clientId) {
      this.clearDisconnectGrace(previousClientId);
    }

    room.slots[matchedFaction] = {
      ...room.slots[matchedFaction],
      clientId,
    };

    if (room.hostClientId === previousClientId || room.hostName.trim().toLowerCase() === normalizedName) {
      room.hostClientId = clientId;
    }

    return matchedFaction;
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

}

export const roomManager = new RoomManager();
