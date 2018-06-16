import EventEmitter from './event-emitter.js';
import { SirenEntity } from '../siren';

class EntityStore extends EventEmitter {
  constructor() {
    super();
    this._cache = new Map();
    this._inflight = 0;
  }

  async _fetch(href, token) {
    const method = action.method || 'GET';
    const headers = new Headers();
    token && headers.set('authorization', `Bearer ${token}`);
    const response = await fetch(href, {
      cache: 'no-cache',
      headers,
      method: 'GET',
      mode: 'cors',
    });
    if (!response.ok) {
      throw new Error(`Request failed, status: ${response.status} (${response.statusText})`);
    }
    const json = await response.json();
    return new SirenEntity(json);
  }

  async get(href, token) {
    let cache = this._cache.get(token);
    if (!cache) {
      this._cache.set(token, cache = new Map());
    }
    else if (cache.has(href)) {
      return cache.get(href);
    }
    this._raise('inflight', { count: ++this._inflight });
    try {
      const entity = await this._fetch(href, token);
      cache.set(href, entity);
      this._raise('update', { href, entity });
    }
    catch (error) {
      this._raise('error', { error });
    }
    this._raise('inflight', { count: --this._inflight });
  }
}
