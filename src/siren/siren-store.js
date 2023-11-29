/**
 * Siren Store
 *
 * A siren client for fetching entities with support for caching.
 * Allows target api root specific options to be set.
 */

import { SirenEntity } from './siren-entity.js';
import { SirenAction } from './siren-action.js';

function getMaxAge(response) {
  const matches = response.headers.get('cache-control')?.match(/max-age=(\d+)/g);
  return matches ? parseInt(matches[1], 10) : -1;
}

export class SirenStore {
  constructor() {
    this._inflight = 0;
    this._targets = new Map();
    this._entityListeners = new Map();
    this._eventListeners = new Map();
    this._requests = new Map();
    this._cache = new Map();
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

  addEventListener(event, callback) {
    this._getEventListeners(event).push(callback);
  }

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
      action.getField(name).value = fields[name];
    }
    const response = await this._fetch({ action });
    const entity = await this._getEntity(response);
    return { entity, response };
  }

  // ----- entity fetching

  // performs a GET request to the specified href
  async _get({ href }) {
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

    if (!this._cache.has(href) || noCache) {
      const { entity, response } = await this._get({ href })
      this._update({ href, entity, response });
      return { entity, response };
    }

    const cached = this._cache.get(href);
    if (cached.expires < new Date().getTime()) {
      this._get({ href }).then(({ entity, response }) => this._update({ href, entity, response }));
    }
    return cached
  }

  parseAction({ action }) {
    if (!action) {
      throw new Error('No action given');
    }

    const options = this.getOptions({ href: action.href });

    const headers = new Headers();
    if (options.headers) {
      for (const [key, value] of Object.entries(options.headers)) {
        headers.set(key, value);
      }
    }
    action.type && action.type !== 'multipart/form-data' && headers.set('content-type', action.type);

    const fields = this._getFields(action);
    const method = (action.method || 'GET').toUpperCase();
    const url = new URL(action.href);

    let body;

    if (fields) {
      if (['GET', 'HEAD', 'DELETE'].includes(method)) {
        url.search = fields;
      } else if (action.type.indexOf('json') !== -1) {
        const json = {};
        fields.forEach((value, key) => json[key] = value);
        body = JSON.stringify(json);
      } else {
        body = fields;
      }
    }

    return { body, headers, method, url };
  }

  async _fetch({ action }) {
    const { body, headers, method, url } = this.parseAction({ action });

    this._raise('fetch');
    this._raise('inflight', { count: ++this._inflight });

    const response = await fetch(url, {
      body,
      cache: 'no-cache',
      headers,
      method,
      mode: 'cors',
    }).finally(() => {
      this._raise('inflight', { count: --this._inflight });
      this._raise('complete');
    });

    if (!response.ok) {
      this._raise('error', {
        message: `Request failed, status: ${response.status} (${response.statusText})`,
        response,
      });
    }

    return response;
  }

  _getFields(action) {
    if (!action.fields) {
      return;
    }

    let fields;

    if (['GET', 'HEAD'].includes(action.method.toUpperCase())) {
      fields = new URL(action.href).searchParams;
    } else if (action.type.includes('application/x-www-form-urlencoded')) {
      fields = new URLSearchParams();
    } else {
      fields = new FormData();
    }

    // if the field is specified multiple times, assume it is intentional
    for (const { name, value, files } of action.fields) {
      if (files) {
        for (const file of files) {
          fields.append(name, file, file.name);
        }
      } else {
        fields.append(name, value || '');
      }
    }

    return fields;
  }

  async _getEntity(response) {
    if (![200, 201, 203, 205, 206].includes(response.status)) {
      return;
    }
    const contentType = response.headers.get('content-type');
    if (contentType.search(/application\/(vnd.siren\+)?json/) === -1) {
      return;
    }
    const json = await response.json();
    return new SirenEntity(json);
  }
}
