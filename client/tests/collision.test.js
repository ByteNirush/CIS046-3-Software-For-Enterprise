import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { rectsOverlap } from '../src/game/collision.js';

describe('rectsOverlap collision detection', () => {
  it('returns true when rectangles overlap completely or partially', () => {
    const a = { x: 50, y: 50, width: 40, height: 40 };
    const b = { x: 70, y: 70, width: 40, height: 40 };
    assert.strictEqual(rectsOverlap(a, b), true);
    assert.strictEqual(rectsOverlap(b, a), true);
  });

  it('returns false when rectangles are horizontally separated', () => {
    const a = { x: 10, y: 10, width: 20, height: 20 };
    const b = { x: 40, y: 10, width: 20, height: 20 };
    assert.strictEqual(rectsOverlap(a, b), false);
    assert.strictEqual(rectsOverlap(b, a), false);
  });

  it('returns false when rectangles are vertically separated', () => {
    const a = { x: 10, y: 10, width: 20, height: 20 };
    const b = { x: 10, y: 50, width: 20, height: 20 };
    assert.strictEqual(rectsOverlap(a, b), false);
    assert.strictEqual(rectsOverlap(b, a), false);
  });

  it('returns false when rectangles only touch edges without overlapping', () => {
    const a = { x: 0, y: 0, width: 20, height: 20 };
    const b = { x: 20, y: 0, width: 20, height: 20 };
    assert.strictEqual(rectsOverlap(a, b), false);

    const c = { x: 0, y: 20, width: 20, height: 20 };
    assert.strictEqual(rectsOverlap(a, c), false);
  });

  it('handles corner overlap', () => {
    const a = { x: 10, y: 10, width: 30, height: 30 };
    const b = { x: 35, y: 35, width: 20, height: 20 };
    assert.strictEqual(rectsOverlap(a, b), true);
  });

  it('returns false for null or undefined bounding boxes', () => {
    assert.strictEqual(rectsOverlap(null, { x: 0, y: 0, width: 10, height: 10 }), false);
    assert.strictEqual(rectsOverlap({ x: 0, y: 0, width: 10, height: 10 }, undefined), false);
  });
});

