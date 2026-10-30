/**
 * Lightweight custom event emitter for decoupled communication
 * between the plain JavaScript game engine and UI components.
 * Pure JavaScript, no dependencies, no DOM access.
 */
export class EventEmitter {
  constructor() {
    this.events = new Map();
  }

  /**
   * Subscribes a handler to an event.
   * @param {string} event - The event name
   * @param {Function} handler - The callback function
   * @returns {Function} An unsubscribe function that removes the handler
   */
  on(event, handler) {
    if (typeof handler !== 'function') {
      return () => {};
    }
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event).add(handler);

    return () => {
      this.off(event, handler);
    };
  }

  /**
   * Unsubscribes a handler from an event.
   * @param {string} event - The event name
   * @param {Function} handler - The callback function to remove
   */
  off(event, handler) {
    const handlers = this.events.get(event);
    if (!handlers) {
      return;
    }
    handlers.delete(handler);
    if (handlers.size === 0) {
      this.events.delete(event);
    }
  }

  /**
   * Emits an event, calling all registered handlers with the payload.
   * @param {string} event - The event name
   * @param {*} [payload] - Optional payload passed to handlers
   */
  emit(event, payload) {
    const handlers = this.events.get(event);
    if (!handlers) {
      return;
    }
    // Iterate over a snapshot copy to allow handlers to safely unsubscribe during dispatch
    for (const handler of Array.from(handlers)) {
      handler(payload);
    }
  }
}

export default EventEmitter;

