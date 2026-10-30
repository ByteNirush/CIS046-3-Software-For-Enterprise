/**
 * Server-side game validation rules.
 *
 * NOTE:
 * These constants are deliberately duplicated from the client (client/src/game/config.js).
 * They must be kept strictly in sync between client and server. In a larger production system,
 * sharing these through a shared monorepo package (e.g. @banana/common) would be the cleaner alternative.
 */
export const MIN_SPAWN_INTERVAL_MS = 500;
export const CATCHES_PER_LEVEL = 10;

/**
 * Calculates the maximum theoretically plausible score achievable within the given elapsed time.
 *
 * REASONING:
 * In the game engine, items cannot spawn faster than one item per MIN_SPAWN_INTERVAL_MS (500ms).
 * Because catching an item requires that an item has spawned, the maximum number of items that
 * could have appeared since the start of the run is Math.floor(elapsedMs / MIN_SPAWN_INTERVAL_MS) + 1
 * (accounting for the immediate first item at t = 0). A score strictly above this bound is physically
 * impossible without tampering.
 *
 * IMPORTANT:
 * This plausibility check is a necessary condition to catch obvious cheats or speedhacks,
 * but it is NOT a proof of honest play. A player could still use an automated bot or assist tool
 * to play within plausible score bounds.
 *
 * @param {number} elapsedMs - Time elapsed since run was started in milliseconds
 * @returns {number} Maximum plausible score
 */
export function maxPlausibleScore(elapsedMs) {
  if (typeof elapsedMs !== 'number' || Number.isNaN(elapsedMs) || elapsedMs < 0) {
    return 0;
  }
  return Math.floor(elapsedMs / MIN_SPAWN_INTERVAL_MS) + 1;
}

export default {
  MIN_SPAWN_INTERVAL_MS,
  CATCHES_PER_LEVEL,
  maxPlausibleScore,
};

