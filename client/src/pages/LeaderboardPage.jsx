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
    <div style={{ maxWidth: '650px', margin: '2rem auto', textAlign: 'center' }}>
      <h1>Banana Arcade Leaderboard</h1>

      {loading && <p>Loading leaderboard...</p>}

      {error && (
        <div style={{ margin: '1.5rem 0' }}>
          <p style={{ color: '#c62828', marginBottom: '0.75rem' }}>{error}</p>
          <button
            type="button"
            onClick={() => fetchScores()}
            style={{
              padding: '0.4rem 1rem',
              backgroundColor: '#1976d2',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && leaderboard.length === 0 && (
        <p style={{ margin: '2rem 0', color: '#666', fontSize: '1.1rem' }}>
          No scores yet. Be the first!
        </p>
      )}

      {!loading && !error && leaderboard.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              margin: '0 auto',
              textAlign: 'left',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Rank</th>
                <th style={{ padding: '0.75rem 1rem' }}>Player</th>
                <th style={{ padding: '0.75rem 1rem' }}>Best Score</th>
                <th style={{ padding: '0.75rem 1rem' }}>Date</th>
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
                    style={{
                      borderBottom: '1px solid #eee',
                      backgroundColor: isCurrent ? '#fff9c4' : 'transparent',
                      fontWeight: isCurrent ? 'bold' : 'normal',
                    }}
                  >
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {entry.rank === 1 && '🥇 '}
                      {entry.rank === 2 && '🥈 '}
                      {entry.rank === 3 && '🥉 '}
                      {entry.rank}
                    </td>
                    {/* Rendered as plain text to prevent HTML injection */}
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {entry.username} {isCurrent && '(You)'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>{entry.bestScore}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#666', fontSize: '0.9rem' }}>
                      {formatDate(entry.achievedAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Show personal rank if logged in and not in the top 10 */}
          {me && !isMeInTopTen && (
            <div
              style={{
                marginTop: '1.5rem',
                padding: '0.75rem 1rem',
                backgroundColor: '#e3f2fd',
                borderRadius: '6px',
                display: 'inline-block',
              }}
            >
              Your best: <strong>{me.bestScore}</strong> (rank {me.rank})
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default LeaderboardPage;
