// Author: [my name] | External/AI code in this file: AI-assisted (Antigravity), reviewed and understood by me

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

function SignupPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    if (!username.trim() || !/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return 'Username must be 3–20 characters long and contain only letters, numbers, and underscores.';
    }
    if (!password || password.length < 8 || password.length > 72) {
      return 'Password must be between 8 and 72 characters.';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      await signup(username, password);
      navigate('/puzzle');
    } catch (err) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '2rem auto' }}>
      <h2>Create a Banana Arcade Account</h2>
      {error && (
        <div style={{ color: 'red', marginBottom: '1rem' }} role="alert">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="signup-username" style={{ display: 'block', marginBottom: '0.25rem' }}>
            Username
          </label>
          <input
            id="signup-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
            style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="signup-password" style={{ display: 'block', marginBottom: '0.25rem' }}>
            Password
          </label>
          <input
            id="signup-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
            style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box' }}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', padding: '0.5rem', cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>
      </form>
      <p style={{ marginTop: '1rem' }}>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}

export default SignupPage;
