/**
 * Pure function determining whether two axis-aligned bounding boxes (AABBs) overlap.
 * @param {{ x: number, y: number, width: number, height: number }} a
 * @param {{ x: number, y: number, width: number, height: number }} b
 * @returns {boolean} True if the two bounding boxes overlap, false otherwise.
 */
export function rectsOverlap(a, b) {
  if (!a || !b) {
    return false;
  }
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export default rectsOverlap;

