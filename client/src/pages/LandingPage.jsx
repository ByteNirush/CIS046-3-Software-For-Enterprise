import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

function LandingPage() {
  const { user, loading } = useAuth();

  return (
    <div>
      <section className="hero-section">
        <div className="hero-pill">
          <span>🍌</span>
          <span>Classic Web Arcade & Math Challenge</span>
        </div>

        <h1 className="hero-title">
          Crack the Puzzle.<br />Catch the Bananas.
        </h1>

        <p className="hero-subtitle">
          Banana Clash pairs fast-paced mental arithmetic with vintage arcade reflexes.
          Solve the visual riddle to earn tokens, play the catch run, and climb the verified leaderboard.
        </p>

        {loading ? (
          <div style={{ color: 'var(--text-muted)' }}>Checking session...</div>
        ) : user ? (
          <div className="card" style={{ maxWidth: '520px', margin: '0 auto', textAlign: 'center' }}>
            <p style={{ margin: '0 0 1.25rem', fontSize: '1rem', color: 'var(--text-muted)' }}>
              Ready to play, <strong style={{ color: 'var(--text-main)' }}>{user.username}</strong>?
            </p>
            <div className="hero-actions">
              <Link to="/puzzle" className="btn btn-primary btn-lg">
                <span>🧩</span> Solve Puzzle
              </Link>
              <Link to="/game" className="btn btn-success btn-lg">
                <span>🎮</span> Arcade Game
              </Link>
              <Link to="/leaderboard" className="btn btn-secondary btn-lg">
                <span>🏆</span> Leaderboard
              </Link>
            </div>
          </div>
        ) : (
          <div className="hero-actions">
            <Link to="/signup" className="btn btn-primary btn-lg">
              Create Account
            </Link>
            <Link to="/login" className="btn btn-secondary btn-lg">
              Sign In
            </Link>
            <Link to="/leaderboard" className="btn btn-outline btn-lg">
              Browse Scores
            </Link>
          </div>
        )}
      </section>

      {/* 3-Step Game Loop Explanation */}
      <section>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.4rem' }}>How Banana Clash Works</h2>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            A fair, token-gated arcade experience in three simple steps.
          </p>
        </div>

        <div className="arcade-features-grid">
          <div className="feature-step-card">
            <div className="feature-step-num">1</div>
            <h3 className="feature-step-title">Solve the Puzzle Gate</h3>
            <p className="feature-step-desc">
              Decode the visual banana math riddle to identify the missing digit (0–9).
              Each solved puzzle awards 1 verified play token.
            </p>
          </div>

          <div className="feature-step-card">
            <div className="feature-step-num">2</div>
            <h3 className="feature-step-title">Catch & Dodge</h3>
            <p className="feature-step-desc">
              Pilot your basket using arrow keys, A/D, or touch drag. Catch ripe bananas for points,
              level up for speed, and avoid rotten fruit.
            </p>
          </div>

          <div className="feature-step-card">
            <div className="feature-step-num">3</div>
            <h3 className="feature-step-title">Climb the Leaderboard</h3>
            <p className="feature-step-desc">
              Scores are validated by the server to ensure fair competition.
              Secure your high score and earn a spot on the hall of fame.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;
