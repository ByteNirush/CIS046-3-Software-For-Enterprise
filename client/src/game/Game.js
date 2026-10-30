import {
  LOGICAL_WIDTH,
  LOGICAL_HEIGHT,
  START_LIVES,
  BASE_FALL_SPEED,
  SPEED_INCREASE_PER_LEVEL,
  CATCHES_PER_LEVEL,
  BASE_SPAWN_INTERVAL_MS,
  MIN_SPAWN_INTERVAL_MS,
  SPAWN_INTERVAL_DECREASE_PER_LEVEL,
  SPOILED_CHANCE,
  MAX_FRAME_MS,
  ITEM_SIZE,
} from './config.js';
import { rectsOverlap } from './collision.js';
import { createInput } from './input.js';
import { Basket, FallingItem } from './entities.js';

export class Game {
  /**
   * Initializes the Game instance.
   * @param {HTMLCanvasElement} canvas - Target canvas element
   * @param {import('../events/emitter.js').EventEmitter} emitter - Event emitter for React UI communication
   */
  constructor(canvas, emitter) {
    this.canvas = canvas;
    this.ctx = canvas ? canvas.getContext('2d') : null;
    this.emitter = emitter;

    // Ensure logical canvas resolution
    if (this.canvas) {
      this.canvas.width = LOGICAL_WIDTH;
      this.canvas.height = LOGICAL_HEIGHT;
    }

    // Input controller
    this.input = canvas ? createInput(canvas) : null;

    // Game state (kept inside Game instance, NEVER in React state)
    this.basket = new Basket();
    this.items = [];
    this.score = 0;
    this.lives = START_LIVES;
    this.level = 1;
    this.catches = 0;

    // Timing and animation
    this.lastFrameTime = 0;
    this.spawnTimerMs = 0;
    this.totalDurationMs = 0;
    this.animFrameId = null;

    // Flags
    this.isRunning = false;
    this.isPaused = false;
    this.isGameOver = false;

    // Bind loop method to instance
    this.loop = this.loop.bind(this);

    // Visibility change handler: pause automatically when page is hidden
    this.handleVisibilityChange = () => {
      if (document.hidden && this.isRunning && !this.isPaused && !this.isGameOver) {
        this.pause();
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  /**
   * Starts a new game session from the beginning.
   */
  start() {
    this.score = 0;
    this.lives = START_LIVES;
    this.level = 1;
    this.catches = 0;
    this.items = [];
    this.basket = new Basket();
    this.spawnTimerMs = 0;
    this.totalDurationMs = 0;
    this.isRunning = true;
    this.isPaused = false;
    this.isGameOver = false;

    this.emitter?.emit('start');

    // Prime animation timestamp and launch loop
    this.lastFrameTime = performance.now();
    if (typeof requestAnimationFrame !== 'undefined') {
      this.animFrameId = requestAnimationFrame(this.loop);
    }
  }

  /**
   * Pauses the game loop and displays pause state.
   */
  pause() {
    if (!this.isRunning || this.isPaused || this.isGameOver) {
      return;
    }
    this.isPaused = true;
    if (this.animFrameId && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.render();
    this.emitter?.emit('pause');
  }

  /**
   * Resumes the game loop when explicitly requested by user.
   */
  resume() {
    if (!this.isRunning || !this.isPaused || this.isGameOver) {
      return;
    }
    this.isPaused = false;
    this.lastFrameTime = performance.now();
    this.emitter?.emit('resume');

    if (typeof requestAnimationFrame !== 'undefined') {
      this.animFrameId = requestAnimationFrame(this.loop);
    }
  }

  /**
   * Tears down the game loop, cancels frames, and removes all listeners.
   */
  destroy() {
    this.isRunning = false;
    this.isPaused = false;

    if (this.animFrameId && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }

    if (this.input) {
      this.input.destroy();
      this.input = null;
    }
  }

  /**
   * Computes current item spawn interval (decreases per level, clamped at MIN_SPAWN_INTERVAL_MS).
   * @returns {number} Interval in milliseconds
   */
  getSpawnInterval() {
    const calculated = BASE_SPAWN_INTERVAL_MS - (this.level - 1) * SPAWN_INTERVAL_DECREASE_PER_LEVEL;
    return Math.max(MIN_SPAWN_INTERVAL_MS, calculated);
  }

  /**
   * Computes current item fall speed (increases per level).
   * @returns {number} Speed in pixels per second
   */
  getFallSpeed() {
    return BASE_FALL_SPEED + (this.level - 1) * SPEED_INCREASE_PER_LEVEL;
  }

  /**
   * Spawns a new item at the top of the canvas.
   */
  spawnItem() {
    const isSpoiled = Math.random() < SPOILED_CHANCE;
    const type = isSpoiled ? 'spoiled' : 'banana';
    const maxX = LOGICAL_WIDTH - ITEM_SIZE;
    const x = Math.random() * maxX;
    const speed = this.getFallSpeed();

    this.items.push(new FallingItem(type, x, -ITEM_SIZE, ITEM_SIZE, speed));
  }

  /**
   * Triggers the game-over sequence, rendering the final frame and notifying listeners.
   */
  triggerGameOver() {
    this.isGameOver = true;
    this.isRunning = false;

    if (this.animFrameId && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    this.render();

    this.emitter?.emit('gameOver', {
      score: this.score,
      level: this.level,
      durationMs: Math.round(this.totalDurationMs),
    });
  }

  /**
   * Updates game physics, movement, spawning, and collision checks.
   * @param {number} dt - Delta time in seconds
   * @param {number} deltaMs - Delta time in milliseconds
   */
  update(dt, deltaMs) {
    // 1. Move the player's basket
    const direction = this.input ? this.input.getDirection() : 0;
    const targetX = this.input ? this.input.getTargetX() : null;
    this.basket.update(dt, direction, targetX);

    // 2. Spawn items on interval
    this.spawnTimerMs += deltaMs;
    if (this.spawnTimerMs >= this.getSpawnInterval()) {
      this.spawnTimerMs = 0;
      this.spawnItem();
    }

    // 3. Update falling items and resolve collisions
    const basketBounds = this.basket.getBounds();
    const activeItems = [];

    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      item.update(dt);

      const itemBounds = item.getBounds();

      // Check collision with basket
      if (rectsOverlap(itemBounds, basketBounds)) {
        if (item.type === 'banana') {
          this.score += 1;
          this.catches += 1;
          this.emitter?.emit('catch', { score: this.score });

          // Level up every CATCHES_PER_LEVEL
          if (this.catches % CATCHES_PER_LEVEL === 0) {
            this.level += 1;
            this.emitter?.emit('levelUp', { level: this.level });
          }
        } else if (item.type === 'spoiled') {
          this.lives -= 1;
          this.emitter?.emit('lifeLost', { lives: this.lives });
          if (this.lives <= 0) {
            this.triggerGameOver();
            return;
          }
        }
        // Caught items disappear
        continue;
      }

      // Check if item reached canvas bottom
      if (item.y >= LOGICAL_HEIGHT) {
        if (item.type === 'banana') {
          this.lives -= 1;
          this.emitter?.emit('miss', { lives: this.lives });
          if (this.lives <= 0) {
            this.triggerGameOver();
            return;
          }
        }
        // Spoiled items at bottom simply disappear without penalty
        continue;
      }

      activeItems.push(item);
    }

    this.items = activeItems;
  }

  /**
   * Main game animation frame loop.
   * Calculates delta time in seconds, capping single frames at MAX_FRAME_MS
   * to ensure tab switching doesn't produce huge physics leaps.
   * @param {number} timestamp - High resolution timestamp from requestAnimationFrame
   */
  loop(timestamp) {
    if (!this.isRunning || this.isPaused || this.isGameOver) {
      return;
    }

    const elapsedMs = timestamp - (this.lastFrameTime || timestamp);
    // Frame delta capping
    const deltaMs = Math.min(elapsedMs, MAX_FRAME_MS);
    this.lastFrameTime = timestamp;
    const dt = deltaMs / 1000;

    this.totalDurationMs += deltaMs;

    this.update(dt, deltaMs);

    if (this.isGameOver) {
      return;
    }

    this.render();

    if (typeof requestAnimationFrame !== 'undefined') {
      this.animFrameId = requestAnimationFrame(this.loop);
    }
  }

  /**
   * Renders the game scene onto the canvas using simple shapes and text.
   */
  render() {
    if (!this.ctx) return;
    const ctx = this.ctx;

    // Clear background
    ctx.fillStyle = '#f7f4eb';
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    // Subtle ground separator line
    ctx.strokeStyle = '#d7ccc8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, LOGICAL_HEIGHT - 12);
    ctx.lineTo(LOGICAL_WIDTH, LOGICAL_HEIGHT - 12);
    ctx.stroke();

    // Draw basket
    ctx.fillStyle = '#8d5b4c';
    ctx.beginPath();
    ctx.roundRect
      ? ctx.roundRect(this.basket.x, this.basket.y, this.basket.width, this.basket.height, 6)
      : ctx.rect(this.basket.x, this.basket.y, this.basket.width, this.basket.height);
    ctx.fill();

    ctx.strokeStyle = '#5d4037';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw falling items using emoji/text
    ctx.font = `${ITEM_SIZE - 4}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const item of this.items) {
      const centerX = item.x + item.size / 2;
      const centerY = item.y + item.size / 2;

      if (item.type === 'banana') {
        ctx.fillText('🍌', centerX, centerY);
      } else {
        // Spoiled banana marker
        ctx.fillText('🥀', centerX, centerY);
      }
    }

    // Render Paused Overlay
    if (this.isPaused) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('PAUSED', LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2 - 20);

      ctx.font = '16px sans-serif';
      ctx.fillText('Click Resume to continue', LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2 + 20);
    }

    // Render Game Over Overlay
    if (this.isGameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

      ctx.fillStyle = '#ff5252';
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('GAME OVER', LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2 - 20);

      ctx.fillStyle = '#ffffff';
      ctx.font = '18px sans-serif';
      ctx.fillText(`Score: ${this.score}`, LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2 + 20);
    }
  }
}

export default Game;

