/**
 * EventEmitter
 * adds the ability to emit events
 */
export default class EventEmitter {
  constructor() {
    this._events = new Map();
  }

  on(event, callback) {
    let callbacks = this._events.get(event);
    if (!callbacks) {
      this._events.set(event, callbacks = new Set());
    }
    callbacks.add(callback);
  }

  off(event, callback) {
    let callbacks = this._events.get(event);
    if (!callbacks) {
      return;
    }
    callbacks.delete(callback);
  }

  _raise(event, data) {
    let callbacks = this._events.get(event);
    if (!callbacks) {
      return;
    }
    callbacks.forEach(fn => fn(data));
  }
}
