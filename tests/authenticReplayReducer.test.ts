import type { PieceType, Point } from '../src/rules/classicThreeKingdomRules';
import type { AuthenticReplayState } from '../src/rules/threeKingdomRules';
import {
  type AuthenticBoardState,
  type AuthenticFaction,
  type AuthenticFactionOrNeutral,
  type AuthenticPiece,
  applyAuthenticMove,
  createInitialAuthenticState,
} from '../src/rules/authenticThreeKingdomRules';
import { reconstructAuthenticReplayState } from '../src/rules/authenticReplayReducer';
import { assert, test } from './testHarness';

function makePiece(
  id: string,
  type: PieceType,
  owner: AuthenticFactionOrNeutral,
  x: number,
  y: number,
  overrides: Partial<AuthenticPiece> = {}
): AuthenticPiece {
  return {
    id,
    type,
    owner,
    visualFaction: owner,
    originFaction: owner,
    x,
    y,
    firstMoveDone: false,
    ...overrides,
  };
}

function makeState(overrides: Partial<AuthenticBoardState> = {}): AuthenticBoardState {
  return {
    pieces: [],
    currentTurn: 'Wu',
    moveNumber: 0,
    factionMoveCounts: { Wu: 0, Wei: 0, Shu: 0 },
    hanController: null,
    allianceState: { allies: null, target: null, source: null },
    checkedPriorityQueue: [],
    eliminated: [],
    history: [],
    captured: [],
    winner: null,
    lastMove: null,
    ...overrides,
  };
}

function standardGenerals(): AuthenticPiece[] {
  return [
    makePiece('wu-g', 'G', 'Wu', 1, 8),
    makePiece('wei-g', 'G', 'Wei', 8, 15),
    makePiece('shu-g', 'G', 'Shu', 7, 1),
  ];
}

function advanceState(state: AuthenticBoardState, pieceId: string, to: Point): AuthenticBoardState {
  const selectedPiece = state.pieces.find((piece) => piece.id === pieceId);
  assert.ok(selectedPiece, `Missing piece ${pieceId}`);

  const resolution = applyAuthenticMove(state, selectedPiece, to);
  assert.ok(resolution, `Move for ${pieceId} should resolve`);

  return {
    ...state,
    pieces: resolution.pieces,
    currentTurn: resolution.nextTurn ?? state.currentTurn,
    moveNumber: state.moveNumber + 1,
    factionMoveCounts: resolution.factionMoveCounts,
    hanController: resolution.hanController,
    allianceState: resolution.allianceState,
    checkedPriorityQueue: resolution.checkedPriorityQueue,
    eliminated: resolution.eliminated,
    history: [...state.history, resolution.moveRecord],
    captured: [...state.captured, ...resolution.capturedPieces],
    winner: resolution.winner,
    lastMove: resolution.lastMove,
  };
}

function toReplaySeed(state: AuthenticBoardState): AuthenticReplayState {
  return {
    pieces: state.pieces.map((piece) => ({ ...piece })),
    currentTurn: state.currentTurn,
    moveNumber: state.moveNumber,
    factionMoveCounts: { ...state.factionMoveCounts },
    hanController: state.hanController,
    allianceState: state.allianceState.allies
      ? {
          allies: [...state.allianceState.allies] as [AuthenticFaction, AuthenticFaction],
          target: state.allianceState.target,
          source: state.allianceState.source,
        }
      : { allies: null, target: null, source: null },
    checkedPriorityQueue: [...state.checkedPriorityQueue],
    eliminated: [...state.eliminated],
    captured: state.captured.map((piece) => ({ ...piece })),
    winner: state.winner,
    lastMove: state.lastMove
      ? {
          from: { ...state.lastMove.from },
          to: { ...state.lastMove.to },
        }
      : null,
  };
}

function findPiece(pieces: AuthenticPiece[], id: string) {
  const piece = pieces.find((entry) => entry.id === id);
  assert.ok(piece, `Missing piece ${id}`);
  return piece;
}

test('Authentic replay reducer: initial state at move index 0', () => {
  const initialState = createInitialAuthenticState();

  const snapshot = reconstructAuthenticReplayState(toReplaySeed(initialState), [], 0);

  assert.deepEqual(snapshot.pieces, initialState.pieces);
  assert.equal(snapshot.currentTurn, 'Wu');
  assert.equal(snapshot.lastMoveRecord, null);
  assert.equal(snapshot.moveIndex, 0);
  assert.notEqual(snapshot.pieces, initialState.pieces);
});

test('Authentic replay reducer: after one Authentic move', () => {
  const initialState = createInitialAuthenticState();
  const afterOneMove = advanceState(initialState, 'auth-wu-S-0', { x: 4, y: 4 });

  const snapshot = reconstructAuthenticReplayState(toReplaySeed(initialState), afterOneMove.history, 1);
  const movedPiece = findPiece(snapshot.pieces, 'auth-wu-S-0');

  assert.deepEqual({ x: movedPiece.x, y: movedPiece.y }, { x: 4, y: 4 });
  assert.equal(snapshot.currentTurn, 'Wei');
  assert.deepEqual(snapshot.lastMove, { from: { x: 3, y: 4 }, to: { x: 4, y: 4 } });
});

test('Authentic replay reducer: after Han Emperor depose', () => {
  const initialState = makeState({
    currentTurn: 'Shu',
    moveNumber: 1,
    pieces: [
      ...standardGenerals(),
      makePiece('shu-h', 'H', 'Shu', 7, 6),
      makePiece('han-emperor', 'G', 'Han', 8, 8),
      makePiece('han-r', 'R', 'Han', 6, 8),
    ],
  });
  const nextState = advanceState(initialState, 'shu-h', { x: 8, y: 8 });

  const snapshot = reconstructAuthenticReplayState(toReplaySeed(initialState), nextState.history, 1);

  assert.equal(snapshot.hanController, 'Shu');
  assert.deepEqual(snapshot.allianceState, {
    allies: ['Wu', 'Wei'],
    target: 'Shu',
    source: 'anti-emperor',
  });
});

test('Authentic replay reducer: Han military transfer replay', () => {
  const initialState = makeState({
    currentTurn: 'Shu',
    moveNumber: 1,
    pieces: [
      ...standardGenerals(),
      makePiece('shu-h', 'H', 'Shu', 7, 6),
      makePiece('han-emperor', 'G', 'Han', 8, 8),
      makePiece('han-r', 'R', 'Han', 6, 8),
      makePiece('han-p', 'P', 'Han', 8, 6),
    ],
  });
  const nextState = advanceState(initialState, 'shu-h', { x: 8, y: 8 });

  const snapshot = reconstructAuthenticReplayState(toReplaySeed(initialState), nextState.history, 1);

  assert.ok(snapshot.pieces.some((piece) => piece.id === 'han-r' && piece.owner === 'Shu'));
  assert.ok(snapshot.pieces.some((piece) => piece.id === 'han-p' && piece.owner === 'Shu'));
});

test('Authentic replay reducer: alliance state replay', () => {
  const initialState = makeState({
    currentTurn: 'Wu',
    moveNumber: 1,
    pieces: [
      ...standardGenerals(),
      makePiece('wu-h', 'H', 'Wu', 6, 6),
    ],
  });
  const nextState = advanceState(initialState, 'wu-h', { x: 8, y: 5 });

  const snapshot = reconstructAuthenticReplayState(toReplaySeed(initialState), nextState.history, 1);

  assert.deepEqual(snapshot.allianceState, {
    allies: ['Wu', 'Shu'],
    target: 'Wei',
    source: 'alliance',
  });
});

test('Authentic replay reducer: capture replay', () => {
  const initialState = makeState({
    currentTurn: 'Wu',
    moveNumber: 1,
    pieces: [
      ...standardGenerals(),
      makePiece('wu-r', 'R', 'Wu', 4, 8),
      makePiece('wei-s', 'S', 'Wei', 4, 11),
    ],
  });
  const nextState = advanceState(initialState, 'wu-r', { x: 4, y: 11 });

  const snapshot = reconstructAuthenticReplayState(toReplaySeed(initialState), nextState.history, 1);

  assert.ok(!snapshot.pieces.some((piece) => piece.id === 'wei-s'));
  assert.ok(snapshot.captured.some((piece) => piece.id === 'wei-s'));
  assert.equal(findPiece(snapshot.pieces, 'wu-r').y, 11);
});

test('Authentic replay reducer: winner replay', () => {
  const initialState = makeState({
    currentTurn: 'Wu',
    moveNumber: 1,
    pieces: [
      makePiece('wu-g', 'G', 'Wu', 1, 8),
      makePiece('wu-r', 'R', 'Wu', 8, 14),
      makePiece('wei-g', 'G', 'Wei', 8, 15),
    ],
  });
  const nextState = advanceState(initialState, 'wu-r', { x: 8, y: 15 });

  const snapshot = reconstructAuthenticReplayState(toReplaySeed(initialState), nextState.history, 1);

  assert.equal(snapshot.winner, 'Wu');
  assert.ok(snapshot.eliminated.includes('Wei'));
});

test('Authentic replay reducer: input state and history are not mutated', () => {
  const initialState = createInitialAuthenticState();
  const afterOneMove = advanceState(initialState, 'auth-wu-S-0', { x: 4, y: 4 });
  const replaySeed = toReplaySeed(initialState);
  const replaySeedSnapshot = structuredClone(replaySeed);
  const historySnapshot = structuredClone(afterOneMove.history);

  const replay = reconstructAuthenticReplayState(replaySeed, afterOneMove.history, 1);

  assert.deepEqual(replaySeed, replaySeedSnapshot);
  assert.deepEqual(afterOneMove.history, historySnapshot);
  assert.notEqual(replay.pieces, replaySeed.pieces);
});

test('Authentic replay reducer: invalid move indexes clamp safely', () => {
  const initialState = createInitialAuthenticState();
  let state = advanceState(initialState, 'auth-wu-S-0', { x: 4, y: 4 });
  state = advanceState(state, 'auth-wei-S-0', { x: 4, y: 12 });

  const negativeSnapshot = reconstructAuthenticReplayState(toReplaySeed(initialState), state.history, -5);
  const largeSnapshot = reconstructAuthenticReplayState(toReplaySeed(initialState), state.history, 999);
  const nanSnapshot = reconstructAuthenticReplayState(toReplaySeed(initialState), state.history, Number.NaN);

  assert.equal(negativeSnapshot.moveIndex, 0);
  assert.equal(negativeSnapshot.lastMoveRecord, null);
  assert.equal(largeSnapshot.moveIndex, state.history.length);
  assert.equal(findPiece(largeSnapshot.pieces, 'auth-wei-S-0').y, 12);
  assert.equal(nanSnapshot.moveIndex, 0);
});
