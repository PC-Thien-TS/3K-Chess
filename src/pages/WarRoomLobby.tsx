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
const AUTHENTIC_DISABLED_MESSAGE = 'Authentic Three Kingdoms mode is under construction.';

const FACTIONS: Faction[] = ['Shu', 'Wei', 'Wu'];
const FACTION_COLORS = {
  Shu: 'border-rose-500/30 text-rose-500 bg-rose-500/5',
  Wei: 'border-blue-500/30 text-blue-500 bg-blue-500/5',
  Wu: 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5'
};

export default function WarRoomLobby() {
  const { roomCode: rawCode } = useParams<{ roomCode: string }>();
  const roomCode = rawCode ? normalizeRoomCode(rawCode) : undefined;
  const navigate = useNavigate();
  const location = useLocation();
  const { updateConfig } = useMatchContext();
  const [commanderName] = useState(() => {
    const stateName = ((location.state as any)?.playerName || "").trim();
    if (stateName) return stateName;
    return (localStorage.getItem('last_commander_name') || "Commander").trim() || "Commander";
  });
  
  const [room, setRoom] = useState<WarRoom | OnlineWarRoom | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roomMode, setRoomMode] = useState<'local' | 'online'>((location.state as any)?.mode || 'local');
  const [isConnected, setIsConnected] = useState(false);
  const [diagnostics, setDiagnostics] = useState<{ socketId?: string; lastEvent?: string } | null>(null);
  const requestedGameMode = normalizeGameMode((location.state as any)?.gameMode, DEFAULT_GAME_MODE);

  useEffect(() => {
    if (!roomCode) return;
    setIsLoading(true);
    setDiagnostics({ socketId: onlineRoomClient.socketId });

    if (roomMode === 'online') {
      const wsUrl = (import.meta as any).env.VITE_WS_URL;
      if (!wsUrl) {
        const localFound = getWarRoom(roomCode || "");
        if (localFound) {
           setError("WebSocket server not configured. Reverting to Local Simulation of this chamber.");
           setRoomMode('local');
        } else {
           setError("Room not found in this browser. Local Simulation rooms are stored only on this device. Deploy WebSocket backend for real online joining.");
           setIsLoading(false);
        }
        return;
      }

      onlineRoomClient.connect();
      setIsConnected(onlineRoomClient.isConnected);

      const unsubState = onlineRoomClient.subscribeToRoomState((newRoom) => {
        if (newRoom.roomCode === roomCode) {
          setRoom(newRoom);
          setIsConnected(true);
          setIsLoading(false);
          setDiagnostics(prev => ({ ...prev, socketId: onlineRoomClient.socketId, lastEvent: 'ROOM_STATE' }));
        }
      });

      const unsubError = onlineRoomClient.subscribeToErrors((err) => {
        setError(`Strategic Failure: ${err}`);
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
            const localFaction = (Object.entries(newRoom.slots) as [Faction, any][]).find(([f, s]) => s.clientId === onlineRoomClient.socketId)?.[0];
            const isHost = onlineRoomClient.socketId === newRoom.hostClientId;
            navigate('/practice', { state: { roomCode: newRoom.roomCode, mode: 'online', playerFaction: localFaction, isHost, gameMode } });
          }, 1200);
        }
      });

      if ((import.meta as any).env.DEV) {
        console.log(`[Strategic Command] Synchronizing with Cloud Chamber: ${roomCode} for ${commanderName}`);
      }

      onlineRoomClient.joinRoom({ roomCode, playerName: commanderName });

      return () => {
        unsubState();
        unsubError();
        unsubMatch();
      };
    } else {
      const found = getWarRoom(roomCode || "");
      if (found) {
        const validation = validateWarRoom(found);
        if (!validation.valid) {
          setError(`Strategic Breach Detected: ${validation.errors[0]}`);
          setRoom(found);
          setIsLoading(false);
          return;
        }
        setRoom(found);
        setIsLoading(false);
        
        if (commanderName) {
            const firstEmpty = FACTIONS.find(f => found.slots[f].occupantType === 'empty');
            if (firstEmpty) {
                const updated = { ...found };
                updated.slots[firstEmpty] = {
                    faction: firstEmpty,
                    occupantType: 'human',
                    playerName: commanderName,
                    ready: false
                };
                saveWarRoom(updated);
                setRoom(updated);
            }
        }
      } else {
        const wsUrl = (import.meta as any).env.VITE_WS_URL;
        if (!wsUrl) {
            setError("Room not found in this browser. Local Simulation rooms are stored only on this device. Deploy WebSocket backend for real online joining.");
            setIsLoading(false);
        } else {
            setError("Chamber not found locally. Attempting to locate in cloud repositories...");
            setRoomMode('online');
            // Effect will re-run with online mode
        }
      }
    }
  }, [roomCode, roomMode, commanderName]);

  const activeGameMode = normalizeGameMode((room as any)?.roomRules?.gameMode, requestedGameMode);

  const handleCopyCode = () => {
    if (room?.roomCode) {
      navigator.clipboard.writeText(room.roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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
      setError("Strategic Automata are forbidden in this chamber.");
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

  const canStart = room && FACTIONS.every(f => (room.slots as any)[f].occupantType !== 'empty' && (room.slots as any)[f].ready);

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
            <p className="text-zinc-500 font-serif italic uppercase text-[10px] tracking-widest animate-pulse">Contacting Strategic Command...</p>
        </div>
      </div>
    );
  }

  if (!room && error) {
    return (
      <div className="pt-24 min-h-screen flex flex-col items-center justify-center p-6">
         <div className="glass-dark border border-rose-500/20 p-12 rounded-[3rem] max-w-md w-full text-center space-y-8">
            <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500 mx-auto border border-rose-500/20">
               <ShieldAlert size={40} />
            </div>
            <div className="space-y-2">
               <h2 className="text-white text-2xl font-serif font-black uppercase tracking-widest">Tactical Breach</h2>
               <p className="text-zinc-500 text-xs font-serif italic leading-relaxed">{error}</p>
            </div>
            <Link 
              to="/rooms" 
              className="block w-full bg-white/5 hover:bg-white/10 text-white py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest border border-white/5 transition-all"
            >
               Return to Council
            </Link>
         </div>
      </div>
    );
  }

  if (!room) return null;

  return (
    <div className="pt-24 min-h-screen container mx-auto px-6 pb-12 flex flex-col gap-10">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <Link to="/rooms" className="flex items-center gap-2 text-gold hover:text-white transition-colors text-xs font-bold uppercase tracking-widest mb-4">
            <ChevronLeft size={16} /> Retreat to Council
          </Link>
          <div className="flex items-center gap-4">
            <h1 className="text-4xl md:text-5xl font-serif font-black text-white tracking-widest">
                LOBBY: <span className="text-gold italic uppercase">{room.roomCode}</span>
            </h1>
            <button 
                onClick={handleCopyCode}
                className="bg-white/5 hover:bg-white/10 p-3 rounded-xl border border-white/10 transition-all text-gold flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest"
            >
                {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                {copied ? "Copied" : "Copy Code"}
            </button>
          </div>
        </div>

        <div className="flex flex-col items-end">
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.4em] mb-2">Host Protocol</div>
            <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold border border-gold/30">
                    <User size={14} />
                </div>
                <div>
                   <p className="text-white text-xs font-serif font-bold italic">{room.hostName}</p>
                   <p className="text-[8px] text-zinc-600 uppercase tracking-widest">Lord Commander</p>
                </div>
            </div>
        </div>
      </div>

      {/* Main Content: The Faction Slots */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {FACTIONS.map((fct) => {
          const slot = room.slots[fct];
          const isOccupied = slot.occupantType !== 'empty';
          const canIControl = isMySlot(fct);
          const isHost = roomMode === 'online' ? (room as OnlineWarRoom).hostClientId === onlineRoomClient.socketId : true;

          return (
            <div key={fct} className={cn(
              "group relative flex flex-col glass-dark border p-10 rounded-[4rem] transition-all duration-500 hover:scale-[1.02] min-h-[450px]",
              isOccupied ? FACTION_COLORS[slot.faction] : "border-white/5 text-zinc-500 grayscale opacity-60 hover:grayscale-0 hover:opacity-100"
            )}>
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
                          <div className="flex flex-col gap-4 w-full px-4">
                             <button 
                                onClick={() => claimSlot(fct)}
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
 
                           <div className="flex gap-3 w-full px-4">
                              {slot.occupantType === 'human' && canIControl && (
                                <button 
                                    onClick={() => toggleReady(fct)}
                                    className={cn(
                                      "flex-[2] py-4 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all border shadow-lg hover:scale-105 active:scale-95",
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
                                   className="flex-1 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white py-4 rounded-2xl transition-all border border-rose-500/20 flex items-center justify-center hover:scale-105 active:scale-95"
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
      <div className="flex flex-col lg:flex-row gap-8 items-stretch pt-4">
          <div className="flex-1 bg-white/[0.02] border border-white/5 p-8 rounded-[3rem] flex flex-col gap-6 shadow-2xl">
              <div className="flex items-center gap-8">
                  <div className="w-16 h-16 rounded-3xl bg-gold/10 flex items-center justify-center text-gold shrink-0 border border-gold/10">
                     <Shield size={32} />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-12 gap-y-4 flex-1">
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
                <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-4">
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

          <div className="w-full lg:w-96 flex flex-col justify-center">
              <AnimatePresence mode="wait">
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
                disabled={!canStart || isStarting || activeGameMode === 'authentic'}
                className={cn(
                  "w-full py-8 rounded-[3rem] font-black uppercase tracking-[0.5em] text-sm transition-all flex items-center justify-center gap-4 border overflow-hidden relative",
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
                        <Sword size={24} /> {activeGameMode === 'authentic' ? "Under Construction" : canStart ? "Start Incursion" : "Awaiting Readiness"}
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
