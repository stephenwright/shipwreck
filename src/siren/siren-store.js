/**
 * Siren Store
 *
 * A siren client for fetching entities with support for caching.
 * Allows target api root specific options to be set.
 */

import { SirenAction } from './siren-action.js';
import { SirenClient } from './siren-client.js';

function getMaxAge(response) {
  const matches = response.headers.get('cache-control')?.match(/max-age=(\d+)/g);
  return matches ? parseInt(matches[1], 10) : -1;
}

/** @typedef {'fetch'|'inflight'|'error'|'complete'} StoreEvent */

/**
 * A web client for working with Siren Hypermedia APIs
 * Meant to work with single page applications, with many components that
 * possibly need to fetch the same entity. Uses caching to avoid multiple
 * requests for the same entity. And can add listeners to be notified if
 * the entity changes due to another request.
 *
 * Emits the following events:
 * - fetch - starting a fetch
 * - inflight - there are current requests in flight { count }
 * - error - something went wrong { message }
 * - complete - fetch complete (calls wether it was successful or not)
 */
export class SirenStore {
  constructor() {
    this._inflight = 0;
    this._targets = new Map();
    this._entityListeners = new Map();
    this._eventListeners = new Map();
    this._requests = new Map();
    this._cache = new Map();
    this._client = new SirenClient();
  }

  // ----- events

  _getEventListeners(event) {
    if (!this._eventListeners.has(event)) {
      this._eventListeners.set(event, []);
    }
    return this._eventListeners.get(event);
  }

  _raise(event, detail = {}) {
    this._getEventListeners(event).forEach(fn => fn({ detail }));
  }

  /**
   * @params {StoreEvent} event
   * @params {function} callback
   */
  addEventListener(event, callback) {
    this._getEventListeners(event).push(callback);
  }

  /**
   * @params {StoreEvent} event
   * @params {function} callback
   */
  removeEventListener(event, callback) {
    const listeners = this._getEventListeners(event);
    const i = listeners.indexOf(callback);
    if (i !== -1) {
      listeners.splice(i, 1);
    }
  }

  // ----- target specific settings

  addTarget({ href, options = {} }) {
    this._targets.set(href, options);
    this.clearCache();
    this.unload();
  }

  getOptions({ href }) {
    let options = {};

    [...this._targets.keys()].forEach((key) => {
      if (href.startsWith(key)) {
        options = this._targets.get(key);
      }
    });

    return options
  }

  // ----- caching

  _update({ href, entity, response }) {
    let expires = getMaxAge(response);
    const now = new Date().getTime();
    if (expires <= now) {
      expires = now + 5000;
    }
    this._cache.set(href, { entity, expires });
    this._notify({ href, entity, response });
  }

  clearCache() {
    this._cache.clear();
  }

  clearExpired() {
    const now = new Date().getTime();
    for (const [href, item] of this._cache) {
      if (item?.expires < now) {
        this._cache.delete(href);
      }
    }
  }

  reload() {
    if (!this._entityListeners) return;
    for (const [href] of this._entityListeners) {
      this.get({ href, noCache: true });
    }
  }

  unload() {
    if (!this._entityListeners) return;
    for (const [href] of this._entityListeners) {
      this._notify({ href });
    }
  }

  // ----- entity listeners

  _getEntityListeners(href) {
    if (!this._entityListeners.has(href)) {
      this._entityListeners.set(href, new Set());
    }
    return this._entityListeners.get(href);
  }

  _notify({ href, entity, response, error, status }) {
    this._getEntityListeners(href).forEach(fn => {
      try {
        fn({ entity, response, error, status });
      } catch {
        /* shrug */
      }
    });
  }

  addEntityListener(href, callback) {
    if (!href || typeof callback !== 'function') {
      return;
    }
    this._getEntityListeners(href).add(callback);
    return () => this.removeEntityListener(href, callback);
  }

  removeEntityListener(href, callback) {
    if (!href || typeof callback !== 'function') {
      return;
    }
    this._getEntityListeners(href).delete(callback);
  }

  // ----- actions

  // performs a request using the supplied action
  async submit({ action, fields = {} }) {
    for (const name of Object.keys(fields)) {
      const field = action.getField(name);
      const value = fields[name];
      if (field) {
        field.value = value;
      } else {
        action.fields.push({ name, value });
      }
    }

    this._raise('fetch');
    this._raise('inflight', { count: ++this._inflight });

    const options = this.getOptions({ href: action.href });
    return this._client.submit(action, options)
      .catch(err => {
        this._raise('error', {
          message: err.message,
          response: err.response,
        });
      })
      .finally(() => {
        this._raise('inflight', { count: --this._inflight });
        this._raise('complete');
      });
  }

  // ----- entity fetching

  async _getRequest({ href }) {
    // if there's already a request for this href inflight, don't start a new one
    let request = this._requests.get(href);
    if (!request) {
      const action = new SirenAction({ href });
      request = this.submit({ action }).finally(() => this._requests.delete(href));
      this._requests.set(href, request);
    }
    return request;
  }

  async get({ href, noCache = false }) {
    if (!href || typeof href !== 'string') {
      throw new Error('Invalid HREF');
    }
    const cached = this._cache.get(href);
    const expired = cached && cached.expires < new Date().getTime();
    if (!cached || expired || noCache) {
      const { entity, response } = await this._getRequest({ href })
      this._update({ href, entity, response });
      return { entity, response };
    }
    return cached
  }
}
