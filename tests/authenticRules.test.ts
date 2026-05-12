import type { PieceType, Point } from '../src/rules/classicThreeKingdomRules';
import {
  AllianceState,
  type AuthenticBoardState,
  type AuthenticFaction,
  type AuthenticFactionOrNeutral,
  type AuthenticPiece,
  applyAuthenticMove,
  createInitialAuthenticState,
  getAuthenticInitialPieces,
  validateAuthenticMove,
} from '../src/rules/authenticThreeKingdomRules';
import { test, assert } from './testHarness';

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

test('Authentic: Wu moves first', () => {
  const state = createInitialAuthenticState();
  assert.equal(state.currentTurn, 'Wu');
});

test('Authentic: turn order advances Wu -> Wei -> Shu', () => {
  let state = createInitialAuthenticState();
  state = advanceState(state, 'auth-wu-S-0', { x: 4, y: 4 });
  assert.equal(state.currentTurn, 'Wei');
  state = advanceState(state, 'auth-wei-S-0', { x: 4, y: 12 });
  assert.equal(state.currentTurn, 'Shu');
});

test('Authentic: Horse ignores leg blocking', () => {
  const pieces = [
    ...standardGenerals(),
    makePiece('wu-h', 'H', 'Wu', 3, 7),
    makePiece('blocker', 'S', 'Wu', 4, 7),
  ];
  const validation = validateAuthenticMove(
    pieces.find((piece) => piece.id === 'wu-h') ?? null,
    { x: 5, y: 8 },
    pieces,
    'Wu',
    1,
    null,
    { allies: null, target: null, source: null }
  );
  assert.equal(validation.legal, true);
});

test('Authentic: Elephant ignores eye blocking but respects territory', () => {
  const legalPieces = [
    ...standardGenerals(),
    makePiece('wu-e', 'E', 'Wu', 2, 7),
    makePiece('eye-block', 'S', 'Wu', 3, 8),
  ];
  const legal = validateAuthenticMove(
    legalPieces.find((piece) => piece.id === 'wu-e') ?? null,
    { x: 4, y: 9 },
    legalPieces,
    'Wu',
    1,
    null,
    { allies: null, target: null, source: null }
  );
  assert.equal(legal.legal, true);

  const territoryPieces = [
    ...standardGenerals(),
    makePiece('wu-e-2', 'E', 'Wu', 4, 11),
  ];
  const illegal = validateAuthenticMove(
    territoryPieces.find((piece) => piece.id === 'wu-e-2') ?? null,
    { x: 6, y: 13 },
    territoryPieces,
    'Wu',
    1,
    null,
    { allies: null, target: null, source: null }
  );
  assert.equal(illegal.legal, false);
  assert.match(illegal.reason ?? '', /territory/i);
});

test('Authentic: Soldier home behavior allows forward and sideways but blocks backward', () => {
  const homePieces = [
    ...standardGenerals(),
    makePiece('wu-s-home', 'S', 'Wu', 3, 8),
  ];

  const forwardHome = validateAuthenticMove(
    homePieces.find((piece) => piece.id === 'wu-s-home') ?? null,
    { x: 4, y: 8 },
    homePieces,
    'Wu',
    1,
    null,
    { allies: null, target: null, source: null }
  );
  assert.equal(forwardHome.legal, true);

  const sidewaysHome = validateAuthenticMove(
    homePieces.find((piece) => piece.id === 'wu-s-home') ?? null,
    { x: 3, y: 9 },
    homePieces,
    'Wu',
    1,
    null,
    { allies: null, target: null, source: null }
  );
  assert.equal(sidewaysHome.legal, true);

  const backwardHome = validateAuthenticMove(
    homePieces.find((piece) => piece.id === 'wu-s-home') ?? null,
    { x: 2, y: 8 },
    homePieces,
    'Wu',
    1,
    null,
    { allies: null, target: null, source: null }
  );
  assert.equal(backwardHome.legal, false);
  assert.match(backwardHome.reason ?? '', /cannot move backward/i);
});

test('Authentic: Soldier crossed-border behavior allows backward movement', () => {
  const crossedPieces = [
    ...standardGenerals(),
    makePiece('wu-s-crossed', 'S', 'Wu', 5, 8),
  ];
  const backwardCrossed = validateAuthenticMove(
    crossedPieces.find((piece) => piece.id === 'wu-s-crossed') ?? null,
    { x: 4, y: 8 },
    crossedPieces,
    'Wu',
    1,
    null,
    { allies: null, target: null, source: null }
  );
  assert.equal(backwardCrossed.legal, true);
});

test('Authentic: Cannon first-move territory restriction works', () => {
  const pieces = [
    ...standardGenerals(),
    makePiece('shu-cannon', 'P', 'Shu', 5, 2),
  ];

  const validation = validateAuthenticMove(
    pieces.find((piece) => piece.id === 'shu-cannon') ?? null,
    { x: 5, y: 5 },
    pieces,
    'Shu',
    1,
    null,
    { allies: null, target: null, source: null }
  );

  assert.equal(validation.legal, false);
  assert.match(validation.reason ?? '', /cannot leave its home territory/i);
});

test('Authentic: Cannon capture requires exactly one screen', () => {
  const noScreenPieces = [
    ...standardGenerals(),
    makePiece('shu-cannon', 'P', 'Shu', 5, 2, { firstMoveDone: true }),
    makePiece('target', 'R', 'Wei', 5, 6),
  ];
  const noScreen = validateAuthenticMove(
    noScreenPieces.find((piece) => piece.id === 'shu-cannon') ?? null,
    { x: 5, y: 6 },
    noScreenPieces,
    'Shu',
    1,
    null,
    { allies: null, target: null, source: null }
  );
  assert.equal(noScreen.legal, false);
  assert.match(noScreen.reason ?? '', /exactly one screen/i);

  const oneScreenPieces = [
    ...standardGenerals(),
    makePiece('shu-cannon-ok', 'P', 'Shu', 5, 2, { firstMoveDone: true }),
    makePiece('screen', 'S', 'Wu', 5, 4),
    makePiece('target', 'R', 'Wei', 5, 6),
  ];
  const oneScreen = validateAuthenticMove(
    oneScreenPieces.find((piece) => piece.id === 'shu-cannon-ok') ?? null,
    { x: 5, y: 6 },
    oneScreenPieces,
    'Shu',
    1,
    null,
    { allies: null, target: null, source: null }
  );
  assert.equal(oneScreen.legal, true);
  assert.equal(oneScreen.isCapture, true);

  const twoScreenPieces = [
    ...standardGenerals(),
    makePiece('shu-cannon-too-many', 'P', 'Shu', 5, 2, { firstMoveDone: true }),
    makePiece('screen-a', 'S', 'Wu', 5, 3),
    makePiece('screen-b', 'S', 'Wu', 5, 4),
    makePiece('target', 'R', 'Wei', 5, 6),
  ];
  const twoScreen = validateAuthenticMove(
    twoScreenPieces.find((piece) => piece.id === 'shu-cannon-too-many') ?? null,
    { x: 5, y: 6 },
    twoScreenPieces,
    'Shu',
    1,
    null,
    { allies: null, target: null, source: null }
  );
  assert.equal(twoScreen.legal, false);
  assert.match(twoScreen.reason ?? '', /exactly one screen/i);
});

test('Authentic: Han military is protected before the Emperor is deposed', () => {
  const pieces = [
    ...standardGenerals(),
    makePiece('shu-r', 'R', 'Shu', 6, 5),
    makePiece('han-emperor', 'G', 'Han', 8, 8),
    makePiece('han-r', 'R', 'Han', 6, 8),
  ];

  const validation = validateAuthenticMove(
    pieces.find((piece) => piece.id === 'shu-r') ?? null,
    { x: 6, y: 8 },
    pieces,
    'Shu',
    1,
    null,
    { allies: null, target: null, source: null }
  );

  assert.equal(validation.legal, false);
  assert.match(validation.reason ?? '', /Han military pieces cannot be captured/i);
});

test('Authentic: Only Horse may depose the Han Emperor', () => {
  const illegalPieces = [
    ...standardGenerals(),
    makePiece('shu-r', 'R', 'Shu', 8, 5),
    makePiece('han-emperor', 'G', 'Han', 8, 8),
  ];
  const illegal = validateAuthenticMove(
    illegalPieces.find((piece) => piece.id === 'shu-r') ?? null,
    { x: 8, y: 8 },
    illegalPieces,
    'Shu',
    1,
    null,
    { allies: null, target: null, source: null }
  );
  assert.equal(illegal.legal, false);

  const legalPieces = [
    ...standardGenerals(),
    makePiece('shu-h', 'H', 'Shu', 7, 6),
    makePiece('han-emperor', 'G', 'Han', 8, 8),
  ];
  const legal = validateAuthenticMove(
    legalPieces.find((piece) => piece.id === 'shu-h') ?? null,
    { x: 8, y: 8 },
    legalPieces,
    'Shu',
    1,
    null,
    { allies: null, target: null, source: null }
  );
  assert.equal(legal.legal, true);
  assert.equal(legal.special, 'DEPOSE_EMPEROR');
});

test('Authentic: Han military transfers after Emperor depose', () => {
  const state = makeState({
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

  const next = advanceState(state, 'shu-h', { x: 8, y: 8 });
  assert.equal(next.hanController, 'Shu');
  assert.ok(next.pieces.some((piece) => piece.id === 'han-r' && piece.owner === 'Shu'));
  assert.ok(next.pieces.some((piece) => piece.id === 'han-p' && piece.owner === 'Shu'));
});

test('Authentic: Anti-emperor alliance forms after depose', () => {
  const state = makeState({
    currentTurn: 'Shu',
    moveNumber: 1,
    pieces: [
      ...standardGenerals(),
      makePiece('shu-h', 'H', 'Shu', 7, 6),
      makePiece('han-emperor', 'G', 'Han', 8, 8),
      makePiece('han-r', 'R', 'Han', 6, 8),
    ],
  });

  const next = advanceState(state, 'shu-h', { x: 8, y: 8 });
  assert.deepEqual(next.allianceState, {
    allies: ['Wu', 'Wei'],
    target: 'Shu',
    source: 'anti-emperor',
  });
});

test('Authentic: Alliance blocks captures between allies', () => {
  const allianceState: AllianceState = {
    allies: ['Wu', 'Wei'],
    target: 'Shu',
    source: 'alliance',
  };
  const pieces = [
    ...standardGenerals(),
    makePiece('wu-r', 'R', 'Wu', 4, 8),
    makePiece('wei-s', 'S', 'Wei', 4, 10),
  ];

  const validation = validateAuthenticMove(
    pieces.find((piece) => piece.id === 'wu-r') ?? null,
    { x: 4, y: 10 },
    pieces,
    'Wu',
    1,
    null,
    allianceState
  );

  assert.equal(validation.legal, false);
  assert.match(validation.reason ?? '', /Allied kingdoms cannot capture each other/i);
});

test('Authentic: Check priority gives the checked faction the next move', () => {
  const state = makeState({
    currentTurn: 'Wu',
    moveNumber: 1,
    pieces: [
      ...standardGenerals(),
      makePiece('wu-r', 'R', 'Wu', 5, 13),
    ],
  });

  const next = advanceState(state, 'wu-r', { x: 8, y: 13 });
  assert.deepEqual(next.checkedPriorityQueue, ['Wei']);
  assert.equal(next.currentTurn, 'Wei');
});

test('Authentic: Army absorption transfers defeated pieces to the attacker', () => {
  const state = makeState({
    currentTurn: 'Wu',
    moveNumber: 1,
    pieces: [
      ...standardGenerals(),
      makePiece('wu-r', 'R', 'Wu', 8, 14),
      makePiece('wei-s', 'S', 'Wei', 6, 15),
    ],
  });

  const next = advanceState(state, 'wu-r', { x: 8, y: 15 });
  assert.ok(next.eliminated.includes('Wei'));
  assert.ok(next.pieces.some((piece) => piece.id === 'wei-s' && piece.owner === 'Wu'));
});

test('Authentic: checkmate and army absorption can resolve the final winner immediately', () => {
  const state = makeState({
    currentTurn: 'Wu',
    moveNumber: 1,
    pieces: [
      makePiece('wu-g', 'G', 'Wu', 1, 8),
      makePiece('shu-g', 'G', 'Shu', 8, 1),
      makePiece('shu-s', 'S', 'Shu', 4, 1),
      makePiece('wu-r-left', 'R', 'Wu', 7, 3),
      makePiece('wu-r-right', 'R', 'Wu', 9, 3),
      makePiece('wu-r-finisher', 'R', 'Wu', 8, 5),
    ],
  });

  const actingPiece = state.pieces.find((piece) => piece.id === 'wu-r-finisher');
  assert.ok(actingPiece, 'Missing wu-r-finisher');

  const resolution = applyAuthenticMove(state, actingPiece, { x: 8, y: 3 });
  assert.ok(resolution, 'Expected a legal move resolution');

  assert.equal(resolution.winner, 'Wu');
  assert.equal(resolution.nextTurn, null);
  assert.ok(resolution.eliminated.includes('Shu'));
  assert.ok(resolution.moveRecord.special?.includes('CHECKMATE'));
  assert.ok(resolution.moveRecord.special?.includes('ABSORB_ARMY'));
  assert.ok(resolution.moveRecord.eliminated?.includes('Shu'));
  assert.ok(resolution.pieces.some((piece) => piece.id === 'shu-s' && piece.owner === 'Wu'));
  assert.match(resolution.status, /Wu wins/i);
});

test('Authentic: Victory resolves when one faction remains', () => {
  const state = makeState({
    currentTurn: 'Wu',
    moveNumber: 1,
    pieces: [
      makePiece('wu-g', 'G', 'Wu', 1, 8),
      makePiece('wu-r', 'R', 'Wu', 8, 14),
      makePiece('wei-g', 'G', 'Wei', 8, 15),
    ],
  });

  const actingPiece = state.pieces.find((piece) => piece.id === 'wu-r');
  assert.ok(actingPiece, 'Missing wu-r');

  const resolution = applyAuthenticMove(state, actingPiece, { x: 8, y: 15 });
  assert.ok(resolution, 'Expected a legal move resolution');

  const next = advanceState(state, 'wu-r', { x: 8, y: 15 });
  assert.equal(resolution.winner, 'Wu');
  assert.equal(resolution.nextTurn, null);
  assert.equal(next.winner, 'Wu');
});

test('Authentic: Initial state helper returns a fresh default board', () => {
  const first = createInitialAuthenticState();
  const second = createInitialAuthenticState();

  assert.equal(first.currentTurn, 'Wu');
  assert.equal(first.moveNumber, 0);
  assert.equal(first.winner, null);
  assert.deepEqual(first.history, []);
  assert.deepEqual(first.pieces, getAuthenticInitialPieces());
  assert.notEqual(first.pieces, second.pieces);
  assert.notEqual(first.allianceState, second.allianceState);
  assert.ok(first.pieces.some((piece) => piece.owner === 'Han' && piece.type === 'G'));
});

test('Authentic: Invalid move returns a clear reason', () => {
  const pieces = [
    ...standardGenerals(),
    makePiece('wu-r', 'R', 'Wu', 4, 8),
  ];

  const validation = validateAuthenticMove(
    pieces.find((piece) => piece.id === 'wu-r') ?? null,
    { x: 5, y: 9 },
    pieces,
    'Wu',
    1,
    null,
    { allies: null, target: null, source: null }
  );

  assert.equal(validation.legal, false);
  assert.equal(validation.reason, 'Chariots move orthogonally.');
});

test('Authentic: apply move does not mutate input state', () => {
  const state = createInitialAuthenticState();
  const snapshot = structuredClone(state);
  const selectedPiece = state.pieces.find((piece) => piece.id === 'auth-wu-S-0');
  assert.ok(selectedPiece, 'Missing auth-wu-S-0');

  const resolution = applyAuthenticMove(state, selectedPiece, { x: 4, y: 4 });
  assert.ok(resolution, 'Expected a legal move resolution');

  assert.deepEqual(state, snapshot);
  assert.deepEqual(selectedPiece, snapshot.pieces.find((piece) => piece.id === 'auth-wu-S-0'));
  assert.notEqual(resolution.pieces, state.pieces);
  assert.ok(resolution.pieces.some((piece) => piece.id === 'auth-wu-S-0' && piece.x === 4 && piece.y === 4));
});
