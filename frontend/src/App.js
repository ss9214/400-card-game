import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import JoinGame from './components/JoinGame';
import RoomLobby from './components/RoomLobby';
import Lobby from './components/Lobby';
import GamePlay from './components/GamePlay';
import GameFinished from './components/GameFinished';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/join" element={<JoinGame />} />
        <Route path="/room/:code" element={<RoomLobby />} />
        <Route path="/room/:code/400/lobby" element={<Lobby />} />
        <Route path="/room/:code/400/play" element={<GamePlay />} />
        <Route path="/room/:code/400/finished" element={<GameFinished />} />
        {/* Legacy routes for backward compatibility */}
        <Route path="/game/join" element={<JoinGame />} />
        <Route path="/game/lobby" element={<Lobby />} />
        <Route path="/game/play" element={<GamePlay />} />
        <Route path="/game/finished" element={<GameFinished />} />
      </Routes>
    </Router>
  );
}

export default App;
