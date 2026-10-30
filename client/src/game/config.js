export const LOGICAL_WIDTH = 480;
export const LOGICAL_HEIGHT = 640;
export const BASKET_WIDTH = 80;
export const BASKET_HEIGHT = 20;
export const BASKET_SPEED = 420; // pixels per second
export const START_LIVES = 3;
export const BASE_FALL_SPEED = 140;
export const SPEED_INCREASE_PER_LEVEL = 25;
export const CATCHES_PER_LEVEL = 10;
export const BASE_SPAWN_INTERVAL_MS = 900;
export const SPAWN_INTERVAL_DECREASE_PER_LEVEL = 60;
// The server will duplicate MIN_SPAWN_INTERVAL_MS in the next step to judge whether a submitted score is plausible.
export const MIN_SPAWN_INTERVAL_MS = 500;
export const SPOILED_CHANCE = 0.2;
export const MAX_FRAME_MS = 50;
export const ITEM_SIZE = 32;
export const BASKET_BOTTOM_OFFSET = 24;

export default {
  LOGICAL_WIDTH,
  LOGICAL_HEIGHT,
  BASKET_WIDTH,
  BASKET_HEIGHT,
  BASKET_SPEED,
  START_LIVES,
  BASE_FALL_SPEED,
  SPEED_INCREASE_PER_LEVEL,
  CATCHES_PER_LEVEL,
  BASE_SPAWN_INTERVAL_MS,
  MIN_SPAWN_INTERVAL_MS,
  SPOILED_CHANCE,
  MAX_FRAME_MS,
  ITEM_SIZE,
  BASKET_BOTTOM_OFFSET,
};
