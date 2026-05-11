import type { PieceType, Point } from '@/src/rules/classicThreeKingdomRules';
import {
  applyAuthenticMove,
  getAuthenticLegalMoves,
  getAuthenticTerritory,
  isAuthenticPlayerFaction,
  isFactionInCheck,
  type AuthenticBoardState,
  type AuthenticFaction,
  type AuthenticPiece,
  type AuthenticSpecialMove,
} from '@/src/rules/authenticThreeKingdomRules';

const PIECE_VALUES: Record<PieceType, number> = {
  G: 1000,
  R: 9,
  P: 7,
  H: 5,
  E: 3,
  A: 3,
  S: 1,
};

export interface AuthenticBotDecision {
  pieceId: string;
  pieceType: PieceType;
  from: Point;
  to: Point;
  score: number;
  reason: string;
}

type AuthenticBotCandidate = {
  piece: AuthenticPiece;
  to: Point;
};

function getForwardProgress(piece: AuthenticPiece, to: Point) {
  if (piece.originFaction === 'Shu') return to.y - piece.y;
  if (piece.originFaction === 'Wei') return piece.y - to.y;
  if (piece.originFaction === 'Wu') return to.x - piece.x;
  return 0;
}

function getPositionScore(piece: AuthenticPiece, to: Point) {
  const centerDistance = Math.abs(to.x - 8) + Math.abs(to.y - 8);
  let score = (16 - centerDistance) * 8;

  const progress = getForwardProgress(piece, to);
  if (progress > 0) {
    score += progress * 18;
  }

  if (isAuthenticPlayerFaction(piece.originFaction)) {
    const fromTerritory = getAuthenticTerritory(piece.x, piece.y);
    const toTerritory = getAuthenticTerritory(to.x, to.y);
    if (fromTerritory === piece.originFaction && toTerritory !== piece.originFaction) {
      score += 24;
    }
  }

  return score;
}

function pushReason(
  currentScore: number,
  bestReason: { rank: number; text: string },
  points: number,
  rank: number,
  text: string
) {
  const nextScore = currentScore + points;
  const nextReason = rank > bestReason.rank ? { rank, text } : bestReason;
  return { nextScore, nextReason };
}

function getSpecialsForResolution(resolution: ReturnType<typeof applyAuthenticMove>) {
  return new Set<AuthenticSpecialMove>(resolution?.moveRecord.special || []);
}

function getCandidates(state: AuthenticBoardState, faction: AuthenticFaction): AuthenticBotCandidate[] {
  return state.pieces
    .filter((piece) => piece.owner === faction)
    .flatMap((piece) =>
      getAuthenticLegalMoves(
        piece,
        state.pieces,
        faction,
        state.moveNumber,
        state.hanController,
        state.allianceState
      ).map((to) => ({ piece, to }))
    );
}

export function chooseAuthenticBotMove(
  state: AuthenticBoardState,
  faction: AuthenticFaction
): AuthenticBotDecision | null {
  const candidates = getCandidates(state, faction);
  if (candidates.length === 0) return null;

  const currentInCheck = isFactionInCheck(faction, state.pieces, state.allianceState);
  const scoredMoves = candidates.flatMap((candidate) => {
    const resolution = applyAuthenticMove(state, candidate.piece, candidate.to);
    if (!resolution) return [];

    let score = 0;
    let reason = { rank: 0, text: 'Random legal fallback' };
    const specials = getSpecialsForResolution(resolution);
    const captured = resolution.moveRecord.captured;

    if (currentInCheck && !isFactionInCheck(faction, resolution.pieces, resolution.allianceState)) {
      const result = pushReason(score, reason, 30000, 7, 'Resolving danger around the General');
      score = result.nextScore;
      reason = result.nextReason;
    }

    if (resolution.winner === faction || (captured?.type === 'G' && captured.owner !== 'Han')) {
      const result = pushReason(score, reason, 25000, 6, 'Capturing an enemy General');
      score = result.nextScore;
      reason = result.nextReason;
    }

    if (specials.has('DEPOSE_EMPEROR')) {
      const result = pushReason(score, reason, 18000, 5, 'Deposing the Han Emperor with a Horse');
      score = result.nextScore;
      reason = result.nextReason;
    }

    if (captured) {
      const captureValue = PIECE_VALUES[captured.type] || 0;
      const result = pushReason(
        score,
        reason,
        captureValue * 1200,
        4,
        `Capturing ${captured.visualFaction} ${captured.type}`
      );
      score = result.nextScore;
      reason = result.nextReason;
    }

    if (specials.has('CHECK') || resolution.checkedPriorityQueue.length > 0) {
      const result = pushReason(score, reason, 2500, 3, 'Giving check');
      score = result.nextScore;
      reason = result.nextReason;
    }

    if (specials.has('ALLIANCE')) {
      const result = pushReason(score, reason, 800, 2, 'Forming an alliance');
      score = result.nextScore;
      reason = result.nextReason;
    }

    score += getPositionScore(candidate.piece, candidate.to);
    score += Math.random() * 24;

    return [{
      pieceId: candidate.piece.id,
      pieceType: candidate.piece.type,
      from: { x: candidate.piece.x, y: candidate.piece.y },
      to: candidate.to,
      score,
      reason: reason.text,
    }];
  });

  if (scoredMoves.length === 0) return null;

  scoredMoves.sort((a, b) => b.score - a.score);
  return scoredMoves[0];
}
