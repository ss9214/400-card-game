import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Home from './components/Home';
import JoinGame from './components/JoinGame';
import RoomLobby from './components/RoomLobby';
import Lobby from './components/Lobby';
import GamePlay from './components/GamePlay';
import GameFinished from './components/GameFinished';
import ImposterSetup from './components/ImposterSetup';
import ImposterPlay from './components/ImposterPlay';
import RulesButton from './components/RulesButton';

function AppContent() {
  const location = useLocation();
  // Extract game type from URL path
  const pathMatch = location.pathname.match(/\/room\/[^/]+\/(\w+)\/(lobby|play|finished)/);
  const gameType = pathMatch ? pathMatch[1] : '400';

  return (
    <>
      <RulesButton gameType={gameType} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/join" element={<JoinGame />} />
        <Route path="/room/:code" element={<RoomLobby />} />
        <Route path="/room/:code/400/lobby" element={<Lobby />} />
        <Route path="/room/:code/400/play" element={<GamePlay />} />
        <Route path="/room/:code/400/finished" element={<GameFinished />} />
        <Route path="/room/:code/spades/lobby" element={<Lobby />} />
        <Route path="/room/:code/spades/play" element={<GamePlay />} />
        <Route path="/room/:code/spades/finished" element={<GameFinished />} />
        <Route path="/room/:code/imposter/lobby" element={<ImposterSetup />} />
        <Route path="/room/:code/imposter/play" element={<ImposterPlay />} />
        {/* Legacy routes for backward compatibility */}
        <Route path="/game/join" element={<JoinGame />} />
        <Route path="/game/lobby" element={<Lobby />} />
        <Route path="/game/play" element={<GamePlay />} />
        <Route path="/game/finished" element={<GameFinished />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
