import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import JoinGame from './components/JoinGame';
import Lobby from './components/Lobby';
import GamePlay from './components/GamePlay';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/game/join" element={<JoinGame />} />
        <Route path="/game/lobby" element={<Lobby />} />
        <Route path="/game/play" element={<GamePlay />} />
      </Routes>
    </Router>
  );
}

export default App;
