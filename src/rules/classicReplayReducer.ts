import { DEFAULT_GAME_MODE, normalizeGameMode } from '@/shared/gameModes';
import type { MatchRecord, Piece, RecordedMove } from './threeKingdomRules';

export interface ClassicReplaySnapshot {
  pieces: Piece[];
  lastMove: RecordedMove | null;
  moveIndex: number;
}

function clonePiece(piece: Piece): Piece {
  return { ...piece };
}

function clampMoveIndex(moveIndex: number, movesLength: number) {
  if (!Number.isFinite(moveIndex)) {
    return 0;
  }

  return Math.max(0, Math.min(Math.floor(moveIndex), movesLength));
}

function findMovingPiece(pieces: Piece[], move: RecordedMove) {
  return (
    pieces.find((piece) => piece.id === move.pieceId) ||
    pieces.find(
      (piece) =>
        piece.x === move.from.x &&
        piece.y === move.from.y &&
        piece.type === move.pieceType &&
        piece.faction === move.faction
    ) ||
    null
  );
}

function applyRecordedMove(pieces: Piece[], move: RecordedMove) {
  const movingPiece = findMovingPiece(pieces, move);
  if (!movingPiece) {
    return pieces;
  }

  const piecesWithoutMover = pieces.filter((piece) => piece.id !== movingPiece.id);
  const piecesWithoutDestination = piecesWithoutMover.filter(
    (piece) => piece.x !== move.to.x || piece.y !== move.to.y
  );

  let nextPieces = piecesWithoutDestination.concat({
    ...movingPiece,
    x: move.to.x,
    y: move.to.y,
  });

  if (move.eliminatedAfterMove && move.eliminatedAfterMove.length > 0) {
    nextPieces = nextPieces.filter((piece) => !move.eliminatedAfterMove?.includes(piece.faction));
  }

  return nextPieces;
}

export function reconstructClassicReplayState(
  initialPieces: Piece[],
  moves: RecordedMove[],
  moveIndex: number
): ClassicReplaySnapshot {
  const normalizedMoveIndex = clampMoveIndex(moveIndex, moves.length);
  let pieces = initialPieces.map(clonePiece);

  for (let index = 0; index < normalizedMoveIndex; index += 1) {
    const move = moves[index];
    if (!move) {
      continue;
    }

    pieces = applyRecordedMove(pieces, move);
  }

  return {
    pieces,
    lastMove: normalizedMoveIndex > 0 ? moves[normalizedMoveIndex - 1] ?? null : null,
    moveIndex: normalizedMoveIndex,
  };
}

export function isClassicReplayRecord(record: Pick<MatchRecord, 'setup'>) {
  return normalizeGameMode(record.setup?.gameMode, DEFAULT_GAME_MODE) === 'classic';
}
