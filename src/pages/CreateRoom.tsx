import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Shield, Sword, User, Settings2, Zap } from 'lucide-react';
import { generateRoomCode, saveWarRoom, WarRoom, RoomFactionSlot } from '@/src/storage/warRooms';
import { Faction, BotDifficulty } from '@/src/rules/classicThreeKingdomRules';
import { cn } from '@/src/lib/utils';
import { onlineRoomClient } from '@/src/services/onlineRoomClient';
import { DEFAULT_GAME_MODE, GAME_MODE_META, GameMode, GAME_MODE_RULESETS, normalizeGameMode } from '@/shared/gameModes';
const AUTHENTIC_DISABLED_MESSAGE =
  'Modern 3K is local-only. Start it from /setup?mode=authentic.';
const BOT_DIFFICULTY_LABELS: Record<BotDifficulty, string> = {
  easy: 'Casual',
  normal: 'Tactical',
  hard: 'Aggressive',
};
const BOT_DIFFICULTY_NOTES: Record<BotDifficulty, string> = {
  easy: 'Lighter scoring and more variance.',
  normal: 'Balanced pressure and safer trades.',
  hard: 'Sharper heuristics and stronger king safety.',
};

export default function CreateRoom() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [hostName, setHostName] = useState(localStorage.getItem('last_commander_name') || "");
  const [selectedFaction, setSelectedFaction] = useState<Faction>('Shu');
  const [gameMode, setGameMode] = useState<GameMode>(normalizeGameMode(searchParams.get('mode'), DEFAULT_GAME_MODE));
  const [allowBots, setAllowBots] = useState(true);
  const [defaultDifficulty, setDefaultDifficulty] = useState<BotDifficulty>('normal');
  const wsUrlAvailable = !!(import.meta as any).env.VITE_WS_URL;
  const [roomMode, setRoomMode] = useState<'local' | 'online'>(wsUrlAvailable ? 'online' : 'local');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(gameMode === 'authentic' ? AUTHENTIC_DISABLED_MESSAGE : null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const name = hostName.trim();
    if (!name || isCreating) return;
    
    // Persist name
    localStorage.setItem('last_commander_name', name);
    
    if (gameMode === 'authentic') {
      setError(AUTHENTIC_DISABLED_MESSAGE);
      return;
    }

    setError(null);
    setIsCreating(true);

    if ((import.meta as any).env.DEV) {
      console.log(`[Strategic Command] Opening Chamber: Mode=${roomMode}, WS_Configured=${!!(import.meta as any).env.VITE_WS_URL}`);
    }

    const timeout = setTimeout(() => {
      if (isCreating) {
        setError("Creating the Classic room took too long. Please retry.");
        setIsCreating(false);
      }
    }, 5000);

    try {
      if (roomMode === 'online') {
        const wsUrl = (import.meta as any).env.VITE_WS_URL;
        if (!wsUrl) {
          clearTimeout(timeout);
          setError("WebSocket unavailable. Use Local Simulation or configure the backend.");
          setIsCreating(false);
          return;
        }

        onlineRoomClient.connect();
        
        const unsubscribeError = onlineRoomClient.subscribeToErrors((err) => {
          clearTimeout(timeout);
          setError(err === 'CANNOT_CONNECT' ? 'Cannot connect. Check the backend and retry.' : `Connection issue: ${err}`);
          setIsCreating(false);
          unsubscribeError();
        });

        const unsubscribeState = onlineRoomClient.subscribeToRoomState((room) => {
          clearTimeout(timeout);
          if ((import.meta as any).env.DEV) {
            console.log(`[Strategic Command] Online Chamber Synchronized: ${room.roomCode}`);
          }
          navigate(`/rooms/${room.roomCode}`, { state: { mode: 'online', playerName: name, gameMode } });
          setIsCreating(false);
          unsubscribeState();
          unsubscribeError();
        });

        onlineRoomClient.createRoom({
          hostName: name,
          preferredFaction: selectedFaction as any,
          gameMode,
          allowBots,
          botDifficultyDefault: defaultDifficulty as any
        });
        return;
      }

      // Local Simulation Mode
      const roomCode = generateRoomCode();
      if ((import.meta as any).env.DEV) {
        console.log(`[Strategic Command] Initializing Local Archive: ${roomCode}`);
      }
      
      const slots: Record<Exclude<Faction, 'None'>, RoomFactionSlot> = {
        Shu: { faction: 'Shu', occupantType: 'empty', ready: false },
        Wei: { faction: 'Wei', occupantType: 'empty', ready: false },
        Wu: { faction: 'Wu', occupantType: 'empty', ready: false }
      };

      slots[selectedFaction as Exclude<Faction, 'None'>] = {
        faction: selectedFaction as any,
        occupantType: 'human',
        playerName: name,
        ready: true
      };

      if (allowBots) {
        (Object.keys(slots) as Faction[]).forEach(f => {
          if (f !== selectedFaction) {
            slots[f as Exclude<Faction, 'None'>] = {
              faction: f as any,
              occupantType: 'bot',
              botDifficulty: defaultDifficulty,
              ready: true
            };
          }
        });
      }

      const newRoom: WarRoom = {
        roomCode,
        hostName: name,
        createdAt: new Date().toISOString(),
        status: 'waiting',
        slots,
        roomRules: {
          ruleset: GAME_MODE_RULESETS[gameMode],
          gameMode,
          allowBots,
          botDifficultyDefault: defaultDifficulty
        }
      };

      saveWarRoom(newRoom);
      clearTimeout(timeout);
      
      if ((import.meta as any).env.DEV) {
        console.log(`[Strategic Command] Mission Accepted. Navigating to Chamber ${roomCode}`);
      }
      
      navigate(`/rooms/${roomCode}`, { state: { mode: 'local', gameMode } });
    } catch (err: any) {
      clearTimeout(timeout);
      setError(err?.message || "Could not create the Classic room.");
      setIsCreating(false);
    }
  };

  return (
    <div className="pt-24 min-h-screen container mx-auto px-4 pb-12 sm:px-6 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <Link to="/rooms" className="flex items-center gap-2 text-gold hover:text-white transition-colors text-xs font-bold uppercase tracking-widest mb-8">
          <ChevronLeft size={16} /> Return to Classic Rooms
        </Link>
        <h1 className="mb-2 text-3xl font-serif font-black uppercase tracking-[0.14em] text-white sm:text-4xl md:text-5xl md:tracking-widest">
          ESTABLISH <span className="text-gold italic">CLASSIC ROOM</span>
        </h1>
        <p className="mb-8 text-base font-serif italic text-zinc-500 sm:mb-12 sm:text-lg">
          Classic rooms support online sync, local war-room play, bots, and replay-ready matches.
        </p>

        <form onSubmit={handleCreate} className="space-y-8 sm:space-y-10">
          <div className="space-y-4">
            <label className="text-zinc-500 text-[10px] uppercase font-bold tracking-[0.3em] flex items-center gap-2">
              <Shield size={14} className="text-gold" /> Campaign Mode
            </label>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {(['classic', 'authentic'] as GameMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    setGameMode(mode);
                    setSearchParams({ mode });
                    setError(mode === 'authentic' ? AUTHENTIC_DISABLED_MESSAGE : null);
                  }}
                  className={cn(
                    "rounded-[1.75rem] border p-5 text-left transition-all sm:rounded-3xl sm:p-6",
                    gameMode === mode ? "bg-gold/10 border-gold" : "bg-white/[0.03] border-white/5 hover:border-white/10"
                  )}
                >
                  <div className="text-[10px] font-bold uppercase tracking-widest text-gold mb-2">
                    {mode === 'authentic' ? 'Local Only' : GAME_MODE_META[mode].shortLabel}
                  </div>
                  <h4 className="text-white text-base font-serif font-black uppercase mb-2">
                    {GAME_MODE_META[mode].label}
                  </h4>
                  <p className="text-[10px] text-zinc-600 font-serif italic">{GAME_MODE_META[mode].description}</p>
                </button>
              ))}
            </div>
            {gameMode === 'authentic' && (
              <p className="text-[10px] text-amber-300/80 font-serif italic">
                Modern 3K is local-only. Start it from /setup?mode=authentic.
              </p>
            )}
          </div>

          {/* Room Mode Toggle */}
          <div className="space-y-4">
            <label className="text-zinc-500 text-[10px] uppercase font-bold tracking-[0.3em] flex items-center gap-2">
              <Zap size={14} className="text-gold" /> Engagement Layer
            </label>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <button
                type="button"
                onClick={() => setRoomMode('local')}
                className={cn(
                  "rounded-[1.75rem] border p-5 text-left transition-all relative overflow-hidden group sm:rounded-3xl sm:p-6",
                  roomMode === 'local' 
                    ? "bg-gold/10 border-gold shadow-[0_0_20px_rgba(212,175,55,0.1)]" 
                    : "bg-white/[0.03] border-white/5 hover:border-white/10"
                )}
              >
                <div className="flex items-center gap-4 mb-2">
                  <div className={cn(
                    "p-2 rounded-lg transition-colors",
                    roomMode === 'local' ? "bg-gold text-ink" : "bg-white/5 text-zinc-500 group-hover:text-gold"
                  )}>
                    <User size={16} />
                  </div>
                <h4 className={cn(
                    "text-[10px] font-bold uppercase tracking-widest",
                    roomMode === 'local' ? "text-white" : "text-zinc-500"
                  )}>Local Simulation</h4>
                </div>
                <p className="text-[10px] text-zinc-600 font-serif italic ml-10">Stored only on this device. Best for solo training or same-room tactics.</p>
                {roomMode === 'local' && <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />}
              </button>

              <button
                type="button"
                disabled={!wsUrlAvailable}
                onClick={() => setRoomMode('online')}
                className={cn(
                  "rounded-[1.75rem] border p-5 text-left transition-all relative overflow-hidden group sm:rounded-3xl sm:p-6",
                  !wsUrlAvailable && "opacity-50 grayscale cursor-not-allowed",
                  roomMode === 'online' 
                    ? "bg-gold/10 border-gold shadow-[0_0_20px_rgba(212,175,55,0.1)]" 
                    : "bg-white/[0.03] border-white/5 hover:border-white/10"
                )}
              >
                <div className="flex items-center gap-4 mb-2">
                  <div className={cn(
                    "p-2 rounded-lg transition-colors",
                    roomMode === 'online' ? "bg-gold text-ink" : "bg-white/5 text-zinc-500 group-hover:text-gold"
                  )}>
                    <Zap size={16} />
                  </div>
                <h4 className={cn(
                    "text-[10px] font-bold uppercase tracking-widest",
                    roomMode === 'online' ? "text-white" : "text-zinc-500"
                  )}>Online WebSocket</h4>
                </div>
                <p className="text-[10px] text-zinc-600 font-serif italic ml-10">Cross-device synchronization via battlefield cloud. Play with friends anywhere.</p>
                {roomMode === 'online' && <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />}
              </button>
            </div>
            {!wsUrlAvailable && roomMode === 'online' && (
              <p className="text-[9px] text-rose-500/80 font-serif italic text-center">
                Battlefield Cloud is currently offline. Please use Local Simulation.
              </p>
            )}
          </div>

          {/* Host Name */}
          <div className="space-y-4">
            <label className="text-zinc-500 text-[10px] uppercase font-bold tracking-[0.3em] flex items-center gap-2">
              <User size={14} className="text-gold" /> Commander's Title
            </label>
            <div className="relative">
              <input 
                type="text" 
                required
                data-testid="player-name-input"
                placeholder="Enter your name or title..."
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                className="w-full rounded-[1.75rem] border border-white/10 bg-white/[0.03] px-6 py-5 text-lg tracking-wide text-white placeholder:text-zinc-700 transition-all focus:outline-none focus:border-gold/30 font-serif sm:rounded-3xl sm:px-10 sm:py-8 sm:text-2xl"
              />
              <div className="absolute right-8 top-1/2 -translate-y-1/2 flex gap-1">
                {[1, 2, 3].map(i => <div key={i} className="w-1 h-3 bg-gold/20 rounded-full" />)}
              </div>
            </div>
          </div>

          {/* Faction Selection */}
          <div className="space-y-6">
            <label className="text-zinc-500 text-[10px] uppercase font-bold tracking-[0.3em] flex items-center gap-2">
              <Shield size={14} className="text-gold" /> Initial Allegiance
            </label>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
              {[
                { id: 'Shu', name: 'Benevolence', color: 'bg-shu', textColor: 'text-shu' },
                { id: 'Wei', name: 'Authority', color: 'bg-wei', textColor: 'text-wei' },
                { id: 'Wu', name: 'Prosperity', color: 'bg-wu', textColor: 'text-wu' }
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedFaction(f.id as Faction)}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-4 overflow-hidden rounded-[1.75rem] border py-8 transition-all group sm:rounded-[2.5rem] sm:py-12",
                    selectedFaction === f.id 
                      ? "bg-white/[0.05] border-gold shadow-[0_0_40px_rgba(212,175,55,0.1)]" 
                      : "bg-white/[0.02] border-white/5 hover:border-white/10 text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  <div className={cn(
                    "flex h-16 w-16 items-center justify-center rounded-[1.5rem] text-4xl font-black font-serif transition-transform duration-500 group-hover:scale-110 sm:h-20 sm:w-20 sm:rounded-[2rem] sm:text-5xl",
                    selectedFaction === f.id ? f.color + " text-white shadow-2xl" : "bg-white/5 text-zinc-800"
                  )}>{f.id[0]}</div>
                  <div className="text-center">
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-[0.3em] block mb-1",
                      selectedFaction === f.id ? "text-gold" : "text-zinc-600"
                    )}>{f.id}</span>
                    <span className="text-[7px] font-serif italic text-zinc-700 uppercase tracking-widest">{f.name}</span>
                  </div>
                  {selectedFaction === f.id && (
                    <motion.div 
                      layoutId="faction-glow"
                      className={cn("absolute inset-x-0 bottom-0 h-1 blur-xl opacity-50", f.color)} 
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Rule Settings */}
          <div className="space-y-6 rounded-[1.75rem] border border-white/5 bg-white/[0.02] p-5 sm:space-y-8 sm:rounded-[2rem] sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-white text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                  <Settings2 size={16} className="text-gold" /> Strategic Automata
                </h4>
                <p className="text-zinc-500 text-[10px] font-serif italic">Allow tactical bots to fill unoccupied slots.</p>
              </div>
              <button
                type="button"
                onClick={() => setAllowBots(!allowBots)}
                className={cn(
                  "w-14 h-8 rounded-full relative transition-all",
                  allowBots ? "bg-gold" : "bg-white/10"
                )}
              >
                <motion.div 
                  animate={{ x: allowBots ? 26 : 4 }}
                  className="w-6 h-6 bg-black rounded-full absolute top-1"
                />
              </button>
            </div>

            {allowBots && (
              <div className="space-y-4">
                <label className="text-zinc-600 text-[9px] uppercase font-bold tracking-widest">Bot Tactical Difficulty</label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {(['easy', 'normal', 'hard'] as BotDifficulty[]).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDefaultDifficulty(d)}
                      className={cn(
                        "flex-1 rounded-xl border px-3 py-3 text-left transition-all",
                        defaultDifficulty === d 
                          ? "bg-gold/10 border-gold text-gold" 
                          : "bg-white/5 border-white/5 text-zinc-500 hover:bg-white/10 hover:text-zinc-300"
                      )}
                    >
                      <span className="block text-[9px] font-bold uppercase tracking-widest">
                        {BOT_DIFFICULTY_LABELS[d]} ({d})
                      </span>
                      <span className="mt-1 block text-[10px] font-serif italic normal-case tracking-normal opacity-75">
                        {BOT_DIFFICULTY_NOTES[d]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

            <button 
              type="submit"
              data-testid="create-online-room-button"
              disabled={isCreating || gameMode === 'authentic' || (roomMode === 'online' && !wsUrlAvailable)}
              className="flex w-full items-center justify-center gap-3 rounded-[1.75rem] bg-gold py-5 text-[11px] font-bold uppercase tracking-[0.28em] text-black shadow-[0_0_30px_rgba(212,175,55,0.2)] transition-all hover:bg-white disabled:opacity-50 sm:rounded-[2rem] sm:py-6 sm:text-xs sm:tracking-[0.4em]"
            >
              <Sword size={20} /> {gameMode === 'authentic' ? "Local Only" : isCreating ? "Creating..." : "Initialize Room"}
            </button>

            {roomMode === 'online' && !wsUrlAvailable && (
              <p className="text-rose-500/80 text-[10px] font-serif italic text-center mt-4">
                WebSocket unavailable. Use Local Simulation to create a Classic room without a backend.
              </p>
            )}

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-6 rounded-2xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-3 mt-4">
                <Shield size={16} /> {error}
              </div>
            )}
        </form>
      </div>
    </div>
  );
}
