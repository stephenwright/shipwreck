import { SirenEntity } from './siren-entity.js';
import { SirenAction } from './siren-action.js';

/**
 * Client for fetching entities from a Siren API
 */
export class SirenClient {
  constructor(token) {
    this._token = token;
    this._requests = new Map();
  }

  set token(val) {
    this._token = val;
  }

  get inflight() {
    return this._requests.size;
  }

  // performs a request using the supplied action
  async submit({ action }) {
    const response = await this._fetch({ action });
    const entity = await this._getEntity(response);
    return { entity, response };
  }

  // performs a GET request to the specified href
  async get({ href }) {
    if (!href || typeof href !== 'string') {
      throw new Error('Invalid HREF');
    }
    let request = this._requests.get(href);
    if (!request) {
      const action = new SirenAction({ href });
      request = this.submit({ action }).finally(() => this._requests.delete(href));
      this._requests.set(href, request);
    }
    return request;
  }

  parseAction({ action }) {
    if (!action) {
      throw new Error('No action given');
    }

    const headers = new Headers();
    this._token && headers.set('authorization', `Bearer ${this._token}`);
    action.type && action.type !== 'multipart/form-data' && headers.set('content-type', action.type);

    const fields = this._getFields(action);
    const method = (action.method || 'GET').toUpperCase();
    const url = new URL(action.href);

    let body;

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

    return { body, headers, method, url };
  }

  async _fetch({ action }) {
    const { body, headers, method, url } = this.parseAction({ action });

    const response = await fetch(url, {
      body,
      cache: 'no-cache',
      headers,
      method,
      mode: 'cors',
    });

    if (!response.ok) {
      throw new Error(`Request failed, status: ${response.status} (${response.statusText})`);
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
