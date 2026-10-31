import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <span className="navbar-brand-icon" aria-hidden="true">🍌</span>
          <span>Banana Clash</span>
        </Link>

        <nav aria-label="Main navigation">
          <ul className="navbar-nav">
            <li>
              <NavLink
                to="/"
                end
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                Home
              </NavLink>
            </li>
            {user && (
              <>
                <li>
                  <NavLink
                    to="/puzzle"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  >
                    Puzzle Gate
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/game"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  >
                    Arcade Game
                  </NavLink>
                </li>
              </>
            )}
            <li>
              <NavLink
                to="/leaderboard"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                Leaderboard
              </NavLink>
            </li>
          </ul>
        </nav>

        <div className="navbar-user-section">
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div className="user-badge" title={`Signed in as ${user.username}`}>
                <span className="user-avatar-mini" aria-hidden="true">
                  {user.username.charAt(0).toUpperCase()}
                </span>
                <span>{user.username}</span>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleLogout}
                aria-label="Log out of your account"
              >
                Logout
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Link to="/login" className="btn btn-outline btn-sm">
                Login
              </Link>
              <Link to="/signup" className="btn btn-primary btn-sm">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default NavBar;
