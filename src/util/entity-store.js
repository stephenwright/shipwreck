import EventEmitter from './event-emitter.js';
import { SirenEntity, SirenSubEntity, SirenAction } from '../siren.js';

/**
 * Convert a JSON object into a URL encoded parameter string.
 * Usefull for sending data in a query string, or as form parameters
 */
const _urlencode = data => Object.keys(data)
  .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
  .join('&');

/**
 * Emits the following events:
 *  inflight - when the number of fetches in progress changes up or down { count }
 *  update - an entity has been updated { href, entity }
 *  error - something went wrong { message }
 */
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

  async clear(token) {
    return this._cache.has(token) && this._cache.delete(token);
  }

  async _fetch({ action, token }) {
    const method = (action.method || 'GET').toUpperCase();
    const headers = new Headers();
    token && headers.set('authorization', `Bearer ${token}`);
    action.type && headers.set('content-type', action.type);
    let body;
    let url = action.href;
    const data = action.fields.length > 0 && action.fields.reduce((d,f) => {
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
    this._raise('inflight', { count: ++this._inflight });
    const response = await fetch(url, options).finally(() => this._raise('inflight', { count: --this._inflight }));
    if (!response.ok) {
      this._raise('error', {
        message: `Request failed, status: ${response.status} (${response.statusText})`,
        response,
      });
    }
    return response;
  }

  async _getEntity(action, token) {
    const response = await this._fetch({ action, token });
    if (![200, 201, 203, 205, 206].includes(response.status)) {
      return { response };
    }
    const contentType = response.headers.get('content-type');
    let entity = null;
    if (contentType.search(/application\/(vnd.siren\+)?json/) !== -1) {
      const json = await response.json();
      entity = new SirenEntity(json);
    }
    return { entity, response };
  }

  // performs a request using the supplied action
  async submitAction(action, { token, useCache = true }) {
    const { entity, response } = await this._getEntity(action, token);
    const self = useCache && entity && entity.link('self');
    if (self) {
      const cache = this.getCache(token);
      const { href } = self;
      // cache the entity by the SELF href
      cache.set(href, entity);
      this._raise('update', { href, entity });
    }
    return { entity, response };
  }

  // performs a GET request to the specified href
  async get(href, { token, useCache = true } = {}) {
    const cache = this.getCache(token);
    if (useCache && cache.has(href)) {
      this._raise('inflight', { count: this._inflight });
      return { entity: cache.get(href) };
    }
    const action = new SirenAction({ href });
    const { entity, response } = await this._getEntity(action, token);
    if (entity && useCache) {
      // cache the entity by the REQUESTED href
      cache.set(href, entity);
      this._raise('update', { href, entity });
      // cache sub-entites
      entity && entity.entities && entity.entities
        .filter(e => e instanceof SirenSubEntity && e.link('self'))
        .forEach(e => cache.set(e.link('self').href, new SirenEntity(e.json)));
    }
    return { entity, response };
  }
}
