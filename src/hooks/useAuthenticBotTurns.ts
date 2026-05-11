import React from 'react';
import { chooseAuthenticBotMove, type AuthenticBotDecision } from '@/src/ai/authenticBotAI';
import type { PlayerType } from '@/src/rules/classicThreeKingdomRules';
import type {
  AuthenticBoardState,
  AuthenticFaction,
} from '@/src/rules/authenticThreeKingdomRules';

type UseAuthenticBotTurnsParams = {
  enabled: boolean;
  gameState: AuthenticBoardState;
  controlModes: Record<AuthenticFaction, PlayerType>;
  executeBotMove: (decision: AuthenticBotDecision) => boolean;
  setStatus: React.Dispatch<React.SetStateAction<string>>;
};

export function useAuthenticBotTurns({
  enabled,
  gameState,
  controlModes,
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
    const activeControl = controlModes[activeTurn];

    if (!enabled || gameState.winner || activeControl !== 'Bot') {
      setIsBotThinking(false);
      return;
    }

    setIsBotThinking(true);
    setStatus(`${activeTurn} Bot thinking...`);

    timerRef.current = setTimeout(() => {
      try {
        const decision = chooseAuthenticBotMove(gameState, activeTurn);
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
  }, [enabled, gameState, controlModes, executeBotMove, setStatus]);

  return { isBotThinking };
}
