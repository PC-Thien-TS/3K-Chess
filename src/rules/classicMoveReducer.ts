import type {
  CheckmateResult,
  Faction,
  Move,
  Piece,
  Point,
  ValidationResult,
} from './classicThreeKingdomRules';
import {
  getNextClassicFaction,
  isCheckmateDetailed,
  validateBoardIntegrity,
  validateMove,
} from './classicThreeKingdomRules';

const FACTIONS: Faction[] = ['Shu', 'Wei', 'Wu'];

export type ClassicMoveTransitionResult =
  | {
      legal: false;
      validation: ValidationResult;
    }
  | {
      legal: true;
      validation: ValidationResult;
      capturedPiece?: Piece;
      finalPieces: Piece[];
      eliminatedFactions: Faction[];
      winner: Faction | null;
      nextTurn: Faction | null;
      checkmateHappened: boolean;
      debugResults: Record<string, CheckmateResult>;
      move: Move;
      integrity: { valid: boolean; errors: string[] };
    };

type ApplyClassicMoveTransitionArgs = {
  piece: Piece;
  destination: Point;
  pieces: Piece[];
  turn: Faction;
  eliminatedFactions: Faction[];
  moveId: string;
};

export function applyClassicMoveTransition({
  piece,
  destination,
  pieces,
  turn,
  eliminatedFactions,
  moveId,
}: ApplyClassicMoveTransitionArgs): ClassicMoveTransitionResult {
  const validation = validateMove(piece, destination, pieces, turn);
  if (!validation.legal) {
    return {
      legal: false,
      validation,
    };
  }

  const capturedPiece = pieces.find((existingPiece) => existingPiece.x === destination.x && existingPiece.y === destination.y);
  const survivingPieces = pieces.filter((existingPiece) => existingPiece.id !== piece.id);
  if (capturedPiece) {
    survivingPieces.splice(survivingPieces.indexOf(capturedPiece), 1);
  }

  const movedPiece: Piece = { ...piece, x: destination.x, y: destination.y };
  let finalPieces = [...survivingPieces, movedPiece];
  const nextEliminated = [...eliminatedFactions];
  let checkmateHappened = false;
  const debugResults: Record<string, CheckmateResult> = {};

  FACTIONS.forEach((faction) => {
    if (faction !== turn && !nextEliminated.includes(faction)) {
      const detail = isCheckmateDetailed(faction, finalPieces);
      debugResults[faction] = detail;
      if (detail.checkmated) {
        nextEliminated.push(faction);
        finalPieces = finalPieces.filter((remainingPiece) => remainingPiece.faction !== faction);
        checkmateHappened = true;
      }
    }
  });

  const activeFactionCount = FACTIONS.filter((faction) => !nextEliminated.includes(faction)).length;
  const winner =
    FACTIONS.find((faction) => !nextEliminated.includes(faction) && activeFactionCount === 1) || null;

  const nextTurn = !winner
    ? (getNextClassicFaction(turn as Exclude<Faction, 'None'>, finalPieces, nextEliminated as Exclude<Faction, 'None'>[]) as Faction | null)
    : null;

  const move: Move = {
    id: moveId,
    pieceType: piece.type,
    faction: turn,
    from: { x: piece.x, y: piece.y },
    to: destination,
    captured: capturedPiece?.type,
    check: validation.givesCheck,
    checkedFactions: validation.checkedFactions,
    checkmate: checkmateHappened,
    gameWinner: winner,
    timestamp: new Date(),
  };

  return {
    legal: true,
    validation,
    capturedPiece,
    finalPieces,
    eliminatedFactions: nextEliminated,
    winner,
    nextTurn,
    checkmateHappened,
    debugResults,
    move,
    integrity: validateBoardIntegrity(finalPieces, nextEliminated),
  };
}
