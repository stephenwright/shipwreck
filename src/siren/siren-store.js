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
  #inflight;
  #targets;
  #entityListeners;
  #eventListeners;
  #requests;
  #cache;
  #client;

  constructor() {
    this.#inflight = 0;
    this.#targets = new Map();
    this.#entityListeners = new Map();
    this.#eventListeners = new Map();
    this.#requests = new Map();
    this.#cache = new Map();
    this.#client = new SirenClient();
  }

  // ----- events

  #getEventListeners(event) {
    if (!this.#eventListeners.has(event)) {
      this.#eventListeners.set(event, []);
    }
    return this.#eventListeners.get(event);
  }

  #emit(event, detail = {}) {
    this.#getEventListeners(event).forEach(fn => fn({ detail }));
  }

  /**
   * @params {StoreEvent} event
   * @params {function} callback
   */
  on(event, callback) {
    this.#getEventListeners(event).push(callback);
  }

  /**
   * @params {StoreEvent} event
   * @params {function} callback
   */
  off(event, callback) {
    const listeners = this.#getEventListeners(event);
    const i = listeners.indexOf(callback);
    if (i !== -1) {
      listeners.splice(i, 1);
    }
  }

  // ----- target specific settings

  /**
   * Specify options to be used when fetching entities from a specific target
   * @param {string} href - URI prefix to match
   * @param {object} options - options to be used when fetching entities from this target
   */
  addTarget({ href, options = {} }) {
    this.#targets.set(href, options);
    this.clearCache();
    this.unload();
  }

  #getOptions({ href }) {
    let options = {};
    this.#targets.forEach((value, key) => href.startsWith(key) && (options = { ...options, ...value }));
    return options
  }

  // ----- caching

  #update({ href, entity, response }) {
    let expires = getMaxAge(response);
    const now = new Date().getTime();
    if (expires <= now) {
      expires = now + 5000;
    }
    this.#cache.set(href, { entity, expires });
    this.#emit(`set:${href}`, { entity, response });
  }

  clearCache() {
    this.#cache.clear();
  }

  clearExpired() {
    const now = new Date().getTime();
    for (const [href, item] of this.#cache) {
      if (item?.expires < now) {
        this.#cache.delete(href);
      }
    }
  }

  reload() {
    if (!this.#entityListeners) return;
    for (const [href] of this.#entityListeners) {
      this.get({ href, noCache: true });
    }
  }

  unload() {
    if (!this.#entityListeners) return;
    for (const [href] of this.#entityListeners) {
      this.#emit(`set:${href}`, {});
    }
  }

  // ----- actions

  // performs a request using the supplied action
  async submit({ action, fields = {} }) {
    this.#emit('fetch');
    this.#emit('inflight', { count: ++this.#inflight });

    const options = this.#getOptions({ href: action.href });
    return this.#client.submit({ action, options, fields })
      .catch(err => {
        this.#emit('error', {
          message: err.message,
          response: err.response,
        });
      })
      .finally(() => {
        this.#emit('inflight', { count: --this.#inflight });
        this.#emit('complete');
      });
  }

  // ----- entity fetching

  async #getRequest({ href }) {
    // if there's already a request for this href inflight, don't start a new one
    let request = this.#requests.get(href);
    if (!request) {
      const action = new SirenAction({ href });
      request = this.submit({ action }).finally(() => this.#requests.delete(href));
      this.#requests.set(href, request);
    }
    return request;
  }

  async get({ href, noCache = false }) {
    if (!href || typeof href !== 'string') {
      throw new Error('Invalid HREF');
    }
    const cached = this.#cache.get(href);
    const expired = cached && cached.expires < new Date().getTime();
    if (!cached || expired || noCache) {
      const { entity, response } = await this.#getRequest({ href });
      this.#update({ href, entity, response });
      return { entity, response };
    }
    return cached
  }
}
