import {
  AddBotPayload,
  CreateRoomPayload,
  JoinSlotPayload,
  SubmitMovePayload,
} from '../server/protocol';
import { roomManager } from '../server/roomManager';
import { test, assert } from './testHarness';

const classicRoomPayload = (overrides: Partial<CreateRoomPayload> = {}): CreateRoomPayload => ({
  hostName: 'Host',
  preferredFaction: 'Shu',
  gameMode: 'classic',
  allowBots: false,
  botDifficultyDefault: 'easy',
  ...overrides,
});

function setupThreeSideRoom() {
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

test('Classic online: reconnect restores slot by playerName', () => {
  const { room, hostId } = setupThreeSideRoom();

  roomManager.handleDisconnect(hostId);
  const snapshot = roomManager.getRoomSnapshot({ roomCode: room.roomCode, playerName: 'Host' }, `host-rejoin-${Math.random().toString(36).slice(2, 8)}`);

  assert.equal(snapshot.assignedFaction, 'Shu');
  assert.equal(snapshot.isHost, true);
  assert.equal(snapshot.room.slots.Shu.playerName, 'Host');
});
