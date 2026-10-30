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
| `Banana API` | [http://marcconrad.com/uob/banana/doc.php](http://marcconrad.com/uob/banana/doc.php) | Third-party banana puzzle generator API; subject to discontinuation without notice and non-commercial use only | 2026-10-30 |
| `server/.env.example` | AI-assisted (Antigravity) | Added Banana API URL and puzzle configuration defaults (`PUZZLE_TTL_SECONDS`, `PUZZLE_MAX_ATTEMPTS`, `BANANA_TIMEOUT_MS`) | 2026-10-30 |
| `server/.env` | AI-assisted (Antigravity) | Added Banana API URL and puzzle configuration environment variables | 2026-10-30 |
| `server/config/index.js` | AI-assisted (Antigravity) | Added URL parsing and positive integer validations for puzzle and Banana API settings | 2026-10-30 |
| `server/db/schema.sql` | AI-assisted (Antigravity) | Appended `puzzles` table definition with status check constraint, UUID primary key, foreign key, and user index | 2026-10-30 |
| `server/services/bananaService.js` | AI-assisted (Antigravity) | Implemented Banana API integration with built-in fetch, AbortController timeout, validation, and generic `BananaServiceError` | 2026-10-30 |
| `server/services/puzzleService.js` | AI-assisted (Antigravity) | Implemented puzzle lifecycle management (`createPuzzle`, transactional `checkAnswer`, `cleanupOldPuzzles`) | 2026-10-30 |
| `server/middleware/rateLimiters.js` | AI-assisted (Antigravity) | Added `puzzleLimiter` (20 requests per 10 mins keyed by `req.session.userId`) returning 429 JSON | 2026-10-30 |
| `server/middleware/requireLogin.js` | AI-assisted (Antigravity) | Added session userId synchronization to support both `req.session.userId` and `req.session.user.id` | 2026-10-30 |
| `server/middleware/requireJson.js` | AI-assisted (Antigravity) | Extracted shared middleware ensuring POST bodies provide `Content-Type: application/json` | 2026-10-30 |
| `server/controllers/authController.js` | AI-assisted (Antigravity) | Stored `req.session.userId` on signup and login | 2026-10-30 |
| `server/routes/auth.js` | AI-assisted (Antigravity) | Updated to import shared `requireJson` middleware | 2026-10-30 |
| `server/controllers/puzzleController.js` | AI-assisted (Antigravity) | Implemented HTTP controllers mapping puzzle service results to 201, 200, 400, 404, 409, 410 statuses | 2026-10-30 |
| `server/routes/puzzle.js` | AI-assisted (Antigravity) | Created puzzle router mounted at `/api/puzzle` with `requireLogin`, `puzzleLimiter`, and `requireJson` guards | 2026-10-30 |
| `server/app.js` | AI-assisted (Antigravity) | Mounted `/api/puzzle` router and mapped `BananaServiceError` to 502 with generic friendly message | 2026-10-30 |
| `server/package.json` | AI-assisted (Antigravity) | Added `"test": "node --test"` script | 2026-10-30 |
| `server/tests/puzzleService.test.js` | AI-assisted (Antigravity) | Automated unit tests covering correct, wrong, exhausted attempts, expired, other user, and duplicate answers using in-memory SQLite and mocked bananaService | 2026-10-30 |
| `client/src/api/puzzle.js` | AI-assisted (Antigravity) | Client API functions for `newPuzzle` and `submitAnswer` with error status attachment | 2026-10-30 |
| `client/src/pages/PuzzlePage.jsx` | AI-assisted (Antigravity) | Puzzle gate UI with countdown timer, single-digit input, StrictMode mount guard, all status states, and unlocked play game link | 2026-10-30 |
| `server/.env.example` | AI-assisted (Antigravity) | Added `PLAY_TOKEN_TTL_SECONDS=900` and `RUN_MAX_SECONDS=600` defaults | 2026-10-30 |
| `server/.env` | AI-assisted (Antigravity) | Configured `PLAY_TOKEN_TTL_SECONDS` and `RUN_MAX_SECONDS` environment variables | 2026-10-30 |
| `server/config/index.js` | AI-assisted (Antigravity) | Validated `PLAY_TOKEN_TTL_SECONDS` and `RUN_MAX_SECONDS` as positive integers at startup | 2026-10-30 |
| `server/db/schema.sql` | AI-assisted (Antigravity) | Appended `play_tokens` table with status constraint, foreign keys to users and puzzles, and user index | 2026-10-30 |
| `server/services/tokenService.js` | AI-assisted (Antigravity) | Implemented play token lifecycle (`createTokenForPuzzle`, `expireStaleTokens`, `countAvailable`, and atomic `startRun`) | 2026-10-30 |
| `server/services/puzzleService.js` | AI-assisted (Antigravity) | Integrated transactional play token issuance upon correct answer and returned `unlocked: true` flag | 2026-10-30 |
| `server/middleware/rateLimiters.js` | AI-assisted (Antigravity) | Added `gameLimiter` (10 requests per minute per user on POST /api/game/start) returning 429 JSON | 2026-10-30 |
| `server/controllers/gameController.js` | AI-assisted (Antigravity) | Implemented `getStatus` (available tokens) and `start` (spend token and return runId) HTTP controllers | 2026-10-30 |
| `server/routes/game.js` | AI-assisted (Antigravity) | Mounted `/api/game` router with `requireLogin`, `gameLimiter`, and `requireJson` protections | 2026-10-30 |
| `server/app.js` | AI-assisted (Antigravity) | Mounted `/api/game` router under Express `/api` pipeline | 2026-10-30 |
| `server/tests/puzzleService.test.js` | AI-assisted (Antigravity) | Updated test assertions to expect `unlocked: true` on correct answers | 2026-10-30 |
| `server/tests/tokenService.test.js` | AI-assisted (Antigravity) | Automated unit tests covering all token lifecycle behaviors and transaction guarantees | 2026-10-30 |
| `client/package.json` | AI-assisted (Antigravity) | Added `"test": "node --test"` script for client unit tests | 2026-10-30 |
| `client/src/events/emitter.js` | AI-assisted (Antigravity) | Implemented custom `EventEmitter` class with `on`, `off`, `emit`, and unsubscribe cleanup function | 2026-10-30 |
| `client/src/game/config.js` | AI-assisted (Antigravity) | Game configuration constants (dimensions, speeds, intervals, lives, frame caps, collision sizes) | 2026-10-30 |
| `client/src/game/collision.js` | AI-assisted (Antigravity) | Pure function `rectsOverlap` for 2D axis-aligned bounding box collision detection | 2026-10-30 |
| `client/src/game/input.js` | AI-assisted (Antigravity) | Input controller tracking keyboard (Arrows, A/D) and pointer/touch canvas drag with listener cleanup | 2026-10-30 |
| `client/src/game/entities.js` | AI-assisted (Antigravity) | Plain JS entity classes for `Basket` and `FallingItem` with bounds and physics updates | 2026-10-30 |
| `client/src/game/Game.js` | AI-assisted (Antigravity) | Plain JavaScript game engine running requestAnimationFrame loop, delta time capping, visibility pauses, event emissions, and canvas rendering (no external art, sounds, or game libraries) | 2026-10-30 |
| `client/tests/collision.test.js` | AI-assisted (Antigravity) | Unit tests verifying rectangle collision overlap, non-overlap, edge touching, and invalid bounds | 2026-10-30 |
| `client/tests/emitter.test.js` | AI-assisted (Antigravity) | Unit tests verifying event subscription, emission, payload delivery, off, and unsubscribe safety | 2026-10-30 |
| `client/src/api/game.js` | AI-assisted (Antigravity) | Client API functions for `getStatus` and `startGame` with HTTP status error attachment | 2026-10-30 |
| `client/src/components/GameCanvas.jsx` | AI-assisted (Antigravity) | Responsive canvas component mounting Game engine, StrictMode safe, rendering HUD from events | 2026-10-30 |
| `client/src/pages/GamePage.jsx` | AI-assisted (Antigravity) | Game lobby and active game page handling token availability, Start game action, game over stats, and navigation | 2026-10-30 |
| `server/package.json` | AI-assisted (Antigravity) | Added `helmet` dependency for secure HTTP headers | 2026-10-30 |
| `server/config/gameRules.js` | AI-assisted (Antigravity) | Server-side validation constants (`MIN_SPAWN_INTERVAL_MS`, `CATCHES_PER_LEVEL`) and `maxPlausibleScore` upper-bound function | 2026-10-30 |
| `server/services/scoreService.js` | AI-assisted (Antigravity) | Transactional `finishRun` with plausibility checks, audit logging, and `getLeaderboard` CTE query with tie-breaking | 2026-10-30 |
| `server/middleware/originCheck.js` | AI-assisted (Antigravity) | Defense-in-depth origin validation middleware for state-changing HTTP requests | 2026-10-30 |
| `server/controllers/gameController.js` | AI-assisted (Antigravity) | Added `finish` handler validating UUID and mapping outcome results to HTTP statuses | 2026-10-30 |
| `server/routes/game.js` | AI-assisted (Antigravity) | Added `POST /api/game/finish` with `requireJson` and `gameLimiter`, and added `Cache-Control: no-store` | 2026-10-30 |
| `server/routes/auth.js` | AI-assisted (Antigravity) | Added `Cache-Control: no-store` header to all authentication responses | 2026-10-30 |
| `server/controllers/leaderboardController.js` | AI-assisted (Antigravity) | Public leaderboard handler returning top 10 and session user rank with `Cache-Control: no-store` | 2026-10-30 |
| `server/routes/leaderboard.js` | AI-assisted (Antigravity) | Mounted public `/api/leaderboard` route | 2026-10-30 |
| `server/app.js` | AI-assisted (Antigravity) | Integrated `helmet()`, `originCheck`, reverse proxy comment, and mounted `/api/leaderboard` | 2026-10-30 |
| `docs/design/known-limitations.md` | AI-assisted (Antigravity) | Documented known architecture limitations and security boundaries | 2026-10-30 |
| `server/tests/scoreService.test.js` | AI-assisted (Antigravity) | Automated unit tests for `maxPlausibleScore`, `finishRun` checks, and `getLeaderboard` using in-memory SQLite and clock injection | 2026-10-30 |
| `client/src/api/game.js` | AI-assisted (Antigravity) | Added `finishGame` submitting only runId and score | 2026-10-30 |
| `client/src/api/leaderboard.js` | AI-assisted (Antigravity) | Added `getLeaderboard` fetch function | 2026-10-30 |
| `client/src/pages/GamePage.jsx` | AI-assisted (Antigravity) | Implemented score submission state machine, retry mechanism, and status displays on game over | 2026-10-30 |
| `client/src/pages/LeaderboardPage.jsx` | AI-assisted (Antigravity) | Leaderboard table UI with top 10, current user highlight, rank outside top 10, and plain text usernames | 2026-10-30 |

> **Note on Assets & Libraries**: No external art, sounds, or third-party game frameworks/libraries are used. The Banana Catch game is built in vanilla JavaScript using the native HTML5 Canvas 2D API, standard Unicode emojis, and browser input/animation primitives.

