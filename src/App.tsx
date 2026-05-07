import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import PracticeBoard from './pages/PracticeBoard';
import MatchSetup from './pages/MatchSetup';
import MatchArchive from './pages/MatchArchive';
import ReplayBoard from './pages/ReplayBoard';
import WarCouncil from './pages/WarCouncil';
import CreateRoom from './pages/CreateRoom';
import JoinRoom from './pages/JoinRoom';
import WarRoomLobby from './pages/WarRoomLobby';
import { MatchProvider } from './context/MatchContext';

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
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/setup" element={<MatchSetup />} />
          <Route path="/practice" element={<PracticeBoard />} />
          <Route path="/archive" element={<MatchArchive />} />
          <Route path="/replay/:matchId" element={<ReplayBoard />} />
          <Route path="/rooms" element={<WarCouncil />} />
          <Route path="/rooms/create" element={<CreateRoom />} />
          <Route path="/rooms/join" element={<JoinRoom />} />
          <Route path="/rooms/:roomCode" element={<WarRoomLobby />} />
        </Routes>
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
      <MatchProvider>
        <Layout children={null} />
      </MatchProvider>
    </Router>
  );
}
