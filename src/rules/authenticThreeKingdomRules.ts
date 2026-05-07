import { GAME_MODE_RULESETS } from '@/shared/gameModes';
import type { Faction, Piece, PieceType, Point } from '@/src/rules/classicThreeKingdomRules';

export const AUTHENTIC_RULESET = GAME_MODE_RULESETS.authentic;
export const AUTHENTIC_ROWS = 17;
export const AUTHENTIC_COLS = 17;
export const AUTHENTIC_FACTIONS: Faction[] = ['Shu', 'Wei', 'Wu'];

export const AUTHENTIC_MODE_STATUS =
  'Authentic Three Kingdoms mode is under construction.';

export const AUTHENTIC_BOARD_NOTE =
  'Authentic v1 is a local-only board preview and piece-inspection playground. Full rules, bots, and online sync are not enabled.';

export const AUTHENTIC_MOVE_BLOCKED_MESSAGE =
  'Authentic movement rules are incomplete. Move preview only; move execution is blocked.';

export const AUTHENTIC_LOCAL_ONLY_MESSAGE =
  'Authentic mode currently supports local board preview only. Online play and bot control are disabled.';

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
  { x: 4, y: 3 },
  { x: 6, y: 3 },
  { x: 8, y: 3 },
  { x: 10, y: 3 },
  { x: 12, y: 3 },
  { x: 3, y: 4 },
  { x: 3, y: 6 },
  { x: 3, y: 8 },
  { x: 3, y: 10 },
  { x: 3, y: 12 },
  { x: 4, y: 13 },
  { x: 6, y: 13 },
  { x: 8, y: 13 },
  { x: 10, y: 13 },
  { x: 12, y: 13 },
];

export function getAuthenticInitialPieces(): Piece[] {
  const pieces: Piece[] = [];
  const backRow = ['R', 'H', 'E', 'A', 'G', 'A', 'E', 'H', 'R'] as PieceType[];

  backRow.forEach((type, i) => {
    pieces.push({ id: `auth-shu-${type}-${i}`, type, faction: 'Shu', x: 4 + i, y: 0 });
    pieces.push({ id: `auth-wei-${type}-${i}`, type, faction: 'Wei', x: 4 + i, y: 16 });
    pieces.push({ id: `auth-wu-${type}-${i}`, type, faction: 'Wu', x: 0, y: 4 + i });
  });

  pieces.push({ id: 'auth-shu-P-1', type: 'P', faction: 'Shu', x: 5, y: 2 });
  pieces.push({ id: 'auth-shu-P-2', type: 'P', faction: 'Shu', x: 11, y: 2 });
  pieces.push({ id: 'auth-wei-P-1', type: 'P', faction: 'Wei', x: 5, y: 14 });
  pieces.push({ id: 'auth-wei-P-2', type: 'P', faction: 'Wei', x: 11, y: 14 });
  pieces.push({ id: 'auth-wu-P-1', type: 'P', faction: 'Wu', x: 2, y: 5 });
  pieces.push({ id: 'auth-wu-P-2', type: 'P', faction: 'Wu', x: 2, y: 11 });

  [4, 6, 8, 10, 12].forEach((x, i) => {
    pieces.push({ id: `auth-shu-S-${i}`, type: 'S', faction: 'Shu', x, y: 3 });
    pieces.push({ id: `auth-wei-S-${i}`, type: 'S', faction: 'Wei', x, y: 13 });
  });

  [4, 6, 8, 10, 12].forEach((y, i) => {
    pieces.push({ id: `auth-wu-S-${i}`, type: 'S', faction: 'Wu', x: 3, y });
  });

  return pieces;
}

export function getAuthenticFactionLabel(faction: Faction): string {
  if (faction === 'Shu') return 'Shu Han';
  if (faction === 'Wei') return 'Cao Wei';
  if (faction === 'Wu') return 'Eastern Wu';
  return 'Unaligned';
}

export function getAuthenticTerritory(x: number, y: number): Faction | 'river' | 'neutral' {
  if (y <= 4 && x >= 3 && x <= 13) return 'Shu';
  if (x <= 4 && y >= 3 && y <= 13) return 'Wu';
  if (y >= 12 && x >= 3 && x <= 13) return 'Wei';
  if (x >= 6 && x <= 10 && y >= 6 && y <= 10) return 'river';
  return 'neutral';
}

export function isAuthenticPalacePoint(x: number, y: number, faction: Faction): boolean {
  if (faction === 'Shu') return x >= 7 && x <= 9 && y >= 0 && y <= 2;
  if (faction === 'Wu') return x >= 0 && x <= 2 && y >= 7 && y <= 9;
  if (faction === 'Wei') return x >= 7 && x <= 9 && y >= 14 && y <= 16;
  return false;
}

export function findAuthenticPieceAt(pieces: Piece[], point: Point): Piece | undefined {
  return pieces.find((piece) => piece.x === point.x && piece.y === point.y);
}

export function getAuthenticPreviewTargets(piece: Piece): Point[] {
  const offsets: Point[] = [
    { x: -1, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: -1 },
    { x: 0, y: 1 },
    { x: -1, y: -1 },
    { x: 1, y: -1 },
    { x: -1, y: 1 },
    { x: 1, y: 1 },
  ];

  return offsets
    .map((offset) => ({ x: piece.x + offset.x, y: piece.y + offset.y }))
    .filter((point) => point.x >= 0 && point.x < AUTHENTIC_COLS && point.y >= 0 && point.y < AUTHENTIC_ROWS);
}
