import { SirenEntity } from './siren-entity.js';
import { SirenAction } from './siren-action.js';

/**
 * Client for fetching entities from a Siren API
 */
export class SirenClient {
  /**
   * performs a request using the supplied action
   * @param {SirenAction} action
   * @param {object} options - additional options to include in the request
   * @param {object} options.headers - headers to include in the request
   * @returns {Promise<{ entity: SirenEntity, response: Response }>}
   */
  async submit(action, options = {}) {
    const { body, headers, method, url } = this.parseAction(action);

    Object.entries(options.headers).forEach(([key, value]) => headers.set(key, value));

    const response = await fetch(url, {
      body,
      headers,
      method,
      mode: 'cors',
      cache: 'no-cache',
    });

    if (!response.ok) {
      const err = new Error(`Request failed, status: ${response.status} (${response.statusText})`);
      err.response = response;
      throw err;
    }

    const entity = await this.parseResponse(response);
    return { entity, response };
  }

  /**
   * performs a GET request to the specified href
   * @param {string} href
   * @returns {Promise<{ entity: SirenEntity, response: Response }>}
   */
  async get(href) {
    if (!href || typeof href !== 'string') {
      throw new Error('Invalid HREF');
    }
    return this.submit(new SirenAction({ href }));
  }

  /**
   * Parse an action and returns fetch options
   * @param {SirenAction} action
   * @returns {
   *  method: string,
  *  url: URL,
  *  headers: Headers,
  *  body: FormData | URLSearchParams | string,
  * }
  */
  parseAction({ href, fields, type, method = 'GET' }) {
    const url = new URL(href);

    const headers = new Headers();
    type !== 'multipart/form-data' && headers.set('content-type', type);

    let body;
    if (fields) {
      const noBody = ['GET', 'HEAD'].includes(method.toUpperCase());
      let data;

      // set data type
      if (noBody || type.includes('application/x-www-form-urlencoded')) {
        data = new URLSearchParams();
      } else {
        data = new FormData();
      }

      // append fields to data
      // if a field is specified multiple times, assume it is intentional
      for (const { name, value, files } of fields) {
        if (files) {
          for (const file of files) {
            data.append(name, file, file.name);
          }
        } else {
          if (Array.isArray(value)) {
            // handle arrays
          } else if (typeof value === 'object') {
            // handle objects
          } else {
            // handle primitives
            data.append(name, value || '');
          }
        }
      }

      // apply data to body or url
      if (noBody) {
        // append the fields to the URL
        url.search = new URLSearchParams([...url.searchParams, ...data]);
      } else if (type.indexOf('json') !== -1) {
        // convert FormData to JSON
        const json = {};
        data.forEach((value, key) => json[key] = value);
        body = JSON.stringify(json);
      } else {
        // use FormData or URLSearchParams as is
        body = data;
      }
    }

    return { method, url, headers, body };
  }

  /**
  * Parse a response and returns a SirenEntity
  * @param {Response} response
  * @returns {Promise<SirenEntity>} siren entity
  */
  async parseResponse(response) {
    if (![200, 201, 203, 205, 206].includes(response.status)) {
      return;
    }
    const contentType = response.headers.get('content-type');
    if (contentType.search(/application\/(vnd.siren\+)?json/) === -1) {
      return;
    }
    const json = await response.clone().json();
    return new SirenEntity(json);
  }
}
