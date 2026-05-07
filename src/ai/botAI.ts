import { 
  Faction, 
  Piece, 
  Move, 
  validateMove, 
  isFactionInCheck, 
  isCheckmateDetailed,
  getPieceName,
  BotDifficulty,
  findGeneral
} from '../rules/classicThreeKingdomRules';

const PIECE_VALUES: Record<string, number> = {
  'G': 1000,
  'R': 9,
  'P': 7,
  'H': 5,
  'E': 3,
  'A': 3,
  'S': 1
};

export interface BotDecision {
  move: Move;
  score: number;
  reason: string;
}

/**
 * Helper: Calculate total material value for a faction
 */
function getFactionMaterialValue(faction: Faction, pieces: Piece[]): number {
  return pieces
    .filter(p => p.faction === faction)
    .reduce((val, p) => val + (PIECE_VALUES[p.type] || 0), 0);
}

/**
 * Helper: Identify strongest enemy
 */
function getStrongestEnemyFaction(botFaction: Faction, pieces: Piece[]): Faction | null {
  const others = (['Shu', 'Wei', 'Wu'] as Faction[]).filter(f => f !== botFaction);
  let strongest: Faction | null = null;
  let maxVal = -1;
  
  others.forEach(f => {
    const val = getFactionMaterialValue(f, pieces);
    if (val > maxVal && val > 0) {
      maxVal = val;
      strongest = f;
    }
  });
  
  return strongest;
}

/**
 * Helper: Check if a position is under attack by any enemy
 */
function isThreatened(x: number, y: number, pieces: Piece[], protectorFaction: Faction): boolean {
  const enemies = pieces.filter(p => p.faction !== protectorFaction && p.faction !== 'None');
  for (const enemy of enemies) {
    const validation = validateMove(enemy, { x, y }, pieces, enemy.faction);
    if (validation.legal) return true;
  }
  return false;
}

/**
 * Bot AI v2: Enhanced Heuristic with 1-ply tactical scoring
 */
export function chooseBotMove(faction: Faction, pieces: Piece[], difficulty: BotDifficulty = 'easy'): BotDecision | null {
  const legalMoves = getAllBotLegalMoves(faction, pieces);
  if (legalMoves.length === 0) return null;

  const strongestEnemy = getStrongestEnemyFaction(faction, pieces);
  const currentCheck = isFactionInCheck(faction, pieces);

  const scoredMoves: BotDecision[] = legalMoves.map(move => {
    let score = 0;
    let reason = "Tactical repositioning";

    // 1. Simulate move
    const piece = pieces.find(p => p.x === move.from.x && p.y === move.from.y)!;
    const virtualPieces = pieces
      .filter(p => !(p.x === move.to.x && p.y === move.to.y)) // Remove captured
      .map(p => p.id === piece.id ? { ...p, x: move.to.x, y: move.to.y } : p);

    // WINNING: Checkmate evaluation
    const enemyFactions = (['Shu', 'Wei', 'Wu'] as Faction[]).filter(f => f !== faction);
    let checkmateCount = 0;
    enemyFactions.forEach(f => {
      if (isCheckmateDetailed(f, virtualPieces).checkmated) {
        checkmateCount++;
      }
    });

    if (checkmateCount > 0) {
      score += 10000 * checkmateCount;
      reason = "Victory path found: Delivering checkmate";
    }

    // SURVIVAL: Escape check
    if (currentCheck.inCheck) {
      const nextCheck = isFactionInCheck(faction, virtualPieces);
      if (!nextCheck.inCheck) {
        score += 1000;
        reason = "Defensive maneuver: Protecting General";
      }
    }

    // AGGRESSION: Gives check
    let checkCount = 0;
    enemyFactions.forEach(f => {
      if (isFactionInCheck(f, virtualPieces).inCheck) {
        checkCount++;
      }
    });

    if (checkCount > 0) {
      score += 500 * checkCount;
      if (score < 5000) reason = `Asserting pressure: Checking enemy General`;
    }

    // MATERIAL: Capture evaluation
    if (move.captured) {
      const captureValue = PIECE_VALUES[move.captured] || 0;
      let captureScore = captureValue * 100;
      
      // Target bias: slightly favor attacking the strongest enemy
      const capturedPiece = pieces.find(p => p.x === move.to.x && p.y === move.to.y);
      if (capturedPiece && capturedPiece.faction === strongestEnemy) {
        captureScore += 50;
      }
      
      score += captureScore;
      if (score < 5000) reason = `Material gain: Captured enemy ${getPieceName(move.captured)}`;
    }

    // TACTICAL SAFETY (Normal Difficulty Only)
    if (difficulty === 'normal') {
      // Avoid moving into danger
      if (isThreatened(move.to.x, move.to.y, virtualPieces, faction)) {
        const pieceValue = PIECE_VALUES[piece.type] || 0;
        score -= pieceValue * 50;
      }

      // Check if enemy can give check after this move
      let enemyCanCheck = false;
      const others = pieces.filter(p => p.faction !== faction && p.faction !== 'None');
      for (const enemy of others) {
        for (let dy = 0; dy < 17; dy++) {
          for (let dx = 0; dx < 17; dx++) {
            const v = validateMove(enemy, { x: dx, y: dy }, virtualPieces, enemy.faction);
            if (v.givesCheck && v.checkedFactions?.includes(faction)) {
              enemyCanCheck = true;
              break;
            }
          }
          if (enemyCanCheck) break;
        }
      }
      if (enemyCanCheck) {
        score -= 300;
      }
    }

    // POSITIONING
    const dxFromCenter = Math.abs(move.to.x - 8);
    const dyFromCenter = Math.abs(move.to.y - 8);
    const distFromCenter = dxFromCenter + dyFromCenter;
    
    // Faction flavor
    if (faction === 'Shu') { // Defensive
      const protectBonus = (isThreatened(findGeneral('Shu', pieces)!.x, findGeneral('Shu', pieces)!.y, pieces, 'Shu') ? 1 : 0) * 100;
      score += protectBonus;
      score += (16 - distFromCenter) * 2;
    } else if (faction === 'Wei') { // Aggressive
      score += (checkCount > 0 ? 50 : 0);
      score += (16 - distFromCenter) * 3;
    } else if (faction === 'Wu') { // Mobility/Position
      score += (16 - distFromCenter) * 5;
    }

    // Development bonus
    const isHomeRow = (p: Piece) => {
      if (p.faction === 'Shu') return p.y >= 13;
      if (p.faction === 'Wei') return p.y <= 3;
      if (p.faction === 'Wu') return p.y >= 5 && p.y <= 11 && p.x <= 3;
      return false;
    };
    if (isHomeRow(piece) && !isHomeRow({ ...piece, x: move.to.x, y: move.to.y })) {
      score += 20;
    }

    // Randomness
    const randomRange = difficulty === 'easy' ? 200 : 40;
    score += Math.random() * randomRange;

    return { move, score, reason };
  });

  scoredMoves.sort((a, b) => b.score - a.score);
  return scoredMoves[0];
}

function getAllBotLegalMoves(faction: Faction, pieces: Piece[]): Move[] {
  const moves: Move[] = [];
  const factionPieces = pieces.filter(p => p.faction === faction);

  for (const piece of factionPieces) {
    for (let y = 0; y < 17; y++) {
      for (let x = 0; x < 17; x++) {
        const validation = validateMove(piece, { x, y }, pieces, faction);
        if (validation.legal) {
          moves.push({
            id: 'bot-' + Math.random().toString(36).substr(2, 9),
            pieceType: piece.type,
            faction: piece.faction,
            from: { x: piece.x, y: piece.y },
            to: { x, y },
            captured: pieces.find(p => p.x === x && p.y === y)?.type,
            check: validation.givesCheck,
            checkedFactions: validation.checkedFactions,
            timestamp: new Date()
          });
        }
      }
    }
  }
  return moves;
}
