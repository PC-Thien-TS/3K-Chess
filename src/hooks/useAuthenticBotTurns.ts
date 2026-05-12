import React from 'react';
import { chooseAuthenticBotMove, type AuthenticBotDecision } from '@/src/ai/authenticBotAI';
import type { BotDifficulty, PlayerType } from '@/src/rules/classicThreeKingdomRules';
import type {
  AuthenticBoardState,
  AuthenticFaction,
} from '@/src/rules/authenticThreeKingdomRules';

type UseAuthenticBotTurnsParams = {
  enabled: boolean;
  gameState: AuthenticBoardState;
  controlModes: Record<AuthenticFaction, PlayerType>;
  difficultyModes: Record<AuthenticFaction, BotDifficulty>;
  executeBotMove: (decision: AuthenticBotDecision) => boolean;
  setStatus: React.Dispatch<React.SetStateAction<string>>;
};

export function shouldScheduleAuthenticBotTurn({
  enabled,
  winner,
  activeTurn,
  controlModes,
}: {
  enabled: boolean;
  winner: AuthenticBoardState['winner'];
  activeTurn: AuthenticFaction;
  controlModes: Record<AuthenticFaction, PlayerType>;
}) {
  return enabled && !winner && controlModes[activeTurn] === 'Bot';
}

export function useAuthenticBotTurns({
  enabled,
  gameState,
  controlModes,
  difficultyModes,
  executeBotMove,
  setStatus,
}: UseAuthenticBotTurnsParams) {
  const [isBotThinking, setIsBotThinking] = React.useState(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const activeTurn = gameState.currentTurn;
    const shouldRun = shouldScheduleAuthenticBotTurn({
      enabled,
      winner: gameState.winner,
      activeTurn,
      controlModes,
    });

    if (!shouldRun) {
      setIsBotThinking(false);
      return;
    }

    setIsBotThinking(true);
    setStatus(`${activeTurn} Bot thinking...`);

    timerRef.current = setTimeout(() => {
      try {
        const decision = chooseAuthenticBotMove(gameState, activeTurn, difficultyModes[activeTurn]);
        if (!decision) {
          setStatus(`${activeTurn} Bot has no legal moves.`);
          return;
        }

        executeBotMove(decision);
      } finally {
        timerRef.current = null;
        setIsBotThinking(false);
      }
    }, 700);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [enabled, gameState, controlModes, difficultyModes, executeBotMove, setStatus]);

  return { isBotThinking };
}
