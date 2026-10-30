import { useEffect, useRef, useState } from 'react';
import { EventEmitter } from '../events/emitter.js';
import { Game } from '../game/Game.js';
import { LOGICAL_WIDTH, LOGICAL_HEIGHT, START_LIVES } from '../game/config.js';

export function GameCanvas({ runId, onGameOver }) {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(START_LIVES);
  const [level, setLevel] = useState(1);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const emitter = new EventEmitter();
    const game = new Game(canvas, emitter);
    gameRef.current = game;

    // Subscribe to game engine events
    const unCatch = emitter.on('catch', (payload) => {
      setScore(payload.score);
    });

    const unMiss = emitter.on('miss', (payload) => {
      setLives(payload.lives);
    });

    const unLifeLost = emitter.on('lifeLost', (payload) => {
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

    // Start game run
    game.start();

    // Cleanup ensures safe teardown under React StrictMode double-mounting
    return () => {
      game.destroy();
      unCatch();
      unMiss();
      unLifeLost();
      unLevelUp();
      unPause();
      unResume();
      unGameOver();
      gameRef.current = null;
    };
  }, [onGameOver]);

  const togglePause = () => {
    if (!gameRef.current) return;
    if (isPaused) {
      gameRef.current.resume();
    } else {
      gameRef.current.pause();
    }
  };

  return (
    <div style={{ maxWidth: `${LOGICAL_WIDTH}px`, margin: '0 auto', textAlign: 'center' }}>
      {/* Controls information */}
      <div style={{ marginBottom: '0.5rem', color: '#555', fontSize: '0.95rem' }}>
        Controls: <strong>Arrow keys, A/D, or drag</strong>
      </div>

      {/* Heads-Up Display (HUD) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.5rem 1rem',
          background: '#eceff1',
          borderRadius: '6px',
          marginBottom: '0.5rem',
          fontWeight: 'bold',
        }}
      >
        <span>Score: {score}</span>
        <span>
          Lives: {'❤️'.repeat(Math.max(0, lives))}
          {lives <= 0 ? '💀' : ''}
        </span>
        <span>Level: {level}</span>
        <button
          type="button"
          onClick={togglePause}
          style={{
            padding: '0.25rem 0.75rem',
            fontSize: '0.85rem',
            cursor: 'pointer',
          }}
        >
          {isPaused ? 'Resume' : 'Pause'}
        </button>
      </div>

      {/* Responsive Canvas Container */}
      <canvas
        ref={canvasRef}
        width={LOGICAL_WIDTH}
        height={LOGICAL_HEIGHT}
        aria-label="Banana Catch game canvas - catch bananas in your basket and avoid spoiled fruit"
        style={{
          width: '100%',
          maxWidth: `${LOGICAL_WIDTH}px`,
          height: 'auto',
          aspectRatio: `${LOGICAL_WIDTH} / ${LOGICAL_HEIGHT}`,
          display: 'block',
          margin: '0 auto',
          background: '#f7f4eb',
          border: '2px solid #b0bec5',
          borderRadius: '8px',
          touchAction: 'none',
        }}
      />
    </div>
  );
}

export default GameCanvas;

