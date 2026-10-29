// Purpose: Placeholder page component for LandingPage.
// Author: [my name] | External/AI code in this file: AI-assisted (Antigravity)

import { useState, useEffect } from 'react';
import { fetchHealth } from '../api/health.js';

function LandingPage() {
  // TEMPORARY: remove once real API calls exist
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // TEMPORARY: remove once real API calls exist
    fetchHealth()
      .then((data) => {
        setHealth(data);
      })
      .catch((err) => {
        setError(err.message);
      });
  }, []);

  return (
    <div>
      <div>LandingPage</div>
      {/* TEMPORARY: remove once real API calls exist */}
      {error && <div>Server Error: {error}</div>}
      {health && <div>Server Status: {health.status}</div>}
    </div>
  );
}

export default LandingPage;
