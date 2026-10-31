import {
  LOGICAL_WIDTH,
  LOGICAL_HEIGHT,
  BASKET_WIDTH,
  BASKET_HEIGHT,
  BASKET_SPEED,
  BASKET_BOTTOM_OFFSET,
  ITEM_SIZE,
} from './config.js';

/**
 * Represents the player-controlled basket.
 */
export class Basket {
  constructor() {
    this.width = BASKET_WIDTH;
    this.height = BASKET_HEIGHT;
    this.speed = BASKET_SPEED;
    this.x = (LOGICAL_WIDTH - this.width) / 2;
    this.y = LOGICAL_HEIGHT - this.height - BASKET_BOTTOM_OFFSET;
  }

  /**
   * Updates basket position from either pointer target or keyboard direction.
   * @param {number} dt - Delta time in seconds
   * @param {number} direction - -1 (left), 1 (right), or 0
   * @param {number|null} targetX - Target logical X from touch/pointer drag
   */
  update(dt, direction, targetX) {
    if (targetX !== null && targetX !== undefined) {
      this.x = targetX - this.width / 2;
    } else if (direction !== 0) {
      this.x += direction * this.speed * dt;
    }

    // Clamp within canvas boundaries
    const maxX = LOGICAL_WIDTH - this.width;
    if (this.x < 0) {
      this.x = 0;
    } else if (this.x > maxX) {
      this.x = maxX;
    }
  }

  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }

  /**
   * Returns the top catching rim bounds for realistic catching physics.
   */
  getCatchBounds() {
    return {
      x: this.x + 2,
      y: this.y,
      width: this.width - 4,
      height: Math.max(12, this.height * 0.75),
    };
  }
}

/**
 * Represents a falling item (standard banana, golden banana, heart, freeze, or spoiled fruit).
 */
export class FallingItem {
  constructor(type, x, y, size = ITEM_SIZE, speed) {
    this.type = type; // 'banana' | 'golden' | 'heart' | 'freeze' | 'spoiled'
    this.x = x;
    this.y = y;
    this.size = size;
    this.speed = speed;
    this.wobble = Math.random() * Math.PI * 2;
    this.rotation = 0;
  }

  /**
   * Advances the item downwards according to its speed and wobbles gently.
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    this.y += this.speed * dt;
    this.wobble += dt * 4;
    this.rotation = Math.sin(this.wobble) * 0.18;
  }

  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.size,
      height: this.size,
    };
  }
}

export default {
  Basket,
  FallingItem,
};

