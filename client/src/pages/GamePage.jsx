import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getStatus, startGame, finishGame, abandonGame } from '../api/game.js';
import GameCanvas from '../components/GameCanvas.jsx';

function GamePage() {
  const [loading, setLoading] = useState(true);
  const [tokensAvailable, setTokensAvailable] = useState(0);
  const [playerStats, setPlayerStats] = useState({
    personalBest: 0,
    totalGames: 0,
    rank: null,
  });
  const [recentRuns, setRecentRuns] = useState([]);
  const [activeRunInfo, setActiveRunInfo] = useState(null);

  // Active game run state
  const [run, setRun] = useState(null);
  const [starting, setStarting] = useState(false);
  const [abandoning, setAbandoning] = useState(false);
  const [gameOverStats, setGameOverStats] = useState(null);
  const [error, setError] = useState(null);

  // Score submission state machine: null | 'saving' | 'saved' | 'rejected' | 'expired' | 'error'
  const [submitState, setSubmitState] = useState(null);
  const [savedScore, setSavedScore] = useState(null);

  const activeRunIdRef = useRef(null);
  const lastScoreRef = useRef(null);
  const submittingRef = useRef(false);

  // Maps HTTP errors to user-friendly messages
  const getErrorMessage = (err) => {
    if (err?.status === 403) {
      return 'Solve a puzzle to unlock an arcade play token';
    }
    if (err?.status === 429) {
      return 'Too many requests, slow down';
    }
    return err?.message || 'A network error occurred. Please try again.';
  };

  const loadStatus = useCallback(async () => {
    try {
      setError(null);
      const data = await getStatus();
      setTokensAvailable(data.tokensAvailable || 0);
      setPlayerStats({
        personalBest: data.personalBest || 0,
        totalGames: data.totalGames || 0,
        rank: data.rank || null,
      });
      setRecentRuns(data.recentRuns || []);
      setActiveRunInfo(data.activeRun || null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  // Starts an official Ranked tournament match (spends 1 token)
  const handleStartRanked = async () => {
    try {
      setStarting(true);
      setError(null);
      setSubmitState(null);
      setSavedScore(null);
      submittingRef.current = false;

      const runData = await startGame();
      setRun(runData);
      activeRunIdRef.current = runData.runId;
      setGameOverStats(null);
      setTokensAvailable((prev) => Math.max(0, prev - 1));
      setActiveRunInfo(null);
    } catch (err) {
      setError(getErrorMessage(err));
      if (err?.status === 403) {
        setTokensAvailable(0);
      }
    } finally {
      setStarting(false);
    }
  };

  // Resumes an in-progress active run recovered from the backend
  const handleResumeActiveRun = () => {
    if (!activeRunInfo) return;
    setError(null);
    setSubmitState(null);
    setSavedScore(null);
    submittingRef.current = false;
    setRun({ runId: activeRunInfo.runId });
    activeRunIdRef.current = activeRunInfo.runId;
    setGameOverStats(null);
  };

  // Forfeits an active run
  const handleAbandonRun = async () => {
    if (!activeRunInfo) return;
    try {
      setAbandoning(true);
      await abandonGame(activeRunInfo.runId);
      setActiveRunInfo(null);
      await loadStatus();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setAbandoning(false);
    }
  };

  const submitScore = async (runId, score) => {
    if (submittingRef.current || !runId) return;
    submittingRef.current = true;
    setSubmitState('saving');

    try {
      const res = await finishGame(runId, score);
      setSubmitState('saved');
      setSavedScore(res.score !== undefined ? res.score : score);
      // Refresh player profile and leaderboard stats
      loadStatus();
    } catch (err) {
      if (err?.status === 422) {
        setSubmitState('rejected');
      } else if (err?.status === 410) {
        setSubmitState('expired');
      } else {
        setSubmitState('error');
      }
    } finally {
      submittingRef.current = false;
    }
  };

  const handleGameOver = (stats) => {
    setGameOverStats(stats);
    setRun(null);

    const runId = activeRunIdRef.current;
    lastScoreRef.current = stats.score;

    if (runId) {
      submitScore(runId, stats.score);
    }
  };

  const handleRetrySubmit = () => {
    if (activeRunIdRef.current && lastScoreRef.current !== null) {
      submitScore(activeRunIdRef.current, lastScoreRef.current);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '480px', margin: '4rem auto', textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🍌</div>
        <p style={{ color: 'var(--text-muted)' }}>Loading Arcade Arena...</p>
      </div>
    );
  }

  // Active game run rendering (viewport fitted)
  if (run && run.runId) {
    return (
      <div className="arcade-play-wrapper">
        <GameCanvas
          runId={run.runId}
          onGameOver={handleGameOver}
          onQuit={() => {
            if (confirm('Are you sure you want to forfeit this ranked match? Your token has already been spent.')) {
              handleGameOver({ score: 0, level: 1, durationMs: 1000 });
            }
          }}
        />
      </div>
    );
  }

  // Game over screen
  if (gameOverStats) {
    const timeFormatted = (gameOverStats.durationMs / 1000).toFixed(1);

    return (
      <div style={{ maxWidth: '480px', margin: '1rem auto' }}>
        <div className="card card-elevated" style={{ textAlign: 'center', padding: '1.75rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.25rem' }}>🏁</div>
          <h2 style={{ marginBottom: '0.25rem' }}>Ranked Match Complete</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0 0 1.25rem 0' }}>
            Your final performance has been submitted for verification.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.75rem',
              margin: '1.25rem 0',
              padding: '1.25rem',
              backgroundColor: 'var(--bg-surface-alt)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
            }}
          >
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Score
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--primary-text)' }} className="tabular-nums">
                {gameOverStats.score}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Level
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {gameOverStats.level}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Survive Time
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)' }} className="tabular-nums">
                {timeFormatted}s
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-around',
              padding: '0.4rem',
              marginBottom: '1rem',
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
            }}
          >
            <span>Catches: <strong>{gameOverStats.catches || gameOverStats.score}</strong></span>
            <span>Max Combo: <strong>{gameOverStats.maxCombo || 0}x</strong></span>
          </div>

          {/* Submission Status */}
          <div style={{ margin: '1rem 0' }}>
            {submitState === 'saving' && (
              <div className="badge badge-amber" style={{ padding: '0.5rem 1rem', fontSize: '0.88rem' }}>
                <span>⏳</span> Verifying & saving score to leaderboard...
              </div>
            )}

            {submitState === 'saved' && (
              <div className="alert alert-success" style={{ justifyContent: 'center', textAlign: 'center' }}>
                <div>
                  <strong>✓ Score recorded: {savedScore} points!</strong>
                  <div style={{ marginTop: '0.35rem' }}>
                    <Link
                      to="/leaderboard"
                      style={{
                        color: 'var(--success-text)',
                        fontWeight: 700,
                        textDecoration: 'underline',
                      }}
                    >
                      View Leaderboard Rankings →
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {submitState === 'rejected' && (
              <div className="alert alert-error" style={{ justifyContent: 'center' }}>
                <span>⚠️</span>
                <strong>Score could not be verified by arcade anti-cheat.</strong>
              </div>
            )}

            {submitState === 'expired' && (
              <div className="alert alert-error" style={{ justifyContent: 'center' }}>
                <span>⚠️</span>
                <strong>Session expired before completion.</strong>
              </div>
            )}

            {submitState === 'error' && (
              <div className="alert alert-error" style={{ justifyContent: 'center', flexDirection: 'column', alignItems: 'center' }}>
                <div>Could not connect to server to record score.</div>
                <button
                  type="button"
                  onClick={handleRetrySubmit}
                  className="btn btn-secondary btn-sm"
                  style={{ marginTop: '0.5rem' }}
                >
                  Retry Submission
                </button>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1.25rem' }}>
            {tokensAvailable > 0 && (
              <button
                type="button"
                onClick={handleStartRanked}
                disabled={starting}
                className="btn btn-success btn-lg"
              >
                {starting ? 'Launching...' : `Play Again (${tokensAvailable} Tokens Left)`}
              </button>
            )}

            <Link
              to="/puzzle"
              className={`btn ${tokensAvailable === 0 ? 'btn-primary btn-lg' : 'btn-outline btn-lg'}`}
            >
              <span>🧩</span> {tokensAvailable === 0 ? 'Solve Puzzle to Play Again' : 'Earn More Tokens'}
            </Link>

            <Link to="/leaderboard" className="btn btn-outline btn-lg">
              Leaderboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Clean Arcade Lobby
  return (
    <div className="game-lobby-container" style={{ maxWidth: '560px' }}>
      {/* Sleek Header */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div className="badge badge-amber" style={{ marginBottom: '0.4rem', fontSize: '0.78rem' }}>
          <span>🎮</span>
          <span>Ranked Arcade Arena</span>
        </div>
        <h1 style={{ marginBottom: '0.25rem', fontSize: '2rem' }}>Banana Catch</h1>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.92rem' }}>
          Catch ripe bananas, avoid spoiled fruit, and compete for the #1 spot on the global leaderboard.
        </p>
      </div>

      {error && (
        <div className="alert alert-error" role="alert" style={{ marginBottom: '1.25rem' }}>
          <span>⚠️</span>
          <div>{error}</div>
        </div>
      )}

      {/* Recover Active Session Banner */}
      {activeRunInfo && (
        <div
          className="card"
          style={{
            border: '2px solid var(--primary)',
            backgroundColor: 'var(--primary-subtle)',
            marginBottom: '1.25rem',
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <div style={{ fontWeight: 800, color: 'var(--primary-text)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>⚡</span> In-Progress Match Detected
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Started at {new Date(activeRunInfo.startedAt).toLocaleTimeString()} ({activeRunInfo.remainingSeconds}s remaining).
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={handleResumeActiveRun}
                className="btn btn-primary btn-sm"
              >
                ▶ Resume Match
              </button>
              <button
                type="button"
                onClick={handleAbandonRun}
                disabled={abandoning}
                className="btn btn-secondary btn-sm"
              >
                {abandoning ? 'Cancelling...' : 'Forfeit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Player Stats Bar */}
      <div
        className="card card-elevated"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '0.5rem',
          padding: '1.15rem 0.5rem',
          marginBottom: '1.25rem',
          backgroundColor: 'var(--bg-surface)',
          textAlign: 'center',
        }}
      >
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Play Tokens
          </div>
          <div
            style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              color: tokensAvailable > 0 ? 'var(--primary-text)' : 'var(--text-muted)',
              marginTop: '0.15rem',
            }}
          >
            🪙 {tokensAvailable}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Personal Best
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-text)', marginTop: '0.15rem' }}>
            ★ {playerStats.personalBest}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Ranked Runs
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.15rem' }}>
            🕹️ {playerStats.totalGames}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Global Rank
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: playerStats.rank ? 'var(--primary)' : 'var(--text-muted)', marginTop: '0.15rem' }}>
            {playerStats.rank ? `#${playerStats.rank}` : '—'}
          </div>
        </div>
      </div>

      {/* Main Ranked Play Action Card */}
      <div className="card card-elevated" style={{ textAlign: 'center', padding: '1.75rem', marginBottom: '1.25rem' }}>
        {tokensAvailable > 0 ? (
          <div>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.35rem' }}>🎮</div>
            <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1.25rem' }}>Ready for Ranked Play</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0 0 1.25rem 0' }}>
              Launch an official arcade session. Spends 1 play token and validates your score on the leaderboard.
            </p>

            <button
              type="button"
              onClick={handleStartRanked}
              disabled={starting}
              className="btn btn-success btn-lg btn-full"
              style={{ fontSize: '1.1rem', padding: '0.85rem' }}
            >
              {starting ? 'Starting Game Run...' : '▶ Start Ranked Match (Spend 1 Token)'}
            </button>

            <div style={{ marginTop: '0.85rem' }}>
              <Link to="/puzzle" style={{ fontSize: '0.85rem', color: 'var(--primary-text)', fontWeight: 600 }}>
                + Earn additional tokens at Puzzle Gate
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.35rem' }}>🪙</div>
            <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1.25rem' }}>No Play Tokens Remaining</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0 0 1.25rem 0', lineHeight: 1.5 }}>
              Each ranked arcade run requires 1 token. Solve an interactive visual math puzzle to earn tokens and unlock the arena.
            </p>

            <Link
              to="/puzzle"
              className="btn btn-primary btn-lg btn-full"
              style={{ fontSize: '1.05rem', padding: '0.85rem' }}
            >
              <span>🧩</span> Solve a Puzzle to Unlock Play
            </Link>
          </div>
        )}
      </div>

      {/* Compact How to Play & Power-Ups Strip */}
      <div
        className="card"
        style={{
          padding: '1rem',
          textAlign: 'left',
          marginBottom: '1.25rem',
          backgroundColor: 'var(--bg-surface)',
        }}
      >
        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
          Rules & Power-Ups
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '0.5rem',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>🍌</span> <span>Banana (+1 pt)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>🌟</span> <span>Golden (+1 pt)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>💖</span> <span>Heart (+1 Life)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>❄️</span> <span>Freeze (Slow-mo)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>🥀</span> <span>Spoiled (-1 Life)</span>
          </div>
        </div>
      </div>

      {/* Recent Ranked Runs Section */}
      {recentRuns.length > 0 && (
        <div className="card" style={{ textAlign: 'left', padding: '1rem' }}>
          <h4 style={{ margin: '0 0 0.65rem 0', fontSize: '0.9rem', color: 'var(--text-main)' }}>
            Recent Ranked Runs
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {recentRuns.map((r) => (
              <div
                key={r.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.45rem 0.65rem',
                  backgroundColor: 'var(--bg-surface-alt)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.82rem',
                }}
              >
                <div>
                  <span style={{ fontWeight: 700, color: 'var(--primary-text)', marginRight: '0.5rem' }}>
                    Score: {r.score}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    {new Date(r.finishedAt).toLocaleDateString()} {new Date(r.finishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <span className="badge badge-success" style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}>
                  Recorded
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default GamePage;
