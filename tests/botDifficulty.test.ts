import { chooseAuthenticBotMove } from '../src/ai/authenticBotAI';
import { chooseBotMove } from '../src/ai/botAI';
import {
  createClassicInitialPieces,
  type BotDifficulty,
  type Piece,
  validateMove,
} from '../src/rules/classicThreeKingdomRules';
import {
  createInitialAuthenticState,
  type AuthenticBoardState,
  type AuthenticPiece,
  validateAuthenticMove,
} from '../src/rules/authenticThreeKingdomRules';
import { assert, test } from './testHarness';

const DIFFICULTIES: BotDifficulty[] = ['easy', 'normal', 'hard'];

function findClassicPiece(pieces: Piece[], move: NonNullable<ReturnType<typeof chooseBotMove>>['move']) {
  return pieces.find((piece) => piece.x === move.from.x && piece.y === move.from.y && piece.faction === move.faction);
}

function createAuthenticTestState(overrides: Partial<AuthenticBoardState>): AuthenticBoardState {
  const base = createInitialAuthenticState();
  return {
    ...base,
    ...overrides,
    pieces: overrides.pieces ? overrides.pieces.map((piece) => ({ ...piece })) : base.pieces.map((piece) => ({ ...piece })),
    factionMoveCounts: overrides.factionMoveCounts ? { ...overrides.factionMoveCounts } : { ...base.factionMoveCounts },
    allianceState: overrides.allianceState ? { ...overrides.allianceState } : { ...base.allianceState },
    checkedPriorityQueue: overrides.checkedPriorityQueue ? [...overrides.checkedPriorityQueue] : [...base.checkedPriorityQueue],
    eliminated: overrides.eliminated ? [...overrides.eliminated] : [...base.eliminated],
    history: overrides.history ? [...overrides.history] : [...base.history],
    captured: overrides.captured ? [...overrides.captured] : [...base.captured],
  };
}

test('Classic bot: easy, normal, and hard all return legal moves from the initial board', () => {
  const pieces = createClassicInitialPieces();

  DIFFICULTIES.forEach((difficulty) => {
    const decision = chooseBotMove('Shu', pieces, difficulty);
    assert.ok(decision, `Expected a ${difficulty} Classic bot decision`);

    const piece = findClassicPiece(pieces, decision.move);
    assert.ok(piece, `Expected to find source piece for ${difficulty}`);

    const validation = validateMove(piece, decision.move.to, pieces, 'Shu');
    assert.equal(validation.legal, true, `Expected ${difficulty} Classic bot move to be legal`);
  });
});

test('Classic bot: hard prefers an immediate enemy General capture when available', () => {
  const pieces: Piece[] = [
    { id: 'shu-g', type: 'G', faction: 'Shu', x: 7, y: 1 },
    { id: 'wei-g', type: 'G', faction: 'Wei', x: 8, y: 15 },
    { id: 'wu-g', type: 'G', faction: 'Wu', x: 1, y: 8 },
    { id: 'shu-r', type: 'R', faction: 'Shu', x: 8, y: 14 },
    { id: 'shu-s', type: 'S', faction: 'Shu', x: 4, y: 3 },
  ];

  const decision = chooseBotMove('Shu', pieces, 'hard');
  assert.ok(decision);
  assert.deepEqual(decision.move.to, { x: 8, y: 15 });
  assert.equal(decision.move.captured, 'G');
});

test('Authentic bot: easy, normal, and hard all return legal moves from the initial board', () => {
  const state = createInitialAuthenticState();

  DIFFICULTIES.forEach((difficulty) => {
    const decision = chooseAuthenticBotMove(state, 'Wu', difficulty);
    assert.ok(decision, `Expected a ${difficulty} Authentic bot decision`);

    const piece = state.pieces.find((entry) => entry.id === decision.pieceId);
    assert.ok(piece, `Expected to find Authentic piece for ${difficulty}`);

    const validation = validateAuthenticMove(
      piece,
      decision.to,
      state.pieces,
      'Wu',
      state.moveNumber,
      state.hanController,
      state.allianceState
    );
    assert.equal(validation.legal, true, `Expected ${difficulty} Authentic bot move to be legal`);
  });
});

test('Authentic bot: respects alliances and does not target allied pieces', () => {
  const pieces: AuthenticPiece[] = [
    { id: 'wu-g', type: 'G', owner: 'Wu', visualFaction: 'Wu', originFaction: 'Wu', x: 1, y: 8, firstMoveDone: false },
    { id: 'wei-g', type: 'G', owner: 'Wei', visualFaction: 'Wei', originFaction: 'Wei', x: 8, y: 15, firstMoveDone: false },
    { id: 'shu-g', type: 'G', owner: 'Shu', visualFaction: 'Shu', originFaction: 'Shu', x: 8, y: 1, firstMoveDone: false },
    { id: 'han-r', type: 'R', owner: 'Han', visualFaction: 'Han', originFaction: 'Han', x: 8, y: 8, firstMoveDone: false },
    { id: 'wu-h', type: 'H', owner: 'Wu', visualFaction: 'Wu', originFaction: 'Wu', x: 4, y: 8, firstMoveDone: false },
    { id: 'wei-s', type: 'S', owner: 'Wei', visualFaction: 'Wei', originFaction: 'Wei', x: 5, y: 6, firstMoveDone: false },
    { id: 'shu-s', type: 'S', owner: 'Shu', visualFaction: 'Shu', originFaction: 'Shu', x: 6, y: 9, firstMoveDone: false },
  ];

  const state = createAuthenticTestState({
    currentTurn: 'Wu',
    moveNumber: 3,
    pieces,
    allianceState: { allies: ['Wu', 'Wei'], target: 'Shu', source: 'alliance' },
  });

  const decision = chooseAuthenticBotMove(state, 'Wu', 'hard');
  assert.ok(decision);
  assert.notDeepEqual(decision.to, { x: 5, y: 6 });

  const piece = state.pieces.find((entry) => entry.id === decision.pieceId);
  assert.ok(piece);
  const validation = validateAuthenticMove(
    piece,
    decision.to,
    state.pieces,
    'Wu',
    state.moveNumber,
    state.hanController,
    state.allianceState
  );
  assert.equal(validation.legal, true);
});

test('Authentic bot: does not move Han neutral pieces unless they have been transferred', () => {
  const state = createInitialAuthenticState();
  const decision = chooseAuthenticBotMove(state, 'Wu', 'normal');

  assert.ok(decision);
  const piece = state.pieces.find((entry) => entry.id === decision.pieceId);
  assert.ok(piece);
  assert.equal(piece.owner, 'Wu');
  assert.notEqual(piece.owner, 'Han');
});
