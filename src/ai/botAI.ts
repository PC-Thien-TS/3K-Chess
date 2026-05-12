import {
  Faction,
  Piece,
  Move,
  validateMove,
  isFactionInCheck,
  isCheckmateDetailed,
  getPieceName,
  BotDifficulty,
  findGeneral,
} from '../rules/classicThreeKingdomRules';

const PIECE_VALUES: Record<string, number> = {
  G: 1000,
  R: 9,
  P: 7,
  H: 5,
  E: 3,
  A: 3,
  S: 1,
};

const CLASSIC_FACTIONS: Faction[] = ['Shu', 'Wei', 'Wu'];

export interface BotDecision {
  move: Move;
  score: number;
  reason: string;
}

interface MoveAnalysis {
  move: Move;
  piece: Piece;
  movedPieceValue: number;
  capturedValue: number;
  currentCheck: ReturnType<typeof isFactionInCheck>;
  virtualPieces: Piece[];
  isStillInCheck: boolean;
  checkmateCount: number;
  checkTargets: Faction[];
  exposedToAttack: boolean;
  enemyCanCheckUs: boolean;
  centerBonus: number;
  developmentBonus: number;
}

function getPieceValue(type: Piece['type']) {
  return PIECE_VALUES[type] || 0;
}

function getFactionMaterialValue(faction: Faction, pieces: Piece[]): number {
  return pieces
    .filter((piece) => piece.faction === faction)
    .reduce((total, piece) => total + getPieceValue(piece.type), 0);
}

function getStrongestEnemyFaction(botFaction: Faction, pieces: Piece[]): Faction | null {
  const others = CLASSIC_FACTIONS.filter((faction) => faction !== botFaction);
  let strongest: Faction | null = null;
  let strongestValue = -1;

  others.forEach((candidate) => {
    const material = getFactionMaterialValue(candidate, pieces);
    if (material > strongestValue && material > 0) {
      strongestValue = material;
      strongest = candidate;
    }
  });

  return strongest;
}

function isThreatened(x: number, y: number, pieces: Piece[], protectorFaction: Faction): boolean {
  const enemies = pieces.filter((piece) => piece.faction !== protectorFaction && piece.faction !== 'None');
  for (const enemy of enemies) {
    const validation = validateMove(enemy, { x, y }, pieces, enemy.faction);
    if (validation.legal) return true;
  }
  return false;
}

function canEnemyGiveCheck(
  faction: Faction,
  pieces: Piece[],
  virtualPieces: Piece[]
) {
  const enemies = pieces.filter((piece) => piece.faction !== faction && piece.faction !== 'None');
  for (const enemy of enemies) {
    for (let y = 0; y < 17; y += 1) {
      for (let x = 0; x < 17; x += 1) {
        const validation = validateMove(enemy, { x, y }, virtualPieces, enemy.faction);
        if (validation.givesCheck && validation.checkedFactions?.includes(faction)) {
          return true;
        }
      }
    }
  }
  return false;
}

function buildVirtualPieces(pieces: Piece[], move: Move, piece: Piece) {
  return pieces
    .filter((entry) => !(entry.x === move.to.x && entry.y === move.to.y))
    .map((entry) => (entry.id === piece.id ? { ...entry, x: move.to.x, y: move.to.y } : entry));
}

function getCenterBonus(move: Move, faction: Faction) {
  const dxFromCenter = Math.abs(move.to.x - 8);
  const dyFromCenter = Math.abs(move.to.y - 8);
  const distance = dxFromCenter + dyFromCenter;
  const centrality = 16 - distance;

  if (faction === 'Wu') return centrality * 5;
  if (faction === 'Wei') return centrality * 3;
  return centrality * 2;
}

function isHomeRow(piece: Piece) {
  if (piece.faction === 'Shu') return piece.y === 0;
  if (piece.faction === 'Wei') return piece.y === 16;
  if (piece.faction === 'Wu') return piece.x === 0;
  return false;
}

function getDevelopmentBonus(piece: Piece, move: Move) {
  const nextPiece = { ...piece, x: move.to.x, y: move.to.y };
  return isHomeRow(piece) && !isHomeRow(nextPiece) ? 20 : 0;
}

function analyzeMove(
  faction: Faction,
  pieces: Piece[],
  move: Move,
  strongestEnemy: Faction | null,
  currentCheck: ReturnType<typeof isFactionInCheck>
): MoveAnalysis | null {
  const piece = pieces.find((entry) => entry.x === move.from.x && entry.y === move.from.y);
  if (!piece) return null;

  const virtualPieces = buildVirtualPieces(pieces, move, piece);
  const enemyFactions = CLASSIC_FACTIONS.filter((candidate) => candidate !== faction);
  let checkmateCount = 0;
  const checkTargets: Faction[] = [];

  enemyFactions.forEach((enemyFaction) => {
    const enemyCheck = isFactionInCheck(enemyFaction, virtualPieces);
    if (enemyCheck.inCheck) {
      checkTargets.push(enemyFaction);
    }
    if (isCheckmateDetailed(enemyFaction, virtualPieces).checkmated) {
      checkmateCount += 1;
    }
  });

  const capturedPiece = pieces.find((entry) => entry.x === move.to.x && entry.y === move.to.y);
  const capturedValue = move.captured ? getPieceValue(move.captured) : 0;
  let captureBias = capturedValue;
  if (capturedPiece && capturedPiece.faction === strongestEnemy) {
    captureBias += 0.5;
  }

  const movedPieceValue = getPieceValue(piece.type);
  const general = findGeneral(faction, pieces);
  const generalUnderPressure = general
    ? isThreatened(general.x, general.y, pieces, faction)
    : false;

  return {
    move,
    piece,
    movedPieceValue,
    capturedValue: captureBias,
    currentCheck,
    virtualPieces,
    isStillInCheck: isFactionInCheck(faction, virtualPieces).inCheck,
    checkmateCount,
    checkTargets,
    exposedToAttack: isThreatened(move.to.x, move.to.y, virtualPieces, faction),
    enemyCanCheckUs: canEnemyGiveCheck(faction, pieces, virtualPieces),
    centerBonus: getCenterBonus(move, faction) + (generalUnderPressure && faction === 'Shu' ? 100 : 0),
    developmentBonus: getDevelopmentBonus(piece, move),
  };
}

function chooseReason(analysis: MoveAnalysis, difficulty: BotDifficulty) {
  if (analysis.checkmateCount > 0) {
    return 'Victory path found: Delivering checkmate';
  }

  if (analysis.currentCheck.inCheck && !analysis.isStillInCheck) {
    return 'Defensive maneuver: Protecting General';
  }

  if (analysis.capturedValue > 0) {
    return `Material gain: Captured enemy ${getPieceName(analysis.move.captured!)}`;
  }

  if (analysis.checkTargets.length > 0) {
    return difficulty === 'hard'
      ? 'Aggressive pressure: Safe check on an enemy General'
      : 'Asserting pressure: Checking enemy General';
  }

  if (analysis.developmentBonus > 0) {
    return 'Development: Activating reserves';
  }

  return difficulty === 'easy' ? 'Casual pressure' : 'Tactical repositioning';
}

function scoreEasyMove(analysis: MoveAnalysis) {
  let score = 0;
  score += analysis.checkmateCount * 6000;
  if (analysis.currentCheck.inCheck && !analysis.isStillInCheck) {
    score += 2200;
  }
  score += analysis.capturedValue * 180;
  score += analysis.checkTargets.length * 160;
  score += analysis.centerBonus * 0.8;
  score += analysis.developmentBonus;
  if (analysis.exposedToAttack) {
    score -= analysis.movedPieceValue * 40;
  }
  score += Math.random() * 420;
  return score;
}

function scoreNormalMove(analysis: MoveAnalysis) {
  let score = 0;
  score += analysis.checkmateCount * 10000;
  if (analysis.currentCheck.inCheck && !analysis.isStillInCheck) {
    score += 3500;
  }
  if (analysis.isStillInCheck) {
    score -= 4000;
  }
  score += analysis.capturedValue * 240;
  score += analysis.checkTargets.length * 520;
  score += analysis.centerBonus;
  score += analysis.developmentBonus;
  if (analysis.exposedToAttack) {
    score -= analysis.movedPieceValue * 90;
  }
  if (analysis.enemyCanCheckUs) {
    score -= 320;
  }
  score += Math.random() * 90;
  return score;
}

function scoreHardMove(analysis: MoveAnalysis) {
  let score = 0;
  score += analysis.checkmateCount * 16000;
  if (analysis.currentCheck.inCheck && !analysis.isStillInCheck) {
    score += 8000;
  }
  if (analysis.isStillInCheck) {
    score -= 12000;
  }
  score += analysis.capturedValue * 320;
  if (analysis.checkTargets.length > 0) {
    score += analysis.exposedToAttack ? 400 : 1600;
  }
  score += analysis.centerBonus * 1.15;
  score += analysis.developmentBonus * 1.5;

  if (analysis.exposedToAttack) {
    const badTradePenalty = Math.max(analysis.movedPieceValue - analysis.capturedValue, 0) * 180;
    score -= analysis.movedPieceValue * 130;
    score -= badTradePenalty;
  }

  if (analysis.enemyCanCheckUs) {
    score -= 900;
  }

  score += Math.random() * 16;
  return score;
}

function scoreMove(analysis: MoveAnalysis, difficulty: BotDifficulty) {
  if (difficulty === 'easy') return scoreEasyMove(analysis);
  if (difficulty === 'hard') return scoreHardMove(analysis);
  return scoreNormalMove(analysis);
}

function chooseEasyMove(scoredMoves: BotDecision[]) {
  const sorted = [...scoredMoves].sort((a, b) => b.score - a.score);
  const poolSize = Math.min(sorted.length, 4);
  const choicePool = sorted.slice(0, Math.max(poolSize, 1));
  return choicePool[Math.floor(Math.random() * choicePool.length)];
}

export function chooseBotMove(
  faction: Faction,
  pieces: Piece[],
  difficulty: BotDifficulty = 'easy'
): BotDecision | null {
  const legalMoves = getAllBotLegalMoves(faction, pieces);
  if (legalMoves.length === 0) return null;

  const strongestEnemy = getStrongestEnemyFaction(faction, pieces);
  const currentCheck = isFactionInCheck(faction, pieces);

  const scoredMoves = legalMoves.flatMap((move) => {
    const analysis = analyzeMove(faction, pieces, move, strongestEnemy, currentCheck);
    if (!analysis) {
      return [];
    }

    return [
      {
        move,
        score: scoreMove(analysis, difficulty),
        reason: chooseReason(analysis, difficulty),
      },
    ];
  });

  if (scoredMoves.length === 0) return null;

  scoredMoves.sort((a, b) => b.score - a.score);
  return difficulty === 'easy' ? chooseEasyMove(scoredMoves) : scoredMoves[0];
}

function getAllBotLegalMoves(faction: Faction, pieces: Piece[]): Move[] {
  const moves: Move[] = [];
  const factionPieces = pieces.filter((piece) => piece.faction === faction);

  for (const piece of factionPieces) {
    for (let y = 0; y < 17; y += 1) {
      for (let x = 0; x < 17; x += 1) {
        const validation = validateMove(piece, { x, y }, pieces, faction);
        if (validation.legal) {
          moves.push({
            id: `bot-${Math.random().toString(36).slice(2, 11)}`,
            pieceType: piece.type,
            faction: piece.faction,
            from: { x: piece.x, y: piece.y },
            to: { x, y },
            captured: pieces.find((entry) => entry.x === x && entry.y === y)?.type,
            check: validation.givesCheck,
            checkedFactions: validation.checkedFactions,
            timestamp: new Date(),
          });
        }
      }
    }
  }

  return moves;
}
