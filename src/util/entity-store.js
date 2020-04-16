import EventEmitter from './event-emitter.js';
import { SirenEntity, SirenAction } from '../lib/siren/index.js';

/**
 * Emits the following events:
 *  inflight - when the number of fetches in progress changes up or down { count }
 *  error - something went wrong { message }
 */
export default class EntityStore extends EventEmitter {
  constructor() {
    super();
    this._requests = new Map();
    this._inflight = 0;
  }

  // performs a request using the supplied action
  async submit({ action, token }) {
    const response = await this._fetch({ action, token });
    const entity = await this._getEntity(response);
    return { entity, response };
  }

  // performs a GET request to the specified href
  async get({ href, token }) {
    if (!href || typeof href !== 'string') {
      throw new Error('Invalid HREF');
    }
    const requestKey = `${token}@${href}`;
    let request = this._requests.get(requestKey);
    if (!request) {
      request = this._fetch({ action: new SirenAction({ href }), token });
      this._requests.set(requestKey, request);
    }
    const response = await request;
    this._requests.delete(requestKey);
    const entity = await this._getEntity(response);
    return { entity, response };
  }

  async _fetch({ action, token }) {
    const method = (action.method || 'GET').toUpperCase();
    const headers = new Headers();
    token && headers.set('authorization', `Bearer ${token}`);
    action.type && action.type !== 'multipart/form-data' && headers.set('content-type', action.type);
    let body;
    const url = new URL(action.href, window.location.origin);
    const fields = await this._getFields(action);
    if (fields) {
      if (['GET', 'HEAD'].includes(method)) {
        url.search = fields;
      } else if (action.type.indexOf('json') !== -1) {
        const json = {};
        fields.forEach((value, key) => json[key] = value);
        body = JSON.stringify(json);
      } else {
        body = fields;
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

  async _getFields(action) {
    if (!action.fields) {
      return;
    }
    let fields;
    if (['GET', 'HEAD'].includes(action.method.toUpperCase())) {
      fields = new URL(action.href, window.location.origin).searchParams;
    } else if (action.type === 'application/x-www-form-urlencoded') {
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
