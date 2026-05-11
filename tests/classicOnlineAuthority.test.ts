import {
  AddBotPayload,
  CreateRoomPayload,
  JoinSlotPayload,
  SubmitMovePayload,
} from '../server/protocol';
import { roomManager } from '../server/roomManager';
import { test, assert } from './testHarness';
import type { Piece } from '../src/rules/classicThreeKingdomRules';

const classicRoomPayload = (overrides: Partial<CreateRoomPayload> = {}): CreateRoomPayload => ({
  hostName: 'Host',
  preferredFaction: 'Shu',
  gameMode: 'classic',
  allowBots: false,
  botDifficultyDefault: 'easy',
  ...overrides,
});

function resetRoomManagerForTests() {
  const manager = roomManager as any;
  manager.rooms.clear();
  manager.processedMoveIds.clear();
  manager.roomGameStates.clear();
  manager.disconnectGraceTimers.forEach((timer: ReturnType<typeof setTimeout>) => clearTimeout(timer));
  manager.disconnectGraceTimers.clear();
}

function setMatchStateForTests(
  roomCode: string,
  state: {
    currentTurn: Piece['faction'];
    moveNumber: number;
    eliminatedFactions: Piece['faction'][];
    winner: Piece['faction'] | null;
    pieces: Piece[];
  }
) {
  const manager = roomManager as any;
  const room = roomManager.getRoom(roomCode);
  if (!room) {
    throw new Error('ROOM_NOT_FOUND');
  }

  manager.roomGameStates.set(roomCode.toUpperCase(), {
    currentTurn: state.currentTurn,
    moveNumber: state.moveNumber,
    eliminatedFactions: [...state.eliminatedFactions],
    winner: state.winner,
    pieces: state.pieces.map((piece) => ({ ...piece })),
  });
  room.status = state.winner ? 'finished' : 'playing';
}

function expireRoomForTests(roomCode: string) {
  const manager = roomManager as any;
  const normalized = roomCode.toUpperCase();
  manager.rooms.delete(normalized);
  manager.processedMoveIds.delete(normalized);
  manager.roomGameStates.delete(normalized);
}

function setupThreeSideRoom() {
  resetRoomManagerForTests();
  const hostId = `host-${Math.random().toString(36).slice(2, 8)}`;
  const weiId = `wei-${Math.random().toString(36).slice(2, 8)}`;
  const room = roomManager.createRoom(classicRoomPayload({ allowBots: true }), hostId);

  roomManager.joinRoom({ roomCode: room.roomCode, playerName: 'Host' }, hostId);
  roomManager.removeBot({ roomCode: room.roomCode, faction: 'Wei' }, hostId);
  roomManager.joinSlot({ roomCode: room.roomCode, faction: 'Wei', playerName: 'Wei Commander' } satisfies JoinSlotPayload, weiId);
  roomManager.setReady({ roomCode: room.roomCode, faction: 'Wei', ready: true }, weiId);
  const startedRoom = roomManager.startMatch(room.roomCode, hostId);

  return { room: startedRoom, hostId, weiId };
}

function makePiece(id: string, type: Piece['type'], faction: Piece['faction'], x: number, y: number): Piece {
  return { id, type, faction, x, y };
}

function submitMove(roomCode: string, clientId: string, move: SubmitMovePayload['move']) {
  return roomManager.validateSubmittedMove(
    {
      roomCode,
      move,
    },
    clientId,
    true
  );
}

function expectError(expected: string, fn: () => unknown) {
  try {
    fn();
    assert.fail(`Expected ${expected}`);
  } catch (error) {
    assert.equal((error as Error).message, expected);
  }
}

test('Classic online: valid human move accepted and fake client outcome ignored', () => {
  resetRoomManagerForTests();
  const hostId = `host-${Math.random().toString(36).slice(2, 8)}`;
  const room = roomManager.createRoom(classicRoomPayload({ allowBots: true }), hostId);
  roomManager.startMatch(room.roomCode, hostId);

  const result = roomManager.validateSubmittedMove(
    {
      roomCode: room.roomCode,
      move: {
        id: `move-${Math.random().toString(36).slice(2, 8)}`,
        faction: 'Shu',
        pieceId: 'shu-S-0',
        pieceType: 'S',
        from: { x: 4, y: 3 },
        to: { x: 4, y: 4 },
      },
      clientGameState: {
        currentTurn: 'Shu',
        eliminatedFactions: ['Wei', 'Wu'],
        winner: 'Shu',
        status: 'FINISHED',
        moveNumber: 99,
      },
    },
    hostId,
    true
  );

  assert.equal(result.validatedPayload.serverState?.winner, null);
  assert.deepEqual(result.validatedPayload.serverState?.eliminatedFactions, []);
  assert.equal(result.validatedPayload.serverState?.currentTurn, 'Wei');
});

test('Classic online: duplicate move rejected', () => {
  resetRoomManagerForTests();
  const hostId = `host-${Math.random().toString(36).slice(2, 8)}`;
  const room = roomManager.createRoom(classicRoomPayload({ allowBots: true }), hostId);
  roomManager.startMatch(room.roomCode, hostId);

  const move = {
    id: `move-${Math.random().toString(36).slice(2, 8)}`,
    faction: 'Shu' as const,
    pieceId: 'shu-S-1',
    pieceType: 'S',
    from: { x: 6, y: 3 },
    to: { x: 6, y: 4 },
  };

  submitMove(room.roomCode, hostId, move);
  expectError('DUPLICATE_MOVE', () => submitMove(room.roomCode, hostId, move));
});

test('Classic online: wrong faction rejected', () => {
  const { room, weiId } = setupThreeSideRoom();

  expectError('UNAUTHORIZED_FACTION', () =>
    submitMove(room.roomCode, weiId, {
      id: `move-${Math.random().toString(36).slice(2, 8)}`,
      faction: 'Shu',
      pieceId: 'shu-S-0',
      pieceType: 'S',
      from: { x: 4, y: 3 },
      to: { x: 4, y: 4 },
    })
  );
});

test('Classic online: not-your-turn rejected', () => {
  resetRoomManagerForTests();
  const hostId = `host-${Math.random().toString(36).slice(2, 8)}`;
  const room = roomManager.createRoom(classicRoomPayload({ allowBots: true }), hostId);
  roomManager.startMatch(room.roomCode, hostId);

  expectError('NOT_YOUR_TURN', () =>
    submitMove(room.roomCode, hostId, {
      id: `move-${Math.random().toString(36).slice(2, 8)}`,
      faction: 'Wei',
      pieceId: 'wei-S-0',
      pieceType: 'S',
      from: { x: 4, y: 13 },
      to: { x: 4, y: 12 },
      actorType: 'bot',
    })
  );
});

test('Classic online: non-host bot submission rejected', () => {
  const { room, hostId, weiId } = setupThreeSideRoom();

  submitMove(room.roomCode, hostId, {
    id: `move-${Math.random().toString(36).slice(2, 8)}`,
    faction: 'Shu',
    pieceId: 'shu-S-1',
    pieceType: 'S',
    from: { x: 6, y: 3 },
    to: { x: 6, y: 4 },
  });

  submitMove(room.roomCode, weiId, {
    id: `move-${Math.random().toString(36).slice(2, 8)}`,
    faction: 'Wei',
    pieceId: 'wei-S-1',
    pieceType: 'S',
    from: { x: 6, y: 13 },
    to: { x: 6, y: 12 },
  });

  expectError('UNAUTHORIZED_FACTION', () =>
    submitMove(room.roomCode, weiId, {
      id: `move-${Math.random().toString(36).slice(2, 8)}`,
      faction: 'Wu',
      pieceId: 'wu-S-0',
      pieceType: 'S',
      from: { x: 3, y: 4 },
      to: { x: 4, y: 4 },
      actorType: 'bot',
    })
  );
});

test('Classic online: host bot submission accepted', () => {
  resetRoomManagerForTests();
  const hostId = `host-${Math.random().toString(36).slice(2, 8)}`;
  const room = roomManager.createRoom(classicRoomPayload({ allowBots: true }), hostId);
  roomManager.startMatch(room.roomCode, hostId);

  submitMove(room.roomCode, hostId, {
    id: `move-${Math.random().toString(36).slice(2, 8)}`,
    faction: 'Shu',
    pieceId: 'shu-S-1',
    pieceType: 'S',
    from: { x: 6, y: 3 },
    to: { x: 6, y: 4 },
  });

  const result = submitMove(room.roomCode, hostId, {
    id: `move-${Math.random().toString(36).slice(2, 8)}`,
    faction: 'Wei',
    pieceId: 'wei-S-1',
    pieceType: 'S',
    from: { x: 6, y: 13 },
    to: { x: 6, y: 12 },
    actorType: 'bot',
  });

  assert.equal(result.validatedPayload.move.actorType, 'bot');
  assert.equal(result.validatedPayload.serverState?.currentTurn, 'Wu');
});

test('Classic online: match snapshot returns authoritative state', () => {
  resetRoomManagerForTests();
  const hostId = `host-${Math.random().toString(36).slice(2, 8)}`;
  const room = roomManager.createRoom(classicRoomPayload({ allowBots: true }), hostId);
  roomManager.startMatch(room.roomCode, hostId);

  submitMove(room.roomCode, hostId, {
    id: `move-${Math.random().toString(36).slice(2, 8)}`,
    faction: 'Shu',
    pieceId: 'shu-S-0',
    pieceType: 'S',
    from: { x: 4, y: 3 },
    to: { x: 4, y: 4 },
  });

  const snapshot = roomManager.getMatchSnapshot({ roomCode: room.roomCode, playerName: 'Host' }, hostId);
  assert.ok(snapshot.matchState);
  assert.equal(snapshot.matchState?.moveNumber, 1);
  assert.equal(snapshot.matchState?.currentTurn, 'Wei');
  assert.ok(snapshot.matchState?.pieces.some((piece) => piece.id === 'shu-S-0' && piece.x === 4 && piece.y === 4));
});

test('Classic online: match snapshot preserves capture state', () => {
  resetRoomManagerForTests();
  const hostId = `host-${Math.random().toString(36).slice(2, 8)}`;
  const room = roomManager.createRoom(classicRoomPayload({ allowBots: true }), hostId);
  roomManager.startMatch(room.roomCode, hostId);
  setMatchStateForTests(room.roomCode, {
    currentTurn: 'Shu',
    moveNumber: 0,
    eliminatedFactions: [],
    winner: null,
    pieces: [
      makePiece('shu-g', 'G', 'Shu', 7, 1),
      makePiece('wei-g', 'G', 'Wei', 8, 15),
      makePiece('wu-g', 'G', 'Wu', 1, 8),
      makePiece('shu-r', 'R', 'Shu', 4, 4),
      makePiece('wei-s', 'S', 'Wei', 4, 7),
    ],
  });

  submitMove(room.roomCode, hostId, {
    id: `move-${Math.random().toString(36).slice(2, 8)}`,
    faction: 'Shu',
    pieceId: 'shu-r',
    pieceType: 'R',
    from: { x: 4, y: 4 },
    to: { x: 4, y: 7 },
  });

  const snapshot = roomManager.getMatchSnapshot({ roomCode: room.roomCode, playerName: 'Host' }, hostId);
  assert.ok(snapshot.matchState);
  assert.equal(snapshot.matchState?.moveNumber, 1);
  assert.ok(snapshot.matchState?.pieces.some((piece) => piece.id === 'shu-r' && piece.x === 4 && piece.y === 7));
  assert.ok(!snapshot.matchState?.pieces.some((piece) => piece.id === 'wei-s'));
});

test('Classic online: reconnect restores slot by playerName', () => {
  const { room, hostId } = setupThreeSideRoom();

  roomManager.handleDisconnect(hostId);
  const snapshot = roomManager.getRoomSnapshot({ roomCode: room.roomCode, playerName: 'Host' }, `host-rejoin-${Math.random().toString(36).slice(2, 8)}`);

  assert.equal(snapshot.assignedFaction, 'Shu');
  assert.equal(snapshot.isHost, true);
  assert.equal(snapshot.room.slots.Shu.playerName, 'Host');
});

test('Classic online: guest reconnect restores the same slot without duplication', () => {
  const { room, weiId } = setupThreeSideRoom();
  const rejoinedGuestId = `guest-rejoin-${Math.random().toString(36).slice(2, 8)}`;

  roomManager.handleDisconnect(weiId);
  const snapshot = roomManager.getRoomSnapshot(
    { roomCode: room.roomCode, playerName: 'Wei Commander' },
    rejoinedGuestId
  );

  assert.equal(snapshot.assignedFaction, 'Wei');
  assert.equal(snapshot.room.slots.Wei.playerName, 'Wei Commander');
  assert.equal(snapshot.room.slots.Wei.clientId, rejoinedGuestId);
  assert.equal(
    Object.values(snapshot.room.slots).filter((slot) => slot.occupantType === 'human').length,
    2
  );
});

test('Classic online: host reconnect keeps bot authority after match snapshot recovery', () => {
  resetRoomManagerForTests();
  const hostId = `host-${Math.random().toString(36).slice(2, 8)}`;
  const room = roomManager.createRoom(classicRoomPayload({ allowBots: true }), hostId);
  roomManager.startMatch(room.roomCode, hostId);

  roomManager.handleDisconnect(hostId);
  const rejoinedHostId = `host-rejoin-${Math.random().toString(36).slice(2, 8)}`;
  const snapshot = roomManager.getMatchSnapshot({ roomCode: room.roomCode, playerName: 'Host' }, rejoinedHostId);

  assert.equal(snapshot.isHost, true);
  assert.equal(snapshot.assignedFaction, 'Shu');

  submitMove(room.roomCode, rejoinedHostId, {
    id: `move-${Math.random().toString(36).slice(2, 8)}`,
    faction: 'Shu',
    pieceId: 'shu-S-1',
    pieceType: 'S',
    from: { x: 6, y: 3 },
    to: { x: 6, y: 4 },
  });

  const botResult = submitMove(room.roomCode, rejoinedHostId, {
    id: `move-${Math.random().toString(36).slice(2, 8)}`,
    faction: 'Wei',
    pieceId: 'wei-S-1',
    pieceType: 'S',
    from: { x: 6, y: 13 },
    to: { x: 6, y: 12 },
    actorType: 'bot',
  });

  assert.equal(botResult.validatedPayload.move.actorType, 'bot');
  assert.equal(botResult.validatedPayload.serverState?.currentTurn, 'Wu');
});

test('Classic online: match snapshot restores eliminated factions and winner', () => {
  resetRoomManagerForTests();
  const hostId = `host-${Math.random().toString(36).slice(2, 8)}`;
  const room = roomManager.createRoom(classicRoomPayload({ allowBots: true }), hostId);
  roomManager.startMatch(room.roomCode, hostId);
  setMatchStateForTests(room.roomCode, {
    currentTurn: 'Shu',
    moveNumber: 0,
    eliminatedFactions: ['Wu'],
    winner: null,
    pieces: [
      makePiece('shu-g', 'G', 'Shu', 7, 1),
      makePiece('wei-g', 'G', 'Wei', 8, 15),
      makePiece('shu-r', 'R', 'Shu', 8, 14),
    ],
  });

  submitMove(room.roomCode, hostId, {
    id: `move-${Math.random().toString(36).slice(2, 8)}`,
    faction: 'Shu',
    pieceId: 'shu-r',
    pieceType: 'R',
    from: { x: 8, y: 14 },
    to: { x: 8, y: 15 },
  });

  const snapshot = roomManager.getMatchSnapshot({ roomCode: room.roomCode, playerName: 'Host' }, hostId);
  assert.ok(snapshot.matchState);
  assert.deepEqual(snapshot.matchState?.eliminatedFactions, ['Wu', 'Wei']);
  assert.equal(snapshot.matchState?.winner, 'Shu');
});

test('Classic online: room expired snapshot path returns ROOM_NOT_FOUND', () => {
  resetRoomManagerForTests();
  const hostId = `host-${Math.random().toString(36).slice(2, 8)}`;
  const room = roomManager.createRoom(classicRoomPayload({ allowBots: true }), hostId);
  expireRoomForTests(room.roomCode);

  expectError('ROOM_NOT_FOUND', () =>
    roomManager.getRoomSnapshot({ roomCode: room.roomCode, playerName: 'Host' }, hostId)
  );
  expectError('ROOM_NOT_FOUND', () =>
    roomManager.getMatchSnapshot({ roomCode: room.roomCode, playerName: 'Host' }, hostId)
  );
});
