/**
 * Shipwreck : Heed the Sirens' call
 *
 * A web client for working with Siren Hypermedia APIs
 */

import { SirenStore } from './siren/siren-store.js';
import { intercept } from './router.js';

import markup from './markup.js';

/** Convert a string to a DOM node */
export const _html = (str) => {
  const template = document.createElement('template');
  template.innerHTML = str.trim();
  return template.content.firstChild;
};

const ABSOLUTE_URL_REGEX = new RegExp('^(?:[a-z]+:)?//', 'i');

/**
 * Emits the following events:
 *  fetch - starting a fetch
 *  inflight - there are current requests in flight { count }
 *  update - then entity has been updated { href, entity }
 *  success - fetch was successful { message }
 *  error - something went wrong { message }
 *  complete - fetch complete (calls wether it was successful or not)
 */
export class Shipwreck {
  constructor(target) {
    this._target = target;
    this._eventListeners = new Map();

    this._baseUri = sessionStorage.getItem('ship-baseUri') || '';
    this._token = sessionStorage.getItem('ship-authToken') || '';

    this._store = new SirenStore();
    this._store.addEventListener('error', e => {
      const { message, response } = e.detail;
      this._raise('error', { message, response });
    });
    this._store.addEventListener('inflight', e => this._raise('inflight', { count: e.detail.count }));
    this._updateStore();

    this._watchLinks();
    this._watchForms();

  }

  _updateStore() {
    const headers = {};
    this._token && (headers.Authorization = `Bearer ${this._token}`);
    this._store.addTarget({ href: this.baseUri, options: { headers } });
  }

  // ===== properties

  get entity() {
    return this._entity;
  }

  set entity(entity) {
    this._entity = entity;
    this._raise('update', { message: 'Updated entity', entity });
  }
  get baseUri() {
    return this._baseUri;
  }

  set baseUri(uri) {
    uri = uri || undefined; // falsy = undefined
    if (uri === this._baseUri) {
      return;
    }
    this._baseUri = uri;

    this._updateStore();
    this._watchLinks();

    if (uri) {
      sessionStorage.setItem('ship-baseUri', uri);
    } else {
      sessionStorage.removeItem('ship-baseUri');
    }
  }

  get token() {
    return this._token;
  }

  set token(newToken) {
    newToken = newToken || undefined; // falsy = undefined
    if (newToken === this._token) {
      return;
    }
    this._token = newToken;
    if (newToken) {
      sessionStorage.setItem('ship-authToken', newToken);
    } else {
      sessionStorage.removeItem('ship-authToken');
    }
    this._updateStore();
  }

  // ===== watchers

  _watchLinks() {
    this._interceptor?.remove();
    this._interceptor = this._baseUri ? intercept(this._baseUri, href => this.fetch(href)) : undefined;
  }

  _watchForms() {
    this._target.addEventListener('submit', e => {
      e.preventDefault();
      this._submitForm(e.target);
    });
  }

  // ===== events

  _getEventListeners(event) {
    if (!this._eventListeners.has(event)) {
      this._eventListeners.set(event, []);
    }
    return this._eventListeners.get(event);
  }

  _raise(event, detail = {}) {
    this._getEventListeners(event).forEach(fn => fn({ detail }));
  }

  on(event, callback) {
    this._getEventListeners(event).push(callback);
  }

  off(event, callback) {
    const listeners = this._getEventListeners(event);
    const i = listeners.indexOf(callback);
    if (i !== -1) {
      listeners.splice(i, 1);
    }
  }

  // =====

  /**
   * Construct a URL from a base, path, and query
   * @param {string} base - base URL, defaults to this.baseUri
   * @param {string} path - path to fetch
   * @param {object} query - query parameters
   * @returns {URL}
   */
  buildUrl({ base, path, query }) {
    if (ABSOLUTE_URL_REGEX.test(path)) {
      return new URL(path);
    }
    const root = new URL(base || this.baseUri);
    path = root.pathname.replace(/\/$/, '') + '/' + path.replace(/^\//, '');
    const url = new URL(path, root);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        Array.isArray(value)
          ? value.forEach(v => url.searchParams.append(key, v))
          : url.searchParams.set(key, value);
      }
    }
    return url;
  }

  // =====

  /**
   * Convert a form into a siren action and submit the action
   * requests confirmation for DELETE actions
   * renders the results if response is a siren entity
   * @param {HTMLFormElement} form
   */
  async _submitForm(form) {
    // convert html form to siren action
    const fields = [];
    let method = form.getAttribute('method');

    for (const { name, value, type, checked, files } of form.elements) {
      if (name === '_method') {
        method = value;
        continue;
      }
      if (type === 'radio' && !checked) {
        continue;
      }
      if (type === 'checkbox' && !checked) {
        continue;
      }
      name && fields.push({ name, value, files });
    }

    const action = {
      name: form.name,
      type: form.enctype,
      href: form.action,
      method: method || 'GET',
      fields,
    };

    // confirm destructive actions
    if (action.method === 'DELETE' && !confirm('You are performing a DELETE. This action is potentially destructive.')) {
      return;
    }

    // submit the action and render the response
    try {
      this._raise('fetch', {});
      const { entity, response } = await this._store.submit({ action });
      this.entity = entity;
      await this.render({ entity, response });
      this._raise('success', { message: 'Action submitted.' });
    } catch (err) {
      this._raise('error', { message: err.message });
    }

    this._raise('complete', {});
  }

  /**
   * Fetch an entity and render the results
   * @params {string} path - path to fetch
   */
  async fetch(path) {
    this._raise('fetch', {});
    try {
      const { href } = this.buildUrl({ path });
      const { entity, response } = await this._store.get({ href, noCache: true });
      this.entity = entity;
      this.render({ entity, response });
      this._raise('success', { message: 'Request success', href });
    } catch (err) {
      console.warn(err);
      this._raise('error', { message: err.message, error: err });
    }
    this._raise('complete', { message: 'Fetch complete.' });
  }

  /**
   *
   * @param {SirenEntity}} entity - the entity to display
   * @param {Response} response - the response to display if no siren entity is available
   */
  async render({ entity, response }) {
    if (entity) {
      this._target.innerHTML = markup.ship(entity);
      this._raise('update', { message: 'Updated entity', entity });
    } else if (response) {
      const text = await response.text();
      this._target.innerHTML = markup.raw(text, response.url);
    }
    // wire up tabbed content, in the following structure:
    //  div.tabbed
    //   div.tabs
    //     a[name=<name>]
    //   div.content.<name>
    this._target.querySelectorAll('.tabbed').forEach(el => {
      const tabs = el.querySelectorAll(':scope > .tabs > a');
      const contents = el.querySelectorAll(':scope > .content');
      tabs.forEach(tab => {
        tab.onclick = () => {
          tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          contents.forEach(c => c.style.display = c.className.includes(tab.name) ? 'block' : 'none');
        };
      });
      tabs.length && tabs[0].click();
    });
  }
}
