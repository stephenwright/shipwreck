/**
 * @class EventEmitter
 * convenience methods for emitting events.
 */
export default class EventEmitter extends EventTarget {
  on(event, callback) {
    this.addEventListener(event, callback);
  }

  off(event, callback) {
    this.removeEventListener(event, callback);
  }

  _raise(event, detail = {}) {
    this.dispatchEvent(new CustomEvent(event, { detail }));
  }
}
