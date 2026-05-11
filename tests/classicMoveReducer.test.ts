import type { Faction, Piece, PieceType } from '../src/rules/classicThreeKingdomRules';
import {
  MOVE_ERRORS,
  createClassicInitialPieces,
  getNextClassicFaction,
  validateBoardIntegrity,
} from '../src/rules/classicThreeKingdomRules';
import { applyClassicMoveTransition } from '../src/rules/classicMoveReducer';
import { assert, test } from './testHarness';

function makePiece(id: string, type: PieceType, faction: Faction, x: number, y: number): Piece {
  return { id, type, faction, x, y };
}

function findPiece(pieces: Piece[], id: string): Piece {
  const piece = pieces.find((entry) => entry.id === id);
  assert.ok(piece, `Missing piece ${id}`);
  return piece;
}

function expectLegalTransition(
  transition: ReturnType<typeof applyClassicMoveTransition>
): Extract<ReturnType<typeof applyClassicMoveTransition>, { legal: true }> {
  if (!transition.legal) {
    assert.fail(transition.validation.reason ?? 'Expected legal move transition');
  }

  return transition;
}

function makeThreeFactionBoard(extraPieces: Piece[] = []): Piece[] {
  return [
    makePiece('shu-g', 'G', 'Shu', 7, 1),
    makePiece('wei-g', 'G', 'Wei', 8, 15),
    makePiece('wu-g', 'G', 'Wu', 1, 8),
    ...extraPieces,
  ];
}

function makeTwoFactionBoard(extraPieces: Piece[] = []): Piece[] {
  return [
    makePiece('shu-g', 'G', 'Shu', 7, 1),
    makePiece('wu-g', 'G', 'Wu', 1, 8),
    ...extraPieces,
  ];
}

test('Classic reducer: valid move updates piece position', () => {
  const pieces = createClassicInitialPieces();
  const piece = findPiece(pieces, 'shu-S-0');

  const transition = expectLegalTransition(
    applyClassicMoveTransition({
      piece,
      destination: { x: 4, y: 4 },
      pieces,
      turn: 'Shu',
      eliminatedFactions: [],
      moveId: 'move-valid-position',
    })
  );

  const movedPiece = findPiece(transition.finalPieces, 'shu-S-0');
  assert.deepEqual({ x: movedPiece.x, y: movedPiece.y }, { x: 4, y: 4 });
  assert.ok(!transition.finalPieces.some((entry) => entry.id === 'shu-S-0' && entry.x === 4 && entry.y === 3));
});

test('Classic reducer: capture removes target piece', () => {
  const pieces = makeThreeFactionBoard([
    makePiece('shu-r', 'R', 'Shu', 4, 4),
    makePiece('wei-s', 'S', 'Wei', 4, 7),
  ]);
  const piece = findPiece(pieces, 'shu-r');

  const transition = expectLegalTransition(
    applyClassicMoveTransition({
      piece,
      destination: { x: 4, y: 7 },
      pieces,
      turn: 'Shu',
      eliminatedFactions: [],
      moveId: 'move-capture',
    })
  );

  assert.equal(transition.capturedPiece?.id, 'wei-s');
  assert.ok(!transition.finalPieces.some((entry) => entry.id === 'wei-s'));
  assert.equal(transition.finalPieces.length, pieces.length - 1);
});

test('Classic reducer: turn advances after legal move', () => {
  const pieces = createClassicInitialPieces();
  const piece = findPiece(pieces, 'shu-S-1');

  const transition = expectLegalTransition(
    applyClassicMoveTransition({
      piece,
      destination: { x: 6, y: 4 },
      pieces,
      turn: 'Shu',
      eliminatedFactions: [],
      moveId: 'move-next-turn',
    })
  );

  assert.equal(transition.nextTurn, 'Wei');
});

test('Classic reducer: eliminated faction is skipped in next-turn calculation', () => {
  const pieces = makeTwoFactionBoard([makePiece('shu-s', 'S', 'Shu', 4, 3)]);
  const piece = findPiece(pieces, 'shu-s');

  const transition = expectLegalTransition(
    applyClassicMoveTransition({
      piece,
      destination: { x: 4, y: 4 },
      pieces,
      turn: 'Shu',
      eliminatedFactions: ['Wei'],
      moveId: 'move-skip-eliminated',
    })
  );

  assert.equal(transition.nextTurn, 'Wu');
});

test('Classic reducer: winner resolves when only one active faction remains', () => {
  const pieces = [makePiece('shu-g', 'G', 'Shu', 7, 1), makePiece('shu-s', 'S', 'Shu', 4, 3)];
  const piece = findPiece(pieces, 'shu-s');

  const transition = expectLegalTransition(
    applyClassicMoveTransition({
      piece,
      destination: { x: 4, y: 4 },
      pieces,
      turn: 'Shu',
      eliminatedFactions: ['Wei'],
      moveId: 'move-win',
    })
  );

  assert.equal(transition.checkmateHappened, true);
  assert.deepEqual(transition.eliminatedFactions, ['Wei', 'Wu']);
  assert.equal(transition.winner, 'Shu');
  assert.equal(transition.nextTurn, null);
});

test('Classic reducer: illegal move is rejected with reason', () => {
  const pieces = createClassicInitialPieces();
  const piece = findPiece(pieces, 'shu-S-0');

  const transition = applyClassicMoveTransition({
    piece,
    destination: { x: 5, y: 3 },
    pieces,
    turn: 'Shu',
    eliminatedFactions: [],
    moveId: 'move-illegal',
  });

  assert.equal(transition.legal, false);
  assert.equal(transition.validation.reason, MOVE_ERRORS.SOLDIER_BACKWARD);
});

test('Classic reducer: move object stays replay-compatible', () => {
  const pieces = makeThreeFactionBoard([
    makePiece('shu-r', 'R', 'Shu', 4, 4),
    makePiece('wei-s', 'S', 'Wei', 4, 7),
  ]);
  const piece = findPiece(pieces, 'shu-r');

  const transition = expectLegalTransition(
    applyClassicMoveTransition({
      piece,
      destination: { x: 4, y: 7 },
      pieces,
      turn: 'Shu',
      eliminatedFactions: [],
      moveId: 'replay-move-1',
    })
  );

  assert.equal(transition.move.id, 'replay-move-1');
  assert.equal(transition.move.faction, 'Shu');
  assert.equal(transition.move.pieceType, 'R');
  assert.deepEqual(transition.move.from, { x: 4, y: 4 });
  assert.deepEqual(transition.move.to, { x: 4, y: 7 });
  assert.equal(transition.move.captured, 'S');
});

test('Classic reducer: board integrity result is returned', () => {
  const pieces = createClassicInitialPieces();
  const piece = findPiece(pieces, 'shu-S-2');

  const transition = expectLegalTransition(
    applyClassicMoveTransition({
      piece,
      destination: { x: 8, y: 4 },
      pieces,
      turn: 'Shu',
      eliminatedFactions: [],
      moveId: 'move-integrity',
    })
  );

  assert.deepEqual(
    transition.integrity,
    validateBoardIntegrity(transition.finalPieces, transition.eliminatedFactions)
  );
  assert.equal(transition.integrity.valid, true);
});

test('Classic reducer: input pieces are not mutated', () => {
  const pieces = createClassicInitialPieces();
  const snapshot = structuredClone(pieces);
  const piece = findPiece(pieces, 'shu-S-3');

  const transition = expectLegalTransition(
    applyClassicMoveTransition({
      piece,
      destination: { x: 10, y: 4 },
      pieces,
      turn: 'Shu',
      eliminatedFactions: [],
      moveId: 'move-no-mutate',
    })
  );

  assert.deepEqual(pieces, snapshot);
  assert.deepEqual(piece, findPiece(snapshot, 'shu-S-3'));
  assert.notEqual(transition.finalPieces, pieces);
});

test('Classic helper: next-turn advance works for bot no-legal-move flow', () => {
  const pieces = makeTwoFactionBoard([makePiece('shu-s', 'S', 'Shu', 4, 3)]);

  assert.equal(getNextClassicFaction('Shu', pieces, ['Wei']), 'Wu');
  assert.equal(getNextClassicFaction('Wu', pieces, ['Wei']), 'Shu');
});
