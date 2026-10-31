/**
 * Lightweight 2D canvas particle and floating text effect engine.
 * Adds visual juice, sparkle bursts, and score feedback with zero dependencies.
 */

export class Particle {
  constructor(x, y, color, size = 4, vx = 0, vy = 0, maxLife = 0.5) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.size = size;
    this.vx = vx;
    this.vy = vy;
    this.maxLife = maxLife;
    this.life = maxLife;
    this.gravity = 180; // downward drift
  }

  update(dt) {
    this.life -= dt;
    this.vy += this.gravity * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  isDead() {
    return this.life <= 0;
  }

  render(ctx) {
    if (this.isDead()) return;
    const alpha = Math.max(0, Math.min(1, this.life / this.maxLife));
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, Math.max(1, this.size * alpha), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export class FloatingText {
  constructor(text, x, y, color = '#f59e0b', fontSize = 18, maxLife = 0.8) {
    this.text = text;
    this.x = x;
    this.y = y;
    this.color = color;
    this.fontSize = fontSize;
    this.maxLife = maxLife;
    this.life = maxLife;
    this.vy = -60; // float upwards
  }

  update(dt) {
    this.life -= dt;
    this.y += this.vy * dt;
  }

  isDead() {
    return this.life <= 0;
  }

  render(ctx) {
    if (this.isDead()) return;
    const alpha = Math.max(0, Math.min(1, this.life / this.maxLife));
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.font = `bold ${this.fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 4;
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}

export class EffectSystem {
  constructor() {
    this.particles = [];
    this.floatingTexts = [];
  }

  clear() {
    this.particles = [];
    this.floatingTexts = [];
  }

  /**
   * Spawns a burst of particles from an origin.
   */
  spawnBurst(x, y, count = 10, colors = ['#f59e0b', '#fbbf24', '#fef08a'], speed = 140) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const v = (0.4 + Math.random() * 0.6) * speed;
      const vx = Math.cos(angle) * v;
      const vy = Math.sin(angle) * v - 40; // upward bias
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = 3 + Math.random() * 4;
      const life = 0.35 + Math.random() * 0.35;
      this.particles.push(new Particle(x, y, color, size, vx, vy, life));
    }
  }

  /**
   * Spawns floating popup text.
   */
  spawnFloatingText(text, x, y, color = '#f59e0b', fontSize = 18) {
    this.floatingTexts.push(new FloatingText(text, x, y, color, fontSize));
  }

  update(dt) {
    for (let i = 0; i < this.particles.length; i++) {
      this.particles[i].update(dt);
    }
    this.particles = this.particles.filter((p) => !p.isDead());

    for (let i = 0; i < this.floatingTexts.length; i++) {
      this.floatingTexts[i].update(dt);
    }
    this.floatingTexts = this.floatingTexts.filter((t) => !t.isDead());
  }

  render(ctx) {
    for (let i = 0; i < this.particles.length; i++) {
      this.particles[i].render(ctx);
    }
    for (let i = 0; i < this.floatingTexts.length; i++) {
      this.floatingTexts[i].render(ctx);
    }
  }
}

export default EffectSystem;

