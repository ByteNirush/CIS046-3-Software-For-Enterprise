import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.75rem 1rem', borderBottom: '1px solid #ccc' }}>
      <Link to="/">Home</Link>
      <Link to="/leaderboard">Leaderboard</Link>
      {user ? (
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span>{user.username}</span>
          <button type="button" onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.75rem' }}>
          <Link to="/login">Login</Link>
          <Link to="/signup">Signup</Link>
        </div>
      )}
    </nav>
  );
}

export default NavBar;
