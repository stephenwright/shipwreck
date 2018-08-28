import EventEmitter from './event-emitter.js';
import { SirenEntity, SirenAction } from '../siren.js';

/**
 * Convert a JSON object into a URL encoded parameter string.
 * Usefull for sending data in a query string, or as form parameters
 */
const _urlencode = data => Object.keys(data)
  .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
  .join('&');

export default class EntityStore extends EventEmitter {
  constructor() {
    super();
    this._cache = new Map();
    this._inflight = 0;
  }

  getCache(token) {
    let cache = this._cache.get(token);
    if (!cache) {
      this._cache.set(token, cache = new Map());
    }
    return cache;
  }

  async _fetch({ action, token }) {
    const method = (action.method || 'GET').toUpperCase();
    const headers = new Headers();
    token && headers.set('authorization', `Bearer ${token}`);
    action.type && headers.set('content-type', action.type);
    let body;
    let url = action.href;
    const data = action.fields && action.fields.reduce((d,f) => {
      d[f.name] = f.value;
      return d;
    }, {});
    if (data) {
      if (['GET', 'HEAD'].includes(method)) {
        url = `${url}?${_urlencode(data)}`;
      } else if (action.type.indexOf('json') !== -1) {
        body = JSON.stringify(data);
      } else {
        body = _urlencode(data);
      }
    }
    const options = {
      body,
      cache: 'no-cache',
      headers,
      method,
      mode: 'cors',
    };
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`Request failed, status: ${response.status} (${response.statusText})`);
    }
    const json = await response.json();
    return new SirenEntity(json);
  }

  async submitAction(action, token) {
    let entity;
    this._raise('inflight', { count: ++this._inflight });
    try {
      entity = await this._fetch({ action, token });
      const self = entity.link('self');
      if (self) {
        const cache = this.getCache(token);
        const { href } = self;
        // cache the entity by the SELF href
        cache.set(href, entity);
        this._raise('update', { href, entity });
      }
    } catch (error) {
      this._raise('error', { message: error.message });
    }
    this._raise('inflight', { count: --this._inflight });
    return entity;
  }

  async get(href, token) {
    const cache = this.getCache(token);
    if (cache.has(href)) {
      return cache.get(href);
    }
    const action = new SirenAction({ href });
    const entity = await this.submitAction(action, token);
    // cache the entity by the REQUESTED href
    cache.set(href, entity);
    return entity;
  }
}
