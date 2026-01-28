import React, { useEffect, useState } from 'react';
import { fetchPlayerHand } from '../api';
import api from '../api';
import socket from '../socket';
import BetModal from './Bet';
import './GamePlay.css';
import { useNavigate } from 'react-router-dom';

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
  const [tricksWon, setTricksWon]    = useState({});
  const gameCode = sessionStorage.getItem('gameCode');
  const playerId = sessionStorage.getItem('playerId');
  const [roundSkippedMsg, setRoundSkippedMsg] = useState('');

  const navigate = useNavigate();

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
    console.log(gameState);
    const starterIdx = gameState.data.trickStarterIdx;
    console.log("starterIdx: ")
    console.log(starterIdx);
    setBetIdx(starterIdx);
    setTrickStarterIdx(starterIdx);
    
    // Only enter betting phase if the game is actually in betting phase
    if (gameState.data.phase === 'betting') {
      const placed = Object.keys(byId).length;
      if (placed < p.data.length) {
        setBetting(true);
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

    const handleBetPlaced = ({ playerId: pid, bet, nextIdx }) => {
      setBets(prev => {
        const updatedBets = { ...prev, [pid]: bet };
        if (updatedBets["undefined"]) {
            delete updatedBets["undefined"];
        }
        console.log(updatedBets);
        // Check if all 4 players have placed their bets
        if (Object.keys(updatedBets).length === 4) {
          setBetting(false); // End betting phase on the frontend
          setBetIdx(0); // Reset bet index for the start of the next round (backend will handle the actual start player)
          // Sync betting phase to backend
          api.post(`/games/${gameCode}/state`, { current_bet_idx: 0 }).catch(err => console.error('Failed to update bet index:', err));
        } else {
          setBetIdx(nextIdx); // Move to the next bettor
          // Sync current bet index to backend
          api.post(`/games/${gameCode}/state`, { current_bet_idx: nextIdx }).catch(err => console.error('Failed to update bet index:', err));
        }

        return updatedBets;
      });
    };

    socket.on('bet-placed', handleBetPlaced);

    return () => {
      socket.off('bet-placed', handleBetPlaced);
    };
  }, [gameCode, playerId]); // Removed players dependency as it's no longer strictly needed here

  useEffect(() => {
    if (!bettingPhase
        && players.length > 0
        && Object.keys(bets).length === players.length) {
      const total = players.reduce((sum, p) => sum + (bets[p.id] || 0), 0);
      
      // Calculate minimum total bet based on highest score
      const maxScore = Math.max(...players.map(p => p.gameScore));
      const minTotalBet = 11 + Math.floor(maxScore / 10);
      
      if (total < minTotalBet) {
        // clear bets and re-enter betting
        setBets({});
        setBetting(true);
        
        // ask the server to skip the round, increment rounds_completed, and deal new hands
        socket.emit('skip-round', { gameCode });
      } else {
        // Sync phase to 'playing' in backend
        api.post(`/games/${gameCode}/state`, { phase: 'playing' }).catch(err => console.error('Failed to update phase:', err));
      }
    }
  }, [bettingPhase, bets, players, gameCode]);

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
    const handleTrickFinished = ({ winnerId, trick }) => {
      setTricksWon(prev => ({
        ...prev,
        [winnerId]: (prev[winnerId] || 0) + 1
      }));
      setPlayed({});
      setTrick([]);
      const winnerIdx = players.findIndex(p => p.id === winnerId);
      setTrickStarterIdx(winnerIdx);
      // Sync trick_starter_idx to backend
      api.post(`/games/${gameCode}/state`, { trick_starter_idx: winnerIdx }).catch(err => console.error('Failed to update trick starter:', err));
    };

    socket.on('trick-finished', handleTrickFinished);
    return () => socket.off('trick-finished', handleTrickFinished);
  }, [players, gameCode]);

  // submit a bet
  const submitBet = async val => {
    const who = players[currentBetIdx];
    await api.post('/games/bet', { 
      playerId: who.id, 
      bet: val,
      gameCode: gameCode
    });
    const next = (currentBetIdx + 1) % 4;
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

  useEffect(() => {
        const handleRoundSkipped = ({ message }) => {
        setTricksWon({});
        setBets({});
        setBetting(true);
        setPlayed({});
        setTrick([]);
        loadPlayersAndBets();
      
        setRoundSkippedMsg(message);
        setTimeout(() => setRoundSkippedMsg(''), 4000); // Hide after 4 seconds
        };
        socket.on('round-skipped', handleRoundSkipped);
        return () => socket.off('round-skipped', handleRoundSkipped);
  }, []);

  useEffect(() => {
    const handleScoresUpdated = ({ players: updatedPlayers }) => {
      setPlayers(prevPlayers =>
        prevPlayers.map(p => {
          const updated = updatedPlayers.find(up => up.id === p.id);
          return updated ? { ...p, gameScore: updated.gameScore } : p;
        })
      );
    };
    socket.on('scores-updated', handleScoresUpdated);
    return () => socket.off('scores-updated', handleScoresUpdated);
  }, []);

  // game over
  useEffect(() => {
    const handleGameOver = ({ team: winningTeam, player1: winningPlayer1, player2: winningPlayer2 }) => {
        console.log("Game finished event received:", winningTeam);
        // Reset relevant GamePlay state
        setTricksWon({});
        setBets({});
        setBetting(false); // Ensure betting modal is hidden
        setPlayed({});
        setTrick([]);
        setHand([]); // Clear the hand display

        // Clear local storage items specific to THIS game instance's progression
        localStorage.removeItem('playerHand'); // Clear the old hand

        navigate('/game/finished', { state: { winningTeam: winningTeam, winningPlayers: [winningPlayer1, winningPlayer2] } });
    }
    socket.on('game-over', handleGameOver);
    //
    // clear game and data here, except maybe the names and room code so we can restart with same info like a start game button
    //
    return () => {
        socket.off('game-over', handleGameOver);
    }
  }, [navigate]);

  useEffect(() => {
    const handleRoundFinished = () => {
      setTricksWon({});
      setBets({});
      setPlayed({});
      setTrick([]);
      // Reset round data and wait for backend to finish clearing bets
      setTimeout(() => {
        loadPlayersAndBets().then(() => {
          // Force betting phase after reset
          setBetting(true);
        });
      }, 500);
    };
    socket.on('round-finished', handleRoundFinished);
    return () => socket.off('round-finished', handleRoundFinished);
  }, [gameCode]);

  return (
    <div>
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
            minBet={2 + Math.floor((players[currentBetIdx]?.gameScore || 0) / 10)}
            onSubmit={submitBet}
            />
        )}

        {/* Top-right: overall game scores */}
        <div className="scoreboard-top">
            <table className="scoreboard-top-table">
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

        {roundSkippedMsg && (
            <div className="round-skipped-banner">{roundSkippedMsg}</div>
        )}
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
