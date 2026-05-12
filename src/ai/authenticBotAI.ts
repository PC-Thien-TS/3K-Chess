import type { BotDifficulty, PieceType, Point } from '@/src/rules/classicThreeKingdomRules';
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

type AuthenticMoveAnalysis = {
  piece: AuthenticPiece;
  to: Point;
  resolution: NonNullable<ReturnType<typeof applyAuthenticMove>>;
  specials: Set<AuthenticSpecialMove>;
  capturedValue: number;
  capturedGeneral: boolean;
  resolvesCheck: boolean;
  stillInCheck: boolean;
  givesCheck: boolean;
  exposedToAttack: boolean;
  positionScore: number;
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

function analyzeAuthenticMove(
  state: AuthenticBoardState,
  faction: AuthenticFaction,
  candidate: AuthenticBotCandidate
): AuthenticMoveAnalysis | null {
  const resolution = applyAuthenticMove(state, candidate.piece, candidate.to);
  if (!resolution) return null;

  const specials = getSpecialsForResolution(resolution);
  const captured = resolution.moveRecord.captured;

  return {
    piece: candidate.piece,
    to: candidate.to,
    resolution,
    specials,
    capturedValue: captured ? PIECE_VALUES[captured.type] || 0 : 0,
    capturedGeneral: captured?.type === 'G' && captured.owner !== 'Han',
    resolvesCheck:
      isFactionInCheck(faction, state.pieces, state.allianceState) &&
      !isFactionInCheck(faction, resolution.pieces, resolution.allianceState),
    stillInCheck: isFactionInCheck(faction, resolution.pieces, resolution.allianceState),
    givesCheck: specials.has('CHECK') || resolution.checkedPriorityQueue.length > 0,
    exposedToAttack: isFactionInCheck(faction, resolution.pieces, resolution.allianceState)
      ? true
      : isThreatenedByOpponent(faction, candidate.to, resolution.pieces, resolution.allianceState),
    positionScore: getPositionScore(candidate.piece, candidate.to),
  };
}

function isThreatenedByOpponent(
  faction: AuthenticFaction,
  point: Point,
  pieces: AuthenticBoardState['pieces'],
  allianceState: AuthenticBoardState['allianceState']
) {
  return pieces.some((piece) => {
    if (!isAuthenticPlayerFaction(piece.owner) || piece.owner === faction) {
      return false;
    }

    return getAuthenticLegalMoves(
      piece,
      pieces,
      piece.owner,
      1,
      null,
      allianceState
    ).some((candidate) => candidate.x === point.x && candidate.y === point.y);
  });
}

function scoreEasyMove(analysis: AuthenticMoveAnalysis) {
  let score = 0;
  let reason = { rank: 0, text: 'Casual legal move' };

  if (analysis.resolution.winner) {
    const result = pushReason(score, reason, 12000, 5, 'Closing the campaign');
    score = result.nextScore;
    reason = result.nextReason;
  }

  if (analysis.resolvesCheck) {
    const result = pushReason(score, reason, 9000, 4, 'Resolving danger around the General');
    score = result.nextScore;
    reason = result.nextReason;
  }

  if (analysis.capturedValue > 0) {
    const result = pushReason(score, reason, analysis.capturedValue * 900, 3, `Capturing ${analysis.resolution.moveRecord.captured?.visualFaction} ${analysis.resolution.moveRecord.captured?.type}`);
    score = result.nextScore;
    reason = result.nextReason;
  }

  if (analysis.givesCheck) {
    const result = pushReason(score, reason, 1200, 2, 'Giving check');
    score = result.nextScore;
    reason = result.nextReason;
  }

  score += analysis.positionScore;
  if (analysis.exposedToAttack) {
    score -= (PIECE_VALUES[analysis.piece.type] || 0) * 60;
  }
  score += Math.random() * 160;

  return { score, reason: reason.text };
}

function scoreNormalMove(analysis: AuthenticMoveAnalysis) {
  let score = 0;
  let reason = { rank: 0, text: 'Tactical repositioning' };

  if (analysis.resolvesCheck) {
    const result = pushReason(score, reason, 30000, 7, 'Resolving danger around the General');
    score = result.nextScore;
    reason = result.nextReason;
  }

  if (analysis.resolution.winner || analysis.capturedGeneral) {
    const result = pushReason(score, reason, 25000, 6, 'Capturing an enemy General');
    score = result.nextScore;
    reason = result.nextReason;
  }

  if (analysis.specials.has('DEPOSE_EMPEROR')) {
    const result = pushReason(score, reason, 18000, 5, 'Deposing the Han Emperor with a Horse');
    score = result.nextScore;
    reason = result.nextReason;
  }

  if (analysis.capturedValue > 0) {
    const result = pushReason(
      score,
      reason,
      analysis.capturedValue * 1200,
      4,
      `Capturing ${analysis.resolution.moveRecord.captured?.visualFaction} ${analysis.resolution.moveRecord.captured?.type}`
    );
    score = result.nextScore;
    reason = result.nextReason;
  }

  if (analysis.givesCheck) {
    const result = pushReason(score, reason, 2500, 3, 'Giving check');
    score = result.nextScore;
    reason = result.nextReason;
  }

  if (analysis.specials.has('ALLIANCE')) {
    const result = pushReason(score, reason, 800, 2, 'Forming an alliance');
    score = result.nextScore;
    reason = result.nextReason;
  }

  score += analysis.positionScore;
  if (analysis.stillInCheck) {
    score -= 9000;
  }
  if (analysis.exposedToAttack) {
    score -= (PIECE_VALUES[analysis.piece.type] || 0) * 110;
  }
  score += Math.random() * 24;

  return { score, reason: reason.text };
}

function scoreHardMove(analysis: AuthenticMoveAnalysis) {
  let score = 0;
  let reason = { rank: 0, text: 'Aggressive positional advance' };

  if (analysis.resolution.winner) {
    const result = pushReason(score, reason, 42000, 8, 'Closing the campaign');
    score = result.nextScore;
    reason = result.nextReason;
  }

  if (analysis.resolvesCheck) {
    const result = pushReason(score, reason, 34000, 7, 'Resolving danger around the General');
    score = result.nextScore;
    reason = result.nextReason;
  }

  if (analysis.capturedGeneral) {
    const result = pushReason(score, reason, 28000, 6, 'Capturing an enemy General');
    score = result.nextScore;
    reason = result.nextReason;
  }

  if (analysis.specials.has('DEPOSE_EMPEROR')) {
    const result = pushReason(score, reason, 19000, 5, 'Deposing the Han Emperor with a Horse');
    score = result.nextScore;
    reason = result.nextReason;
  }

  if (analysis.capturedValue > 0) {
    const result = pushReason(
      score,
      reason,
      analysis.capturedValue * 1500,
      4,
      `Capturing ${analysis.resolution.moveRecord.captured?.visualFaction} ${analysis.resolution.moveRecord.captured?.type}`
    );
    score = result.nextScore;
    reason = result.nextReason;
  }

  if (analysis.givesCheck) {
    const bonus = analysis.exposedToAttack ? 1800 : 4200;
    const result = pushReason(score, reason, bonus, 3, 'Driving a safe check');
    score = result.nextScore;
    reason = result.nextReason;
  }

  if (analysis.specials.has('ALLIANCE')) {
    const result = pushReason(score, reason, 1200, 2, 'Forming an alliance');
    score = result.nextScore;
    reason = result.nextReason;
  }

  if (analysis.specials.has('ABSORB_ARMY')) {
    const result = pushReason(score, reason, 1800, 2, 'Absorbing a defeated army');
    score = result.nextScore;
    reason = result.nextReason;
  }

  score += analysis.positionScore * 1.15;
  if (analysis.stillInCheck) {
    score -= 12000;
  }
  if (analysis.exposedToAttack) {
    const pieceValue = PIECE_VALUES[analysis.piece.type] || 0;
    const tradePenalty = Math.max(pieceValue - analysis.capturedValue, 0) * 180;
    score -= pieceValue * 120;
    score -= tradePenalty;
  }
  score += Math.random() * 8;

  return { score, reason: reason.text };
}

function scoreAuthenticMove(analysis: AuthenticMoveAnalysis, difficulty: BotDifficulty) {
  if (difficulty === 'easy') return scoreEasyMove(analysis);
  if (difficulty === 'hard') return scoreHardMove(analysis);
  return scoreNormalMove(analysis);
}

function chooseEasyAuthenticMove(scoredMoves: AuthenticBotDecision[]) {
  const sorted = [...scoredMoves].sort((a, b) => b.score - a.score);
  const pool = sorted.slice(0, Math.min(sorted.length, 4));
  return pool[Math.floor(Math.random() * pool.length)];
}

export function chooseAuthenticBotMove(
  state: AuthenticBoardState,
  faction: AuthenticFaction,
  difficulty: BotDifficulty = 'normal'
): AuthenticBotDecision | null {
  const candidates = getCandidates(state, faction);
  if (candidates.length === 0) return null;

  const scoredMoves = candidates.flatMap((candidate) => {
    const analysis = analyzeAuthenticMove(state, faction, candidate);
    if (!analysis) return [];

    const scored = scoreAuthenticMove(analysis, difficulty);
    return [{
      pieceId: candidate.piece.id,
      pieceType: candidate.piece.type,
      from: { x: candidate.piece.x, y: candidate.piece.y },
      to: candidate.to,
      score: scored.score,
      reason: scored.reason,
    }];
  });

  if (scoredMoves.length === 0) return null;

  scoredMoves.sort((a, b) => b.score - a.score);
  return difficulty === 'easy' ? chooseEasyAuthenticMove(scoredMoves) : scoredMoves[0];
}
