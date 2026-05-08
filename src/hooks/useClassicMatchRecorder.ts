import React from 'react';
import type {
  CheckmateResult,
  Faction,
  MatchConfig,
  MatchRecord,
  MatchStats,
  Piece,
  RecordedMove,
  ValidationResult,
} from '@/src/rules/classicThreeKingdomRules';
import { getPieceName } from '@/src/rules/classicThreeKingdomRules';
import { exportMatchRecord, saveMatchRecord } from '@/src/storage/localMatchArchive';
import { GAME_MODE_RULESETS } from '@/shared/gameModes';

const FACTIONS: Faction[] = ['Shu', 'Wei', 'Wu'];

const createInitialMatchStats = (): MatchStats => ({
  totalMoves: 0,
  totalCaptures: 0,
  totalChecks: 0,
  totalCheckmates: 0,
  capturesByFaction: { Shu: 0, Wei: 0, Wu: 0, None: 0 },
  eliminationOrder: [],
});

type RecordCompletedMoveInput = {
  moveId: string;
  historyLength: number;
  actingFaction: Faction;
  piece: Piece;
  destination: { x: number; y: number };
  capturedPiece?: Piece;
  validation: ValidationResult;
  isBot: boolean;
  checkmateHappened: boolean;
  debugResults: Record<string, CheckmateResult>;
  nextWinner: Faction | null;
};

type UseClassicMatchRecorderArgs = {
  config: MatchConfig;
  initialPieces: Piece[];
  pieces: Piece[];
  winner: Faction | null;
  eliminated: Faction[];
  roomCode?: string;
  setStatus: React.Dispatch<React.SetStateAction<string>>;
};

export function useClassicMatchRecorder({
  config,
  initialPieces,
  pieces,
  winner,
  eliminated,
  roomCode,
  setStatus,
}: UseClassicMatchRecorderArgs) {
  const [matchStats, setMatchStats] = React.useState<MatchStats>(createInitialMatchStats);
  const [showSummary, setShowSummary] = React.useState(false);
  const [recordedMoves, setRecordedMoves] = React.useState<RecordedMove[]>([]);
  const [isSaved, setIsSaved] = React.useState(false);
  const summaryTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSummaryTimeout = React.useCallback(() => {
    if (summaryTimeoutRef.current) {
      clearTimeout(summaryTimeoutRef.current);
      summaryTimeoutRef.current = null;
    }
  }, []);

  React.useEffect(() => clearSummaryTimeout, [clearSummaryTimeout]);

  const queueSummaryReveal = React.useCallback(() => {
    clearSummaryTimeout();
    summaryTimeoutRef.current = setTimeout(() => {
      setShowSummary(true);
      summaryTimeoutRef.current = null;
    }, 1500);
  }, [clearSummaryTimeout]);

  const recordCompletedMove = React.useCallback(
    ({
      moveId,
      historyLength,
      actingFaction,
      piece,
      destination,
      capturedPiece,
      validation,
      isBot,
      checkmateHappened,
      debugResults,
      nextWinner,
    }: RecordCompletedMoveInput): RecordedMove => {
      const capturedThisMove = !!capturedPiece;

      setMatchStats((prev) => {
        const newCapturesByFaction = { ...prev.capturesByFaction };
        if (capturedThisMove) {
          newCapturesByFaction[actingFaction] = (newCapturesByFaction[actingFaction] || 0) + 1;
        }

        const newElimOrder = [...prev.eliminationOrder];
        if (checkmateHappened) {
          FACTIONS.forEach((faction) => {
            if (debugResults[faction]?.checkmated && !newElimOrder.includes(faction)) {
              newElimOrder.push(faction);
            }
          });
        }

        return {
          totalMoves: prev.totalMoves + 1,
          totalCaptures: capturedThisMove ? prev.totalCaptures + 1 : prev.totalCaptures,
          totalChecks: validation.givesCheck ? prev.totalChecks + 1 : prev.totalChecks,
          totalCheckmates: checkmateHappened ? prev.totalCheckmates + 1 : prev.totalCheckmates,
          capturesByFaction: newCapturesByFaction,
          eliminationOrder: newElimOrder,
          finalMoveText: `${isBot ? 'BOT ' : ''}${actingFaction} ${getPieceName(piece.type)} ${
            capturedThisMove ? `captured ${getPieceName(capturedPiece.type)}` : 'moved'
          } to (${destination.x}, ${destination.y})`,
        };
      });

      const recordedMove: RecordedMove = {
        id: moveId,
        turnNumber: historyLength + 1,
        actorType: isBot ? 'bot' : 'human',
        faction: actingFaction,
        pieceId: piece.id,
        pieceType: piece.type,
        from: { x: piece.x, y: piece.y },
        to: destination,
        capturedPiece: capturedPiece
          ? { type: capturedPiece.type, faction: capturedPiece.faction }
          : undefined,
        givesCheck: validation.givesCheck,
        checkedFactions: validation.checkedFactions,
        checkmateHappened,
        eliminatedAfterMove: checkmateHappened
          ? (Object.keys(debugResults).filter((faction) => debugResults[faction].checkmated) as Faction[])
          : [],
        winnerAfterMove: nextWinner,
        notationText: `${getPieceName(piece.type)} ${
          capturedPiece ? `captures ${getPieceName(capturedPiece.type)}` : 'moves'
        } from (${piece.x},${piece.y}) to (${destination.x},${destination.y})`,
      };

      setRecordedMoves((prev) => [...prev, recordedMove]);

      if (nextWinner) {
        queueSummaryReveal();
      }

      return recordedMove;
    },
    [queueSummaryReveal]
  );

  const resetRecorder = React.useCallback(() => {
    clearSummaryTimeout();
    setShowSummary(false);
    setRecordedMoves([]);
    setIsSaved(false);
    setMatchStats(createInitialMatchStats());
  }, [clearSummaryTimeout]);

  const createMatchRecord = React.useCallback(
    (): MatchRecord => ({
      id: `match-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      ruleset: GAME_MODE_RULESETS.classic,
      setup: config,
      winner,
      eliminatedFactions: eliminated,
      matchStats,
      initialPieces,
      moves: recordedMoves,
      finalPieces: pieces,
      source: roomCode ? { mode: 'war-room-sim', roomCode } : { mode: 'local' },
    }),
    [config, eliminated, initialPieces, matchStats, pieces, recordedMoves, roomCode, winner]
  );

  const handleSaveLocally = React.useCallback(() => {
    const record = createMatchRecord();
    saveMatchRecord(record);
    setIsSaved(true);
    setStatus('Match chronicles saved to local archives.');
    return record;
  }, [createMatchRecord, setStatus]);

  const handleExportMatch = React.useCallback(() => {
    const record = createMatchRecord();
    exportMatchRecord(record);
    setStatus('Match records exported for external archives.');
    return record;
  }, [createMatchRecord, setStatus]);

  return {
    matchStats,
    showSummary,
    recordedMoves,
    isSaved,
    setShowSummary,
    recordCompletedMove,
    resetRecorder,
    createMatchRecord,
    handleSaveLocally,
    handleExportMatch,
  };
}
