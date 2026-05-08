import React from 'react';
import { chooseBotMove, BotDecision } from '@/src/ai/botAI';
import { BotDifficulty, Faction, MatchConfig, Piece, PlayerType } from '@/src/rules/classicThreeKingdomRules';

type UseClassicBotTurnsParams = {
  roomMode: 'local' | 'online';
  isHost?: boolean;
  playerFaction?: Faction | null;
  turn: Faction;
  controlModes: Record<Faction, PlayerType>;
  winner: Faction | null;
  piecesCount: number;
  turnRef: React.MutableRefObject<Faction>;
  controlModesRef: React.MutableRefObject<Record<Faction, PlayerType>>;
  winnerRef: React.MutableRefObject<Faction | null>;
  piecesRef: React.MutableRefObject<Piece[]>;
  configRef: React.MutableRefObject<MatchConfig>;
  eliminatedRef: React.MutableRefObject<Faction[]>;
  executeLocalBotMove: (piece: Piece, x: number, y: number) => string | null;
  submitOnlineBotMove: (piece: Piece, x: number, y: number) => string | null;
  advanceAfterNoLegalMove: (faction: Faction, pieces: Piece[], eliminated: Faction[]) => void;
  setStatus: React.Dispatch<React.SetStateAction<string>>;
  setLastBotDecision: React.Dispatch<React.SetStateAction<BotDecision & { difficulty: BotDifficulty } | null>>;
};

export function useClassicBotTurns({
  roomMode,
  isHost,
  playerFaction,
  turn,
  controlModes,
  winner,
  piecesCount,
  turnRef,
  controlModesRef,
  winnerRef,
  piecesRef,
  configRef,
  eliminatedRef,
  executeLocalBotMove,
  submitOnlineBotMove,
  advanceAfterNoLegalMove,
  setStatus,
  setLastBotDecision,
}: UseClassicBotTurnsParams) {
  const [isBotThinking, setIsBotThinking] = React.useState(false);
  const botTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const devLog = (...args: unknown[]) => {
    if ((import.meta as any).env.DEV) {
      console.log(...args);
    }
  };

  React.useEffect(() => {
    if (botTimerRef.current) {
      clearTimeout(botTimerRef.current);
      botTimerRef.current = null;
    }

    const currentControl = controlModes[turn];
    devLog('[Bot Turn] detected', {
      roomMode,
      turn,
      controlMode: currentControl,
      isHost,
      playerFaction,
      botThinking: isBotThinking,
      pieceCount: piecesCount,
    });

    if (winner || isBotThinking || currentControl !== 'Bot') {
      return;
    }

    if (roomMode === 'online' && !isHost) {
      devLog('[Bot Turn] skipped non-host online bot', {
        roomMode,
        turn,
        controlMode: currentControl,
        isHost,
        playerFaction,
        botThinking: isBotThinking,
        pieceCount: piecesCount,
      });
      return;
    }

    setIsBotThinking(true);
    const delay = 600 + Math.random() * 400;

    botTimerRef.current = setTimeout(() => {
      const activeTurn = turnRef.current;
      const activeWinner = winnerRef.current;
      const activeControl = controlModesRef.current[activeTurn];

      if (activeWinner || activeControl !== 'Bot') {
        setIsBotThinking(false);
        return;
      }

      try {
        const difficulty = configRef.current.factions[activeTurn].difficulty;
        const currentPieces = piecesRef.current;
        const decision = chooseBotMove(activeTurn, currentPieces, difficulty);

        if (!decision) {
          devLog('[Bot Turn] no legal moves', {
            roomMode,
            turn: activeTurn,
            controlMode: activeControl,
            isHost,
            playerFaction,
            botThinking: true,
            pieceCount: currentPieces.length,
          });
          setStatus(`${activeTurn} has no legal maneuvers. Skipping turn.`);
          advanceAfterNoLegalMove(activeTurn, currentPieces, eliminatedRef.current);
          return;
        }

        setLastBotDecision({ ...decision, difficulty });
        const piece = currentPieces.find((entry) => entry.x === decision.move.from.x && entry.y === decision.move.from.y);
        if (!piece) {
          setStatus(`Bot execution failed: unable to locate ${activeTurn} unit at (${decision.move.from.x}, ${decision.move.from.y}).`);
          return;
        }

        const botPrefix = `BOT ${activeTurn} (${difficulty})`;
        setStatus(`${botPrefix}: ${decision.reason}.`);
        devLog('[Bot Turn] selected move', {
          turn: activeTurn,
          from: decision.move.from,
          to: decision.move.to,
          captured: decision.move.captured,
          score: decision.score,
          reason: decision.reason,
        });

        const executionLabel = roomMode === 'online'
          ? '[Bot Turn] host submitting online move'
          : '[Bot Turn] running locally';
        const moveId = roomMode === 'online'
          ? submitOnlineBotMove(piece, decision.move.to.x, decision.move.to.y)
          : executeLocalBotMove(piece, decision.move.to.x, decision.move.to.y);
        devLog(executionLabel, {
          moveId,
          turn: activeTurn,
          from: decision.move.from,
          to: decision.move.to,
        });
      } finally {
        botTimerRef.current = null;
        setIsBotThinking(false);
      }
    }, delay);

    return () => {
      if (botTimerRef.current) {
        clearTimeout(botTimerRef.current);
        botTimerRef.current = null;
      }
    };
  }, [turn, controlModes, winner, roomMode, isHost, playerFaction, piecesCount, turnRef, winnerRef, controlModesRef, configRef, piecesRef, eliminatedRef, executeLocalBotMove, submitOnlineBotMove, advanceAfterNoLegalMove, setStatus, setLastBotDecision]);

  return { isBotThinking };
}
