/**
 * @class EventEmitter
 * convenience methods for emitting events.
 */
export default class EventEmitter {
  constructor() {
    this._listeners = new Map();
  }

  getListeners(event) {
    let listeners = this._listeners.get(event);
    if (!listeners) {
      this._listeners.set(event, listeners = []);
    }
    return listeners;
  }

  on(event, callback) {
    this.getListeners(event).push(callback);
  }

  off(event, callback) {
    const listeners = this.getListeners(event);
    const i = listeners.indexOf(callback);
    if (i !== -1) {
      listeners.splice(i, 1);
    }
  }

  _raise(event, detail = {}) {
    this.getListeners(event).forEach((fn) => fn({ detail }));
  }
}
