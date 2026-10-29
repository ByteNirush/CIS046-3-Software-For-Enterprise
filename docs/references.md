# Third-Party and AI-Generated Code References

| File | Source (URL, tool, or person) | What was used | Date |
| --- | --- | --- | --- |
| `server/package.json` | AI-assisted (Antigravity) | Configured ES module support and added `express-rate-limit` dependency | 2026-10-29 |
| `server/.env.example` | AI-assisted (Antigravity) | Updated `DATABASE_PATH` to `./data/banana.db` | 2026-10-29 |
| `server/.env` | AI-assisted (Antigravity) | Updated `DATABASE_PATH` to `./data/banana.db` while preserving secure random secret | 2026-10-29 |
| `.gitignore` | AI-assisted (Antigravity) | Added `data/` directory to git-ignored rules | 2026-10-29 |
| `server/config/index.js` | AI-assisted (Antigravity) | Environment configuration loader with fail-fast validation for `SESSION_SECRET` | 2026-10-29 |
| `server/db/schema.sql` | AI-assisted (Antigravity) | SQL schema defining `users` table with case-insensitive unique username and timestamps | 2026-10-29 |
| `server/db/index.js` | AI-assisted (Antigravity) | SQLite database initialization with `better-sqlite3`, auto-dir creation, foreign keys, and schema execution | 2026-10-29 |
| `server/db/db.js` | AI-assisted (Antigravity) | Re-exported database connection from `index.js` | 2026-10-29 |
| `server/middleware/requireLogin.js` | AI-assisted (Antigravity) | Authentication guard middleware returning 401 `{ error: "Not logged in" }` when unauthenticated | 2026-10-29 |
| `server/middleware/rateLimiters.js` | AI-assisted (Antigravity) | IP-based rate limiter middleware (10 requests per 15 minutes) for signup and login returning JSON 429 | 2026-10-29 |
| `server/controllers/authController.js` | AI-assisted (Antigravity) | Handlers for user signup (bcrypt cost 12), login (with dummy hash timing mitigation), logout, and getMe | 2026-10-29 |
| `server/routes/auth.js` | AI-assisted (Antigravity) | Auth router mounted at `/api/auth` with rate limiting, 415 Content-Type check, and route protection | 2026-10-29 |
| `server/app.js` | AI-assisted (Antigravity) | Express app setup with `express-session`, 2-hour cookie, MemoryStore, `/api/auth` routing, and error handlers | 2026-10-29 |
| `client/index.html` | AI-assisted (Antigravity) | Updated mount container to `#root` and loaded React entry point `/src/main.jsx` | 2026-10-29 |
| `client/src/api/auth.js` | AI-assisted (Antigravity) | Client fetch functions for `signup`, `login`, `logout`, and `getMe` using same-origin credentials | 2026-10-29 |
| `client/src/context/AuthContext.jsx` | AI-assisted (Antigravity) | React Context managing user authentication state and session hydration on initial load | 2026-10-29 |
| `client/src/hooks/useAuth.js` | AI-assisted (Antigravity) | React hook providing access to `AuthContext` | 2026-10-29 |
| `client/src/main.jsx` | AI-assisted (Antigravity) | Wrapped application root with `AuthProvider` | 2026-10-29 |
| `client/src/components/ProtectedRoute.jsx` | AI-assisted (Antigravity) | Route guard displaying loading state and redirecting unauthenticated users to `/login` | 2026-10-29 |
| `client/src/components/NavBar.jsx` | AI-assisted (Antigravity) | Navigation bar component with Home, Leaderboard, auth links, username, and Logout button | 2026-10-29 |
| `client/src/App.jsx` | AI-assisted (Antigravity) | Route configuration protecting `/puzzle` and `/game` and displaying `NavBar` across all pages | 2026-10-29 |
| `client/src/pages/LoginPage.jsx` | AI-assisted (Antigravity) | Controlled login form with input validation, error handling, autocomplete attributes, and redirect | 2026-10-29 |
| `client/src/pages/SignupPage.jsx` | AI-assisted (Antigravity) | Controlled signup form with input validation, error handling, autocomplete attributes, and redirect | 2026-10-29 |
| `client/src/pages/LandingPage.jsx` | AI-assisted (Antigravity) | Landing page component introducing Banana Arcade with navigation to login, signup, or gameplay | 2026-10-29 |
| `docs/references.md` | AI-assisted (Antigravity) | Documented external and AI-assisted code contributions | 2026-10-29 |
