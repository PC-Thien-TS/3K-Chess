import React from 'react';
import { MatchSnapshotPayload } from '@/server/protocol';
import { Faction, MatchConfig, Piece, PlayerType } from '@/src/rules/classicThreeKingdomRules';
import { mapWarRoomToMatchSetup } from '@/src/storage/warRooms';
import { onlineRoomClient } from '@/src/services/onlineRoomClient';
import {
  clearAllOnlineSessions,
  PersistedOnlineMatchSession,
  saveOnlineMatchSession,
  saveOnlineRoomSession,
} from '@/src/services/onlineSessionStorage';
import { DEFAULT_GAME_MODE, normalizeGameMode } from '@/shared/gameModes';

type UseClassicOnlineSyncParams = {
  roomMode: 'local' | 'online';
  roomCode?: string;
  commanderName: string;
  setOnlineSession: React.Dispatch<React.SetStateAction<PersistedOnlineMatchSession | null>>;
  updateConfig: (newConfig: MatchConfig) => void;
  setControlModes: React.Dispatch<React.SetStateAction<Record<Faction, PlayerType>>>;
  clearSelection: () => void;
  setIsReconnecting: React.Dispatch<React.SetStateAction<boolean>>;
  setRoomExpired: React.Dispatch<React.SetStateAction<string | null>>;
  setLastSyncEvent: React.Dispatch<React.SetStateAction<string | null>>;
  setStatus: React.Dispatch<React.SetStateAction<string>>;
  setAppliedMoveIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  lastProcessedMoveIdRef: React.MutableRefObject<string | null>;
  appliedMoveIdsRef: React.MutableRefObject<Set<string>>;
  piecesRef: React.MutableRefObject<Piece[]>;
  applyRemoteMove: (piece: Piece, x: number, y: number, isBot: boolean, remoteMoveId: string) => void;
  hydrateServerState: (serverState?: {
    currentTurn: Exclude<Faction, 'None'>;
    moveNumber: number;
    eliminatedFactions: Exclude<Faction, 'None'>[];
    winner: Exclude<Faction, 'None'> | null;
    status: 'PLAYING' | 'FINISHED';
  }) => void;
  hydrateSnapshotState: (matchState: NonNullable<MatchSnapshotPayload['matchState']>) => void;
};

export function useClassicOnlineSync({
  roomMode,
  roomCode,
  commanderName,
  setOnlineSession,
  updateConfig,
  setControlModes,
  clearSelection,
  setIsReconnecting,
  setRoomExpired,
  setLastSyncEvent,
  setStatus,
  setAppliedMoveIds,
  lastProcessedMoveIdRef,
  appliedMoveIdsRef,
  piecesRef,
  applyRemoteMove,
  hydrateServerState,
  hydrateSnapshotState,
}: UseClassicOnlineSyncParams) {
  React.useEffect(() => {
    if (roomMode !== 'online') {
      return;
    }

    const wsUrl = (import.meta as any).env.VITE_WS_URL;
    if (!wsUrl) {
      setIsReconnecting(false);
      setLastSyncEvent('CANNOT_CONNECT');
      setStatus('WebSocket unavailable. Classic online requires a backend.');
      return;
    }

    const requestRecovery = () => {
      if (!roomCode) {
        return;
      }
      setIsReconnecting(true);
      setLastSyncEvent('REQUESTING_SNAPSHOT');
      setStatus('Reconnecting... restoring the live Classic match.');
      onlineRoomClient.requestMatchSnapshot({ roomCode, playerName: commanderName });
    };

    onlineRoomClient.connect();

    const unsubConnection = onlineRoomClient.subscribeToConnectionState((connected) => {
      if (!connected) {
        setIsReconnecting(true);
        setLastSyncEvent('DISCONNECTED');
        setStatus('Reconnecting... restoring the live Classic match.');
        return;
      }

      setLastSyncEvent('CONNECTED');
      requestRecovery();
    });

    const unsubSnapshot = onlineRoomClient.subscribeToMatchSnapshot((snapshot) => {
      if (snapshot.room.roomCode !== roomCode) {
        return;
      }

      const matchData = mapWarRoomToMatchSetup(snapshot.room as any);
      updateConfig(matchData);
      setControlModes({
        Shu: matchData.factions.Shu.control,
        Wei: matchData.factions.Wei.control,
        Wu: matchData.factions.Wu.control,
        None: matchData.factions.None.control,
      });

      const recoveredSession: PersistedOnlineMatchSession = {
        roomCode: snapshot.room.roomCode,
        playerName: commanderName,
        roomMode: 'online',
        gameMode: normalizeGameMode((snapshot.room as any).roomRules?.gameMode, DEFAULT_GAME_MODE),
        playerFaction: snapshot.assignedFaction,
        isHost: snapshot.isHost,
      };
      setOnlineSession(recoveredSession);
      saveOnlineRoomSession({
        roomCode: recoveredSession.roomCode,
        playerName: recoveredSession.playerName,
        roomMode: 'online',
        gameMode: recoveredSession.gameMode,
      });
      saveOnlineMatchSession(recoveredSession);

      clearSelection();
      setIsReconnecting(false);
      setRoomExpired(null);
      setLastSyncEvent('MATCH_SNAPSHOT');

      if (snapshot.matchState) {
        hydrateSnapshotState(snapshot.matchState);
        setAppliedMoveIds(new Set());
        lastProcessedMoveIdRef.current = null;
        setStatus(
          snapshot.matchState.winner
            ? `Recovered completed battle. ${snapshot.matchState.winner.toUpperCase()} holds the field.`
            : `Recovered live match state. ${snapshot.matchState.currentTurn} to move.`
        );
      } else {
        setStatus('Recovered room state. Awaiting match initialization.');
      }
    });

    const unsubMove = onlineRoomClient.subscribeToMove((payload) => {
      setLastSyncEvent('MOVE_RECEIVED');
      if (payload.move.id === lastProcessedMoveIdRef.current || appliedMoveIdsRef.current.has(payload.move.id)) {
        hydrateServerState(payload.serverState);
        if ((import.meta as any).env.DEV) {
          console.log(`[Strategic Sync] Skipping already applied move: ${payload.move.id}`);
        }
        return;
      }

      const piece = piecesRef.current.find((entry) => entry.x === payload.move.from.x && entry.y === payload.move.from.y);
      if (piece) {
        lastProcessedMoveIdRef.current = payload.move.id;
        setAppliedMoveIds((prev) => new Set(prev).add(payload.move.id));
        applyRemoteMove(piece, payload.move.to.x, payload.move.to.y, payload.move.id.startsWith('bot-'), payload.move.id);
        hydrateServerState(payload.serverState);
        return;
      }

      hydrateServerState(payload.serverState);
      setLastSyncEvent('MOVE_RESYNC');
      if (roomCode) {
        onlineRoomClient.requestMatchSnapshot({ roomCode, playerName: commanderName });
      }
    });

    const unsubError = onlineRoomClient.subscribeToErrors((error) => {
      if (error === 'ROOM_NOT_FOUND') {
        clearAllOnlineSessions();
        setRoomExpired('Room expired.');
        setIsReconnecting(false);
        setStatus('Room expired.');
        return;
      }

      if (error === 'CANNOT_CONNECT') {
        setIsReconnecting(false);
        setLastSyncEvent('CANNOT_CONNECT');
        setStatus('Cannot connect. Check the backend and retry.');
        return;
      }

      setLastSyncEvent('ERROR');
      setStatus(`Connection issue: ${error}`);
    });

    if (onlineRoomClient.isConnected) {
      requestRecovery();
    }

    return () => {
      unsubConnection();
      unsubSnapshot();
      unsubMove();
      unsubError();
    };
  }, [
    roomMode,
    roomCode,
    commanderName,
    setOnlineSession,
    updateConfig,
    setControlModes,
    clearSelection,
    setIsReconnecting,
    setRoomExpired,
    setLastSyncEvent,
    setStatus,
    setAppliedMoveIds,
    lastProcessedMoveIdRef,
    appliedMoveIdsRef,
    piecesRef,
    applyRemoteMove,
    hydrateServerState,
    hydrateSnapshotState,
  ]);
}
