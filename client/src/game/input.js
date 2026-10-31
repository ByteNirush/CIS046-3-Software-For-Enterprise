/**
 * Creates input handling for keyboard, touch drag, on-screen controls, and pause shortcuts.
 * @param {HTMLCanvasElement} canvas
 * @param {() => void} [onTogglePause]
 * @returns {{ getDirection: () => number, getTargetX: () => number|null, setVirtualDirection: (dir: number) => void, destroy: () => void }}
 */
export function createInput(canvas, onTogglePause) {
  let leftPressed = false;
  let rightPressed = false;
  let virtualDirection = 0;
  let isPointerDown = false;
  let targetX = null;

  function toCanvasX(clientX) {
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0) return null;
    const scale = canvas.width / rect.width;
    return (clientX - rect.left) * scale;
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      leftPressed = true;
      targetX = null; // Keyboard takes over pointer target
      if (e.key === 'ArrowLeft') e.preventDefault();
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      rightPressed = true;
      targetX = null;
      if (e.key === 'ArrowRight') e.preventDefault();
    } else if (e.key === 'p' || e.key === 'P' || e.key === 'Escape' || e.key === ' ') {
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
      }
      if (typeof onTogglePause === 'function') {
        onTogglePause();
      }
    }
  }

  function onKeyUp(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      leftPressed = false;
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      rightPressed = false;
    }
  }

  function onPointerDown(e) {
    isPointerDown = true;
    targetX = toCanvasX(e.clientX);
  }

  function onPointerMove(e) {
    if (isPointerDown) {
      targetX = toCanvasX(e.clientX);
    }
  }

  function onPointerUp() {
    isPointerDown = false;
    targetX = null;
  }

  function onPointerCancel() {
    isPointerDown = false;
    targetX = null;
  }

  // Attach event listeners
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  if (canvas) {
    canvas.addEventListener('pointerdown', onPointerDown);
  }
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerCancel);

  return {
    /**
     * Returns direction based on keyboard keys or virtual buttons: -1 (left), 1 (right), or 0 (neutral).
     */
    getDirection() {
      if (virtualDirection !== 0) return virtualDirection;
      if (leftPressed && !rightPressed) return -1;
      if (rightPressed && !leftPressed) return 1;
      return 0;
    },

    /**
     * Sets virtual direction from on-screen touch controls (-1, 0, 1).
     */
    setVirtualDirection(dir) {
      virtualDirection = dir;
      if (dir !== 0) {
        targetX = null;
      }
    },

    /**
     * Returns the target logical X coordinate from pointer dragging, or null if not dragging.
     */
    getTargetX() {
      return targetX;
    },

    /**
     * Cleans up all attached event listeners completely.
     */
    destroy() {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      if (canvas) {
        canvas.removeEventListener('pointerdown', onPointerDown);
      }
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerCancel);
    },
  };
}

export default createInput;

