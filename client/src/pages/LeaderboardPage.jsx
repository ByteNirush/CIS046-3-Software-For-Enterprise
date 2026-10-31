import { useState, useEffect } from 'react';
import { getLeaderboard } from '../api/leaderboard.js';
import useAuth from '../hooks/useAuth.js';

function LeaderboardPage() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchScores = async (isMounted = { current: true }) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getLeaderboard();
      if (isMounted.current) {
        setLeaderboard(data.leaderboard || []);
        setMe(data.me || null);
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err.message || 'Failed to load leaderboard. Please try again.');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const isMounted = { current: true };
    fetchScores(isMounted);

    return () => {
      isMounted.current = false;
    };
  }, []);

  const formatDate = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  // Determine if logged-in user has a finished score outside the displayed top 10
  const isMeInTopTen = me && leaderboard.some((entry) => entry.rank === me.rank);

  return (
    <div className="leaderboard-container">
      <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
        <div className="badge badge-amber" style={{ marginBottom: '0.5rem' }}>
          <span>🏆</span>
          <span>Hall of Fame</span>
        </div>
        <h1>Arcade Leaderboard</h1>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>
          Real-time top rankings verified by the arcade anti-cheat engine.
        </p>
      </div>

      {/* Personal Rank Highlight Card (if logged in and has recorded score) */}
      {me && (
        <div
          className="card"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.5rem',
            marginBottom: '1.5rem',
            backgroundColor: 'var(--primary-subtle)',
            borderColor: '#fde68a',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }} aria-hidden="true">🎖️</span>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--primary-text)', fontWeight: 600, textTransform: 'uppercase' }}>
                Your Record
              </div>
              <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '1.1rem' }}>
                {user?.username || 'You'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Score: </span>
              <strong style={{ fontSize: '1.1rem' }} className="tabular-nums">{me.bestScore}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Rank: </span>
              <span className="badge badge-amber" style={{ fontSize: '0.85rem' }}>
                #{me.rank}
              </span>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>Fetching top players...</p>
        </div>
      )}

      {error && (
        <div className="alert alert-error" style={{ display: 'block', textAlign: 'center', padding: '1.5rem' }}>
          <p style={{ fontWeight: 600, marginBottom: '0.75rem' }}>{error}</p>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => fetchScores()}
          >
            Retry Loading
          </button>
        </div>
      )}

      {!loading && !error && leaderboard.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🍌</div>
          <h3>No scores on the board yet</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Be the pioneer! Solve a puzzle and set the first record on the leaderboard.
          </p>
        </div>
      )}

      {!loading && !error && leaderboard.length > 0 && (
        <div className="table-responsive">
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th style={{ width: '80px', textAlign: 'center' }}>Rank</th>
                <th>Player</th>
                <th style={{ textAlign: 'right' }}>Best Score</th>
                <th style={{ textAlign: 'right', width: '130px' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry) => {
                const isCurrent =
                  user?.username &&
                  entry.username.toLowerCase() === user.username.toLowerCase();

                return (
                  <tr
                    key={entry.rank}
                    className={isCurrent ? 'user-row' : ''}
                  >
                    <td style={{ textAlign: 'center' }}>
                      {entry.rank === 1 ? (
                        <span className="rank-badge rank-1" title="First Place">1</span>
                      ) : entry.rank === 2 ? (
                        <span className="rank-badge rank-2" title="Second Place">2</span>
                      ) : entry.rank === 3 ? (
                        <span className="rank-badge rank-3" title="Third Place">3</span>
                      ) : (
                        <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{entry.rank}</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span>{entry.username}</span>
                        {isCurrent && (
                          <span className="badge badge-amber" style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem' }}>
                            You
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }} className="tabular-nums">
                      <span style={{ color: 'var(--primary)' }}>★ </span>
                      {entry.bestScore}
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {formatDate(entry.achievedAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default LeaderboardPage;
