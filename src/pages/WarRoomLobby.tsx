import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  ChevronLeft, 
  Copy, 
  Check, 
  User, 
  Bot, 
  Trash2, 
  Play, 
  Info,
  Shield,
  Loader2,
  Sword,
  ShieldAlert
} from 'lucide-react';
import { getWarRoom, saveWarRoom, WarRoom, RoomFactionSlot, mapWarRoomToMatchSetup, validateWarRoom, normalizeRoomCode } from '@/src/storage/warRooms';
import { Faction, BotDifficulty } from '@/src/rules/classicThreeKingdomRules';
import { cn } from '@/src/lib/utils';
import { useMatchContext } from '@/src/context/MatchContext';
import { onlineRoomClient } from '@/src/services/onlineRoomClient';
import { OnlineWarRoom } from '@/server/protocol';
import { DEFAULT_GAME_MODE, GAME_MODE_META, normalizeGameMode } from '@/shared/gameModes';
import {
  clearAllOnlineSessions,
  readOnlineRoomSession,
  saveOnlineMatchSession,
  saveOnlineRoomSession,
} from '@/src/services/onlineSessionStorage';
const AUTHENTIC_DISABLED_MESSAGE =
  'Modern 3K is local-only. Start it from /setup?mode=authentic.';

const FACTIONS: Faction[] = ['Shu', 'Wei', 'Wu'];
const FACTION_COLORS = {
  Shu: 'border-rose-500/30 text-rose-500 bg-rose-500/5',
  Wei: 'border-blue-500/30 text-blue-500 bg-blue-500/5',
  Wu: 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5'
};

function fallbackCopyText(value: string) {
  if (typeof document === 'undefined') {
    return false;
  }

  const textArea = document.createElement('textarea');
  textArea.value = value;
  textArea.setAttribute('readonly', '');
  textArea.style.position = 'absolute';
  textArea.style.left = '-9999px';
  document.body.appendChild(textArea);
  textArea.select();
  textArea.setSelectionRange(0, value.length);

  try {
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    document.body.removeChild(textArea);
  }
}

export default function WarRoomLobby() {
  const recoveryTimeoutMs = 8000;
  const { roomCode: rawCode } = useParams<{ roomCode: string }>();
  const roomCode = rawCode ? normalizeRoomCode(rawCode) : undefined;
  const navigate = useNavigate();
  const location = useLocation();
  const { updateConfig } = useMatchContext();
  const persistedRoomSession = roomCode ? readOnlineRoomSession() : null;
  const [commanderName] = useState(() => {
    const stateName = ((location.state as any)?.playerName || "").trim();
    if (stateName) return stateName;
    if (persistedRoomSession?.roomCode === roomCode && persistedRoomSession.playerName.trim()) {
      return persistedRoomSession.playerName.trim();
    }
    return (localStorage.getItem('last_commander_name') || "Commander").trim() || "Commander";
  });
  
  const [room, setRoom] = useState<WarRoom | OnlineWarRoom | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roomMode, setRoomMode] = useState<'local' | 'online'>(
    ((location.state as any)?.mode || (persistedRoomSession?.roomCode === roomCode ? 'online' : 'local')) as 'local' | 'online'
  );
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(roomMode === 'online');
  const [diagnostics, setDiagnostics] = useState<{ socketId?: string; lastEvent?: string } | null>(null);
  const requestedGameMode = normalizeGameMode(
    (location.state as any)?.gameMode ?? (persistedRoomSession?.roomCode === roomCode ? persistedRoomSession.gameMode : undefined),
    DEFAULT_GAME_MODE
  );

  useEffect(() => {
    if (!roomCode) return;
    setIsLoading(true);
    setDiagnostics({ socketId: onlineRoomClient.socketId });

    if (roomMode === 'online') {
      const wsUrl = (import.meta as any).env.VITE_WS_URL;
      if (!wsUrl) {
        const localFound = getWarRoom(roomCode || "");
        if (localFound) {
           setError("WebSocket unavailable. Falling back to the local room on this device.");
           setRoomMode('local');
        } else {
           setError("WebSocket unavailable. This Classic room is not stored on this device.");
           setIsLoading(false);
        }
        return;
      }

      onlineRoomClient.connect();
      setIsConnected(onlineRoomClient.isConnected);
      setIsReconnecting(true);
      let recoveryTimeout: ReturnType<typeof setTimeout> | null = null;

      const clearRecoveryTimeout = () => {
        if (recoveryTimeout) {
          clearTimeout(recoveryTimeout);
          recoveryTimeout = null;
        }
      };

      const armRecoveryTimeout = () => {
        if (recoveryTimeout) {
          return;
        }
        recoveryTimeout = setTimeout(() => {
          setError('Cannot connect to Classic online room.');
          setIsConnected(false);
          setIsReconnecting(false);
          setIsLoading(false);
          setDiagnostics(prev => ({ ...prev, lastEvent: 'TIMEOUT' }));
        }, recoveryTimeoutMs);
      };

      const recoverRoom = () => {
        armRecoveryTimeout();
        onlineRoomClient.requestRoomSnapshot({ roomCode, playerName: commanderName });
      };

      armRecoveryTimeout();

      const unsubState = onlineRoomClient.subscribeToRoomState((newRoom) => {
        if (newRoom.roomCode === roomCode) {
          clearRecoveryTimeout();
          setRoom(newRoom);
          setIsConnected(true);
          setIsReconnecting(false);
          setError(null);
          setIsLoading(false);
          saveOnlineRoomSession({
            roomCode: newRoom.roomCode,
            playerName: commanderName,
            roomMode: 'online',
            gameMode: normalizeGameMode((newRoom as any).roomRules?.gameMode, requestedGameMode),
          });
          setDiagnostics(prev => ({ ...prev, socketId: onlineRoomClient.socketId, lastEvent: 'ROOM_STATE' }));
        }
      });

      const unsubSnapshot = onlineRoomClient.subscribeToRoomSnapshot((snapshot) => {
        if (snapshot.room.roomCode !== roomCode) {
          return;
        }

        clearRecoveryTimeout();
        setRoom(snapshot.room);
        setRoomMode('online');
        setIsConnected(true);
        setIsReconnecting(false);
        setError(null);
        setIsLoading(false);
        saveOnlineRoomSession({
          roomCode: snapshot.room.roomCode,
          playerName: commanderName,
          roomMode: 'online',
          gameMode: normalizeGameMode((snapshot.room as any).roomRules?.gameMode, requestedGameMode),
        });
        if (snapshot.assignedFaction) {
          saveOnlineMatchSession({
            roomCode: snapshot.room.roomCode,
            playerName: commanderName,
            roomMode: 'online',
            gameMode: normalizeGameMode((snapshot.room as any).roomRules?.gameMode, requestedGameMode),
            playerFaction: snapshot.assignedFaction,
            isHost: snapshot.isHost,
          });
        }
        setDiagnostics(prev => ({ ...prev, socketId: onlineRoomClient.socketId, lastEvent: 'ROOM_SNAPSHOT' }));
      });

      const unsubError = onlineRoomClient.subscribeToErrors((err) => {
        clearRecoveryTimeout();
        if (err === 'ROOM_NOT_FOUND') {
          clearAllOnlineSessions();
          setRoom(null);
          setError('Room expired.');
        } else if (err === 'CANNOT_CONNECT') {
          setError('Cannot connect to Classic online room.');
        } else {
          setError(`Connection issue: ${err}`);
        }
        setIsConnected(false);
        setIsReconnecting(false);
        setIsLoading(false);
        setDiagnostics(prev => ({ ...prev, lastEvent: 'ERROR' }));
      });

      const unsubMatch = onlineRoomClient.subscribeToMatchStart((newRoom) => {
        if (newRoom.roomCode === roomCode) {
          setRoom(newRoom);
          setIsStarting(true);
          setDiagnostics(prev => ({ ...prev, lastEvent: 'MATCH_STARTED' }));
          const matchData = mapWarRoomToMatchSetup(newRoom as any);
          const gameMode = normalizeGameMode((newRoom as any).roomRules?.gameMode, requestedGameMode);
          setTimeout(() => {
            updateConfig(matchData);
            const localFaction = (Object.entries(newRoom.slots) as [Exclude<Faction, 'None'>, any][])
              .find(([, s]) => s.clientId === onlineRoomClient.socketId)?.[0] || null;
            const isHost = onlineRoomClient.socketId === newRoom.hostClientId;
            saveOnlineRoomSession({
              roomCode: newRoom.roomCode,
              playerName: commanderName,
              roomMode: 'online',
              gameMode,
            });
            saveOnlineMatchSession({
              roomCode: newRoom.roomCode,
              playerName: commanderName,
              roomMode: 'online',
              gameMode,
              playerFaction: localFaction || null,
              isHost,
            });
            navigate('/practice', { state: { roomCode: newRoom.roomCode, mode: 'online', playerFaction: localFaction, isHost, gameMode } });
          }, 1200);
        }
      });

      const unsubConnection = onlineRoomClient.subscribeToConnectionState((connected) => {
        setIsConnected(connected);
        if (!connected) {
          setIsReconnecting(true);
          armRecoveryTimeout();
          setDiagnostics(prev => ({ ...prev, lastEvent: 'DISCONNECTED' }));
          return;
        }

        clearRecoveryTimeout();
        setDiagnostics(prev => ({ ...prev, socketId: onlineRoomClient.socketId, lastEvent: 'CONNECTED' }));
        recoverRoom();
      });

      if ((import.meta as any).env.DEV) {
        console.log(`[Classic room sync] Requesting room snapshot: ${roomCode} for ${commanderName}`);
      }

      if (onlineRoomClient.isConnected) {
        recoverRoom();
      }

      return () => {
        clearRecoveryTimeout();
        unsubState();
        unsubSnapshot();
        unsubError();
        unsubMatch();
        unsubConnection();
      };
    } else {
      const found = getWarRoom(roomCode || "");
      if (found) {
        const validation = validateWarRoom(found);
        if (!validation.valid) {
          setError(`Room data issue: ${validation.errors[0]}`);
          setRoom(found);
          setIsReconnecting(false);
          setIsLoading(false);
          return;
        }
        setRoom(found);
        setIsReconnecting(false);
        setIsLoading(false);
      } else {
        const wsUrl = (import.meta as any).env.VITE_WS_URL;
        if (!wsUrl) {
            setError("Room not found on this device, and WebSocket is unavailable.");
            setIsLoading(false);
        } else {
            setError("Room not found locally. Checking Classic online rooms...");
            setRoomMode('online');
            // Effect will re-run with online mode
        }
      }
    }
  }, [roomCode, roomMode, commanderName]);

  const activeGameMode = normalizeGameMode((room as any)?.roomRules?.gameMode, requestedGameMode);
  const connectionStatus = roomMode !== 'online'
    ? 'Local'
    : error === 'Room expired.'
      ? 'Room expired'
    : error === 'Cannot connect to Classic online room.'
        ? 'Cannot connect'
        : isReconnecting
          ? 'Reconnecting...'
          : isConnected
            ? 'Connected'
            : 'Cannot connect';
  const connectionStatusClassName = roomMode !== 'online'
    ? 'border-white/10 bg-white/5 text-zinc-300'
    : error === 'Room expired.'
      ? 'border-rose-500/20 bg-rose-500/10 text-rose-400'
      : error === 'Cannot connect to Classic online room.'
        ? 'border-amber-500/20 bg-amber-500/10 text-amber-300'
        : isReconnecting
          ? 'border-gold/20 bg-gold/10 text-gold'
          : isConnected
          ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
            : 'border-amber-500/20 bg-amber-500/10 text-amber-300';
  const inviteLink = roomCode && typeof window !== 'undefined' ? `${window.location.origin}/rooms/${roomCode}` : '';
  const inviteText = inviteLink ? `Join my Three Kingdoms Chess room: ${inviteLink}` : '';

  const writeToClipboard = async (value: string) => {
    if (!value) {
      return false;
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(value);
        return true;
      } catch {
        // Fall through to execCommand fallback.
      }
    }

    return fallbackCopyText(value);
  };

  const handleCopyCode = async () => {
    if (!room?.roomCode) {
      return;
    }

    const success = await writeToClipboard(room.roomCode);
    if (success) {
      setCopiedCode(true);
      setCopiedInvite(false);
      setCopyFeedback('Room code copied. Share it directly or send the invite link.');
      window.setTimeout(() => setCopiedCode(false), 2000);
      return;
    }

    setCopyFeedback('Clipboard unavailable. Copy the room code manually.');
  };

  const handleCopyInviteLink = async () => {
    if (!inviteLink) {
      return;
    }

    const success = await writeToClipboard(inviteLink);
    if (success) {
      setCopiedInvite(true);
      setCopiedCode(false);
      setCopyFeedback('Invite link copied. Send it to the other commanders.');
      window.setTimeout(() => setCopiedInvite(false), 2200);
      return;
    }

    setCopyFeedback('Clipboard unavailable. Copy the invite link manually.');
  };

  const updateSlot = (faction: Faction, updates: Partial<RoomFactionSlot>) => {
    if (!room) return;
    setError(null);

    if (roomMode === 'online') {
      if (updates.occupantType === 'human' && updates.playerName) {
        onlineRoomClient.joinSlot({ roomCode: room.roomCode, faction: faction as any, playerName: updates.playerName });
      } else if (updates.occupantType === 'empty') {
        onlineRoomClient.leaveSlot({ roomCode: room.roomCode, faction: faction as any });
      } else if (updates.ready !== undefined) {
        onlineRoomClient.setReady({ roomCode: room.roomCode, faction: faction as any, ready: updates.ready });
      }
      return;
    }

    const updated = { ...room };
    updated.slots[faction as Exclude<Faction, 'None'>] = { ...updated.slots[faction as Exclude<Faction, 'None'>], ...updates } as any;
    saveWarRoom(updated as WarRoom);
    setRoom(updated);
  };

  const addBot = (faction: Faction) => {
    if (room && !room.roomRules.allowBots) {
      setError("Bots are not allowed in this Classic online room.");
      return;
    }

    if (roomMode === 'online' && room) {
      onlineRoomClient.addBot({ 
        roomCode: room.roomCode, 
        faction: faction as any, 
        difficulty: room.roomRules.botDifficultyDefault 
      });
      return;
    }

    updateSlot(faction, {
      occupantType: 'bot',
      botDifficulty: room?.roomRules.botDifficultyDefault || 'normal',
      ready: true
    });
  };

  const removeOccupant = (faction: Faction) => {
    if (roomMode === 'online' && room) {
      const slot = (room.slots as any)[faction];
      if (slot.occupantType === 'bot') {
        onlineRoomClient.removeBot({ roomCode: room.roomCode, faction: faction as any });
      } else {
        onlineRoomClient.leaveSlot({ roomCode: room.roomCode, faction: faction as any });
      }
      return;
    }

    updateSlot(faction, {
      occupantType: 'empty',
      playerName: undefined,
      botDifficulty: undefined,
      ready: false
    });
  };

  const toggleReady = (faction: Faction) => {
    if (!room) return;
    const slot = (room.slots as any)[faction];
    if (slot.occupantType === 'human') {
        updateSlot(faction, { ready: !slot.ready });
    }
  };

  const claimedFaction = roomMode === 'online' && room
    ? FACTIONS.find(f => (room as OnlineWarRoom).slots[f].clientId === onlineRoomClient.socketId) || null
    : null;

  const claimSlot = (faction: Faction) => {
    if (roomMode === 'online' && claimedFaction) {
      setError(`Strategic Assignment Locked: You already command ${claimedFaction}.`);
      return;
    }

    updateSlot(faction, {
      occupantType: 'human',
      playerName: roomMode === 'online' ? commanderName : localStorage.getItem('last_commander_name') || 'Local Recruit',
      ready: false,
    });
  };

  const currentUserIsHost = roomMode === 'online' ? !!room && (room as OnlineWarRoom).hostClientId === onlineRoomClient.socketId : true;
  const slotEntries = room ? FACTIONS.map((faction) => room.slots[faction as Exclude<Faction, 'None'>]) : [];
  const claimedCount = slotEntries.filter((slot) => slot.occupantType !== 'empty').length;
  const readyCount = slotEntries.filter((slot) => slot.ready).length;
  const emptyCount = FACTIONS.length - claimedCount;
  const canStart = room && FACTIONS.every(f => (room.slots as any)[f].occupantType !== 'empty' && (room.slots as any)[f].ready);
  const waitingTitle = canStart
    ? currentUserIsHost
      ? 'All commanders ready'
      : 'Awaiting host start'
    : 'Waiting for commanders';
  const waitingDetail = canStart
    ? currentUserIsHost
      ? 'All three kingdoms are occupied and ready. The host can begin the match.'
      : 'All three kingdoms are occupied and ready. Waiting for the host to start.'
    : `${claimedCount}/3 claimed, ${readyCount}/3 ready, ${emptyCount} empty. Claim a slot and declare readiness to begin.`;

  const startMatch = () => {
    if (!canStart || !room) return;
    if (activeGameMode === 'authentic') {
      setError(AUTHENTIC_DISABLED_MESSAGE);
      return;
    }
    setIsStarting(true);
    setError(null);

    if (roomMode === 'online') {
      onlineRoomClient.startMatch(room.roomCode);
      return;
    }

    try {
        const matchData = mapWarRoomToMatchSetup(room as WarRoom);
        
        // Set persistence to "Playing"
        const updated = { ...room, status: 'playing' as const };
        saveWarRoom(updated as WarRoom);

        // UI delay for dramatic effect
        setTimeout(() => {
            updateConfig(matchData);
            navigate('/practice', { state: { roomCode: room.roomCode, mode: 'local', gameMode: matchData.gameMode } });
        }, 1200);
    } catch (err: any) {
        setIsStarting(false);
        setError(err.message || "Failed to initialize tactical sequence.");
    }
  };

  const isMySlot = (faction: Faction) => {
    if (roomMode !== 'online') return true; // In local, you control all
    const slot = (room as OnlineWarRoom).slots[faction as Exclude<Faction, 'None'>];
    return slot.clientId === onlineRoomClient.socketId;
  };

  if (isLoading && !room) {
    return (
      <div className="pt-24 min-h-screen flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-4 border-gold/20 border-t-gold animate-spin" />
          <Sword className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gold animate-pulse" size={32} />
        </div>
        <div className="text-center">
            <h2 className="text-2xl font-serif font-black text-white tracking-[0.3em] uppercase mb-2">Synchronizing War Room</h2>
            <p className="text-zinc-500 font-serif italic uppercase text-[10px] tracking-widest animate-pulse">
              {isReconnecting ? 'Reconnecting...' : 'Connecting...'}
            </p>
        </div>
      </div>
    );
  }

  if (!room && error) {
    const title = error === 'Room expired.' ? 'Room Expired' : error === 'Cannot connect to Classic online room.' ? 'Cannot Connect' : 'Tactical Breach';
    return (
      <div className="pt-24 min-h-screen flex flex-col items-center justify-center p-6">
         <div className="glass-dark border border-rose-500/20 p-12 rounded-[3rem] max-w-md w-full text-center space-y-8">
            <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500 mx-auto border border-rose-500/20">
               <ShieldAlert size={40} />
            </div>
            <div className="space-y-2">
               <h2 className="text-white text-2xl font-serif font-black uppercase tracking-widest">{title}</h2>
               <p className="text-zinc-500 text-xs font-serif italic leading-relaxed">{error}</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => window.location.reload()}
                className="block w-full bg-gold/10 hover:bg-gold text-gold hover:text-black py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest border border-gold/20 transition-all"
              >
                 Try Again
              </button>
              <Link 
                to="/rooms" 
                className="block w-full bg-white/5 hover:bg-white/10 text-white py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest border border-white/5 transition-all"
              >
                 Return to Council
              </Link>
              <Link 
                to="/rooms/create?mode=classic"
                className="block w-full bg-gold/10 hover:bg-gold text-gold hover:text-black py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest border border-gold/20 transition-all"
              >
                 Create New Classic Room
              </Link>
              <Link 
                to="/"
                className="block w-full bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest border border-white/5 transition-all"
              >
                 Return Home
              </Link>
            </div>
         </div>
      </div>
    );
  }

  if (!room) return null;

  return (
    <div className="pt-24 min-h-screen container mx-auto px-4 pb-12 sm:px-6 flex flex-col gap-8 sm:gap-10">
      {/* Header Area */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link to="/rooms" className="flex items-center gap-2 text-gold hover:text-white transition-colors text-xs font-bold uppercase tracking-widest mb-4">
            <ChevronLeft size={16} /> Retreat to Council
          </Link>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <h1 className="text-3xl font-serif font-black tracking-[0.14em] text-white sm:text-4xl md:text-5xl md:tracking-widest">
                LOBBY: <span data-testid="room-code-display" className="text-gold italic uppercase">{room.roomCode}</span>
            </h1>
          </div>
        </div>

        <div className="flex w-full flex-col items-start lg:w-auto lg:items-end">
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.4em] mb-2">Host Protocol</div>
            <div className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 lg:w-auto">
                <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold border border-gold/30">
                    <User size={14} />
                </div>
                <div>
                   <p className="text-white text-xs font-serif font-bold italic">{room.hostName}</p>
                   <p className="text-[8px] text-zinc-600 uppercase tracking-widest">Lord Commander</p>
                </div>
            </div>
            <div className={cn("mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[0.22em]", connectionStatusClassName)}>
              <span>{connectionStatus}</span>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:gap-8">
        <div
          data-testid="room-invite-card"
          className="flex flex-col gap-5 rounded-[2rem] border border-gold/10 bg-gold/[0.04] p-5 shadow-2xl sm:rounded-[3rem] sm:p-8"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-zinc-500">Invite Commanders</span>
              <h2 className="mt-2 text-2xl font-serif font-black uppercase tracking-[0.12em] text-white">
                Share this Classic room
              </h2>
              <p className="mt-3 max-w-2xl text-sm font-serif italic leading-relaxed text-zinc-400">
                Send the room code or the full invite link. Opening the link does not auto-claim a faction slot.
              </p>
            </div>
            <div className="rounded-2xl border border-gold/15 bg-black/20 px-4 py-3 text-center">
              <span className="block text-[8px] font-bold uppercase tracking-[0.3em] text-zinc-500">Room Code</span>
              <span className="mt-1 block font-mono text-lg font-black uppercase tracking-[0.24em] text-gold">
                {room.roomCode}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
            <div className="min-w-0 rounded-[1.5rem] border border-white/8 bg-white/[0.03] px-4 py-4">
              <span className="block text-[8px] font-bold uppercase tracking-[0.28em] text-zinc-500">Invite Helper</span>
              <p className="mt-2 text-sm text-zinc-300">{inviteText}</p>
            </div>
            <div className="min-w-0 rounded-[1.5rem] border border-white/8 bg-white/[0.03] px-4 py-4">
              <span className="block text-[8px] font-bold uppercase tracking-[0.28em] text-zinc-500">Invite Link</span>
              <p className="mt-2 break-all font-mono text-sm text-zinc-300">{inviteLink}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleCopyCode}
              data-testid="copy-room-code-button"
              aria-label="Copy Classic room code"
              title="Copy Classic room code"
              className="flex flex-1 items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-[10px] font-bold uppercase tracking-[0.28em] text-gold transition-all hover:bg-white/10 active:scale-[0.98]"
            >
              {copiedCode ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
              {copiedCode ? 'Copied!' : 'Copy Code'}
            </button>
            <button
              type="button"
              onClick={handleCopyInviteLink}
              data-testid="copy-invite-link-button"
              aria-label="Copy full Classic room invite link"
              title="Copy full Classic room invite link"
              className="flex flex-1 items-center justify-center gap-3 rounded-2xl border border-gold/15 bg-gold/10 px-5 py-4 text-[10px] font-bold uppercase tracking-[0.24em] text-gold transition-all hover:bg-gold hover:text-black active:scale-[0.98]"
            >
              {copiedInvite ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
              {copiedInvite ? 'Invite link copied!' : 'Copy Invite Link'}
            </button>
          </div>

          <div className="rounded-[1.4rem] border border-white/6 bg-black/20 px-4 py-4">
            <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-zinc-500">Share Note</p>
            <p className="mt-2 text-sm font-serif italic leading-relaxed text-zinc-400">
              Friends can join from the Join Room page with the code or paste the full invite link directly.
            </p>
            {copyFeedback && (
              <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-gold">
                {copyFeedback}
              </p>
            )}
          </div>
        </div>

        <div
          data-testid="lobby-waiting-status"
          className="flex flex-col gap-5 rounded-[2rem] border border-white/6 bg-white/[0.03] p-5 shadow-2xl sm:rounded-[3rem] sm:p-8"
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-zinc-500">Waiting State</span>
            <h2 className="mt-2 text-2xl font-serif font-black uppercase tracking-[0.12em] text-white">
              {waitingTitle}
            </h2>
            <p className="mt-3 text-sm font-serif italic leading-relaxed text-zinc-400">
              {waitingDetail}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-[1.4rem] border border-white/8 bg-black/20 px-3 py-4 text-center">
              <span className="block text-[8px] font-bold uppercase tracking-[0.24em] text-zinc-500">Claimed</span>
              <span data-testid="claimed-slot-count" className="mt-2 block text-2xl font-black text-white">{claimedCount}</span>
            </div>
            <div className="rounded-[1.4rem] border border-white/8 bg-black/20 px-3 py-4 text-center">
              <span className="block text-[8px] font-bold uppercase tracking-[0.24em] text-zinc-500">Ready</span>
              <span data-testid="ready-player-count" className="mt-2 block text-2xl font-black text-white">{readyCount}</span>
            </div>
            <div className="rounded-[1.4rem] border border-white/8 bg-black/20 px-3 py-4 text-center">
              <span className="block text-[8px] font-bold uppercase tracking-[0.24em] text-zinc-500">Empty</span>
              <span className="mt-2 block text-2xl font-black text-white">{emptyCount}</span>
            </div>
          </div>

          <div className="space-y-3">
            {FACTIONS.map((faction) => {
              const slot = room.slots[faction as Exclude<Faction, 'None'>];
              const statusLabel =
                slot.occupantType === 'empty'
                  ? 'Empty'
                  : slot.occupantType === 'bot'
                    ? `Bot / ${slot.ready ? 'Ready' : 'Preparing'}`
                    : `Human / ${slot.ready ? 'Ready' : 'Preparing'}`;

              return (
                <div key={`summary-${faction}`} className="flex flex-col gap-2 rounded-[1.25rem] border border-white/6 bg-white/[0.02] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn('h-2.5 w-2.5 rounded-full', faction === 'Shu' ? 'bg-rose-400' : faction === 'Wei' ? 'bg-blue-400' : 'bg-emerald-400')} />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white">{faction}</p>
                      <p className="text-[10px] text-zinc-500">{slot.playerName || (slot.occupantType === 'bot' ? `Bot (${slot.botDifficulty})` : 'No commander')}</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-400">{statusLabel}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content: The Faction Slots */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
        {FACTIONS.map((fct) => {
          const slot = room.slots[fct];
          const isOccupied = slot.occupantType !== 'empty';
          const canIControl = isMySlot(fct);
          const isHost = currentUserIsHost;

          return (
            <div key={fct} className={cn(
              "group relative flex min-h-[380px] flex-col rounded-[2rem] border p-5 transition-all duration-500 hover:scale-[1.02] glass-dark sm:min-h-[420px] sm:rounded-[3rem] sm:p-8 xl:min-h-[450px] xl:rounded-[4rem] xl:p-10",
              isOccupied ? FACTION_COLORS[slot.faction] : "border-white/5 text-zinc-500 grayscale opacity-60 hover:grayscale-0 hover:opacity-100"
            )}
            data-testid={`faction-slot-${fct.toLowerCase()}`}>
              {/* Background Crest (Subtle) */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[15rem] font-serif font-black opacity-[0.02] pointer-events-none select-none">
                {fct[0]}
              </div>

              <div className="flex justify-between items-start mb-12 relative z-10">
                <div>
                  <h3 className="text-4xl font-serif font-black uppercase tracking-tighter mb-1 select-none">{fct}</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Kingdom Front</span>
                  </div>
                </div>
                <div className="w-14 h-14 rounded-2xl border-2 border-current/20 flex items-center justify-center font-black font-serif text-2xl transition-all group-hover:bg-white/5 group-hover:border-current/40 group-hover:rotate-12">
                   {fct[0]}
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-center items-center gap-8 relative z-10">
                 <AnimatePresence mode="wait">
                    {slot.occupantType === 'empty' ? (
                       <motion.div 
                         initial={{ opacity: 0, scale: 0.95 }}
                         animate={{ opacity: 1, scale: 1 }}
                         exit={{ opacity: 0, scale: 0.95 }}
                         className="flex flex-col items-center gap-8 w-full"
                       >
                          <div className={cn(
                            "w-28 h-28 rounded-full border-2 border-dashed flex items-center justify-center transition-all duration-700",
                            "border-zinc-800 text-zinc-800 group-hover:border-zinc-600 group-hover:text-zinc-600 shadow-[inset_0_0_40px_rgba(0,0,0,0.2)]"
                          )}>
                             <User size={48} strokeWidth={1} />
                          </div>
                          <div className="flex flex-col gap-3 w-full px-2 sm:px-4">
                             <button 
                                onClick={() => claimSlot(fct)}
                                data-testid="claim-slot-button"
                                disabled={roomMode === 'online' && !!claimedFaction}
                                className="w-full bg-white/5 hover:bg-white/10 text-white py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] border border-white/5 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                             >
                                Claim Command
                             </button>
                             {(room.roomRules.allowBots && isHost) && (
                                <button 
                                   onClick={() => addBot(fct)}
                                   className="w-full bg-gold/10 hover:bg-gold text-gold hover:text-black py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] border border-gold/10 transition-all flex items-center justify-center gap-3 hover:scale-105 active:scale-95"
                                >
                                   <Bot size={18} /> Deploy Automata
                                </button>
                             )}
                          </div>
                       </motion.div>
                    ) : (
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className="flex flex-col items-center gap-8 w-full"
                        >
                           <div className="relative">
                              <motion.div 
                                animate={slot.ready ? { scale: [1, 1.05, 1] } : {}}
                                transition={{ duration: 2, repeat: Infinity }}
                                className={cn(
                                 "w-32 h-32 rounded-[3.5rem] flex items-center justify-center border-4 relative z-10 transition-all duration-500 shadow-2xl",
                                 slot.occupantType === 'human' ? "bg-gold/20 border-gold" : "bg-black/20 border-zinc-700"
                              )}>
                                 {slot.occupantType === 'human' ? <User size={56} strokeWidth={1} className="text-gold" /> : <Bot size={56} strokeWidth={1} className="text-zinc-500" />}
                              </motion.div>
                              <div className={cn(
                                 "absolute -bottom-3 -right-3 w-12 h-12 rounded-full flex items-center justify-center border-2 z-20 shadow-xl transition-all duration-500",
                                 slot.ready ? "bg-emerald-500 border-white text-white rotate-0" : "bg-zinc-800 border-zinc-700 text-zinc-500 rotate-12"
                              )}>
                                 {slot.ready ? <Check size={28} strokeWidth={3} /> : <Loader2 size={24} className="animate-spin" />}
                              </div>
                           </div>
 
                           <div className="text-center px-4">
                              <h4 className="text-white text-2xl font-serif font-black italic uppercase mb-1">{slot.playerName || `BOT (${slot.botDifficulty})`}</h4>
                              <div className="flex items-center justify-center gap-2">
                                <span className={cn(
                                  "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border",
                                  slot.ready ? "text-emerald-500 border-emerald-500/30" : "text-zinc-500 border-zinc-500/30"
                                )}>
                                  {slot.ready ? "SECURED" : "PREPARING"}
                                </span>
                              </div>
                           </div>
 
                           <div className="flex w-full flex-col gap-3 px-2 sm:flex-row sm:px-4">
                              {slot.occupantType === 'human' && canIControl && (
                                <button 
                                    onClick={() => toggleReady(fct)}
                                    data-testid="ready-toggle-button"
                                    className={cn(
                                      "w-full flex-[2] py-4 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all border shadow-lg hover:scale-105 active:scale-95",
                                      slot.ready 
                                        ? "bg-white/5 border-white/10 text-zinc-400 hover:text-white" 
                                        : "bg-gold text-black border-gold hover:bg-white"
                                    )}
                                >
                                    {slot.ready ? "Rescind" : "Declare Ready"}
                                </button>
                              )}
                              {(canIControl || (slot.occupantType === 'bot' && isHost)) && (
                                <button 
                                   onClick={() => removeOccupant(fct)}
                                   className="w-full flex-1 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white py-4 rounded-2xl transition-all border border-rose-500/20 flex items-center justify-center hover:scale-105 active:scale-95"
                                >
                                   <Trash2 size={18} />
                                </button>
                              )}
                           </div>
                        </motion.div>
                    )}
                 </AnimatePresence>
              </div>

              <div className="mt-10 pt-8 border-t border-current/10 relative z-10">
                 <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.3em] opacity-40">
                    <span>Protocol Status</span>
                    <span className={cn(
                      "font-black transition-colors duration-500",
                      slot.ready ? "opacity-100" : "animate-pulse"
                    )}>
                      {slot.ready ? "ENGAGED" : "VACANT"}
                    </span>
                 </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rules Summary & Controls */}
      <div className="flex flex-col gap-6 items-stretch pt-2 lg:flex-row lg:gap-8 lg:pt-4">
          <div className="flex flex-1 flex-col gap-6 rounded-[2rem] border border-white/5 bg-white/[0.02] p-5 shadow-2xl sm:rounded-[3rem] sm:p-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-8">
                  <div className="w-16 h-16 rounded-3xl bg-gold/10 flex items-center justify-center text-gold shrink-0 border border-gold/10">
                     <Shield size={32} />
                  </div>
                  <div className="grid flex-1 grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-12">
                      <div>
                          <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-widest block mb-1">Standard Of Rules</span>
                          <p className="text-white text-xs font-serif italic">{(room as any).roomRules.ruleset}</p>
                      </div>
                      <div>
                          <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-widest block mb-1">Campaign Mode</span>
                          <p className="text-white text-xs font-serif italic">{GAME_MODE_META[activeGameMode].shortLabel}</p>
                      </div>
                      <div>
                          <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-widest block mb-1">Strategic AI</span>
                          <p className="text-white text-xs font-serif italic">{room.roomRules.allowBots ? "Active" : "Forbidden"}</p>
                      </div>
                      <div>
                          <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-widest block mb-1">Winning Terms</span>
                          <p className="text-white text-xs font-serif italic">Last General Standing</p>
                      </div>
                      <div className="col-span-2 md:col-span-1">
                          <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-widest block mb-1">Intelligence Floor</span>
                          <p className="text-white text-xs font-serif italic uppercase">{room.roomRules.botDifficultyDefault}</p>
                      </div>
                  </div>
              </div>

              {roomMode === 'online' && diagnostics && (
                <div className="grid grid-cols-1 gap-4 border-t border-white/5 pt-4 sm:grid-cols-2">
                    <div>
                        <span className="text-[7px] text-zinc-600 uppercase font-bold tracking-widest block mb-1">Commander Signal (Socket ID)</span>
                        <p className="text-zinc-500 text-[9px] font-mono truncate">{diagnostics.socketId || 'Negotiating...'}</p>
                    </div>
                    <div>
                        <span className="text-[7px] text-zinc-600 uppercase font-bold tracking-widest block mb-1">Last Intelligence (Event)</span>
                        <p className="text-zinc-300 text-[9px] font-mono uppercase">{diagnostics.lastEvent || 'Await...'}</p>
                    </div>
                </div>
              )}
          </div>

          <div className="flex w-full flex-col justify-center lg:w-96">
              <AnimatePresence mode="wait">
                  {isReconnecting && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-gold/10 border border-gold/20 text-gold p-4 rounded-2xl mb-4 flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest"
                    >
                        <Loader2 size={16} className="animate-spin" /> Reconnecting...
                    </motion.div>
                  )}
                  {error && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-4 rounded-2xl mb-4 flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest"
                    >
                        <ShieldAlert size={16} /> {error}
                    </motion.div>
                  )}
              </AnimatePresence>

              <button 
                onClick={startMatch}
                data-testid="start-match-button"
                disabled={!canStart || isStarting || activeGameMode === 'authentic'}
                className={cn(
                  "relative flex w-full items-center justify-center gap-4 overflow-hidden rounded-[2rem] border py-6 text-[11px] font-black uppercase tracking-[0.28em] transition-all sm:rounded-[3rem] sm:py-8 sm:text-sm sm:tracking-[0.5em]",
                  canStart && activeGameMode !== 'authentic'
                    ? "bg-gold text-black border-gold hover:bg-white shadow-[0_10px_40px_rgba(212,175,55,0.3)] hover:-translate-y-1" 
                    : "bg-white/5 border-white/5 text-zinc-700 cursor-not-allowed"
                )}
              >
                {isStarting ? (
                    <>
                        <Loader2 size={24} className="animate-spin" /> Incursion Active...
                    </>
                ) : (
                    <>
                        <Sword size={24} /> {activeGameMode === 'authentic' ? "Local Only" : canStart ? "Start Incursion" : "Awaiting Readiness"}
                    </>
                )}
                {canStart && !isStarting && activeGameMode !== 'authentic' && (
                    <div className="absolute inset-0 bg-white/20 animate-pulse-slow pointer-events-none" />
                )}
              </button>
              
              {!canStart && !isStarting && (
                <p className="text-center text-[9px] text-zinc-500 font-serif italic mt-4 uppercase tracking-[0.2em] opacity-60">
                   "All three kingdoms must be commanded before the war begins."
                </p>
              )}
          </div>
      </div>
    </div>
  );
}
