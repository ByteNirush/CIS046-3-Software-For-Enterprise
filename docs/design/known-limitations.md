# Known Limitations and Architectural Trade-offs

This document details known limitations, architectural trade-offs, and security boundaries in the current design of the Banana Arcade application:

1. **In-Memory Session Store (`MemoryStore`)**:
   - `express-session` is currently configured with `MemoryStore` for local development.
   - Sessions are not shared across processes and will reset whenever the Node.js server restarts.
   - In production, this should be replaced with a persistent, distributed store such as Redis or SQLite session store (`connect-sqlite3`).

2. **No Synchronizer CSRF Token System**:
   - State-changing endpoints rely on `SameSite=Lax` cookies and an `Origin` header validation middleware (`server/middleware/originCheck.js`) as defense-in-depth.
   - It does not implement cryptographic synchronizer anti-CSRF tokens.

3. **No Email Verification**:
   - User account registration allows arbitrary alphanumeric usernames and passwords without requiring email verification or proof of identity.

4. **No Multi-Factor Authentication (MFA)**:
   - Authentication relies solely on single-factor credentials (username + bcrypt-hashed password) with rate-limiting mitigations on login/signup endpoints.

5. **Plausibility-Checked Scores (Not Provably Honest)**:
   - Scores are validated against server-measured elapsed time using `maxPlausibleScore(elapsedMs) = Math.floor(elapsedMs / MIN_SPAWN_INTERVAL_MS) + 1`.
   - While this prevents impossible scores, speed hacks, and instant submissions, it is a necessary condition rather than a mathematical proof of human honesty. An automated script could still submit scores within plausible bounds.

6. **External Banana API Reliability**:
   - Banana puzzle generation relies on an external third-party HTTP service (`http://marcconrad.com/uob/banana/api.php`).
   - The service is outside our control, subject to rate limits, network latency, or discontinuation without prior notice. Timeouts and failures are caught and surfaced gracefully as HTTP 502 responses.

7. **Plain-Text Puzzle Solutions in Database**:
   - Generated puzzle solutions (single digits 0–9) are stored in plain text in the `puzzles` database table to permit answer validation.
   - While database access is restricted to the backend service and solutions are never leaked through API responses, a compromise of the database file grants access to active pending puzzle solutions.

