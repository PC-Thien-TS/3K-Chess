import { GAME_MODE_RULESETS } from '@/shared/gameModes';
import {
  countPiecesBetween,
  type PieceType,
  type Point,
} from '@/src/rules/classicThreeKingdomRules';

export type AuthenticFaction = 'Wu' | 'Wei' | 'Shu';
export type NeutralFaction = 'Han';
export type AuthenticPieceOwner = AuthenticFaction | NeutralFaction;
export type AuthenticPieceVisualFaction = AuthenticFaction | NeutralFaction;
export type AuthenticFactionOrNeutral = AuthenticFaction | NeutralFaction;
export type AuthenticSpecialMove =
  | 'ALLIANCE'
  | 'DEPOSE_EMPEROR'
  | 'ABSORB_ARMY'
  | 'CHECK'
  | 'CHECKMATE';

export interface AllianceState {
  allies: [AuthenticFaction, AuthenticFaction] | null;
  target: AuthenticFaction | null;
  source: 'alliance' | 'anti-emperor' | null;
}

export interface AuthenticPiece {
  id: string;
  type: PieceType;
  owner: AuthenticPieceOwner;
  visualFaction: AuthenticPieceVisualFaction;
  originFaction: AuthenticFactionOrNeutral;
  x: number;
  y: number;
  firstMoveDone?: boolean;
}

export interface AuthenticMoveRecord {
  id: string;
  turnNumber: number;
  faction: AuthenticFaction;
  pieceType: PieceType;
  pieceId: string;
  from: Point;
  to: Point;
  captured?: {
    owner: AuthenticPieceOwner;
    visualFaction: AuthenticPieceVisualFaction;
    type: PieceType;
  };
  special?: AuthenticSpecialMove[];
  eliminated?: AuthenticFaction[];
  note: string;
}

export interface AuthenticValidationResult {
  legal: boolean;
  reason?: string;
  isCapture?: boolean;
  special?: AuthenticSpecialMove;
}

export interface AuthenticMoveResolution {
  pieces: AuthenticPiece[];
  eliminated: AuthenticFaction[];
  hanController: AuthenticFaction | null;
  allianceState: AllianceState;
  checkedPriorityQueue: AuthenticFaction[];
  winner: AuthenticFaction | null;
  moveRecord: AuthenticMoveRecord;
  capturedPieces: AuthenticCapturedPieceRecord[];
  nextTurn: AuthenticFaction | null;
  factionMoveCounts: Record<AuthenticFaction, number>;
  status: string;
  lastMove: { from: Point; to: Point };
}

export interface AuthenticCapturedPieceRecord {
  id: string;
  owner: AuthenticPieceOwner;
  visualFaction: AuthenticPieceVisualFaction;
  type: PieceType;
}

export interface AuthenticBoardState {
  pieces: AuthenticPiece[];
  currentTurn: AuthenticFaction;
  moveNumber: number;
  factionMoveCounts: Record<AuthenticFaction, number>;
  hanController: AuthenticFaction | null;
  allianceState: AllianceState;
  checkedPriorityQueue: AuthenticFaction[];
  eliminated: AuthenticFaction[];
  history: AuthenticMoveRecord[];
  captured: AuthenticCapturedPieceRecord[];
  winner: AuthenticFaction | null;
  lastMove: { from: Point; to: Point } | null;
}

export const AUTHENTIC_RULESET = 'SANGUO_YANYI_QI_V1';
export const AUTHENTIC_ROWS = 17;
export const AUTHENTIC_COLS = 17;
export const AUTHENTIC_PLAYER_FACTIONS: AuthenticFaction[] = ['Wu', 'Wei', 'Shu'];
export const AUTHENTIC_FACTIONS: AuthenticFactionOrNeutral[] = ['Wu', 'Wei', 'Shu', 'Han'];

export const AUTHENTIC_MODE_STATUS =
  'Authentic Modern Three Kingdoms Xiangqi - Local Only';

export const AUTHENTIC_BOARD_NOTE =
  'Sanguo Yanyi Qi local board. Wu moves first, Han begins neutral, alliances and check priority can override the standard rotation.';

export const AUTHENTIC_MOVE_BLOCKED_MESSAGE =
  'Move rejected under Sanguo Yanyi Qi rules.';

export const AUTHENTIC_LOCAL_ONLY_MESSAGE =
  'Authentic Modern Three Kingdoms Xiangqi is local-only. Wu, Wei, and Shu support Human or Bot control, while Han remains a neutral court objective.';

export const AUTHENTIC_GLYPHS: Record<PieceType, string> = {
  G: '\u5c07',
  A: '\u58eb',
  E: '\u8c61',
  H: '\u99ac',
  R: '\u8eca',
  P: '\u70ae',
  S: '\u5175',
};

export const AUTHENTIC_LABELS: Record<PieceType, string> = {
  G: 'General',
  A: 'Advisor',
  E: 'Elephant',
  H: 'Horse',
  R: 'Chariot',
  P: 'Cannon',
  S: 'Soldier',
};

export const AUTHENTIC_POINT_ACCENTS: Point[] = [
  { x: 5, y: 2 },
  { x: 11, y: 2 },
  { x: 2, y: 5 },
  { x: 2, y: 11 },
  { x: 5, y: 14 },
  { x: 11, y: 14 },
  { x: 8, y: 6 },
  { x: 6, y: 8 },
  { x: 8, y: 8 },
  { x: 10, y: 8 },
  { x: 8, y: 10 },
];

export const AUTHENTIC_ALLIANCE_POINTS: Record<AuthenticFaction, Point> = {
  Shu: { x: 8, y: 5 },
  Wu: { x: 5, y: 8 },
  Wei: { x: 8, y: 11 },
};

const PALACE_POINTS: Record<AuthenticFaction, { minX: number; maxX: number; minY: number; maxY: number }> = {
  Shu: { minX: 7, maxX: 9, minY: 0, maxY: 2 },
  Wu: { minX: 0, maxX: 2, minY: 7, maxY: 9 },
  Wei: { minX: 7, maxX: 9, minY: 14, maxY: 16 },
};

function createPiece(
  id: string,
  type: PieceType,
  owner: AuthenticPieceOwner,
  visualFaction: AuthenticPieceVisualFaction,
  originFaction: AuthenticFactionOrNeutral,
  x: number,
  y: number
): AuthenticPiece {
  return { id, type, owner, visualFaction, originFaction, x, y, firstMoveDone: false };
}

export function getAuthenticInitialPieces(): AuthenticPiece[] {
  const pieces: AuthenticPiece[] = [];
  const backRow = ['R', 'H', 'E', 'A', 'G', 'A', 'E', 'H', 'R'] as PieceType[];

  backRow.forEach((type, i) => {
    pieces.push(createPiece(`auth-shu-${type}-${i}`, type, 'Shu', 'Shu', 'Shu', 4 + i, 0));
    pieces.push(createPiece(`auth-wei-${type}-${i}`, type, 'Wei', 'Wei', 'Wei', 4 + i, 16));
    pieces.push(createPiece(`auth-wu-${type}-${i}`, type, 'Wu', 'Wu', 'Wu', 0, 4 + i));
  });

  pieces.push(createPiece('auth-shu-P-1', 'P', 'Shu', 'Shu', 'Shu', 5, 2));
  pieces.push(createPiece('auth-shu-P-2', 'P', 'Shu', 'Shu', 'Shu', 11, 2));
  pieces.push(createPiece('auth-wei-P-1', 'P', 'Wei', 'Wei', 'Wei', 5, 14));
  pieces.push(createPiece('auth-wei-P-2', 'P', 'Wei', 'Wei', 'Wei', 11, 14));
  pieces.push(createPiece('auth-wu-P-1', 'P', 'Wu', 'Wu', 'Wu', 2, 5));
  pieces.push(createPiece('auth-wu-P-2', 'P', 'Wu', 'Wu', 'Wu', 2, 11));

  [4, 6, 8, 10, 12].forEach((x, i) => {
    pieces.push(createPiece(`auth-shu-S-${i}`, 'S', 'Shu', 'Shu', 'Shu', x, 3));
    pieces.push(createPiece(`auth-wei-S-${i}`, 'S', 'Wei', 'Wei', 'Wei', x, 13));
  });

  [4, 6, 8, 10, 12].forEach((y, i) => {
    pieces.push(createPiece(`auth-wu-S-${i}`, 'S', 'Wu', 'Wu', 'Wu', 3, y));
  });

  pieces.push(createPiece('han-emperor', 'G', 'Han', 'Han', 'Han', 8, 8));
  pieces.push(createPiece('han-cannon', 'P', 'Han', 'Han', 'Han', 8, 6));
  pieces.push(createPiece('han-chariot-1', 'R', 'Han', 'Han', 'Han', 6, 8));
  pieces.push(createPiece('han-chariot-2', 'R', 'Han', 'Han', 'Han', 10, 8));
  pieces.push(createPiece('han-chariot-3', 'R', 'Han', 'Han', 'Han', 8, 10));

  return pieces;
}

export function createInitialAuthenticState(): AuthenticBoardState {
  return {
    pieces: getAuthenticInitialPieces(),
    currentTurn: 'Wu',
    moveNumber: 0,
    factionMoveCounts: {
      Wu: 0,
      Wei: 0,
      Shu: 0,
    },
    hanController: null,
    allianceState: { allies: null, target: null, source: null },
    checkedPriorityQueue: [],
    eliminated: [],
    history: [],
    captured: [],
    winner: null,
    lastMove: null,
  };
}

export function getAuthenticFactionLabel(faction: AuthenticFactionOrNeutral): string {
  if (faction === 'Wu') return 'Wu / Green';
  if (faction === 'Wei') return 'Wei / Blue';
  if (faction === 'Shu') return 'Shu / Red';
  return 'Han / Yellow Court';
}

export function getAuthenticTerritory(
  x: number,
  y: number
): AuthenticFactionOrNeutral | 'neutral' {
  if (x >= 6 && x <= 10 && y >= 6 && y <= 10) return 'Han';
  if (x <= 4 && y >= 4 && y <= 12) return 'Wu';
  if (y <= 4 && x >= 4 && x <= 12) return 'Shu';
  if (y >= 12 && x >= 4 && x <= 12) return 'Wei';
  return 'neutral';
}

export function isAuthenticPalacePoint(x: number, y: number, faction: AuthenticFaction): boolean {
  const palace = PALACE_POINTS[faction];
  return x >= palace.minX && x <= palace.maxX && y >= palace.minY && y <= palace.maxY;
}

export function findAuthenticPieceAt(pieces: AuthenticPiece[], point: Point): AuthenticPiece | undefined {
  return pieces.find((piece) => piece.x === point.x && piece.y === point.y);
}

export function isAuthenticPlayerFaction(
  value: AuthenticFactionOrNeutral | null | undefined
): value is AuthenticFaction {
  return value === 'Wu' || value === 'Wei' || value === 'Shu';
}

export function getAuthenticPreviewTargets(piece: AuthenticPiece): Point[] {
  const offsets: Point[] = [
    { x: -1, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: -1 },
    { x: 0, y: 1 },
    { x: -1, y: -1 },
    { x: 1, y: -1 },
    { x: -1, y: 1 },
    { x: 1, y: 1 },
    { x: -2, y: -2 },
    { x: 2, y: -2 },
    { x: -2, y: 2 },
    { x: 2, y: 2 },
  ];

  return offsets
    .map((offset) => ({ x: piece.x + offset.x, y: piece.y + offset.y }))
    .filter((point) => point.x >= 0 && point.x < AUTHENTIC_COLS && point.y >= 0 && point.y < AUTHENTIC_ROWS);
}

export function getHanStatus(hanController: AuthenticFaction | null): string {
  return hanController ? `Han military commanded by ${hanController}` : 'Han Court Neutral';
}

export function getAllianceStatus(allianceState: AllianceState): string {
  if (!allianceState.allies || !allianceState.target) {
    return 'No alliance active';
  }
  return `${allianceState.allies[0]} and ${allianceState.allies[1]} allied against ${allianceState.target}`;
}

export function getAlliancePointFaction(point: Point): AuthenticFaction | null {
  return (
    (Object.entries(AUTHENTIC_ALLIANCE_POINTS) as [AuthenticFaction, Point][])
      .find(([, alliancePoint]) => alliancePoint.x === point.x && alliancePoint.y === point.y)?.[0] || null
  );
}

function samePoint(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y;
}

function isAlliedPair(
  a: AuthenticFaction,
  b: AuthenticFaction,
  allianceState: AllianceState
): boolean {
  if (!allianceState.allies) return false;
  return allianceState.allies.includes(a) && allianceState.allies.includes(b);
}

function getRemainingFactions(pieces: AuthenticPiece[]): AuthenticFaction[] {
  return AUTHENTIC_PLAYER_FACTIONS.filter((faction) =>
    pieces.some((piece) => piece.owner === faction)
  );
}

function getSortedTurnPriority(factions: AuthenticFaction[]): AuthenticFaction[] {
  return AUTHENTIC_PLAYER_FACTIONS.filter((faction) => factions.includes(faction));
}

function getNextTurnInBaseOrder(
  currentTurn: AuthenticFaction,
  pieces: AuthenticPiece[],
  eliminated: AuthenticFaction[]
): AuthenticFaction | null {
  const active = AUTHENTIC_PLAYER_FACTIONS.filter(
    (faction) => !eliminated.includes(faction) && pieces.some((piece) => piece.owner === faction)
  );

  if (active.length <= 1) return active[0] || null;

  const index = AUTHENTIC_PLAYER_FACTIONS.indexOf(currentTurn);
  for (let step = 1; step <= AUTHENTIC_PLAYER_FACTIONS.length; step++) {
    const candidate = AUTHENTIC_PLAYER_FACTIONS[(index + step) % AUTHENTIC_PLAYER_FACTIONS.length];
    if (active.includes(candidate)) {
      return candidate;
    }
  }
  return null;
}

function getOpponentFactions(
  faction: AuthenticFaction,
  allianceState: AllianceState
): AuthenticFaction[] {
  return AUTHENTIC_PLAYER_FACTIONS.filter((candidate) => {
    if (candidate === faction) return false;
    return !isAlliedPair(faction, candidate, allianceState);
  });
}

function getFactionDirection(originFaction: AuthenticFaction): Point {
  if (originFaction === 'Shu') return { x: 0, y: 1 };
  if (originFaction === 'Wei') return { x: 0, y: -1 };
  return { x: 1, y: 0 };
}

function hasHanEmperor(pieces: AuthenticPiece[]): boolean {
  return pieces.some((piece) => piece.owner === 'Han' && piece.type === 'G');
}

function normalizeAllianceState(
  allianceState: AllianceState,
  pieces: AuthenticPiece[],
  eliminated: AuthenticFaction[]
): AllianceState {
  if (!allianceState.allies || !allianceState.target) {
    return { allies: null, target: null, source: null };
  }

  const active = getRemainingFactions(pieces).filter((faction) => !eliminated.includes(faction));
  const allyAAlive = active.includes(allianceState.allies[0]);
  const allyBAlive = active.includes(allianceState.allies[1]);
  const targetAlive = active.includes(allianceState.target);

  if (!allyAAlive || !allyBAlive || !targetAlive) {
    return { allies: null, target: null, source: null };
  }

  return allianceState;
}

function projectMove(
  pieces: AuthenticPiece[],
  movingPiece: AuthenticPiece,
  to: Point
): { projectedPieces: AuthenticPiece[]; targetPiece?: AuthenticPiece } {
  const targetPiece = findAuthenticPieceAt(pieces, to);
  const projectedPieces = pieces
    .filter((piece) => !targetPiece || piece.id !== targetPiece.id)
    .map((piece) =>
      piece.id === movingPiece.id
        ? { ...piece, x: to.x, y: to.y, firstMoveDone: true }
        : piece
    );

  return { projectedPieces, targetPiece };
}

function isWithinOwnTerritory(piece: AuthenticPiece, point: Point): boolean {
  if (!isAuthenticPlayerFaction(piece.originFaction)) return false;
  return getAuthenticTerritory(point.x, point.y) === piece.originFaction;
}

function hasCrossedBorder(piece: AuthenticPiece): boolean {
  return !isWithinOwnTerritory(piece, { x: piece.x, y: piece.y });
}

function canPieceAttackSquare(
  piece: AuthenticPiece,
  target: Point,
  pieces: AuthenticPiece[],
  allianceState: AllianceState
): boolean {
  if (!isAuthenticPlayerFaction(piece.owner)) return false;
  const targetPiece = findAuthenticPieceAt(pieces, target);
  if (targetPiece && isAuthenticPlayerFaction(targetPiece.owner) && isAlliedPair(piece.owner, targetPiece.owner, allianceState)) {
    return false;
  }

  const dx = target.x - piece.x;
  const dy = target.y - piece.y;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  switch (piece.type) {
    case 'G':
      return isAuthenticPlayerFaction(piece.originFaction) &&
        isAuthenticPalacePoint(target.x, target.y, piece.originFaction) &&
        ((absDx === 1 && absDy === 0) || (absDx === 0 && absDy === 1));
    case 'A':
      return isAuthenticPlayerFaction(piece.originFaction) &&
        isAuthenticPalacePoint(target.x, target.y, piece.originFaction) &&
        absDx === 1 &&
        absDy === 1;
    case 'E':
      return isAuthenticPlayerFaction(piece.originFaction) &&
        absDx === 2 &&
        absDy === 2 &&
        isWithinOwnTerritory(piece, target);
    case 'H':
      return (absDx === 1 && absDy === 2) || (absDx === 2 && absDy === 1);
    case 'R':
      return (absDx === 0 || absDy === 0) && countPiecesBetween(piece, target, pieces as any) === 0;
    case 'P': {
      if (absDx !== 0 && absDy !== 0) return false;
      const blockers = countPiecesBetween(piece, target, pieces as any);
      if (targetPiece) return blockers === 1;
      return blockers === 0;
    }
    case 'S': {
      if (!isAuthenticPlayerFaction(piece.originFaction)) return false;
      if (!((absDx === 1 && absDy === 0) || (absDx === 0 && absDy === 1))) return false;
      const direction = getFactionDirection(piece.originFaction);
      const forward =
        dx === direction.x && dy === direction.y;
      const backward =
        dx === -direction.x && dy === -direction.y;
      if (!hasCrossedBorder(piece)) {
        return !backward;
      }
      return true;
    }
    default:
      return false;
  }
}

export function hasFacingGenerals(pieces: AuthenticPiece[]): boolean {
  const generals = pieces.filter((piece) => piece.type === 'G' && isAuthenticPlayerFaction(piece.owner));
  for (let i = 0; i < generals.length; i++) {
    for (let j = i + 1; j < generals.length; j++) {
      const a = generals[i];
      const b = generals[j];
      if (a.x === b.x || a.y === b.y) {
        if (countPiecesBetween(a, b, pieces as any) === 0) {
          return true;
        }
      }
    }
  }
  return false;
}

export function isFactionInCheck(
  faction: AuthenticFaction,
  pieces: AuthenticPiece[],
  allianceState: AllianceState
): boolean {
  const general = pieces.find((piece) => piece.owner === faction && piece.type === 'G');
  if (!general) return false;

  return pieces.some((piece) => {
    if (!isAuthenticPlayerFaction(piece.owner) || piece.owner === faction) return false;
    if (isAlliedPair(piece.owner, faction, allianceState)) return false;
    return canPieceAttackSquare(piece, { x: general.x, y: general.y }, pieces, allianceState);
  });
}

function getCheckedFactions(
  pieces: AuthenticPiece[],
  allianceState: AllianceState
): AuthenticFaction[] {
  return AUTHENTIC_PLAYER_FACTIONS.filter(
    (faction) => pieces.some((piece) => piece.owner === faction && piece.type === 'G') && isFactionInCheck(faction, pieces, allianceState)
  );
}

function getProjectedAllianceState(
  selectedPiece: AuthenticPiece,
  target: Point,
  currentTurn: AuthenticFaction,
  pieces: AuthenticPiece[],
  currentAllianceState: AllianceState,
  targetPiece?: AuthenticPiece
): AllianceState {
  let nextAllianceState = currentAllianceState;
  const allianceFaction = getAlliancePointFaction(target);

  if (
    selectedPiece.type === 'H' &&
    allianceFaction &&
    allianceFaction !== currentTurn &&
    currentAllianceState.target !== currentTurn
  ) {
    const enemy = AUTHENTIC_PLAYER_FACTIONS.find(
      (faction) => faction !== currentTurn && faction !== allianceFaction
    );
    nextAllianceState = {
      allies: [currentTurn, allianceFaction],
      target: enemy || null,
      source: 'alliance',
    };
  }

  if (targetPiece?.owner === 'Han' && targetPiece.type === 'G' && selectedPiece.type === 'H') {
    const alliedOpponents = AUTHENTIC_PLAYER_FACTIONS.filter((faction) => faction !== currentTurn);
    nextAllianceState = {
      allies: [alliedOpponents[0], alliedOpponents[1]],
      target: currentTurn,
      source: 'anti-emperor',
    };
  }

  return nextAllianceState;
}

export function validateAuthenticMove(
  selectedPiece: AuthenticPiece | null,
  to: Point,
  pieces: AuthenticPiece[],
  currentTurn: AuthenticFaction,
  moveNumber: number,
  hanController: AuthenticFaction | null,
  allianceState: AllianceState
): AuthenticValidationResult {
  if (!selectedPiece) {
    return { legal: false, reason: 'Select a piece first.' };
  }

  if (selectedPiece.x === to.x && selectedPiece.y === to.y) {
    return { legal: false, reason: 'Select a different destination.' };
  }

  if (selectedPiece.owner !== currentTurn) {
    return { legal: false, reason: 'It is not this kingdom\'s turn.' };
  }

  const targetPiece = findAuthenticPieceAt(pieces, to);
  if (targetPiece && targetPiece.owner === currentTurn) {
    return { legal: false, reason: 'You cannot capture your own commanded piece.' };
  }

  if (
    targetPiece &&
    isAuthenticPlayerFaction(targetPiece.owner) &&
    isAlliedPair(currentTurn, targetPiece.owner, allianceState)
  ) {
    return { legal: false, reason: 'Allied kingdoms cannot capture each other.' };
  }

  if (moveNumber === 0 && targetPiece) {
    return { legal: false, reason: 'The first move of the game cannot capture.' };
  }

  if (
    targetPiece?.owner === 'Han' &&
    targetPiece.type !== 'G' &&
    hasHanEmperor(pieces)
  ) {
    return { legal: false, reason: 'Han military pieces cannot be captured while the Han Emperor remains.' };
  }

  if (
    targetPiece?.owner === 'Han' &&
    targetPiece.type === 'G' &&
    selectedPiece.type !== 'H'
  ) {
    return { legal: false, reason: 'Only a Horse may depose the Han Emperor.' };
  }

  const dx = to.x - selectedPiece.x;
  const dy = to.y - selectedPiece.y;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  let special: AuthenticSpecialMove | undefined;

  switch (selectedPiece.type) {
    case 'G': {
      if (!isAuthenticPlayerFaction(selectedPiece.originFaction)) {
        return { legal: false, reason: 'Han Emperor movement is not player-controlled.' };
      }
      if (!isAuthenticPalacePoint(to.x, to.y, selectedPiece.originFaction)) {
        return { legal: false, reason: 'Generals must remain inside their palace.' };
      }
      if (!((absDx === 1 && absDy === 0) || (absDx === 0 && absDy === 1))) {
        return { legal: false, reason: 'Generals move one orthogonal point.' };
      }
      break;
    }
    case 'A': {
      if (!isAuthenticPlayerFaction(selectedPiece.originFaction)) {
        return { legal: false, reason: 'Only the three kingdoms field Advisors.' };
      }
      if (!isAuthenticPalacePoint(to.x, to.y, selectedPiece.originFaction)) {
        return { legal: false, reason: 'Advisors must remain inside their palace.' };
      }
      if (!(absDx === 1 && absDy === 1)) {
        return { legal: false, reason: 'Advisors move one point diagonally.' };
      }
      break;
    }
    case 'E': {
      if (!isAuthenticPlayerFaction(selectedPiece.originFaction)) {
        return { legal: false, reason: 'Han does not field Elephants.' };
      }
      if (!(absDx === 2 && absDy === 2)) {
        return { legal: false, reason: 'Elephants move exactly two points diagonally.' };
      }
      if (!isWithinOwnTerritory(selectedPiece, to)) {
        return { legal: false, reason: 'Elephants must stay within their home territory.' };
      }
      break;
    }
    case 'H': {
      if (!((absDx === 1 && absDy === 2) || (absDx === 2 && absDy === 1))) {
        return { legal: false, reason: 'Horses move in the Xiangqi L pattern.' };
      }
      if (targetPiece?.owner === 'Han' && targetPiece.type === 'G') {
        special = 'DEPOSE_EMPEROR';
      } else {
        const allianceFaction = getAlliancePointFaction(to);
        if (allianceFaction && allianceFaction !== currentTurn && allianceState.target !== currentTurn) {
          special = 'ALLIANCE';
        }
      }
      break;
    }
    case 'R': {
      if (absDx !== 0 && absDy !== 0) {
        return { legal: false, reason: 'Chariots move orthogonally.' };
      }
      if (countPiecesBetween(selectedPiece, to, pieces as any) !== 0) {
        return { legal: false, reason: 'Chariots cannot jump.' };
      }
      break;
    }
    case 'P': {
      if (absDx !== 0 && absDy !== 0) {
        return { legal: false, reason: 'Cannons move orthogonally.' };
      }
      if (!selectedPiece.firstMoveDone && isAuthenticPlayerFaction(selectedPiece.originFaction)) {
        const targetTerritory = getAuthenticTerritory(to.x, to.y);
        if (targetTerritory !== selectedPiece.originFaction) {
          return { legal: false, reason: 'A Cannon cannot leave its home territory on its first move.' };
        }
      }
      const blockers = countPiecesBetween(selectedPiece, to, pieces as any);
      if (targetPiece) {
        if (blockers !== 1) {
          return { legal: false, reason: 'Cannons need exactly one screen to capture.' };
        }
      } else if (blockers !== 0) {
        return { legal: false, reason: 'Cannons cannot jump when not capturing.' };
      }
      break;
    }
    case 'S': {
      if (!isAuthenticPlayerFaction(selectedPiece.originFaction)) {
        return { legal: false, reason: 'Han does not field Soldiers.' };
      }
      if (!((absDx === 1 && absDy === 0) || (absDx === 0 && absDy === 1))) {
        return { legal: false, reason: 'Soldiers move one orthogonal point.' };
      }
      const direction = getFactionDirection(selectedPiece.originFaction);
      const isForward = dx === direction.x && dy === direction.y;
      const isBackward = dx === -direction.x && dy === -direction.y;
      if (!hasCrossedBorder(selectedPiece)) {
        if (isBackward) {
          return { legal: false, reason: 'Soldiers cannot move backward inside home territory.' };
        }
      }
      break;
    }
    default:
      return { legal: false, reason: AUTHENTIC_MOVE_BLOCKED_MESSAGE };
  }

  const { projectedPieces } = projectMove(pieces, selectedPiece, to);
  const projectedAllianceState = getProjectedAllianceState(
    selectedPiece,
    to,
    currentTurn,
    pieces,
    allianceState,
    targetPiece
  );

  if (hasFacingGenerals(projectedPieces)) {
    return { legal: false, reason: 'Generals may not face each other directly.' };
  }

  if (isFactionInCheck(currentTurn, projectedPieces, projectedAllianceState)) {
    return { legal: false, reason: 'This move leaves your General in check.' };
  }

  return {
    legal: true,
    isCapture: !!targetPiece,
    special,
  };
}

export function getAuthenticLegalMoves(
  piece: AuthenticPiece | null,
  pieces: AuthenticPiece[],
  currentTurn: AuthenticFaction,
  moveNumber: number,
  hanController: AuthenticFaction | null,
  allianceState: AllianceState
): Point[] {
  if (!piece) return [];

  const moves: Point[] = [];
  for (let y = 0; y < AUTHENTIC_ROWS; y++) {
    for (let x = 0; x < AUTHENTIC_COLS; x++) {
      const validation = validateAuthenticMove(
        piece,
        { x, y },
        pieces,
        currentTurn,
        moveNumber,
        hanController,
        allianceState
      );
      if (validation.legal) {
        moves.push({ x, y });
      }
    }
  }
  return moves;
}

function hasAnyLegalMove(
  faction: AuthenticFaction,
  pieces: AuthenticPiece[],
  moveNumber: number,
  hanController: AuthenticFaction | null,
  allianceState: AllianceState
): boolean {
  const factionPieces = pieces.filter((piece) => piece.owner === faction);
  return factionPieces.some((piece) =>
    getAuthenticLegalMoves(piece, pieces, faction, moveNumber, hanController, allianceState).length > 0
  );
}

function transferHanMilitary(
  pieces: AuthenticPiece[],
  controller: AuthenticFaction
): AuthenticPiece[] {
  return pieces.map((piece) => {
    if (piece.owner !== 'Han' || piece.type === 'G') return piece;
    return {
      ...piece,
      owner: controller,
      firstMoveDone: false,
    };
  });
}

function transferArmyToFaction(
  pieces: AuthenticPiece[],
  defeatedFaction: AuthenticFaction,
  controller: AuthenticFaction
): AuthenticPiece[] {
  return pieces.map((piece) => {
    if (piece.owner !== defeatedFaction) return piece;
    if (piece.type === 'G') return piece;
    return {
      ...piece,
      owner: controller,
    };
  });
}

function removeFactionGeneral(
  pieces: AuthenticPiece[],
  defeatedFaction: AuthenticFaction
): AuthenticPiece[] {
  return pieces.filter((piece) => !(piece.owner === defeatedFaction && piece.type === 'G'));
}

function getWinnerFromPieces(pieces: AuthenticPiece[]): AuthenticFaction | null {
  const active = getRemainingFactions(pieces);
  return active.length === 1 ? active[0] : null;
}

function describeSpecial(special: AuthenticSpecialMove | undefined): string | null {
  if (special === 'ALLIANCE') return 'Alliance declared.';
  if (special === 'DEPOSE_EMPEROR') return 'Han Emperor deposed.';
  return null;
}

function getPriorityCheckedQueue(
  pieces: AuthenticPiece[],
  allianceState: AllianceState
): AuthenticFaction[] {
  return getSortedTurnPriority(getCheckedFactions(pieces, allianceState));
}

function resolveCheckPriorityAndCheckmates(
  pieces: AuthenticPiece[],
  moveNumber: number,
  currentMover: AuthenticFaction,
  hanController: AuthenticFaction | null,
  allianceState: AllianceState,
  eliminated: AuthenticFaction[],
  factionMoveCounts: Record<AuthenticFaction, number>,
  moveRecord: AuthenticMoveRecord
): {
  pieces: AuthenticPiece[];
  checkedPriorityQueue: AuthenticFaction[];
  allianceState: AllianceState;
  eliminated: AuthenticFaction[];
  winner: AuthenticFaction | null;
  hanController: AuthenticFaction | null;
  factionMoveCounts: Record<AuthenticFaction, number>;
  statusSuffix: string;
  specials: AuthenticSpecialMove[];
} {
  let workingPieces = pieces;
  let workingAllianceState = normalizeAllianceState(allianceState, workingPieces, eliminated);
  let workingEliminated = [...eliminated];
  let workingCounts = { ...factionMoveCounts };
  let workingHanController = hanController;
  const specials = [...(moveRecord.special || [])];
  const statusFragments: string[] = [];

  let queue = getPriorityCheckedQueue(workingPieces, workingAllianceState);
  while (queue.length > 0) {
    const factionInCheck = queue[0];
    if (hasAnyLegalMove(factionInCheck, workingPieces, moveNumber, workingHanController, workingAllianceState)) {
      break;
    }

    workingPieces = removeFactionGeneral(workingPieces, factionInCheck);
    workingPieces = transferArmyToFaction(workingPieces, factionInCheck, currentMover);
    if (!workingEliminated.includes(factionInCheck)) {
      workingEliminated.push(factionInCheck);
    }
    if (workingHanController === factionInCheck) {
      workingHanController = currentMover;
    }
    workingCounts[currentMover] += 0;
    workingAllianceState = normalizeAllianceState(workingAllianceState, workingPieces, workingEliminated);
    specials.push('CHECKMATE', 'ABSORB_ARMY');
    statusFragments.push(`${factionInCheck} was checkmated and absorbed by ${currentMover}.`);
    queue = getPriorityCheckedQueue(workingPieces, workingAllianceState);
  }

  const winner = getWinnerFromPieces(workingPieces);
  return {
    pieces: workingPieces,
    checkedPriorityQueue: queue,
    allianceState: workingAllianceState,
    eliminated: workingEliminated,
    winner,
    hanController: workingHanController,
    factionMoveCounts: workingCounts,
    statusSuffix: statusFragments.join(' '),
    specials,
  };
}

export function applyAuthenticMove(
  state: AuthenticBoardState,
  selectedPiece: AuthenticPiece,
  to: Point
): AuthenticMoveResolution | null {
  const validation = validateAuthenticMove(
    selectedPiece,
    to,
    state.pieces,
    state.currentTurn,
    state.moveNumber,
    state.hanController,
    state.allianceState
  );

  if (!validation.legal) {
    return null;
  }

  const targetPiece = findAuthenticPieceAt(state.pieces, to);
  const capturedPieces: AuthenticCapturedPieceRecord[] = targetPiece
    ? [{
        id: targetPiece.id,
        owner: targetPiece.owner,
        visualFaction: targetPiece.visualFaction,
        type: targetPiece.type,
      }]
    : [];

  let { projectedPieces } = projectMove(state.pieces, selectedPiece, to);
  let nextHanController = state.hanController;
  let nextAllianceState = getProjectedAllianceState(
    selectedPiece,
    to,
    state.currentTurn,
    state.pieces,
    state.allianceState,
    targetPiece
  );
  const specialList: AuthenticSpecialMove[] = [];
  const eliminatedThisMove: AuthenticFaction[] = [];

  if (validation.special) {
    specialList.push(validation.special);
  }

  let note = `${getAuthenticFactionLabel(state.currentTurn)} ${AUTHENTIC_LABELS[selectedPiece.type]} moved to (${to.x}, ${to.y}).`;
  if (targetPiece) {
    note = `${getAuthenticFactionLabel(state.currentTurn)} ${AUTHENTIC_LABELS[selectedPiece.type]} captured ${getAuthenticFactionLabel(targetPiece.visualFaction)} ${AUTHENTIC_LABELS[targetPiece.type]}.`;
  }

  if (targetPiece?.owner === 'Han' && targetPiece.type === 'G' && selectedPiece.type === 'H') {
    nextHanController = state.currentTurn;
    projectedPieces = transferHanMilitary(projectedPieces, state.currentTurn);
    note = `${state.currentTurn} deposed the Han Emperor and took command of the Han military.`;
  }

  if (validation.special === 'ALLIANCE') {
    const ally = getAlliancePointFaction(to);
    const enemy = AUTHENTIC_PLAYER_FACTIONS.find(
      (faction) => faction !== state.currentTurn && faction !== ally
    ) || null;
    if (ally && enemy) {
      projectedPieces = projectedPieces.map((piece) =>
        piece.owner === 'Han' && piece.type !== 'G'
          ? { ...piece, owner: enemy, firstMoveDone: false }
          : piece
      );
      nextHanController = enemy;
      note = `${state.currentTurn} formed an alliance with ${ally}. ${enemy} seized the Han military.`;
    }
  }

  if (targetPiece && isAuthenticPlayerFaction(targetPiece.owner) && targetPiece.type === 'G') {
    projectedPieces = removeFactionGeneral(projectedPieces, targetPiece.owner);
    projectedPieces = transferArmyToFaction(projectedPieces, targetPiece.owner, state.currentTurn);
    eliminatedThisMove.push(targetPiece.owner);
    specialList.push('ABSORB_ARMY');
    if (nextHanController === targetPiece.owner) {
      nextHanController = state.currentTurn;
    }
    note = `${note} ${targetPiece.owner} lost its General and its army was absorbed by ${state.currentTurn}.`;
  }

  let eliminated = Array.from(new Set([...state.eliminated, ...eliminatedThisMove]));
  nextAllianceState = normalizeAllianceState(nextAllianceState, projectedPieces, eliminated);

  const updatedCounts: Record<AuthenticFaction, number> = {
    ...state.factionMoveCounts,
    [state.currentTurn]: state.factionMoveCounts[state.currentTurn] + 1,
  };

  const moveRecord: AuthenticMoveRecord = {
    id: `auth-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    turnNumber: state.moveNumber + 1,
    faction: state.currentTurn,
    pieceType: selectedPiece.type,
    pieceId: selectedPiece.id,
    from: { x: selectedPiece.x, y: selectedPiece.y },
    to,
    captured: targetPiece
      ? {
          owner: targetPiece.owner,
          visualFaction: targetPiece.visualFaction,
          type: targetPiece.type,
        }
      : undefined,
    special: specialList.length ? specialList : undefined,
    eliminated: eliminatedThisMove.length ? eliminatedThisMove : undefined,
    note,
  };

  const resolution = resolveCheckPriorityAndCheckmates(
    projectedPieces,
    state.moveNumber + 1,
    state.currentTurn,
    nextHanController,
    nextAllianceState,
    eliminated,
    updatedCounts,
    moveRecord
  );

  projectedPieces = resolution.pieces;
  eliminated = resolution.eliminated;
  nextAllianceState = resolution.allianceState;
  nextHanController = resolution.hanController;

  const checkedNow = getCheckedFactions(projectedPieces, nextAllianceState);
  if (checkedNow.length > 0) {
    if (!resolution.specials.includes('CHECK')) {
      resolution.specials.push('CHECK');
    }
  }

  const newlyEliminated = resolution.eliminated.filter((faction) => !state.eliminated.includes(faction));
  moveRecord.special = resolution.specials.length ? resolution.specials : moveRecord.special;
  moveRecord.eliminated = newlyEliminated.length ? newlyEliminated : moveRecord.eliminated;
  if (resolution.statusSuffix) {
    moveRecord.note = `${moveRecord.note} ${resolution.statusSuffix}`.trim();
  } else {
    const describedSpecial = describeSpecial(validation.special);
    if (describedSpecial) {
      moveRecord.note = `${moveRecord.note} ${describedSpecial}`;
    }
  }

  const nextTurn =
    resolution.winner
      ? null
      : resolution.checkedPriorityQueue[0] ||
        getNextTurnInBaseOrder(state.currentTurn, projectedPieces, eliminated);

  let status = moveRecord.note;
  if (resolution.winner) {
    status = `${moveRecord.note} ${resolution.winner} wins.`;
  } else if (resolution.checkedPriorityQueue.length > 0) {
    status = `${moveRecord.note} ${resolution.checkedPriorityQueue[0]} has immediate check priority.`;
  }

  return {
    pieces: projectedPieces,
    eliminated,
    hanController: nextHanController,
    allianceState: nextAllianceState,
    checkedPriorityQueue: resolution.checkedPriorityQueue,
    winner: resolution.winner,
    moveRecord,
    capturedPieces,
    nextTurn,
    factionMoveCounts: resolution.factionMoveCounts,
    status,
    lastMove: {
      from: { x: selectedPiece.x, y: selectedPiece.y },
      to,
    },
  };
}
