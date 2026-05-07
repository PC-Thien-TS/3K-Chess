import { GameMode, GameRuleset } from '@/shared/gameModes';

/**
 * Rule Engine v1 for 3-Player Three Kingdoms Chess
 * Normalized validation and centralized error messages.
 */

export type Faction = 'Shu' | 'Wei' | 'Wu' | 'None';
export type PieceType = 'G' | 'A' | 'E' | 'R' | 'H' | 'P' | 'S';

export interface Point {
  x: number;
  y: number;
}

export interface Piece {
  id: string;
  type: PieceType;
  faction: Faction;
  x: number;
  y: number;
}

export interface Move {
  id: string;
  pieceType: PieceType;
  faction: Faction;
  from: { x: number; y: number };
  to: { x: number; y: number };
  captured?: PieceType;
  check?: boolean;
  checkedFactions?: Faction[];
  checkmate?: boolean;
  gameWinner?: Faction | null;
  timestamp: Date;
}

export interface ValidationResult {
  legal: boolean;
  reason?: string;
  isCapture?: boolean;
  givesCheck?: boolean;
  checkedFactions?: Faction[];
}

export type PlayerType = 'Human' | 'Bot';
export type BotDifficulty = 'easy' | 'normal' | 'hard';

export interface FactionConfig {
  control: PlayerType;
  difficulty: BotDifficulty;
}

export interface MatchConfig {
  gameMode: GameMode;
  factions: Record<Faction, FactionConfig>;
  primaryKingdom: Faction;
}

export interface MatchStats {
  totalMoves: number;
  totalCaptures: number;
  totalChecks: number;
  totalCheckmates: number;
  capturesByFaction: Record<Faction, number>;
  eliminationOrder: Faction[];
  finalMoveText?: string;
}

export interface RecordedMove {
  id: string;
  turnNumber: number;
  actorType: 'human' | 'bot';
  faction: Faction;
  pieceId: string;
  pieceType: PieceType;
  from: Point;
  to: Point;
  capturedPiece?: {
    type: PieceType;
    faction: Faction;
  };
  givesCheck?: boolean;
  checkedFactions?: Faction[];
  checkmateHappened?: boolean;
  eliminatedAfterMove?: Faction[];
  winnerAfterMove?: Faction | null;
  notationText: string;
}

export interface MatchRecord {
  id: string;
  createdAt: string;
  ruleset: GameRuleset;
  setup: MatchConfig;
  winner: Faction | null;
  eliminatedFactions: Faction[];
  matchStats: MatchStats;
  initialPieces: Piece[];
  moves: RecordedMove[];
  finalPieces: Piece[];
  source?: {
    mode: "local" | "war-room-sim";
    roomCode?: string;
  };
}

export const MOVE_ERRORS = {
  NOT_YOUR_TURN: "Illegal move: it is not this faction's turn.",
  SAME_POINT: "Illegal move: choose a different destination.",
  FRIENDLY_OCCUPIED: "Illegal move: cannot capture your own piece.",
  INVALID_PIECE: "Illegal move: no piece selected.",
  GENERAL_STEP: "Illegal move: General moves exactly one orthogonal step.",
  GENERAL_PALACE: "Illegal move: General must stay inside the palace.",
  ADVISOR_STEP: "Illegal move: Advisor moves exactly one diagonal step.",
  ADVISOR_PALACE: "Illegal move: Advisor must stay inside the palace.",
  ELEPHANT_STEP: "Illegal move: Elephant moves exactly two diagonal steps.",
  ELEPHANT_BLOCKED: "Illegal move: Elephant is blocked at the eye point.",
  ELEPHANT_RIVER: "Illegal move: Elephant cannot cross the river.",
  CHARIOT_LINE: "Illegal move: Chariot moves in a straight orthogonal line.",
  CHARIOT_BLOCKED: "Illegal move: Chariot cannot jump over pieces.",
  HORSE_STEP: "Illegal move: Horse moves in an L shape.",
  HORSE_BLOCKED: "Illegal move: Horse is blocked at the leg point.",
  CANNON_LINE: "Illegal move: Cannon moves in a straight orthogonal line.",
  CANNON_MOVE_BLOCKED: "Illegal move: Cannon cannot jump when moving.",
  CANNON_CAPTURE_SCREEN: "Illegal move: Cannon needs exactly one screen piece to capture.",
  SOLDIER_STEP: "Illegal move: Soldier moves one step only.",
  SOLDIER_BACKWARD: "Illegal move: Soldier cannot move backward.",
  GENERIC_MOVE: "Illegal move for this piece type.",
  SELF_CHECK: "Illegal move: your General would be in check.",
  GENERAL_FACING: "Illegal move: opposing Generals cannot face each other directly.",
  GENERAL_MISSING: "Invalid board state: General is missing."
};

/**
 * Palace boundaries (Traditional 3x3 layout)
 */
export function isInsidePalace(p: Point, faction: Faction): boolean {
  if (faction === 'Shu') {
    return p.x >= 7 && p.x <= 9 && p.y >= 0 && p.y <= 2;
  }
  if (faction === 'Wu') {
    return p.x >= 0 && p.x <= 2 && p.y >= 7 && p.y <= 9;
  }
  if (faction === 'Wei') {
    return p.x >= 7 && p.x <= 9 && p.y >= 14 && p.y <= 16;
  }
  return false;
}

/**
 * River boundaries
 */
export function hasCrossedRiver(p: Point, faction: Faction): boolean {
  if (faction === 'Shu') return p.y > 6;
  if (faction === 'Wu') return p.x > 6;
  if (faction === 'Wei') return p.y < 10;
  return false;
}

/**
 * Directional helpers for Soldier
 */
export function isForwardMove(from: Point, to: Point, faction: Faction): boolean {
  if (faction === 'Shu') return to.y > from.y && from.x === to.x;
  if (faction === 'Wu') return to.x > from.x && from.y === to.y;
  if (faction === 'Wei') return to.y < from.y && from.x === to.x;
  return false;
}

export function isBackwardMove(from: Point, to: Point, faction: Faction): boolean {
  if (faction === 'Shu') return to.y < from.y && from.x === to.x;
  if (faction === 'Wu') return to.x < from.x && from.y === to.y;
  if (faction === 'Wei') return to.y > from.y && from.x === to.x;
  return false;
}

export function isSidewaysMove(from: Point, to: Point, faction: Faction): boolean {
  if (faction === 'Shu' || faction === 'Wei') return from.y === to.y && Math.abs(to.x - from.x) === 1;
  if (faction === 'Wu') return from.x === to.x && Math.abs(to.y - from.y) === 1;
  return false;
}

/**
 * Helper to count pieces between two points in a straight line
 */
export function countPiecesBetween(from: Point, to: Point, pieces: Piece[]): number {
  if (from.x !== to.x && from.y !== to.y) return -1; // Not a straight line

  let count = 0;
  if (from.x === to.x) {
    const minY = Math.min(from.y, to.y);
    const maxY = Math.max(from.y, to.y);
    for (let y = minY + 1; y < maxY; y++) {
      if (pieces.some(p => p.x === from.x && p.y === y)) count++;
    }
  } else {
    const minX = Math.min(from.x, to.x);
    const maxX = Math.max(from.x, to.x);
    for (let x = minX + 1; x < maxX; x++) {
      if (pieces.some(p => p.x === x && p.y === from.y)) count++;
    }
  }
  return count;
}

export function validateMove(
  selectedPiece: Piece | null,
  to: Point,
  pieces: Piece[],
  currentTurn: Faction
): ValidationResult {
  // 1. Basic checks
  if (!selectedPiece) {
    return { legal: false, reason: MOVE_ERRORS.INVALID_PIECE };
  }

  if (selectedPiece.faction !== currentTurn) {
    return { legal: false, reason: MOVE_ERRORS.NOT_YOUR_TURN };
  }

  if (selectedPiece.x === to.x && selectedPiece.y === to.y) {
    return { legal: false, reason: MOVE_ERRORS.SAME_POINT };
  }

  const targetPiece = pieces.find(p => p.x === to.x && p.y === to.y);
  if (targetPiece && targetPiece.faction === selectedPiece.faction) {
    return { legal: false, reason: MOVE_ERRORS.FRIENDLY_OCCUPIED };
  }

  const dx = Math.abs(to.x - selectedPiece.x);
  const dy = Math.abs(to.y - selectedPiece.y);

  // 2. Piece-specific movement rules (V1)
  let v1Legal = false;
  let v1Reason: string | undefined;

  switch (selectedPiece.type) {
    case 'G': // General
      if (!isInsidePalace(to, selectedPiece.faction)) {
        v1Reason = MOVE_ERRORS.GENERAL_PALACE;
      } else if (!((dx === 1 && dy === 0) || (dx === 0 && dy === 1))) {
        v1Reason = MOVE_ERRORS.GENERAL_STEP;
      } else {
        v1Legal = true;
      }
      break;

    case 'A': // Advisor
      if (!isInsidePalace(to, selectedPiece.faction)) {
        v1Reason = MOVE_ERRORS.ADVISOR_PALACE;
      } else if (dx !== 1 || dy !== 1) {
        v1Reason = MOVE_ERRORS.ADVISOR_STEP;
      } else {
        v1Legal = true;
      }
      break;

    case 'E': // Elephant
      if (hasCrossedRiver(to, selectedPiece.faction)) {
        v1Reason = MOVE_ERRORS.ELEPHANT_RIVER;
      } else if (dx !== 2 || dy !== 2) {
        v1Reason = MOVE_ERRORS.ELEPHANT_STEP;
      } else {
        const eyeX = (selectedPiece.x + to.x) / 2;
        const eyeY = (selectedPiece.y + to.y) / 2;
        if (pieces.some(p => p.x === eyeX && p.y === eyeY)) {
          v1Reason = MOVE_ERRORS.ELEPHANT_BLOCKED;
        } else {
          v1Legal = true;
        }
      }
      break;

    case 'R': // Chariot
      if (dx !== 0 && dy !== 0) {
        v1Reason = MOVE_ERRORS.CHARIOT_LINE;
      } else if (countPiecesBetween(selectedPiece, to, pieces) !== 0) {
        v1Reason = MOVE_ERRORS.CHARIOT_BLOCKED;
      } else {
        v1Legal = true;
      }
      break;

    case 'H': // Horse
      if (!((dx === 1 && dy === 2) || (dx === 2 && dy === 1))) {
        v1Reason = MOVE_ERRORS.HORSE_STEP;
      } else {
        let legX = selectedPiece.x;
        let legY = selectedPiece.y;
        if (dx === 2) {
          legX = (selectedPiece.x + to.x) / 2;
        } else {
          legY = (selectedPiece.y + to.y) / 2;
        }
        if (pieces.some(p => p.x === legX && p.y === legY)) {
          v1Reason = MOVE_ERRORS.HORSE_BLOCKED;
        } else {
          v1Legal = true;
        }
      }
      break;

    case 'P': // Cannon
      if (dx !== 0 && dy !== 0) {
        v1Reason = MOVE_ERRORS.CANNON_LINE;
      } else {
        const btw = countPiecesBetween(selectedPiece, to, pieces);
        if (targetPiece) {
          if (btw !== 1) {
            v1Reason = MOVE_ERRORS.CANNON_CAPTURE_SCREEN;
          } else {
            v1Legal = true;
          }
        } else {
          if (btw !== 0) {
            v1Reason = MOVE_ERRORS.CANNON_MOVE_BLOCKED;
          } else {
            v1Legal = true;
          }
        }
      }
      break;

    case 'S': // Soldier
      const isCrossedBefore = hasCrossedRiver(selectedPiece, selectedPiece.faction);
      const isForward = isForwardMove(selectedPiece, to, selectedPiece.faction);
      const isSideways = isSidewaysMove(selectedPiece, to, selectedPiece.faction);
      const isOneStep = (dx + dy === 1);

      if (!isOneStep) {
        v1Reason = MOVE_ERRORS.SOLDIER_STEP;
      } else if (isBackwardMove(selectedPiece, to, selectedPiece.faction)) {
        v1Reason = MOVE_ERRORS.SOLDIER_BACKWARD;
      } else if (isForward) {
        v1Legal = true;
      } else if (isCrossedBefore && isSideways) {
        v1Legal = true;
      } else {
        v1Reason = MOVE_ERRORS.SOLDIER_BACKWARD; // Generic catch for sideways-before-river too
      }
      break;
    
    default:
      v1Reason = MOVE_ERRORS.GENERIC_MOVE;
  }

  if (!v1Legal) {
    return { legal: false, reason: v1Reason };
  }

  // 3. Simulated move for V2 rules (Self-check & General-facing)
  const nextPieces = simulateMove(pieces, selectedPiece.id, to);
  
  if (isFactionInCheck(selectedPiece.faction, nextPieces).inCheck) {
    return { legal: false, reason: MOVE_ERRORS.SELF_CHECK };
  }

  if (areGeneralsFacing(nextPieces)) {
    return { legal: false, reason: MOVE_ERRORS.GENERAL_FACING };
  }

  // 4. Check detection on enemies
  const checkedFactions: Faction[] = [];
  ['Shu' as Faction, 'Wei' as Faction, 'Wu' as Faction].forEach(f => {
    if (f !== selectedPiece.faction && isFactionInCheck(f, nextPieces).inCheck) {
      checkedFactions.push(f);
    }
  });

  return { 
    legal: true, 
    isCapture: !!targetPiece, 
    givesCheck: checkedFactions.length > 0,
    checkedFactions
  };
}

export interface CheckmateResult {
  checkmated: boolean;
  inCheck: boolean;
  attackers: Piece[];
  totalCandidateMoves: number;
  totalLegalEscapeMoves: number;
  reason?: string;
}

/**
 * V3 Helper: Get all theoretically legal moves for a faction
 * This is used for checkmate detection.
 */
export function getAllLegalMoves(faction: Faction, pieces: Piece[]): Move[] {
  const factionPieces = pieces.filter(p => p.faction === faction);
  const moves: Move[] = [];

  // Optimization: For some pieces, testing 17x17 is overkill, but for a 17x17 grid 
  // it's the safest way to ensure no "teleport" bugs or grid mapping misses.
  for (const piece of factionPieces) {
    for (let y = 0; y < 17; y++) {
      for (let x = 0; x < 17; x++) {
        const validation = validateMove(piece, { x, y }, pieces, faction);
        if (validation.legal) {
          moves.push({
            id: Math.random().toString(36).substr(2, 9),
            pieceType: piece.type,
            faction: piece.faction,
            from: { x: piece.x, y: piece.y },
            to: { x, y },
            captured: pieces.find(p => p.x === x && p.y === y)?.type,
            timestamp: new Date()
          });
        }
      }
    }
  }
  return moves;
}

/**
 * V3 Helper: Checkmate detection with diagnostics
 */
export function isCheckmateDetailed(faction: Faction, pieces: Piece[]): CheckmateResult {
  const checkState = isFactionInCheck(faction, pieces);
  const general = findGeneral(faction, pieces);

  if (!general) {
    return {
      checkmated: true, // If General is missing, faction is effectively defeated
      inCheck: true,
      attackers: [],
      totalCandidateMoves: 0,
      totalLegalEscapeMoves: 0,
      reason: "General is missing from the battlefield."
    };
  }

  if (!checkState.inCheck) {
    return {
      checkmated: false,
      inCheck: false,
      attackers: [],
      totalCandidateMoves: 0,
      totalLegalEscapeMoves: 0
    };
  }

  const legalMoves = getAllLegalMoves(faction, pieces);
  const totalCandidateMoves = pieces.filter(p => p.faction === faction).length * 289;

  return {
    checkmated: legalMoves.length === 0,
    inCheck: true,
    attackers: checkState.attackers,
    totalCandidateMoves,
    totalLegalEscapeMoves: legalMoves.length,
    reason: legalMoves.length === 0 ? "No legal escape moves found." : undefined
  };
}

/**
 * Legacy V3 Helper: Checkmate detection
 */
export function isCheckmate(faction: Faction, pieces: Piece[]): boolean {
  return isCheckmateDetailed(faction, pieces).checkmated;
}

/**
 * V2 Helper: Simulate a move on a virtual board
 */
export function simulateMove(pieces: Piece[], pieceId: string, to: Point): Piece[] {
  const targetAt = pieces.find(p => p.x === to.x && p.y === to.y);
  return pieces
    .filter(p => p.id !== pieceId && (!targetAt || p.id !== targetAt.id))
    .concat([
      { ...pieces.find(p => p.id === pieceId)!, x: to.x, y: to.y }
    ]);
}

/**
 * V2 Helper: Find faction's leader
 */
export function findGeneral(faction: Faction, pieces: Piece[]): Piece | null {
  return pieces.find(p => p.faction === faction && p.type === 'G') || null;
}

/**
 * V3 QA Helper: Get all legal destinations for a specific piece
 */
export function getLegalDestinationsForPiece(piece: Piece, pieces: Piece[], currentTurn: Faction): { all: Point[], moves: Point[], captures: Point[] } {
  const result = { all: [] as Point[], moves: [] as Point[], captures: [] as Point[] };
  
  // Test 17x17 grid
  for (let y = 0; y < 17; y++) {
    for (let x = 0; x < 17; x++) {
      const target = { x, y };
      const validation = validateMove(piece, target, pieces, currentTurn);
      
      if (validation.legal) {
        result.all.push(target);
        if (validation.isCapture) {
          result.captures.push(target);
        } else {
          result.moves.push(target);
        }
      }
    }
  }
  return result;
}

/**
 * V3 QA Helper: Validate board integrity
 */
export function validateBoardIntegrity(pieces: Piece[], eliminatedFactions: Faction[] = []): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const positions = new Set<string>();
  const ids = new Set<string>();

  pieces.forEach(p => {
    const posKey = `${p.x},${p.y}`;
    if (positions.has(posKey)) {
      errors.push(`Collision detection: Multiple pieces at ${posKey}`);
    }
    positions.add(posKey);

    if (ids.has(p.id)) {
      errors.push(`Duplicate identity: Multiple pieces with ID ${p.id}`);
    }
    ids.add(p.id);

    if (p.x < 0 || p.x >= 17 || p.y < 0 || p.y >= 17) {
      errors.push(`Displacement error: Piece ${p.id} ({p.type}) at out-of-bounds coords (${p.x}, ${p.y})`);
    }

    if (eliminatedFactions.includes(p.faction)) {
      errors.push(`${p.faction} piece ${p.id} (${p.type}) persists after dynasty fall.`);
    }
  });

  const activeFactions = Array.from(new Set(pieces.map(p => p.faction))).filter(f => f !== 'None');
  activeFactions.forEach(f => {
    if (!findGeneral(f, pieces)) {
      errors.push(`State Violation: ${f} lacks a General on the field.`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Piece naming and description helpers
 */
export function getPieceName(type: PieceType): string {
  const names: Record<PieceType, string> = {
    'G': 'General',
    'A': 'Advisor',
    'E': 'Elephant',
    'R': 'Chariot',
    'H': 'Horse',
    'P': 'Cannon',
    'S': 'Soldier'
  };
  return names[type];
}

export function getPieceDescription(type: PieceType): string {
  const descriptions: Record<PieceType, string> = {
    'G': 'Moves one orthogonal step inside the palace.',
    'A': 'Moves one diagonal step inside the palace.',
    'E': 'Moves two diagonal steps; cannot cross the river.',
    'R': 'Moves any distance orthogonally in a straight line.',
    'H': 'Moves in an L-shape (one orthogonal, one diagonal).',
    'P': 'Moves like a Chariot; captures by jumping over one piece.',
    'S': 'Moves one step forward; can move sideways after crossing the river.'
  };
  return descriptions[type];
}

/**
 * V2 Helper: Pure attack detection (No recursion)
 */
export function canPieceAttack(piece: Piece, target: Point, pieces: Piece[]): boolean {
  const dx = Math.abs(target.x - piece.x);
  const dy = Math.abs(target.y - piece.y);

  switch (piece.type) {
    case 'G':
    case 'S':
      // Simplified: if they can move there, they can attack there (for G/S we re-check geom)
      if (piece.type === 'G') return (dx + dy === 1) && (dx === 0 || dy === 0);
      const isCrossed = hasCrossedRiver(piece, piece.faction);
      const isFwd = isForwardMove(piece, target, piece.faction);
      const isSide = isSidewaysMove(piece, target, piece.faction);
      if (dx + dy !== 1) return false;
      if (isFwd) return true;
      if (isCrossed && isSide) return true;
      return false;

    case 'A':
      return dx === 1 && dy === 1;

    case 'E':
      if (dx !== 2 || dy !== 2) return false;
      const eyeX = (piece.x + target.x) / 2;
      const eyeY = (piece.y + target.y) / 2;
      return !pieces.some(p => p.x === eyeX && p.y === eyeY);

    case 'R':
      if (dx !== 0 && dy !== 0) return false;
      return countPiecesBetween(piece, target, pieces) === 0;

    case 'H':
      if (!((dx === 1 && dy === 2) || (dx === 2 && dy === 1))) return false;
      let legX = piece.x;
      let legY = piece.y;
      if (dx === 2) legX = (piece.x + target.x) / 2;
      else legY = (piece.y + target.y) / 2;
      return !pieces.some(p => p.x === legX && p.y === legY);

    case 'P':
      if (dx !== 0 && dy !== 0) return false;
      return countPiecesBetween(piece, target, pieces) === 1;
    
    default:
      return false;
  }
}

/**
 * V2 Helper: Check detection
 */
export function isFactionInCheck(faction: Faction, pieces: Piece[]): { inCheck: boolean; attackers: Piece[] } {
  const general = findGeneral(faction, pieces);
  if (!general) return { inCheck: false, attackers: [] };

  const attackers = pieces.filter(p => p.faction !== faction && canPieceAttack(p, general, pieces));
  return { inCheck: attackers.length > 0, attackers };
}

/**
 * V2 Helper: General facing rule
 */
export function areGeneralsFacing(pieces: Piece[]): boolean {
  const activeGenerals = pieces.filter(p => p.type === 'G');
  for (let i = 0; i < activeGenerals.length; i++) {
    for (let j = i + 1; j < activeGenerals.length; j++) {
      const g1 = activeGenerals[i];
      const g2 = activeGenerals[j];
      
      // Face each other on same line
      if (g1.x === g2.x || g1.y === g2.y) {
        if (countPiecesBetween(g1, g2, pieces) === 0) return true;
      }
    }
  }
  return false;
}
