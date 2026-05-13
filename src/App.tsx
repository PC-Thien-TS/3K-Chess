import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { MatchProvider } from './context/MatchContext';
import { I18nProvider } from './i18n/I18nProvider';
import { useI18n } from './i18n/useI18n';

const Home = lazy(() => import('./pages/Home'));
const HowToPlay = lazy(() => import('./pages/HowToPlay'));
const PlayHub = lazy(() => import('./pages/PlayHub'));
const PracticeBoard = lazy(() => import('./pages/PracticeBoard'));
const MatchArchive = lazy(() => import('./pages/MatchArchive'));
const ReplayBoard = lazy(() => import('./pages/ReplayBoard'));
const WarRoomLobby = lazy(() => import('./pages/WarRoomLobby'));
const NotFound = lazy(() => import('./pages/NotFound'));

function RouteLoadingFallback() {
  const { t } = useI18n();

  return (
    <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center px-4 py-20">
      <div className="glass-dark w-full max-w-md rounded-[2.5rem] border border-gold/20 p-10 text-center shadow-2xl">
        <div className="mx-auto mb-5 h-14 w-14 rounded-full border-2 border-gold/20 border-t-gold animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gold">{t('common.loadingRouteLabel')}</p>
        <h2 className="mt-4 text-2xl font-serif font-black uppercase tracking-[0.12em] text-white">
          {t('common.loadingRouteTitle')}
        </h2>
        <p className="mt-3 text-sm font-serif italic text-zinc-400">
          {t('common.loadingRouteBody')}
        </p>
      </div>
    </div>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden selection:bg-gold selection:text-ink">
      {/* Cinematic Background Elements */}
      <div className="fixed inset-0 z-[-1]">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,#1a1515_0%,#0a0a0a_100%)]" />
        {/* Animated Glows */}
        <div className="absolute top-[10%] right-[10%] w-[600px] h-[600px] bg-wei/5 rounded-full blur-[140px] opacity-20 animate-pulse" />
        <div className="absolute bottom-[10%] left-[10%] w-[600px] h-[600px] bg-shu/10 rounded-full blur-[140px] opacity-10 animate-pulse [animation-delay:2s]" />
        
        {/* Grain Overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay" 
             style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
      </div>
      
      <Navbar />
      <main className="flex-grow">
        <Suspense fallback={<RouteLoadingFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/how-to-play" element={<HowToPlay />} />
            <Route path="/play" element={<PlayHub />} />
            <Route path="/setup" element={<PlayHub />} />
            <Route path="/practice" element={<PracticeBoard />} />
            <Route path="/archive" element={<MatchArchive />} />
            <Route path="/replay/:matchId" element={<ReplayBoard />} />
            <Route path="/rooms" element={<PlayHub />} />
            <Route path="/rooms/create" element={<PlayHub />} />
            <Route path="/rooms/join" element={<PlayHub />} />
            <Route path="/rooms/:roomCode" element={<WarRoomLobby />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />

      {/* SVG Ink Wash Filter */}
      <svg className="hidden">
        <filter id="ink-wash-filter">
          <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" />
        </filter>
      </svg>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <I18nProvider>
        <MatchProvider>
          <Layout children={null} />
        </MatchProvider>
      </I18nProvider>
    </Router>
  );
}
