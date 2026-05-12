import { DEFAULT_GAME_MODE, GAME_MODE_RULESETS, normalizeGameMode } from '@/shared/gameModes';
import type {
  AuthenticRecordedMove,
  AuthenticReplayData,
  AuthenticReplayState,
  MatchConfig,
  MatchRecord,
  MatchStats,
} from './threeKingdomRules';
import {
  applyAuthenticMove,
  createInitialAuthenticState,
  type AllianceState,
  type AuthenticBoardState,
  type AuthenticCapturedPieceRecord,
  type AuthenticFaction,
  type AuthenticMoveRecord,
  type AuthenticPiece,
} from './authenticThreeKingdomRules';

export interface AuthenticReplaySnapshot extends AuthenticReplayState {
  lastMoveRecord: AuthenticMoveRecord | null;
  moveIndex: number;
}

function clonePiece(piece: AuthenticPiece): AuthenticPiece {
  return { ...piece };
}

function cloneCapturedPiece(piece: AuthenticCapturedPieceRecord): AuthenticCapturedPieceRecord {
  return { ...piece };
}

function cloneAllianceState(allianceState: AllianceState | null | undefined): AllianceState {
  if (!allianceState?.allies || !allianceState.target) {
    return { allies: null, target: null, source: null };
  }

  return {
    allies: [...allianceState.allies] as [AuthenticFaction, AuthenticFaction],
    target: allianceState.target,
    source: allianceState.source ?? null,
  };
}

function cloneLastMove(
  lastMove: AuthenticReplayState['lastMove'] | null | undefined
): AuthenticReplayState['lastMove'] {
  if (!lastMove) {
    return null;
  }

  return {
    from: { ...lastMove.from },
    to: { ...lastMove.to },
  };
}

function normalizeFactionMoveCounts(
  counts: Partial<Record<AuthenticFaction, number>> | null | undefined,
  fallback: AuthenticReplayState['factionMoveCounts']
): AuthenticReplayState['factionMoveCounts'] {
  return {
    Wu: counts?.Wu ?? fallback.Wu,
    Wei: counts?.Wei ?? fallback.Wei,
    Shu: counts?.Shu ?? fallback.Shu,
  };
}

function cloneReplayState(state: Partial<AuthenticReplayState>): Partial<AuthenticReplayState> {
  return {
    ...state,
    pieces: Array.isArray(state.pieces) ? state.pieces.map(clonePiece) : undefined,
    factionMoveCounts: state.factionMoveCounts
      ? { ...state.factionMoveCounts }
      : undefined,
    hanController: state.hanController ?? null,
    allianceState: state.allianceState
      ? cloneAllianceState(state.allianceState)
      : undefined,
    checkedPriorityQueue: Array.isArray(state.checkedPriorityQueue)
      ? [...state.checkedPriorityQueue]
      : undefined,
    eliminated: Array.isArray(state.eliminated) ? [...state.eliminated] : undefined,
    captured: Array.isArray(state.captured) ? state.captured.map(cloneCapturedPiece) : undefined,
    winner: state.winner ?? null,
    lastMove: cloneLastMove(state.lastMove),
  };
}

function createEmptyMatchStats(): MatchStats {
  return {
    totalMoves: 0,
    totalCaptures: 0,
    totalChecks: 0,
    totalCheckmates: 0,
    capturesByFaction: { Shu: 0, Wei: 0, Wu: 0, None: 0 },
    eliminationOrder: [],
  };
}

function clampMoveIndex(moveIndex: number, movesLength: number) {
  if (!Number.isFinite(moveIndex)) {
    return 0;
  }

  return Math.max(0, Math.min(Math.floor(moveIndex), movesLength));
}

function normalizeInitialAuthenticReplayState(
  initialState?: Partial<AuthenticReplayState> | null
): AuthenticReplayState {
  const baseState = createInitialAuthenticState();

  return {
    pieces: Array.isArray(initialState?.pieces)
      ? initialState.pieces.map(clonePiece)
      : baseState.pieces.map(clonePiece),
    currentTurn: initialState?.currentTurn ?? baseState.currentTurn,
    moveNumber: Number.isFinite(initialState?.moveNumber)
      ? Math.max(0, Math.floor(initialState.moveNumber as number))
      : baseState.moveNumber,
    factionMoveCounts: normalizeFactionMoveCounts(initialState?.factionMoveCounts, baseState.factionMoveCounts),
    hanController: initialState?.hanController ?? baseState.hanController,
    allianceState: cloneAllianceState(initialState?.allianceState ?? baseState.allianceState),
    checkedPriorityQueue: Array.isArray(initialState?.checkedPriorityQueue)
      ? [...initialState.checkedPriorityQueue]
      : [...baseState.checkedPriorityQueue],
    eliminated: Array.isArray(initialState?.eliminated)
      ? [...initialState.eliminated]
      : [...baseState.eliminated],
    captured: Array.isArray(initialState?.captured)
      ? initialState.captured.map(cloneCapturedPiece)
      : [...baseState.captured],
    winner: initialState?.winner ?? baseState.winner,
    lastMove: cloneLastMove(initialState?.lastMove ?? baseState.lastMove),
  };
}

function createBoardStateFromSnapshot(snapshot: AuthenticReplaySnapshot): AuthenticBoardState {
  return {
    pieces: snapshot.pieces.map(clonePiece),
    currentTurn: snapshot.currentTurn,
    moveNumber: snapshot.moveNumber,
    factionMoveCounts: { ...snapshot.factionMoveCounts },
    hanController: snapshot.hanController,
    allianceState: cloneAllianceState(snapshot.allianceState),
    checkedPriorityQueue: [...snapshot.checkedPriorityQueue],
    eliminated: [...snapshot.eliminated],
    history: [],
    captured: snapshot.captured.map(cloneCapturedPiece),
    winner: snapshot.winner,
    lastMove: cloneLastMove(snapshot.lastMove),
  };
}

function findMovingPiece(pieces: AuthenticPiece[], move: AuthenticMoveRecord) {
  return (
    pieces.find((piece) => piece.id === move.pieceId) ||
    pieces.find(
      (piece) =>
        piece.x === move.from.x &&
        piece.y === move.from.y &&
        piece.type === move.pieceType &&
        piece.owner === move.faction
    ) ||
    null
  );
}

function advanceAuthenticReplaySnapshot(
  previousSnapshot: AuthenticReplaySnapshot,
  move: AuthenticRecordedMove,
  nextMoveNumber: number
): AuthenticReplaySnapshot {
  if (move.replayState) {
    const replayState = normalizeInitialAuthenticReplayState({
      ...previousSnapshot,
      ...cloneReplayState(move.replayState),
      moveNumber: nextMoveNumber,
      lastMove: move.replayState.lastMove ?? { from: { ...move.from }, to: { ...move.to } },
    });

    return {
      ...replayState,
      lastMoveRecord: move,
      moveIndex: nextMoveNumber,
    };
  }

  const movingPiece = findMovingPiece(previousSnapshot.pieces, move);
  if (!movingPiece) {
    return {
      ...previousSnapshot,
      moveNumber: nextMoveNumber,
      lastMove: { from: { ...move.from }, to: { ...move.to } },
      lastMoveRecord: move,
      moveIndex: nextMoveNumber,
    };
  }

  const resolution = applyAuthenticMove(
    createBoardStateFromSnapshot(previousSnapshot),
    movingPiece,
    move.to
  );

  if (!resolution) {
    return {
      ...previousSnapshot,
      moveNumber: nextMoveNumber,
      lastMove: { from: { ...move.from }, to: { ...move.to } },
      lastMoveRecord: move,
      moveIndex: nextMoveNumber,
    };
  }

  return {
    pieces: resolution.pieces.map(clonePiece),
    currentTurn: resolution.nextTurn ?? previousSnapshot.currentTurn,
    moveNumber: nextMoveNumber,
    factionMoveCounts: { ...resolution.factionMoveCounts },
    hanController: resolution.hanController,
    allianceState: cloneAllianceState(resolution.allianceState),
    checkedPriorityQueue: [...resolution.checkedPriorityQueue],
    eliminated: [...resolution.eliminated],
    captured: [
      ...previousSnapshot.captured.map(cloneCapturedPiece),
      ...resolution.capturedPieces.map(cloneCapturedPiece),
    ],
    winner: resolution.winner,
    lastMove: cloneLastMove(resolution.lastMove),
    lastMoveRecord: move,
    moveIndex: nextMoveNumber,
  };
}

function buildAuthenticReplayTimeline(
  initialState: Partial<AuthenticReplayState> | null | undefined,
  moves: AuthenticRecordedMove[]
) {
  let snapshot: AuthenticReplaySnapshot = {
    ...normalizeInitialAuthenticReplayState(initialState),
    lastMoveRecord: null,
    moveIndex: 0,
  };
  const timeline: AuthenticReplaySnapshot[] = [];

  moves.forEach((move, index) => {
    snapshot = advanceAuthenticReplaySnapshot(snapshot, move, index + 1);
    timeline.push(snapshot);
  });

  return timeline;
}

export function reconstructAuthenticReplayState(
  initialState: Partial<AuthenticReplayState> | null | undefined,
  moves: AuthenticRecordedMove[],
  moveIndex: number
): AuthenticReplaySnapshot {
  const normalizedMoves = Array.isArray(moves) ? moves : [];
  const normalizedMoveIndex = clampMoveIndex(moveIndex, normalizedMoves.length);
  const timeline = buildAuthenticReplayTimeline(initialState, normalizedMoves.slice(0, normalizedMoveIndex));

  if (timeline.length === 0) {
    return {
      ...normalizeInitialAuthenticReplayState(initialState),
      lastMoveRecord: null,
      moveIndex: 0,
    };
  }

  const latest = timeline[timeline.length - 1];
  return {
    ...latest,
    moveIndex: normalizedMoveIndex,
  };
}

export function canReplayAuthenticRecord(
  record: Pick<MatchRecord, 'setup' | 'authenticReplay'>
) {
  return (
    normalizeGameMode(record.setup?.gameMode, DEFAULT_GAME_MODE) === 'authentic' &&
    Array.isArray(record.authenticReplay?.moves) &&
    Array.isArray(record.authenticReplay?.initialState?.pieces)
  );
}

export function getAuthenticReplayMoveCount(
  replayData: AuthenticReplayData | null | undefined
) {
  return Array.isArray(replayData?.moves) ? replayData.moves.length : 0;
}

export function createAuthenticMatchRecord({
  config,
  finalState,
  initialState = createInitialAuthenticState(),
}: {
  config: MatchConfig;
  finalState: AuthenticBoardState;
  initialState?: AuthenticBoardState;
}): MatchRecord {
  const chronologicalMoves = [...finalState.history]
    .reverse()
    .map((move) => ({ ...move })) as AuthenticRecordedMove[];
  const initialReplayState = normalizeInitialAuthenticReplayState(initialState);
  const timeline = buildAuthenticReplayTimeline(initialReplayState, chronologicalMoves);
  const replayMoves = chronologicalMoves.map((move, index) => ({
    ...move,
    replayState: cloneReplayState(timeline[index]),
  }));

  const matchStats = replayMoves.reduce<MatchStats>((stats, move) => {
    stats.totalMoves += 1;
    if (move.captured) {
      stats.totalCaptures += 1;
      stats.capturesByFaction[move.faction] += 1;
    }
    if (move.special?.includes('CHECK')) {
      stats.totalChecks += 1;
    }
    if (move.special?.includes('CHECKMATE')) {
      stats.totalCheckmates += 1;
    }
    move.eliminated?.forEach((faction) => {
      if (!stats.eliminationOrder.includes(faction)) {
        stats.eliminationOrder.push(faction);
      }
    });
    stats.finalMoveText = move.note;
    return stats;
  }, createEmptyMatchStats());

  return {
    id: `match-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    createdAt: new Date().toISOString(),
    ruleset: GAME_MODE_RULESETS.authentic,
    setup: config,
    winner: finalState.winner,
    eliminatedFactions: [...finalState.eliminated],
    matchStats,
    initialPieces: [],
    moves: [],
    finalPieces: [],
    authenticReplay: {
      version: 1,
      initialState: cloneReplayState(initialReplayState),
      moves: replayMoves,
    },
    source: { mode: 'local' },
  };
}
