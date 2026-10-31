import { useEffect, useRef, useState, useCallback } from 'react';
import { EventEmitter } from '../events/emitter.js';
import { Game } from '../game/Game.js';
import { LOGICAL_WIDTH, LOGICAL_HEIGHT, START_LIVES } from '../game/config.js';
import sound from '../game/audio.js';

export function GameCanvas({ runId, onGameOver, onQuit }) {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(START_LIVES);
  const [level, setLevel] = useState(1);
  const [combo, setCombo] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(() => sound.getMuted());

  const togglePause = useCallback(() => {
    if (!gameRef.current) return;
    if (isPaused) {
      gameRef.current.resume();
    } else {
      gameRef.current.pause();
    }
  }, [isPaused]);

  const toggleSound = () => {
    const nextMuted = sound.toggleMuted();
    setIsMuted(nextMuted);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const emitter = new EventEmitter();
    const game = new Game(canvas, emitter);
    gameRef.current = game;

    // Subscribe to game engine events
    const unCatch = emitter.on('catch', (payload) => {
      setScore(payload.score);
      setCombo(payload.combo || 0);
    });

    const unMiss = emitter.on('miss', (payload) => {
      setLives(payload.lives);
      setCombo(0);
    });

    const unLifeLost = emitter.on('lifeLost', (payload) => {
      setLives(payload.lives);
      setCombo(0);
    });

    const unHeal = emitter.on('heal', (payload) => {
      setLives(payload.lives);
    });

    const unLevelUp = emitter.on('levelUp', (payload) => {
      setLevel(payload.level);
    });

    const unPause = emitter.on('pause', () => {
      setIsPaused(true);
    });

    const unResume = emitter.on('resume', () => {
      setIsPaused(false);
    });

    const unGameOver = emitter.on('gameOver', (payload) => {
      if (onGameOver) {
        onGameOver(payload);
      }
    });

    // Global keyboard listener for pause shortcut
    const handleKeyDown = (e) => {
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        e.preventDefault();
        togglePause();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Start game run
    game.start();

    // Cleanup ensures safe teardown under React StrictMode double-mounting
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      game.destroy();
      unCatch();
      unMiss();
      unLifeLost();
      unHeal();
      unLevelUp();
      unPause();
      unResume();
      unGameOver();
      gameRef.current = null;
    };
  }, [onGameOver, togglePause]);

  // Touch control handlers
  const handleVirtualLeft = (start) => {
    if (gameRef.current) {
      gameRef.current.setVirtualDirection(start ? -1 : 0);
    }
  };

  const handleVirtualRight = (start) => {
    if (gameRef.current) {
      gameRef.current.setVirtualDirection(start ? 1 : 0);
    }
  };

  return (
    <div className="arcade-cabinet">
      {/* Heads-Up Display (HUD) */}
      <div className="game-hud">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div className="hud-pill tabular-nums">
            <span style={{ color: 'var(--primary)', fontSize: '1rem' }}>★</span>
            <span>Score: <strong>{score}</strong></span>
          </div>

          {combo >= 2 && (
            <span
              className="badge badge-amber"
              style={{
                fontSize: '0.7rem',
                padding: '0.1rem 0.35rem',
              }}
            >
              {combo}x STREAK
            </span>
          )}
        </div>

        <div className="hud-pill" aria-label={`Lives remaining: ${lives}`}>
          <span>
            {Array.from({ length: Math.max(0, lives) }).map((_, i) => (
              <span key={i} style={{ marginRight: '1px' }}>❤️</span>
            ))}
            {lives <= 0 && <span>💀</span>}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span
            className="badge badge-amber"
            style={{
              padding: '0.15rem 0.45rem',
              fontSize: '0.72rem',
              fontWeight: 800,
            }}
          >
            LVL {level}
          </span>

          <button
            type="button"
            onClick={toggleSound}
            aria-label={isMuted ? 'Unmute sounds' : 'Mute sounds'}
            title={isMuted ? 'Unmute sounds' : 'Mute sounds'}
            className="btn btn-sm"
            style={{
              padding: '0.15rem 0.4rem',
              fontSize: '0.8rem',
              backgroundColor: '#334155',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>

          <button
            type="button"
            onClick={togglePause}
            className="btn btn-secondary btn-sm"
            style={{
              padding: '0.15rem 0.5rem',
              fontSize: '0.75rem',
              backgroundColor: '#334155',
              color: '#fff',
              borderColor: '#475569',
            }}
          >
            {isPaused ? '▶ Resume' : '⏸ Pause'}
          </button>
        </div>
      </div>

      {/* Responsive Canvas Container with Viewport Fit */}
      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={LOGICAL_WIDTH}
          height={LOGICAL_HEIGHT}
          aria-label="Banana Catch game canvas"
          className="arcade-canvas"
        />
      </div>

      {/* Streamlined Arcade Controller Dock */}
      <div className="arcade-controller-dock">
        <button
          type="button"
          onPointerDown={() => handleVirtualLeft(true)}
          onPointerUp={() => handleVirtualLeft(false)}
          onPointerCancel={() => handleVirtualLeft(false)}
          onContextMenu={(e) => e.preventDefault()}
          className="arcade-btn-move"
          aria-label="Move basket left"
        >
          <span>◄</span> Move Left
        </button>

        <button
          type="button"
          onPointerDown={() => handleVirtualRight(true)}
          onPointerUp={() => handleVirtualRight(false)}
          onPointerCancel={() => handleVirtualRight(false)}
          onContextMenu={(e) => e.preventDefault()}
          className="arcade-btn-move"
          aria-label="Move basket right"
        >
          Move Right <span>►</span>
        </button>
      </div>

      {/* Clean Minimalist Hint Strip */}
      <div className="arcade-hint-strip">
        <div>
          <span className="kbd">←</span> <span className="kbd">→</span> or <span className="kbd">A</span> <span className="kbd">D</span> to move • <span className="kbd">P</span> to pause
        </div>
        {onQuit && (
          <button
            type="button"
            onClick={onQuit}
            className="arcade-exit-link"
          >
            Forfeit Match
          </button>
        )}
      </div>
    </div>
  );
}

export default GameCanvas;
