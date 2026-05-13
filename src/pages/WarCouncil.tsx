import { useEffect, useState, type MouseEvent } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Users,
  ChevronLeft,
  Trash2,
  Play,
  Search,
  Map as MapIcon,
  Sword,
  Info,
} from 'lucide-react';
import { listWarRooms, deleteWarRoom, type WarRoom } from '@/src/storage/warRooms';
import { cn } from '@/src/lib/utils';
import { useI18n } from '@/src/i18n/useI18n';

export default function WarCouncil() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<WarRoom[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setRooms(listWarRooms());
  }, []);

  const handleDelete = (code: string, e: MouseEvent) => {
    e.stopPropagation();
    if (confirm(t('rooms.deleteConfirm'))) {
      deleteWarRoom(code);
      setRooms(listWarRooms());
    }
  };

  const filteredRooms = rooms.filter(
    (room) =>
      room.roomCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.hostName.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  const hasSavedRooms = rooms.length > 0;
  const hasSearch = searchTerm.trim().length > 0;

  return (
    <div className="container mx-auto min-h-screen px-6 pb-12 pt-24">
      <div className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div>
          <Link
            to="/"
            className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold transition-colors hover:text-white"
          >
            <ChevronLeft size={16} /> {t('rooms.backHome')}
          </Link>
          <h1 className="text-4xl font-black uppercase tracking-widest text-white md:text-6xl font-serif">
            {t('rooms.titleMain')} <span className="italic text-gold">{t('rooms.titleAccent')}</span>
          </h1>
          <p className="mt-3 max-w-3xl font-serif text-base text-zinc-400 opacity-90 md:text-lg">
            {t('rooms.subtitle')}
          </p>
        </div>

        <div className="flex w-full flex-col gap-4 sm:flex-row md:w-auto">
          <Link
            to="/rooms/create"
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gold px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-black shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all hover:bg-white sm:flex-none"
          >
            <Plus size={16} /> {t('rooms.createClassicRoom')}
          </Link>
          <Link
            to="/rooms/join"
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-white transition-all hover:bg-white/5 sm:flex-none"
          >
            <Users size={16} className="text-gold" /> {t('rooms.joinRoom')}
          </Link>
          <Link
            to="/how-to-play"
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-gold/20 px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-gold transition-all hover:bg-gold/10 sm:flex-none"
          >
            <Sword size={16} /> {t('common.howToPlay')}
          </Link>
        </div>
      </div>

      <div className="mb-12 flex items-start gap-4 rounded-2xl border border-gold/10 bg-gold/5 p-4">
        <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold">
          <Info size={20} />
        </div>
        <div>
          <h4 className="mb-1 text-xs font-bold uppercase tracking-widest text-gold">{t('rooms.strategistAdvisory')}</h4>
          <p className="text-sm text-zinc-400">
            {t('rooms.advisoryPrimary')}
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            {t('rooms.advisorySecondary')}
          </p>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-serif font-bold uppercase tracking-widest text-white">{t('rooms.localRoomHistory')}</h2>
        <p className="mt-2 max-w-3xl text-sm text-zinc-500">
          {t('rooms.localRoomHistoryDescription')}
        </p>
      </div>

      <div className="relative mb-10">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gold opacity-40" size={20} />
        <input
          type="text"
          placeholder={t('rooms.searchPlaceholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-white/[0.03] py-5 pl-16 pr-6 font-serif text-white transition-all placeholder:text-zinc-700 focus:border-gold/30 focus:outline-none"
        />
      </div>

      {filteredRooms.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredRooms.map((room, idx) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              key={room.roomCode}
              onClick={() => navigate(`/rooms/${room.roomCode}`)}
              className="group relative cursor-pointer overflow-hidden rounded-[2.5rem] border border-white/5 p-8 transition-all hover:border-gold/30 glass-dark"
            >
              <div className="absolute right-0 top-0 h-32 w-32 translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/5 blur-3xl opacity-0 transition-opacity group-hover:opacity-100" />

              <div className="mb-8 flex items-start justify-between">
                <div>
                  <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">
                    {t('rooms.savedRoomCode')}
                  </span>
                  <h3 className="text-2xl font-serif font-black uppercase tracking-widest text-gold">{room.roomCode}</h3>
                </div>
                <div
                  className={cn(
                    'rounded-full border px-3 py-1 text-[8px] font-bold uppercase tracking-widest',
                    room.status === 'playing'
                      ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500'
                      : 'border-gold/20 bg-gold/10 text-gold',
                  )}
                >
                  {t(`rooms.status.${room.status}`)}
                </div>
              </div>

              <div className="mb-8 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-400 transition-colors group-hover:border-gold/30">
                    <Sword size={18} />
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold uppercase tracking-widest text-zinc-500">{t('rooms.host')}</span>
                    <p className="font-serif italic text-white">{room.hostName}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {Object.values(room.slots).map((slot, i) => (
                    <div
                      key={i}
                      className={cn(
                        'h-1.5 flex-1 rounded-full',
                        slot.occupantType === 'human'
                          ? 'bg-gold'
                          : slot.occupantType === 'bot'
                            ? 'bg-white/20'
                            : 'bg-white/5',
                      )}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  <span>{t('rooms.occupancy')}</span>
                  <span className="text-white">
                    {Object.values(room.slots).filter((slot) => slot.occupantType !== 'empty').length}/3 {t('rooms.slotsSuffix')}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 border-t border-white/5 pt-6">
                <Link
                  to={`/rooms/${room.roomCode}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white/5 py-4 text-[9px] font-bold uppercase tracking-[0.2em] transition-all group-hover:bg-gold group-hover:text-black"
                >
                  <Play size={12} fill="currentColor" /> {t('rooms.reopenSavedRoom')}
                </Link>
                <button
                  onClick={(e) => handleDelete(room.roomCode, e)}
                  className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 text-rose-500 transition-all hover:bg-rose-500 hover:text-white"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-[3rem] border-2 border-dashed border-white/5 py-24 text-center">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white/5 text-zinc-700">
            <MapIcon size={40} />
          </div>
          <h3 className="mb-2 text-2xl font-serif font-bold uppercase tracking-widest text-white">
            {hasSavedRooms ? t('rooms.emptySearchTitle') : t('rooms.emptyTitle')}
          </h3>
          <p className="max-w-xl font-serif italic text-zinc-500">
            {hasSavedRooms && hasSearch
              ? t('rooms.emptySearchBody')
              : t('rooms.emptyBody')}
          </p>
          {!hasSavedRooms && (
            <div className="mt-8 flex w-full max-w-2xl flex-col gap-3 px-6 sm:flex-row sm:justify-center">
              <Link
                to="/rooms/create"
                className="rounded-2xl bg-gold px-6 py-4 text-[10px] font-bold uppercase tracking-[0.24em] text-black transition-all hover:bg-white"
              >
                {t('rooms.createClassicRoom')}
              </Link>
              <Link
                to="/rooms/join"
                className="rounded-2xl border border-white/10 px-6 py-4 text-[10px] font-bold uppercase tracking-[0.24em] text-white transition-all hover:bg-white/5"
              >
                {t('rooms.joinRoom')}
              </Link>
              <Link
                to="/how-to-play"
                className="rounded-2xl border border-gold/20 px-6 py-4 text-[10px] font-bold uppercase tracking-[0.24em] text-gold transition-all hover:bg-gold/10"
              >
                {t('common.howToPlay')}
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
