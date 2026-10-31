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
  BASKET_BOTTOM_OFFSET,
} from './config.js';
import { rectsOverlap } from './collision.js';
import { createInput } from './input.js';
import { Basket, FallingItem } from './entities.js';
import sound from './audio.js';
import { EffectSystem } from './particles.js';

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

    // Input controller with pause shortcut binding
    this.input = canvas ? createInput(canvas, () => this.togglePause()) : null;

    // Visual effects & particles
    this.effects = new EffectSystem();

    // Game state (kept inside Game instance, NEVER in React state)
    this.basket = new Basket();
    this.items = [];
    this.score = 0;
    this.lives = START_LIVES;
    this.level = 1;
    this.catches = 0;
    this.combo = 0;
    this.maxCombo = 0;

    // Power-up & special effects timers
    this.freezeTimerMs = 0;
    this.screenShakeMs = 0;

    // Countdown before items start dropping (3, 2, 1, GO!)
    this.countdown = 3;
    this.countdownTimerMs = 0;

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
    this.combo = 0;
    this.maxCombo = 0;
    this.items = [];
    this.basket = new Basket();
    this.effects.clear();

    this.freezeTimerMs = 0;
    this.screenShakeMs = 0;

    // Initial countdown gives player a moment to prepare
    this.countdown = 3;
    this.countdownTimerMs = 0;

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
   * Toggles pause/resume state.
   */
  togglePause() {
    if (this.isPaused) {
      this.resume();
    } else {
      this.pause();
    }
  }

  /**
   * Forwards virtual control direction from on-screen buttons (-1, 0, 1).
   */
  setVirtualDirection(dir) {
    if (this.input) {
      this.input.setVirtualDirection(dir);
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
    const base = BASE_FALL_SPEED + (this.level - 1) * SPEED_INCREASE_PER_LEVEL;
    // Slow down by 40% when freeze powerup is active
    return this.freezeTimerMs > 0 ? base * 0.6 : base;
  }

  /**
   * Spawns a new item at the top of the canvas.
   */
  spawnItem() {
    const roll = Math.random();
    let type = 'banana';

    // Rarity distribution:
    // 1. Heart (restore life) if hurt (4% chance)
    if (this.lives < START_LIVES && roll < 0.04) {
      type = 'heart';
    }
    // 2. Freeze power-up (5% chance)
    else if (roll < 0.09) {
      type = 'freeze';
    }
    // 3. Rare golden banana (8% chance)
    else if (roll < 0.17) {
      type = 'golden';
    }
    // 4. Spoiled fruit
    else if (roll < 0.17 + SPOILED_CHANCE) {
      type = 'spoiled';
    }
    // 5. Standard healthy banana
    else {
      type = 'banana';
    }

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
      catches: this.catches,
      maxCombo: this.maxCombo,
      durationMs: Math.round(this.totalDurationMs),
    });
  }

  /**
   * Updates game physics, movement, spawning, and collision checks.
   * @param {number} dt - Delta time in seconds
   * @param {number} deltaMs - Delta time in milliseconds
   */
  update(dt, deltaMs) {
    // 1. Handle countdown sequence
    if (this.countdown > 0) {
      this.countdownTimerMs += deltaMs;
      if (this.countdownTimerMs >= 750) {
        this.countdownTimerMs = 0;
        this.countdown -= 1;
        if (this.countdown === 0) {
          // Immediately spawn first item on GO!
          this.spawnItem();
        }
      }
      // Allow moving basket during countdown
      const direction = this.input ? this.input.getDirection() : 0;
      const targetX = this.input ? this.input.getTargetX() : null;
      this.basket.update(dt, direction, targetX);
      return;
    }

    // 2. Decrement timers
    if (this.freezeTimerMs > 0) {
      this.freezeTimerMs = Math.max(0, this.freezeTimerMs - deltaMs);
    }
    if (this.screenShakeMs > 0) {
      this.screenShakeMs = Math.max(0, this.screenShakeMs - deltaMs);
    }

    // 3. Update particle and popup effects
    this.effects.update(dt);

    // 4. Move the player's basket
    const direction = this.input ? this.input.getDirection() : 0;
    const targetX = this.input ? this.input.getTargetX() : null;
    this.basket.update(dt, direction, targetX);

    // 5. Spawn items on interval
    this.spawnTimerMs += deltaMs;
    if (this.spawnTimerMs >= this.getSpawnInterval()) {
      this.spawnTimerMs = 0;
      this.spawnItem();
    }

    // 6. Update falling items and resolve collisions
    const basketCatchBounds = this.basket.getCatchBounds ? this.basket.getCatchBounds() : this.basket.getBounds();
    const activeItems = [];
    const floorY = LOGICAL_HEIGHT - BASKET_BOTTOM_OFFSET;

    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      // Adapt item speed if freeze power-up changed
      item.speed = this.getFallSpeed();
      item.update(dt);

      const itemBounds = item.getBounds();
      const centerX = item.x + item.size / 2;
      const centerY = item.y + item.size / 2;

      // Check collision with basket rim
      if (rectsOverlap(itemBounds, basketCatchBounds)) {
        if (item.type === 'banana') {
          this.score += 1;
          this.catches += 1;
          this.combo += 1;
          this.maxCombo = Math.max(this.maxCombo, this.combo);

          sound.playCatch();
          this.effects.spawnBurst(centerX, centerY, 8, ['#f59e0b', '#fbbf24', '#fef08a']);
          this.effects.spawnFloatingText('+1', centerX, centerY, '#f59e0b', 16);

          if (this.combo >= 3 && this.combo % 3 === 0) {
            this.effects.spawnFloatingText(`🔥 ${this.combo}x STREAK!`, this.basket.x + this.basket.width / 2, this.basket.y - 28, '#f59e0b', 16);
          }

          // Level up every CATCHES_PER_LEVEL
          if (this.catches % CATCHES_PER_LEVEL === 0) {
            this.level += 1;
            sound.playLevelUp();
            this.effects.spawnBurst(LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2, 24, ['#22c55e', '#4ade80', '#bbf7d0'], 220);
            this.effects.spawnFloatingText(`⭐ LEVEL ${this.level}!`, LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2 - 20, '#22c55e', 24);
            this.emitter?.emit('levelUp', { level: this.level });
          }

          this.emitter?.emit('catch', { score: this.score, combo: this.combo });
        } else if (item.type === 'golden') {
          this.score += 1;
          this.catches += 1;
          this.combo += 1;
          this.maxCombo = Math.max(this.maxCombo, this.combo);

          sound.playGoldenCatch();
          this.effects.spawnBurst(centerX, centerY, 16, ['#fbbf24', '#f59e0b', '#ffffff', '#fef08a'], 200);
          this.effects.spawnFloatingText('✨ GOLDEN! +1', centerX, centerY - 10, '#d97706', 18);

          this.emitter?.emit('catch', { score: this.score, combo: this.combo });
        } else if (item.type === 'heart') {
          if (this.lives < START_LIVES) {
            this.lives += 1;
          }
          sound.playHeal();
          this.effects.spawnBurst(centerX, centerY, 12, ['#ef4444', '#f43f5e', '#fda4af']);
          this.effects.spawnFloatingText('❤️ +1 LIFE', centerX, centerY - 10, '#dc2626', 18);

          this.emitter?.emit('heal', { lives: this.lives });
        } else if (item.type === 'freeze') {
          this.freezeTimerMs = 4000;
          sound.playFreeze();
          this.effects.spawnBurst(centerX, centerY, 14, ['#38bdf8', '#7dd3fc', '#e0f2fe']);
          this.effects.spawnFloatingText('❄️ SLOW-MO!', centerX, centerY - 10, '#0284c7', 18);

          this.emitter?.emit('freeze', { active: true });
        } else if (item.type === 'spoiled') {
          this.lives -= 1;
          this.combo = 0;
          this.screenShakeMs = 260;

          sound.playLifeLost();
          this.effects.spawnBurst(centerX, centerY, 14, ['#78350f', '#881337', '#4c0519']);
          this.effects.spawnFloatingText('-1 LIFE 🥀', centerX, centerY - 10, '#dc2626', 18);

          this.emitter?.emit('lifeLost', { lives: this.lives, combo: 0 });
          if (this.lives <= 0) {
            sound.playGameOver();
            this.triggerGameOver();
            return;
          }
        }

        // Caught items disappear
        continue;
      }

      // Check if item reached the ground line
      if (item.y >= floorY) {
        if (item.type === 'banana' || item.type === 'golden') {
          this.lives -= 1;
          this.combo = 0;
          this.screenShakeMs = 200;

          sound.playMiss();
          this.effects.spawnBurst(centerX, floorY, 8, ['#d97706', '#92400e']);
          this.effects.spawnFloatingText('MISSED! 💔', centerX, floorY - 30, '#dc2626', 16);

          this.emitter?.emit('miss', { lives: this.lives, combo: 0 });
          if (this.lives <= 0) {
            sound.playGameOver();
            this.triggerGameOver();
            return;
          }
        }
        // Spoiled, heart, or freeze hitting bottom simply disappear without penalty
        continue;
      }

      activeItems.push(item);
    }

    this.items = activeItems;
  }

  /**
   * Main game animation frame loop.
   * @param {number} timestamp - High resolution timestamp from requestAnimationFrame
   */
  loop(timestamp) {
    if (!this.isRunning || this.isPaused || this.isGameOver) {
      return;
    }

    const elapsedMs = timestamp - (this.lastFrameTime || timestamp);
    // Frame delta capping prevents physics jumping on lag spikes
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
   * Renders the game scene onto the canvas with visual polish.
   */
  render() {
    if (!this.ctx) return;
    const ctx = this.ctx;

    // Apply screen shake if triggered
    ctx.save();
    if (this.screenShakeMs > 0) {
      const shakeIntensity = (this.screenShakeMs / 260) * 5;
      const offsetX = (Math.random() - 0.5) * shakeIntensity * 2;
      const offsetY = (Math.random() - 0.5) * shakeIntensity * 2;
      ctx.translate(offsetX, offsetY);
    }

    // 1. Sky & Background gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 0, LOGICAL_HEIGHT);
    bgGradient.addColorStop(0, '#fef9c3'); // soft warm sunny yellow
    bgGradient.addColorStop(0.5, '#f7f4eb');
    bgGradient.addColorStop(1, '#f1ede4');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    // Subtle sunbeams / diagonal stripes
    ctx.save();
    ctx.fillStyle = 'rgba(245, 158, 11, 0.03)';
    for (let x = -LOGICAL_WIDTH; x < LOGICAL_WIDTH * 2; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 120, LOGICAL_HEIGHT);
      ctx.lineTo(x + 90, LOGICAL_HEIGHT);
      ctx.lineTo(x - 30, 0);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // 2. Ground platform
    const groundY = LOGICAL_HEIGHT - BASKET_BOTTOM_OFFSET + 12;
    ctx.fillStyle = '#854d0e';
    ctx.fillRect(0, groundY, LOGICAL_WIDTH, LOGICAL_HEIGHT - groundY);

    // Ground grass rim
    ctx.fillStyle = '#65a30d';
    ctx.fillRect(0, groundY - 4, LOGICAL_WIDTH, 4);

    // 3. Basket shadow
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.15)';
    ctx.beginPath();
    ctx.ellipse(
      this.basket.x + this.basket.width / 2,
      this.basket.y + this.basket.height + 2,
      this.basket.width / 2 + 4,
      5,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.restore();

    // 4. Basket body (styled woven wooden arcade cart)
    ctx.save();
    const bx = this.basket.x;
    const by = this.basket.y;
    const bw = this.basket.width;
    const bh = this.basket.height;

    // Wood basket gradient
    const basketGrad = ctx.createLinearGradient(bx, by, bx, by + bh);
    basketGrad.addColorStop(0, '#a16207');
    basketGrad.addColorStop(0.5, '#854d0e');
    basketGrad.addColorStop(1, '#713f12');
    ctx.fillStyle = basketGrad;

    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, [4, 4, 10, 10]);
      ctx.fill();
    } else {
      ctx.fillRect(bx, by, bw, bh);
    }

    // Top woven rim
    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(bx - 2, by, bw + 4, 4);

    // Subtle weave pattern lines
    ctx.strokeStyle = 'rgba(254, 240, 138, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(bx + bw * 0.25, by + 4);
    ctx.lineTo(bx + bw * 0.25, by + bh);
    ctx.moveTo(bx + bw * 0.5, by + 4);
    ctx.lineTo(bx + bw * 0.5, by + bh);
    ctx.moveTo(bx + bw * 0.75, by + 4);
    ctx.lineTo(bx + bw * 0.75, by + bh);
    ctx.stroke();

    // Cute banana icon badge in center of basket
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🍌', bx + bw / 2, by + bh / 2 + 1);
    ctx.restore();

    // 5. Draw falling items with gentle tilt
    for (const item of this.items) {
      ctx.save();
      const centerX = item.x + item.size / 2;
      const centerY = item.y + item.size / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate(item.rotation || 0);

      // Subtle drop shadow under item
      ctx.shadowColor = 'rgba(0, 0, 0, 0.18)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 3;

      ctx.font = `${ITEM_SIZE - 2}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (item.type === 'banana') {
        ctx.fillText('🍌', 0, 0);
      } else if (item.type === 'golden') {
        ctx.fillText('🌟', 0, 0);
      } else if (item.type === 'heart') {
        ctx.fillText('💖', 0, 0);
      } else if (item.type === 'freeze') {
        ctx.fillText('❄️', 0, 0);
      } else {
        ctx.fillText('🥀', 0, 0);
      }
      ctx.restore();
    }

    // 6. Freeze visual banner if active
    if (this.freezeTimerMs > 0) {
      ctx.save();
      ctx.fillStyle = 'rgba(2, 132, 199, 0.12)';
      ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

      ctx.fillStyle = '#0284c7';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      const timeLeft = (this.freezeTimerMs / 1000).toFixed(1);
      ctx.fillText(`❄️ SLOW-MO ACTIVE (${timeLeft}s)`, LOGICAL_WIDTH / 2, 24);
      ctx.restore();
    }

    // 7. Render particles and popups
    this.effects.render(ctx);

    // Restore screen shake
    ctx.restore();

    // 8. Countdown overlay
    if (this.countdown > 0) {
      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
      ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 72px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 10;
      ctx.fillText(String(this.countdown), LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2 - 20);

      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('GET READY!', LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2 + 40);
      ctx.restore();
    }

    // 9. Render Paused Overlay
    if (this.isPaused) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
      ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 30px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('PAUSED', LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2 - 24);

      ctx.font = '16px sans-serif';
      ctx.fillStyle = '#fef08a';
      ctx.fillText('Press P or click Resume to continue', LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2 + 18);
    }

    // 10. Render Game Over Overlay
    if (this.isGameOver) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

      ctx.fillStyle = '#f87171';
      ctx.font = 'bold 34px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('GAME OVER', LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2 - 35);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(`Final Score: ${this.score}`, LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2 + 5);

      ctx.font = '15px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`Reached Level ${this.level} • ${this.catches} Catches`, LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2 + 35);
    }
  }
}

export default Game;
