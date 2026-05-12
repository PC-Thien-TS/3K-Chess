import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Key, User, ShieldAlert } from 'lucide-react';
import { getWarRoom, normalizeRoomCode, isValidRoomCode } from '@/src/storage/warRooms';
import { onlineRoomClient } from '@/src/services/onlineRoomClient';
import { cn } from '@/src/lib/utils';
import { normalizeGameMode } from '@/shared/gameModes';

function extractRoomCodeFromInput(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  try {
    const parsedUrl = new URL(trimmed);
    const pathMatch = parsedUrl.pathname.match(/\/rooms\/([^/?#]+)/i);
    if (pathMatch?.[1]) {
      return normalizeRoomCode(pathMatch[1]);
    }
  } catch {
    // Not a URL; fall through to raw room code normalization.
  }

  return normalizeRoomCode(trimmed);
}

export default function JoinRoom() {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState("");
  const [playerName, setPlayerName] = useState(localStorage.getItem('last_commander_name') || "");
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (isJoining) return;
    setError(null);

    const code = extractRoomCodeFromInput(roomCode);

    if (!isValidRoomCode(code)) {
        setError("Invalid room code. Paste the Classic room code or a full invite link such as /rooms/WEI-PZR9.");
        return;
    }

    setIsJoining(true);
    
    // Persist name
    localStorage.setItem('last_commander_name', playerName);
    
    // 1. Prioritize local first as it's instant and requested by requirements
    const localRoom = getWarRoom(code);
    if (localRoom) {
        navigate(`/rooms/${localRoom.roomCode}`, { state: { playerName, mode: 'local', gameMode: normalizeGameMode(localRoom.roomRules?.gameMode) } });
        return;
    }
    
    // 2. Try online if configured
    const wsUrl = (import.meta as any).env.VITE_WS_URL;
    if (!wsUrl) {
        setError("WebSocket unavailable. This Classic room is not stored on this device.");
        setIsJoining(false);
        return;
    }

    onlineRoomClient.connect();
    
    const timeout = setTimeout(() => {
        setError("Cannot connect to that Classic room. Check the code and try again.");
        setIsJoining(false);
        cleanup();
    }, 5000);

    const cleanup = () => {
        clearTimeout(timeout);
        unsubscribeState();
        unsubscribeError();
    };

    const unsubscribeError = onlineRoomClient.subscribeToErrors((err) => {
        setError(err === 'CANNOT_CONNECT' ? 'Cannot connect. Check the backend and retry.' : `Connection issue: ${err}`);
        setIsJoining(false);
        cleanup();
    });

    const unsubscribeState = onlineRoomClient.subscribeToRoomState((room) => {
        if (room.roomCode === code) {
            navigate(`/rooms/${room.roomCode}`, { state: { playerName, mode: 'online', gameMode: normalizeGameMode((room as any).roomRules?.gameMode) } });
            cleanup();
        }
    });

    onlineRoomClient.joinRoom({
        roomCode: code,
        playerName
    });
  };

  return (
    <div className="pt-24 min-h-screen container mx-auto px-4 pb-12 sm:px-6 flex flex-col items-center">
      <div className="w-full max-w-lg">
        <Link to="/rooms" className="flex items-center gap-2 text-gold hover:text-white transition-colors text-xs font-bold uppercase tracking-widest mb-8">
          <ChevronLeft size={16} /> Return to Classic Rooms
        </Link>
        <h1 className="mb-2 text-center text-3xl font-serif font-black uppercase tracking-[0.14em] text-white sm:text-4xl md:text-5xl md:tracking-widest">
          JOIN <span className="text-gold italic">CLASSIC ROOM</span>
        </h1>
        <p className="mb-8 text-center text-base font-serif italic text-zinc-500 sm:mb-12 sm:text-lg">
          Enter a Classic room code. Modern 3K is local-only and does not use room codes.
        </p>

        <form onSubmit={handleJoin} className="glass-dark relative space-y-6 overflow-hidden rounded-[2rem] border border-white/5 p-5 shadow-2xl sm:space-y-8 sm:rounded-[3.5rem] sm:p-12">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gold/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
          
          <div className="space-y-4">
            <label className="text-zinc-500 text-[10px] uppercase font-bold tracking-[0.4em] flex items-center gap-2">
              <User size={14} className="text-gold" /> Commander Designation
            </label>
            <input 
              type="text" 
              required
              data-testid="player-name-input"
              placeholder="Your name..."
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-5 text-lg tracking-wide text-white placeholder:text-zinc-700 transition-all focus:outline-none focus:border-gold/30 font-serif sm:px-8 sm:py-6 sm:text-xl"
            />
          </div>

          <div className="space-y-4">
            <label className="text-zinc-500 text-[10px] uppercase font-bold tracking-[0.4em] flex items-center gap-2">
              <Key size={14} className="text-gold" /> Enter a Classic room code
            </label>
            <div className="relative">
              <input 
                type="text" 
                required
                data-testid="room-code-input"
                placeholder="Paste code or full invite link"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-5 text-2xl uppercase tracking-[0.24em] text-white placeholder:text-zinc-700 transition-all focus:outline-none focus:border-gold/30 font-mono sm:px-10 sm:py-8 sm:text-4xl sm:tracking-[0.3em]"
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-1 h-8 bg-gold/20 rounded-full" />
            </div>
            <p className="text-[10px] font-serif italic leading-relaxed text-zinc-500">
              Paste a raw code like <span className="font-mono uppercase text-zinc-400">WEI-PZR9</span> or a full invite link like{' '}
              <span className="font-mono text-zinc-400">https://.../rooms/WEI-PZR9</span>.
            </p>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-6 rounded-2xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-3">
              <ShieldAlert size={16} /> {error}
            </div>
          )}

          <button 
            type="submit"
            data-testid="join-room-button"
            disabled={isJoining}
            className={cn(
              "flex w-full items-center justify-center gap-4 rounded-[1.75rem] py-5 text-[11px] font-bold uppercase tracking-[0.3em] shadow-[0_0_40px_rgba(212,175,55,0.15)] transition-all sm:rounded-[2rem] sm:py-6 sm:text-xs sm:tracking-[0.5em]",
              isJoining 
                ? "bg-white/5 text-zinc-500" 
                : "bg-gold hover:bg-white text-ink hover:scale-[1.02]"
            )}
          >
            {isJoining ? (
              <>
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-zinc-600 border-t-zinc-400 rounded-full"
                />
                Connecting...
              </>
            ) : "Access Chamber"}
          </button>
          
          <div className="flex flex-col gap-2 items-center opacity-60">
            <div className="w-12 h-[1px] bg-white/10" />
            <p className="text-[9px] text-zinc-500 font-serif italic text-center uppercase tracking-widest leading-relaxed">
              Enter a Classic room code or paste a full invite link. <br/>
              Modern 3K is local-only and does not use room codes. <br/>
              Local simulation chambers remain client-side. <br/>
              Access is restricted to the device of origin unless cloud synced.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
