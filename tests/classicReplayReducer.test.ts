import type { MatchRecord, Piece, PieceType, RecordedMove } from '../src/rules/threeKingdomRules';
import { createClassicInitialPieces } from '../src/rules/classicThreeKingdomRules';
import {
  isClassicReplayRecord,
  reconstructClassicReplayState,
} from '../src/rules/classicReplayReducer';
import { assert, test } from './testHarness';

function makePiece(id: string, type: PieceType, faction: Piece['faction'], x: number, y: number): Piece {
  return { id, type, faction, x, y };
}

function makeMove(overrides: Partial<RecordedMove> & Pick<RecordedMove, 'id' | 'pieceId' | 'pieceType' | 'faction' | 'from' | 'to'>): RecordedMove {
  return {
    turnNumber: 1,
    actorType: 'human',
    notationText: 'test move',
    ...overrides,
  };
}

function findPiece(pieces: Piece[], id: string) {
  const piece = pieces.find((entry) => entry.id === id);
  assert.ok(piece, `Missing piece ${id}`);
  return piece;
}

test('Classic replay reducer: initial state at move index 0', () => {
  const initialPieces = createClassicInitialPieces();

  const snapshot = reconstructClassicReplayState(initialPieces, [], 0);

  assert.deepEqual(snapshot.pieces, initialPieces);
  assert.equal(snapshot.lastMove, null);
  assert.equal(snapshot.moveIndex, 0);
  assert.notEqual(snapshot.pieces, initialPieces);
});

test('Classic replay reducer: after one move', () => {
  const initialPieces = createClassicInitialPieces();
  const moves = [
    makeMove({
      id: 'move-1',
      pieceId: 'shu-S-0',
      pieceType: 'S',
      faction: 'Shu',
      from: { x: 4, y: 3 },
      to: { x: 4, y: 4 },
    }),
  ];

  const snapshot = reconstructClassicReplayState(initialPieces, moves, 1);
  const movedPiece = findPiece(snapshot.pieces, 'shu-S-0');

  assert.deepEqual({ x: movedPiece.x, y: movedPiece.y }, { x: 4, y: 4 });
  assert.equal(snapshot.lastMove?.id, 'move-1');
});

test('Classic replay reducer: after capture', () => {
  const initialPieces = [
    makePiece('shu-g', 'G', 'Shu', 7, 1),
    makePiece('wei-g', 'G', 'Wei', 8, 15),
    makePiece('wu-g', 'G', 'Wu', 1, 8),
    makePiece('shu-r', 'R', 'Shu', 4, 4),
    makePiece('wei-s', 'S', 'Wei', 4, 7),
  ];
  const moves = [
    makeMove({
      id: 'capture-1',
      pieceId: 'shu-r',
      pieceType: 'R',
      faction: 'Shu',
      from: { x: 4, y: 4 },
      to: { x: 4, y: 7 },
      capturedPiece: { type: 'S', faction: 'Wei' },
    }),
  ];

  const snapshot = reconstructClassicReplayState(initialPieces, moves, 1);

  assert.ok(!snapshot.pieces.some((piece) => piece.id === 'wei-s'));
  assert.deepEqual(findPiece(snapshot.pieces, 'shu-r'), {
    id: 'shu-r',
    type: 'R',
    faction: 'Shu',
    x: 4,
    y: 7,
  });
});

test('Classic replay reducer: step backward and forward stay consistent', () => {
  const initialPieces = createClassicInitialPieces();
  const moves = [
    makeMove({
      id: 'move-1',
      pieceId: 'shu-S-0',
      pieceType: 'S',
      faction: 'Shu',
      from: { x: 4, y: 3 },
      to: { x: 4, y: 4 },
    }),
    makeMove({
      id: 'move-2',
      pieceId: 'wei-S-0',
      pieceType: 'S',
      faction: 'Wei',
      from: { x: 4, y: 13 },
      to: { x: 4, y: 12 },
    }),
  ];

  const stepOne = reconstructClassicReplayState(initialPieces, moves, 1);
  const stepTwo = reconstructClassicReplayState(initialPieces, moves, 2);
  const stepTwoAgain = reconstructClassicReplayState(initialPieces, moves, 2);

  assert.deepEqual({ x: findPiece(stepOne.pieces, 'shu-S-0').x, y: findPiece(stepOne.pieces, 'shu-S-0').y }, { x: 4, y: 4 });
  assert.deepEqual({ x: findPiece(stepOne.pieces, 'wei-S-0').x, y: findPiece(stepOne.pieces, 'wei-S-0').y }, { x: 4, y: 13 });
  assert.deepEqual({ x: findPiece(stepTwo.pieces, 'wei-S-0').x, y: findPiece(stepTwo.pieces, 'wei-S-0').y }, { x: 4, y: 12 });
  assert.deepEqual(stepTwo, stepTwoAgain);
});

test('Classic replay reducer: old records without gameMode still count as Classic', () => {
  const legacyRecord = {
    setup: {
      factions: {} as MatchRecord['setup']['factions'],
      primaryKingdom: 'Shu',
    },
  } as MatchRecord;

  assert.equal(isClassicReplayRecord(legacyRecord), true);
});

test('Classic replay reducer: input pieces and moves are not mutated', () => {
  const initialPieces = createClassicInitialPieces();
  const moves = [
    makeMove({
      id: 'move-1',
      pieceId: 'shu-S-0',
      pieceType: 'S',
      faction: 'Shu',
      from: { x: 4, y: 3 },
      to: { x: 4, y: 4 },
    }),
  ];
  const initialSnapshot = structuredClone(initialPieces);
  const moveSnapshot = structuredClone(moves);

  const replay = reconstructClassicReplayState(initialPieces, moves, 1);

  assert.deepEqual(initialPieces, initialSnapshot);
  assert.deepEqual(moves, moveSnapshot);
  assert.notEqual(replay.pieces, initialPieces);
});
