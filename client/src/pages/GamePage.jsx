import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getStatus, startGame } from '../api/game.js';
import GameCanvas from '../components/GameCanvas.jsx';

function GamePage() {
  const [loading, setLoading] = useState(true);
  const [tokensAvailable, setTokensAvailable] = useState(0);
  const [run, setRun] = useState(null);
  const [starting, setStarting] = useState(false);
  const [gameOverStats, setGameOverStats] = useState(null);
  const [error, setError] = useState(null);

  // Maps HTTP errors to friendly user messages
  const getErrorMessage = (err) => {
    if (err?.status === 403) {
      return 'Solve a puzzle to unlock the game';
    }
    if (err?.status === 429) {
      return 'Too many requests, slow down';
    }
    return err?.message || 'A network error occurred. Please try again.';
  };

  useEffect(() => {
    let isCancelled = false;

    async function loadStatus() {
      try {
        setLoading(true);
        setError(null);
        const data = await getStatus();
        if (!isCancelled) {
          setTokensAvailable(data.tokensAvailable || 0);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadStatus();

    return () => {
      isCancelled = true;
    };
  }, []);

  // Token is spent ONLY when user explicitly clicks this button, never in an effect
  const handleStartGame = async () => {
    try {
      setStarting(true);
      setError(null);
      const runData = await startGame();
      setRun(runData);
      setGameOverStats(null);
      setTokensAvailable((prev) => Math.max(0, prev - 1));
    } catch (err) {
      setError(getErrorMessage(err));
      if (err?.status === 403) {
        setTokensAvailable(0);
      }
    } finally {
      setStarting(false);
    }
  };

  const handleGameOver = (stats) => {
    setGameOverStats(stats);
    setRun(null);
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  // Active game run rendering
  if (run && run.runId) {
    return (
      <div style={{ maxWidth: '600px', margin: '1rem auto' }}>
        <GameCanvas runId={run.runId} onGameOver={handleGameOver} />
      </div>
    );
  }

  // Game over state
  if (gameOverStats) {
    const timeFormatted = (gameOverStats.durationMs / 1000).toFixed(1);
    return (
      <div style={{ maxWidth: '500px', margin: '2rem auto', textAlign: 'center' }}>
        <h2>Game Over</h2>
        <div
          style={{
            background: '#fafafa',
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '1.5rem',
            margin: '1.5rem 0',
          }}
        >
          <p style={{ fontSize: '1.25rem', margin: '0.5rem 0' }}>
            Final Score: <strong>{gameOverStats.score}</strong>
          </p>
          <p style={{ margin: '0.5rem 0' }}>
            Level Reached: <strong>{gameOverStats.level}</strong>
          </p>
          <p style={{ margin: '0.5rem 0' }}>
            Time: <strong>{timeFormatted}s</strong>
          </p>
        </div>

        <p style={{ fontStyle: 'italic', color: '#666', margin: '1rem 0' }}>
          Score saving arrives in the next step
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
          <Link
            to="/puzzle"
            style={{
              padding: '0.6rem 1.2rem',
              backgroundColor: '#4caf50',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px',
              fontWeight: 'bold',
            }}
          >
            Solve another puzzle
          </Link>
          <Link
            to="/leaderboard"
            style={{
              padding: '0.6rem 1.2rem',
              backgroundColor: '#2196f3',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px',
            }}
          >
            Leaderboard
          </Link>
        </div>
      </div>
    );
  }

  // Lobby states based on tokensAvailable
  return (
    <div style={{ maxWidth: '500px', margin: '2rem auto', textAlign: 'center' }}>
      <h1>Banana Catch</h1>

      {error && (
        <div
          style={{
            padding: '0.75rem',
            backgroundColor: '#ffebee',
            color: '#c62828',
            borderRadius: '4px',
            marginBottom: '1rem',
          }}
        >
          {error}
        </div>
      )}

      {tokensAvailable === 0 ? (
        <div style={{ marginTop: '1.5rem' }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
            Solve a puzzle to unlock the game
          </p>
          <Link
            to="/puzzle"
            style={{
              display: 'inline-block',
              padding: '0.6rem 1.2rem',
              backgroundColor: '#ff9800',
              color: '#fff',
              textDecoration: 'none',
              borderRadius: '4px',
              fontWeight: 'bold',
            }}
          >
            Go to Puzzles
          </Link>
        </div>
      ) : (
        <div style={{ marginTop: '1.5rem' }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
            You have {tokensAvailable} play{tokensAvailable === 1 ? '' : 's'} available
          </p>
          <button
            type="button"
            onClick={handleStartGame}
            disabled={starting}
            style={{
              padding: '0.75rem 1.75rem',
              fontSize: '1.1rem',
              backgroundColor: '#4caf50',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: starting ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
            }}
          >
            {starting ? 'Starting...' : 'Start game'}
          </button>
        </div>
      )}
    </div>
  );
}

export default GamePage;
