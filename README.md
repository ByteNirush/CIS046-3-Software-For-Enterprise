# Banana Clash

Banana Clash is a real-time 1v1 puzzle battle game for the web where two authenticated players compete head-to-head on the same Banana puzzle. Players race against each other to solve the mathematical puzzle first; the fastest solver scores points and inflicts a gameplay handicap onto their opponent, creating a dynamic, competitive multiplayer experience.

## Tech Stack

- **Front End**: HTML5, CSS3, Vanilla JavaScript (ES modules) — no external frontend frameworks or game engines.
- **Back End**: Node.js, Express, and `ws` (WebSocket) for real-time multiplayer match coordination.
- **Database**: SQLite (via `better-sqlite3`).
- **Authentication**: Password hashing with `bcrypt` and session management with `express-session` cookies.
- **External Service**: Banana puzzle API (https://marcconrad.com/uob/banana/doc.php), requested securely from the backend server.

## Folder Overview

```
banana-clash/
├── client/
│   ├── index.html               # Main single-page application entry HTML
│   ├── css/
│   │   └── style.css            # Global stylesheet and UI theme
│   ├── js/
│   │   ├── main.js              # Client application entry point
│   │   ├── game/                # Client game state and rules display
│   │   ├── events/              # Custom event emitter for client events
│   │   ├── net/                 # WebSocket client connection and reconnection logic
│   │   ├── ui/                  # UI view controllers (login, lobby, match, results, leaderboard)
│   │   └── api/                 # REST API client helpers
│   └── assets/
│       ├── images/              # Static game graphics and icons
│       └── sounds/              # Audio effects and sound cues
├── server/
│   ├── app.js                   # Express and WebSocket server entry point
│   ├── config/                  # Server configuration loaded from environment variables
│   ├── routes/                  # Express HTTP route definitions (auth, leaderboard, profile)
│   ├── controllers/             # Request handlers for HTTP routes
│   ├── services/                # Business logic (bananaService.js, matchService.js)
│   ├── sockets/                 # WebSocket event routers, rooms, and match messaging
│   ├── middleware/              # Express middlewares (auth check, error handling)
│   ├── db/                      # SQLite database setup and schema definitions
│   └── tests/                   # Backend unit and integration tests
├── docs/
│   ├── design/                  # Architecture notes, specifications, and diagrams
│   ├── testing/                 # Test evidence and logs
│   ├── references.md            # Registry of external and AI-generated code sources
│   └── video-notes.md           # Presentation video notes and outline
├── .env.example                 # Example environment variables template
├── .gitignore                   # Ignored files for version control
├── package.json                 # Project metadata, scripts, and dependencies
└── README.md                    # Project documentation
```

## Setup and Run Instructions

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd banana-clash
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   Review `.env` and adjust the configuration values if necessary.

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Run the application**:
   - For development (with auto-reload):
     ```bash
     npm run dev
     ```
   - For production / standard start:
     ```bash
     npm run start
     ```

## Third-party and AI-generated code

All external libraries, snippets, assets, and AI-assisted contributions are documented in [docs/references.md](docs/references.md).

