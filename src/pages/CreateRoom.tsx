import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Shield, Sword, User, Settings2 } from 'lucide-react';
import { generateRoomCode, saveWarRoom, WarRoom, RoomFactionSlot } from '@/src/storage/warRooms';
import { Faction, BotDifficulty } from '@/src/rules/threeKingdomRules';
import { cn } from '@/src/lib/utils';
import { onlineRoomClient } from '@/src/services/onlineRoomClient';
import { ServerMessage } from '@/server/protocol';

const FACTIONS: { id: Faction; name: string }[] = [
  { id: 'Shu', name: 'Kingdom of Shu' },
  { id: 'Wei', name: 'Kingdom of Wei' },
  { id: 'Wu', name: 'Kingdom of Wu' }
];

export default function CreateRoom() {
  const navigate = useNavigate();
  const [hostName, setHostName] = useState("");
  const [selectedFaction, setSelectedFaction] = useState<Faction>('Shu');
  const [allowBots, setAllowBots] = useState(true);
  const [defaultDifficulty, setDefaultDifficulty] = useState<BotDifficulty>('normal');
  const wsUrlAvailable = !!(import.meta as any).env.VITE_WS_URL;
  const [roomMode, setRoomMode] = useState<'local' | 'online'>(wsUrlAvailable ? 'online' : 'local');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const name = hostName.trim();
    if (!name || isCreating) return;
    
    setError(null);
    setIsCreating(true);

    if ((import.meta as any).env.DEV) {
      console.log(`[Strategic Command] Opening Chamber: Mode=${roomMode}, WS_Configured=${!!(import.meta as any).env.VITE_WS_URL}`);
    }

    const timeout = setTimeout(() => {
      if (isCreating) {
        setError("Strategic Delay: Room initialization timed out. Please try again.");
        setIsCreating(false);
      }
    }, 5000);

    try {
      if (roomMode === 'online') {
        const wsUrl = (import.meta as any).env.VITE_WS_URL;
        if (!wsUrl) {
          clearTimeout(timeout);
          setError("WebSocket server not configured. Use Local Simulation or configure VITE_WS_URL.");
          setIsCreating(false);
          return;
        }

        onlineRoomClient.connect();
        
        const unsubscribeError = onlineRoomClient.subscribeToErrors((err) => {
          clearTimeout(timeout);
          setError(`Strategic Failure: ${err}`);
          setIsCreating(false);
          unsubscribeError();
        });

        const unsubscribeState = onlineRoomClient.subscribeToRoomState((room) => {
          clearTimeout(timeout);
          if ((import.meta as any).env.DEV) {
            console.log(`[Strategic Command] Online Chamber Synchronized: ${room.roomCode}`);
          }
          navigate(`/rooms/${room.roomCode}`, { state: { mode: 'online' } });
          setIsCreating(false);
          unsubscribeState();
          unsubscribeError();
        });

        onlineRoomClient.createRoom({
          hostName: name,
          preferredFaction: selectedFaction as any,
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
          ruleset: '3K_CHESS_STANDARD_V1',
          allowBots,
          botDifficultyDefault: defaultDifficulty
        }
      };

      saveWarRoom(newRoom);
      clearTimeout(timeout);
      
      if ((import.meta as any).env.DEV) {
        console.log(`[Strategic Command] Mission Accepted. Navigating to Chamber ${roomCode}`);
      }
      
      navigate(`/rooms/${roomCode}`, { state: { mode: 'local' } });
    } catch (err: any) {
      clearTimeout(timeout);
      setError(err?.message || "Tactical Error: Failed to secure the war room.");
      setIsCreating(false);
    }
  };

  return (
    <div className="pt-24 min-h-screen container mx-auto px-6 pb-12 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <Link to="/rooms" className="flex items-center gap-2 text-gold hover:text-white transition-colors text-xs font-bold uppercase tracking-widest mb-8">
          <ChevronLeft size={16} /> Return to Council
        </Link>
        <h1 className="text-4xl md:text-5xl font-serif font-black text-white tracking-widest uppercase mb-2">
          ESTABLISH <span className="text-gold italic">WAR ROOM</span>
        </h1>
        <p className="text-zinc-500 font-serif italic text-lg mb-12">
          "Define the parameters for your next grand campaign."
        </p>

        <form onSubmit={handleCreate} className="space-y-10">
          {/* Room Mode Toggle */}
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setRoomMode('local')}
              className={cn(
                "py-4 rounded-2xl border text-[10px] font-bold uppercase tracking-widest transition-all",
                roomMode === 'local' ? "bg-gold/10 border-gold text-gold" : "bg-white/5 border-white/5 text-zinc-500"
              )}
            >
              Local Simulation
            </button>
            <button
              type="button"
              onClick={() => setRoomMode('online')}
              className={cn(
                "py-4 rounded-2xl border text-[10px] font-bold uppercase tracking-widest transition-all",
                roomMode === 'online' ? "bg-gold/10 border-gold text-gold" : "bg-white/5 border-white/5 text-zinc-500"
              )}
            >
              Online WebSocket
            </button>
          </div>

          {/* Host Name */}
          <div className="space-y-4">
            <label className="text-zinc-500 text-[10px] uppercase font-bold tracking-[0.3em] flex items-center gap-2">
              <User size={14} className="text-gold" /> Commander's Title
            </label>
            <input 
              type="text" 
              required
              placeholder="Enter your name or title..."
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-6 px-8 text-white placeholder:text-zinc-700 focus:outline-none focus:border-gold/30 transition-all font-serif text-xl"
            />
          </div>

          {/* Faction Selection */}
          <div className="space-y-4">
            <label className="text-zinc-500 text-[10px] uppercase font-bold tracking-[0.3em] flex items-center gap-2">
              <Shield size={14} className="text-gold" /> Allegiance
            </label>
            <div className="grid grid-cols-3 gap-4">
              {FACTIONS.map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedFaction(f.id)}
                  className={cn(
                    "relative py-8 rounded-2xl border transition-all overflow-hidden flex flex-col items-center justify-center gap-3",
                    selectedFaction === f.id 
                      ? "bg-gold/10 border-gold shadow-[0_0_20px_rgba(212,175,55,0.1)]" 
                      : "bg-white/5 border-white/5 hover:border-white/20 text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  <div className={cn(
                    "text-3xl font-black font-serif",
                    selectedFaction === f.id ? "text-gold" : "text-zinc-700"
                  )}>{f.id[0]}</div>
                  <span className={cn(
                    "text-[8px] font-bold uppercase tracking-widest text-center",
                    selectedFaction === f.id ? "text-white" : "text-zinc-600"
                  )}>{f.id}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Rule Settings */}
          <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[2rem] space-y-8">
            <div className="flex items-center justify-between">
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
                <div className="flex gap-2">
                  {(['easy', 'normal', 'hard'] as BotDifficulty[]).map((d) => (
                    <button
                      key={d}
                      type="button"
                      disabled={d === 'hard'}
                      onClick={() => setDefaultDifficulty(d)}
                      className={cn(
                        "flex-1 py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest border transition-all",
                        d === 'hard' ? "opacity-20 cursor-not-allowed border-white/5" :
                        defaultDifficulty === d 
                          ? "bg-gold/10 border-gold text-gold" 
                          : "bg-white/5 border-white/5 text-zinc-500"
                      )}
                    >
                      {d} {d === 'hard' && "(Early Access)"}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

            <button 
              type="submit"
              disabled={isCreating || (roomMode === 'online' && !wsUrlAvailable)}
              className="w-full bg-gold hover:bg-white text-black py-6 rounded-[2rem] font-bold uppercase tracking-[0.4em] text-xs transition-all shadow-[0_0_30px_rgba(212,175,55,0.2)] flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <Sword size={20} /> {isCreating ? "Initializing..." : "Initialize Room"}
            </button>

            {roomMode === 'online' && !wsUrlAvailable && (
              <p className="text-rose-500/80 text-[10px] font-serif italic text-center mt-4">
                Online WebSocket requires a deployed backend. Use Local Simulation to create a room without a server.
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
