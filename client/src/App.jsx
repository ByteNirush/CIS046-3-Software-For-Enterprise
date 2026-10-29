// Author: [my name] | External/AI code in this file: AI-assisted (Antigravity), reviewed and understood by me

import { Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import PuzzlePage from './pages/PuzzlePage.jsx';
import GamePage from './pages/GamePage.jsx';
import LeaderboardPage from './pages/LeaderboardPage.jsx';

function App() {
  return (
    <div>
      <NavBar />
      <main style={{ padding: '1rem' }}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route
            path="/puzzle"
            element={
              <ProtectedRoute>
                <PuzzlePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/game"
            element={
              <ProtectedRoute>
                <GamePage />
              </ProtectedRoute>
            }
          />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
