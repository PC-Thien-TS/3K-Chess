import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Key, User, ShieldAlert } from 'lucide-react';
import { getWarRoom, normalizeRoomCode } from '@/src/storage/warRooms';
import { onlineRoomClient } from '@/src/services/onlineRoomClient';

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

    const code = normalizeRoomCode(roomCode);

    if (!code.includes('-')) {
        setError("Invalid Room Code format. Expected (e.g. WU-ABCD)");
        return;
    }

    setIsJoining(true);
    
    // Persist name
    localStorage.setItem('last_commander_name', playerName);
    
    // 1. Try local first as it's instant
    const localRoom = getWarRoom(code);
    
    // 2. Try online if configured
    const wsUrl = (import.meta as any).env.VITE_WS_URL;
    if (!wsUrl) {
        if (localRoom) {
            navigate(`/rooms/${localRoom.roomCode}`, { state: { playerName, mode: 'local' } });
        } else {
            setError("Room not found in this browser. Local Simulation rooms are stored only on this device. Deploy WebSocket backend for real online joining.");
            setIsJoining(false);
        }
        return;
    }

    onlineRoomClient.connect();
    
    const timeout = setTimeout(() => {
        if (localRoom) {
            navigate(`/rooms/${localRoom.roomCode}`, { state: { playerName, mode: 'local' } });
        } else {
            setError("The targeted chamber does not exist in the local archives or cloud repository.");
            setIsJoining(false);
        }
        cleanup();
    }, 3000);

    const cleanup = () => {
        clearTimeout(timeout);
        unsubscribeState();
        unsubscribeError();
    };

    const unsubscribeError = onlineRoomClient.subscribeToErrors((err) => {
        // If online fails, maybe it's local
        if (localRoom) {
            navigate(`/rooms/${localRoom.roomCode}`, { state: { playerName, mode: 'local' } });
            cleanup();
        } else {
            setError(`Cloud Breach: ${err}`);
            setIsJoining(false);
            cleanup();
        }
    });

    const unsubscribeState = onlineRoomClient.subscribeToRoomState((room) => {
        if (room.roomCode === code) {
            navigate(`/rooms/${room.roomCode}`, { state: { playerName, mode: 'online' } });
            cleanup();
        }
    });

    onlineRoomClient.joinRoom({
        roomCode: code,
        playerName
    });
  };

  return (
    <div className="pt-24 min-h-screen container mx-auto px-6 pb-12 flex flex-col items-center">
      <div className="w-full max-w-lg">
        <Link to="/rooms" className="flex items-center gap-2 text-gold hover:text-white transition-colors text-xs font-bold uppercase tracking-widest mb-8">
          <ChevronLeft size={16} /> Return to Council
        </Link>
        <h1 className="text-4xl md:text-5xl font-serif font-black text-white tracking-widest uppercase mb-2 text-center">
          JOIN <span className="text-gold italic">ROOM</span>
        </h1>
        <p className="text-zinc-500 font-serif italic text-lg mb-12 text-center">
          "Enter the tactical chamber of your allies."
        </p>

        <form onSubmit={handleJoin} className="space-y-8 glass-dark p-10 rounded-[2.5rem] border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
          
          <div className="space-y-4">
            <label className="text-zinc-500 text-[10px] uppercase font-bold tracking-[0.3em] flex items-center gap-2">
              <User size={14} className="text-gold" /> Warrior Designation
            </label>
            <input 
              type="text" 
              required
              placeholder="Your name..."
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-5 px-6 text-white placeholder:text-zinc-700 focus:outline-none focus:border-gold/30 transition-all font-serif"
            />
          </div>

          <div className="space-y-4">
            <label className="text-zinc-500 text-[10px] uppercase font-bold tracking-[0.3em] flex items-center gap-2">
              <Key size={14} className="text-gold" /> Chamber Access Code
            </label>
            <input 
              type="text" 
              required
              placeholder="e.g. SHU-X8Q2"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-5 px-6 text-white placeholder:text-zinc-700 font-mono focus:outline-none focus:border-gold/30 transition-all text-2xl tracking-widest"
            />
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-4 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-3">
              <ShieldAlert size={16} /> {error}
            </div>
          )}

          <button 
            type="submit"
            className="w-full bg-gold hover:bg-white text-black py-5 rounded-[1.5rem] font-bold uppercase tracking-[0.4em] text-[10px] transition-all shadow-[0_0_20px_rgba(212,175,55,0.2)]"
          >
            Access Chamber
          </button>
          
          <p className="text-[9px] text-zinc-600 font-serif italic text-center mt-4 uppercase tracking-widest leading-relaxed">
            Local Simulation rooms only exist in this browser. <br/>
            To join from another device, deploy the WebSocket backend.
          </p>
        </form>
      </div>
    </div>
  );
}
