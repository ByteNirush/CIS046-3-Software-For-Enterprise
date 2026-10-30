import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

function LandingPage() {
  const { user, loading } = useAuth();

  return (
    <div style={{ maxWidth: '600px', margin: '3rem auto', textAlign: 'center' }}>
      <h1>🍌 Welcome to Banana Arcade</h1>
      <p style={{ fontSize: '1.2rem', color: '#555', margin: '1.5rem 0' }}>
        A real-time math puzzle challenge where quick thinking and sharp problem-solving skills take the crown.
        Solve puzzles, climb the leaderboard, and challenge other arcade players!
      </p>

      {loading ? (
        <p>Loading...</p>
      ) : user ? (
        <div style={{ marginTop: '2rem' }}>
          <p>Logged in as <strong>{user.username}</strong></p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
            <Link to="/puzzle" style={{ padding: '0.5rem 1.5rem', background: '#e0a800', color: '#000', textDecoration: 'none', borderRadius: '4px', fontWeight: 'bold' }}>
              Play Puzzle
            </Link>
            <Link to="/leaderboard" style={{ padding: '0.5rem 1.5rem', background: '#eee', color: '#333', textDecoration: 'none', borderRadius: '4px' }}>
              View Leaderboard
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
          <Link to="/login" style={{ padding: '0.5rem 1.5rem', background: '#333', color: '#fff', textDecoration: 'none', borderRadius: '4px' }}>
            Login
          </Link>
          <Link to="/signup" style={{ padding: '0.5rem 1.5rem', background: '#e0a800', color: '#000', textDecoration: 'none', borderRadius: '4px', fontWeight: 'bold' }}>
            Sign Up
          </Link>
        </div>
      )}
    </div>
  );
}

export default LandingPage;
