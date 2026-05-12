import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Plus, 
  Users, 
  ChevronLeft, 
  Trash2, 
  Play, 
  Search, 
  Map as MapIcon,
  Sword,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';
import { listWarRooms, deleteWarRoom, WarRoom } from '@/src/storage/warRooms';
import { cn } from '@/src/lib/utils';

export default function WarCouncil() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<WarRoom[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setRooms(listWarRooms());
  }, []);

  const handleDelete = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Dismantle this war room? All tactical data will be lost.")) {
      deleteWarRoom(code);
      setRooms(listWarRooms());
    }
  };

  const filteredRooms = rooms.filter(r => 
    r.roomCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.hostName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="pt-24 min-h-screen container mx-auto px-6 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <Link to="/" className="flex items-center gap-2 text-gold hover:text-white transition-colors text-xs font-bold uppercase tracking-widest mb-4">
            <ChevronLeft size={16} /> To the Throne Room
          </Link>
          <h1 className="text-4xl md:text-6xl font-serif font-black text-white tracking-widest uppercase">
            WAR <span className="text-gold italic">COUNCIL</span>
          </h1>
          <p className="text-zinc-500 font-serif italic text-lg opacity-80 mt-2">
            "Coordinate with allies and plan the unification of the realm."
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <Link to="/rooms/join" className="flex-1 sm:flex-none border border-white/10 text-white px-8 py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 hover:bg-white/5">
            <Users size={16} className="text-gold" /> Join Room
          </Link>
          <Link to="/rooms/create" className="flex-1 sm:flex-none bg-gold hover:bg-white text-black px-8 py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.3)]">
            <Plus size={16} /> Create Room
          </Link>
        </div>
      </div>

      <div className="bg-gold/5 border border-gold/10 p-4 rounded-2xl mb-12 flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold shrink-0 mt-1">
          <Info size={20} />
        </div>
        <div>
          <h4 className="text-gold text-xs font-bold uppercase tracking-widest mb-1">Strategist's Advisory</h4>
          <p className="text-zinc-400 text-sm italic">
            Classic online WebSocket rooms are available when the backend is reachable. You can also continue with local tactical simulations on this device.
          </p>
        </div>
      </div>

      <div className="mb-10 relative">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gold opacity-40" size={20} />
        <input 
          type="text" 
          placeholder="Search by host or room code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-5 pl-16 pr-6 text-white placeholder:text-zinc-700 focus:outline-none focus:border-gold/30 transition-all font-serif"
        />
      </div>

      {filteredRooms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room, idx) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              key={room.roomCode}
              onClick={() => navigate(`/rooms/${room.roomCode}`)}
              className="group glass-dark border border-white/5 p-8 rounded-[2.5rem] hover:border-gold/30 transition-all cursor-pointer relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex justify-between items-start mb-8">
                <div>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em] mb-2 block">Room Command</span>
                  <h3 className="text-2xl font-serif text-gold font-black tracking-widest uppercase">{room.roomCode}</h3>
                </div>
                <div className={cn(
                  "px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest border",
                  room.status === 'playing' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-gold/10 border-gold/20 text-gold"
                )}>
                  {room.status}
                </div>
              </div>

              <div className="space-y-6 mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 border border-white/10 group-hover:border-gold/30 transition-colors">
                    <Sword size={18} />
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest block">Commander In Chief</span>
                    <p className="text-white font-serif italic">{room.hostName}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {Object.values(room.slots).map((slot, i) => (
                    <div key={i} className={cn(
                      "flex-1 h-1.5 rounded-full",
                      slot.occupantType === 'human' ? "bg-gold" : 
                      slot.occupantType === 'bot' ? "bg-white/20" : "bg-white/5"
                    )} />
                  ))}
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  <span>Occupancy</span>
                  <span className="text-white">{Object.values(room.slots).filter(s => s.occupantType !== 'empty').length}/3 Slots</span>
                </div>
              </div>

              <div className="flex gap-2 pt-6 border-t border-white/5">
                <button 
                  className="flex-1 bg-white/5 group-hover:bg-gold group-hover:text-black py-4 rounded-2xl text-[9px] font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2"
                >
                  <Play size={12} fill="currentColor" /> Enter Lobby
                </button>
                <button 
                  onClick={(e) => handleDelete(room.roomCode, e)}
                  className="bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/20 px-4 rounded-2xl transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
          <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center text-zinc-700 mb-6">
            <MapIcon size={40} />
          </div>
          <h3 className="text-2xl font-serif font-bold text-white mb-2 uppercase tracking-widest">No Active Chambers</h3>
          <p className="text-zinc-500 font-serif italic max-w-sm">
            The war council remains silent. Establish a new room to begin planning your next campaign.
          </p>
        </div>
      )}
    </div>
  );
}
