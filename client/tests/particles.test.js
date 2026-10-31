import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Particle, FloatingText, EffectSystem } from '../src/game/particles.js';

describe('EffectSystem and Particle Physics (particles.js)', () => {
  it('updates particle position and detects expiration', () => {
    const p = new Particle(100, 100, '#f59e0b', 4, 10, -20, 0.5);
    assert.strictEqual(p.isDead(), false);

    // Update 0.25 seconds
    p.update(0.25);
    assert.strictEqual(p.x, 100 + 10 * 0.25);
    assert.strictEqual(p.isDead(), false);

    // Update past maxLife
    p.update(0.3);
    assert.strictEqual(p.isDead(), true);
  });

  it('updates floating text position upwards and expires', () => {
    const ft = new FloatingText('+1', 50, 100, '#22c55e', 18, 0.5);
    assert.strictEqual(ft.isDead(), false);

    ft.update(0.2);
    // vy is negative, so y should decrease
    assert.ok(ft.y < 100);
    assert.strictEqual(ft.isDead(), false);

    ft.update(0.4);
    assert.strictEqual(ft.isDead(), true);
  });

  it('manages burst particles and floating text inside EffectSystem lifecycle', () => {
    const effects = new EffectSystem();

    effects.spawnBurst(100, 200, 8);
    effects.spawnFloatingText('LEVEL UP!', 100, 200);

    assert.strictEqual(effects.particles.length, 8);
    assert.strictEqual(effects.floatingTexts.length, 1);

    // Advance physics
    effects.update(0.1);
    assert.strictEqual(effects.particles.length, 8);

    // Advance physics past all lifespans
    effects.update(1.5);
    assert.strictEqual(effects.particles.length, 0);
    assert.strictEqual(effects.floatingTexts.length, 0);

    // Test clear
    effects.spawnBurst(50, 50, 4);
    effects.clear();
    assert.strictEqual(effects.particles.length, 0);
  });
});

