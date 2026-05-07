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
import { getWarRoom, saveWarRoom, WarRoom, RoomFactionSlot, mapWarRoomToMatchSetup, validateWarRoom } from '@/src/storage/warRooms';
import { Faction, BotDifficulty } from '@/src/rules/threeKingdomRules';
import { cn } from '@/src/lib/utils';
import { useMatchContext } from '@/src/context/MatchContext';
import { onlineRoomClient } from '@/src/services/onlineRoomClient';
import { OnlineWarRoom } from '@/server/protocol';

const FACTIONS: Faction[] = ['Shu', 'Wei', 'Wu'];
const FACTION_COLORS = {
  Shu: 'border-rose-500/30 text-rose-500 bg-rose-500/5',
  Wei: 'border-blue-500/30 text-blue-500 bg-blue-500/5',
  Wu: 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5'
};

export default function WarRoomLobby() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { updateConfig } = useMatchContext();
  
  const [room, setRoom] = useState<WarRoom | OnlineWarRoom | null>(null);
  const [copied, setCopied] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roomMode, setRoomMode] = useState<'local' | 'online'>((location.state as any)?.mode || 'local');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!roomCode) return;

    if (roomMode === 'online') {
      onlineRoomClient.connect();
      setIsConnected(onlineRoomClient.isConnected);

      const unsubState = onlineRoomClient.subscribeToRoomState((newRoom) => {
        setRoom(newRoom);
        setIsConnected(true);
      });

      const unsubError = onlineRoomClient.subscribeToErrors((err) => {
        setError(`Strategic Failure: ${err}`);
      });

      const unsubMatch = onlineRoomClient.subscribeToMatchStart((newRoom) => {
        setRoom(newRoom);
        setIsStarting(true);
        const matchData = mapWarRoomToMatchSetup(newRoom as any);
        setTimeout(() => {
          updateConfig(matchData);
          // Find which faction the local user is
          const localFaction = (Object.entries(newRoom.slots) as [Faction, any][]).find(([f, s]) => s.clientId === onlineRoomClient.socketId)?.[0];
          const isHost = onlineRoomClient.socketId === newRoom.hostClientId;
          navigate('/practice', { state: { roomCode: newRoom.roomCode, mode: 'online', playerFaction: localFaction, isHost } });
        }, 1200);
      });

      // Request initial state or join if re-entering
      const stateName = (location.state as any)?.playerName;
      if (stateName) {
        onlineRoomClient.joinRoom({ roomCode, playerName: stateName });
      }

      return () => {
        unsubState();
        unsubError();
        unsubMatch();
      };
    } else {
      const found = getWarRoom(roomCode);
      if (found) {
        const validation = validateWarRoom(found);
        if (!validation.valid) {
          setError(`Strategic Breach Detected: ${validation.errors[0]}`);
          setRoom(found);
          return;
        }
        setRoom(found);
        
        const stateName = (location.state as any)?.playerName;
        if (stateName) {
            const firstEmpty = FACTIONS.find(f => found.slots[f].occupantType === 'empty');
            if (firstEmpty) {
                const updated = { ...found };
                updated.slots[firstEmpty] = {
                    faction: firstEmpty,
                    occupantType: 'human',
                    playerName: stateName,
                    ready: false
                };
                saveWarRoom(updated);
                setRoom(updated);
            }
        }
      } else {
        navigate('/rooms');
      }
    }
  }, [roomCode, roomMode]);

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

  const canStart = room && FACTIONS.every(f => (room.slots as any)[f].occupantType !== 'empty' && (room.slots as any)[f].ready);

  const startMatch = () => {
    if (!canStart || !room) return;
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
            navigate('/practice', { state: { roomCode: room.roomCode, mode: 'local' } });
        }, 1200);
    } catch (err: any) {
        setIsStarting(false);
        setError(err.message || "Failed to initialize tactical sequence.");
    }
  };

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

          return (
            <div key={fct} className={cn(
              "group relative flex flex-col glass-dark border p-8 rounded-[3rem] transition-all min-h-[400px]",
              isOccupied ? FACTION_COLORS[slot.faction] : "border-white/5 text-zinc-500"
            )}>
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-3xl font-serif font-black uppercase tracking-tighter mb-1">{fct}</h3>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">Kingdom Front</span>
                </div>
                <div className="w-12 h-12 rounded-full border-2 border-current/20 flex items-center justify-center font-black font-serif text-xl opacity-30 group-hover:opacity-100 transition-opacity">
                   {fct[0]}
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-center items-center gap-6 relative">
                 <AnimatePresence mode="wait">
                    {slot.occupantType === 'empty' ? (
                       <motion.div 
                         initial={{ opacity: 0, scale: 0.9 }}
                         animate={{ opacity: 1, scale: 1 }}
                         exit={{ opacity: 0, scale: 0.9 }}
                         className="flex flex-col items-center gap-6 w-full"
                       >
                          <div className="w-20 h-20 rounded-full border-2 border-dashed border-zinc-800 flex items-center justify-center text-zinc-800">
                             <User size={32} />
                          </div>
                          <div className="flex flex-col gap-3 w-full">
                             <button 
                                onClick={() => updateSlot(fct, { occupantType: 'human', playerName: 'Local Recruit', ready: false })}
                                className="w-full bg-white/5 hover:bg-white/10 text-white py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] border border-white/5 transition-all"
                             >
                               Join Command
                             </button>
                             {room.roomRules.allowBots && (
                                <button 
                                   onClick={() => addBot(fct)}
                                   className="w-full bg-gold/10 hover:bg-gold/20 text-gold py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] border border-gold/10 transition-all flex items-center justify-center gap-2"
                                >
                                   <Bot size={14} /> Add tactical Bot
                                </button>
                             )}
                          </div>
                       </motion.div>
                    ) : (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex flex-col items-center gap-6 w-full"
                        >
                           <div className="relative">
                              <div className={cn(
                                 "w-24 h-24 rounded-full flex items-center justify-center border-4 relative z-10",
                                 slot.occupantType === 'human' ? "bg-gold/20 border-gold" : "bg-zinc-800/10 border-zinc-700"
                              )}>
                                 {slot.occupantType === 'human' ? <User size={40} className="text-gold" /> : <Bot size={40} className="text-zinc-500" />}
                              </div>
                              <div className={cn(
                                 "absolute -bottom-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center border-2 z-20",
                                 slot.ready ? "bg-emerald-500 border-white text-white" : "bg-zinc-800 border-zinc-700 text-zinc-500"
                              )}>
                                 {slot.ready ? <Check size={20} /> : <Loader2 size={20} className="animate-spin" />}
                              </div>
                           </div>

                           <div className="text-center">
                              <h4 className="text-white text-xl font-serif font-black italic uppercase">{slot.playerName || `BOT (${slot.botDifficulty})`}</h4>
                              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
                                {slot.occupantType === 'human' ? "Warrior Ready" : "Strategic Automata"}
                              </p>
                           </div>

                           <div className="flex gap-2 w-full">
                              {slot.occupantType === 'human' && (
                                <button 
                                    onClick={() => toggleReady(fct)}
                                    className="flex-1 bg-white/5 hover:bg-white/10 py-3 rounded-xl text-[8px] font-bold uppercase tracking-widest transition-all border border-white/5"
                                >
                                    {slot.ready ? "Unreadied" : "I am Ready"}
                                </button>
                              )}
                              <button 
                                 onClick={() => removeOccupant(fct)}
                                 className="bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white px-4 rounded-xl transition-all border border-rose-500/20"
                              >
                                 <Trash2 size={16} />
                              </button>
                           </div>
                        </motion.div>
                    )}
                 </AnimatePresence>
              </div>

              <div className="mt-8 pt-6 border-t border-current/10">
                 <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest opacity-40">
                    <span>Tactical Status</span>
                    <span className={slot.ready ? "text-emerald-500 opacity-100" : "text-current"}>
                      {slot.ready ? "SECURED" : "PENDING"}
                    </span>
                 </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rules Summary & Controls */}
      <div className="flex flex-col lg:flex-row gap-8 items-stretch pt-4">
          <div className="flex-1 bg-white/[0.02] border border-white/5 p-8 rounded-[3rem] flex items-center gap-8 shadow-2xl">
              <div className="w-16 h-16 rounded-3xl bg-gold/10 flex items-center justify-center text-gold shrink-0 border border-gold/10">
                 <Shield size={32} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-12 gap-y-4 flex-1">
                  <div>
                      <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-widest block mb-1">Standard Of Rules</span>
                      <p className="text-white text-xs font-serif italic">3K-Standard-V1</p>
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
                disabled={!canStart || isStarting}
                className={cn(
                  "w-full py-8 rounded-[3rem] font-black uppercase tracking-[0.5em] text-sm transition-all flex items-center justify-center gap-4 border overflow-hidden relative",
                  canStart 
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
                        <Sword size={24} /> {canStart ? "Start Incursion" : "Awaiting Readiness"}
                    </>
                )}
                {canStart && !isStarting && (
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
