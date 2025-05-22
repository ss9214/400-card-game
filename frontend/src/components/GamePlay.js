import React, { useEffect, useState } from 'react';
import { fetchPlayerHand } from '../api';
import api from '../api';
import socket from '../socket';
import BetModal from './Bet';
import './GamePlay.css';

export default function GamePlay() {
  // --- core state
  const [players, setPlayers]      = useState([]);
  const [hand, setHand]            = useState([]);
  const [playedCards, setPlayed]   = useState({});
  const [currentTrick, setTrick]   = useState([]);
  const [trickStarterIdx, setTrickStarterIdx] = useState(0);
  // --- betting & scoring
  const [bets, setBets]            = useState({});
  const [bettingPhase, setBetting] = useState(false);
  const [currentBetIdx, setBetIdx] = useState(0);
  const [startBetIdx, setStartBetIdx] = useState(0);
  const [tricksWon, setTricksWon]    = useState({});
  const gameCode = localStorage.getItem('gameCode');
  const playerId = parseInt(localStorage.getItem('playerId'), 10);

  // Helper: load players and bets from backend
  const loadPlayersAndBets = async () => {
    const p = await api.get(`/games/${gameCode}/players`);
    p.data.sort((a, b) => a.id - b.id);
    setPlayers(p.data);

    const b = await api.get(`/games/bets/${gameCode}`);
    const byId = Object.fromEntries(
      b.data
        .filter(r => r.bet !== null)
        .map(r => [r.playerId, r.bet])
    );
    setBets(byId);

    // Get current game state
    const gameState = await api.get(`/games/${gameCode}/state`);
    
    // Only enter betting phase if the game is actually in betting phase
    if (gameState.data.phase === 'betting') {
      const placed = Object.keys(byId).length;
      if (placed < p.data.length) {
        setBetting(true);
        setBetIdx((gameState.data.currentBetIdx + placed) % p.data.length);
      }
    } else {
      setBetting(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadPlayersAndBets();
  }, [gameCode]);

  // load your hand
  useEffect(() => {
    fetchPlayerHand(playerId).then(setHand);
  }, [playerId]);

  // join socket room and listen for bet-placed events
  useEffect(() => {
    socket.emit('join-lobby', { gameCode, playerId });
    socket.on('bet-placed', ({ playerId: pid, bet, nextIdx }) => {
      setBets(prev => ({ ...prev, [pid]: bet }));
      if (nextIdx < players.length) {
        setBetIdx(nextIdx);
      } else {
        setBetting(false);
      }
    });
    return () => {
      socket.off('bet-placed');
    };
  }, [gameCode, playerId, players]);

  useEffect(() => {
    if (!bettingPhase
        && players.length > 0
        && Object.keys(bets).length === players.length) {
      const total = players.reduce((sum, p) => sum + (bets[p.id] || 0), 0);
      if (total < 11) {
        // advance the starter for next cycle
        setStartBetIdx(idx => (idx + 1) % players.length);
  
        // clear bets and re-enter betting
        setBets({});
        setBetting(true);
        setBetIdx((startBetIdx + 1) % players.length);
  
        // ask the server to reshuffle & deal a new round
        socket.emit('start-game', { gameCode });
      }
    }
  }, [bettingPhase, bets, players, startBetIdx, gameCode]);

  // handle incoming plays
  useEffect(() => {
    socket.on('card-played', ({ card, playerId: pid }) => {
      setPlayed(prev => ({ ...prev, [pid]: card }));
      if (pid === playerId) setHand(h => h.filter(c => c !== card));
      
      setTrick(t => {
        const u = [...t, { playerId: pid, card }];
        return u;
      });
    });
    return () => socket.off('card-played');
  }, [playerId, players]);

  useEffect(() => {
    // sum up how many tricks have been won so far
    const total = Object.values(tricksWon).reduce((s, n) => s + n, 0);
    if (total === 13) {
      // 1) tell the server to score & reset bets/round_scores
      api.post(`/games/finish-round/${gameCode}`).then(() => {
        // 2) rotate who bets first next round
        setStartBetIdx(s => (s + 1) % players.length);
  
        // 3) clear local state for the new round
        setTricksWon({});
        setBets({});
        setBetting(true);
        setBetIdx((startBetIdx + 1) % players.length);
  
        // 4) ask the server to reshuffle & deal a new hand
        socket.emit('start-game', { gameCode });
      });
    }
  }, [tricksWon, gameCode, players.length, startBetIdx]);

  useEffect(() => {
    const handleTrickFinished = ({ winnerId, trick }) => {
      setTricksWon(prev => ({
        ...prev,
        [winnerId]: (prev[winnerId] || 0) + 1
      }));
      setPlayed({});
      setTrick([]);
      const winnerIdx = players.findIndex(p => p.id === winnerId);
      setTrickStarterIdx(winnerIdx);
    };

    socket.on('trick-finished', handleTrickFinished);
    return () => socket.off('trick-finished', handleTrickFinished);
  }, [players]);

  // submit a bet
  const submitBet = async val => {
    const who = players[currentBetIdx];
    await api.post('/games/bet', { 
      playerId: who.id, 
      bet: val,
      gameCode: gameCode
    });
    const next = currentBetIdx + 1;
    setBets(prev => ({ ...prev, [who.id]: val }));
    setBetIdx(next);
    socket.emit('bet-placed', { playerId: who.id, bet: val, nextIdx: next });
  };

  // derive lead suit
  const leadSuit = currentTrick[0]?.card.split('_of_')[1];

  // turn logic
  const leaderIdx = currentTrick.length > 0
  ? players.findIndex(p => p.id === currentTrick[0].playerId)
  : trickStarterIdx;
  const turnId     = players[(leaderIdx + currentTrick.length) % 4]?.id;
  const isMyTurn   = turnId === playerId;
  
  // playable check
  const isPlayable = card => {
    // disable card play during betting phase
    if (bettingPhase) return false;
    if (!isMyTurn) return false;
    if (!leadSuit) return true;
    const suit = card.split('_of_')[1];
    if (suit === leadSuit) return true;
    const hasLead = hand.some(c => c.split('_of_')[1] === leadSuit);
    return !hasLead;
  };

  // play a card
  const play = card => {
    if (!isPlayable(card)) return;
    socket.emit('play-card', { card, playerId, gameCode });
    setTrick([]); // reset suit for next trick
  };

  useEffect(() => {
    socket.on('new-hand', ({ hand }) => {
      setHand(hand);
    });
    return () => socket.off('new-hand');
  }, []);

  return (
    <div className="gameplay-container">
      {/* Indicator at top middle */}
      {bettingPhase && (
        <div className="bet-indicator">
          It is {players[currentBetIdx]?.name}'s turn to bet!
        </div>
      )}

      {/* Bet modal only for the current bettor */}
      {bettingPhase && playerId === players[currentBetIdx]?.id && (
        <BetModal
          player={players[currentBetIdx]}
          minBet={2}
          onSubmit={submitBet}
        />
      )}

      {/* Top-right: overall game scores */}
      <div className="scoreboard-top">
        <table>
          <thead><tr><th>Name</th><th>Score</th></tr></thead>
          <tbody>
            {players.map(p => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.gameScore}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Center table */}
      <div className="table-center">
        {players.map((p, i) => {
          const pos = ['bottom','left','top','right'][(
            i - players.findIndex(x => x.id === playerId) + 4
          ) % 4];
          return (
            <div key={p.id} className={`table-card ${pos}`}>
              {playedCards[p.id] && (
                <img
                  src={`/cards/${playedCards[p.id]}.svg`}
                  alt=""
                  style={{ height: '100px' }}
                />
              )}
              <div className="player-name">{p.name}</div>
            </div>
          );
        })}
      </div>

      {/* Hand */}
      <div className="hand-container">
        {hand.map((card, idx) => (
          <div
            key={idx}
            className={`card-wrapper ${!isPlayable(card) ? 'disabled-card' : ''}`}
            onClick={() => play(card)}
          >
            <img src={`/cards/${card}.svg`} alt={card} />
          </div>
        ))}
      </div>

      {/* Bottom-right: round bets & tricks */}
      <div className="scoreboard-round">
        <table>
          <thead><tr><th>Name</th><th>Bet</th><th>Won</th></tr></thead>
          <tbody>
            {players.map(p => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{bets[p.id] ?? '-'}</td>
                <td>{tricksWon[p.id] || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
