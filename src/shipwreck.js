/**
 * Shipwreck : Heed the Sirens' call
 *
 * A simple client for working with Siren Hypermedia APIs
 */

import { SirenEntity } from './siren.js';
import markup from './markup.js';

/**
 * Convert a JSON object into a URL encoded parameter string.
 * Usefull for sending data in a query string, or as form parameters
 */
export const _urlencode = data => {
  return Object
    .keys(data)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
    .join('&');
};

/** Convert a string to a DOM node */
export const _html = str => {
  const template = document.createElement('template');
  template.innerHTML = str.trim();
  return template.content.firstChild;
};

/**
 */
export class Shipwreck {
  constructor(target) {
    this.target = target;
    this._token = sessionStorage.getItem('auth-token') || '';
    this._listeners = {};
    document.body.addEventListener('submit', async (e) => {
      if (!this.target.contains(e.target)) {
        return;
      }
      e.preventDefault();
      const form = e.target;
      const action = {
        name: form.name,
        type: form.enctype,
        href: form.action,
        method: form.method,
      };
      const data = {};
      for (const el of form.elements) {
        if (el.name) {
          data[el.name] = el.value;
        }
      }
      this.fetch(action, data);
    });
  }

  get token() {
    return this._token;
  }

  set token(val) {
    if (val === this._token) {
      return;
    }
    this._token = val;
    if (val) {
      sessionStorage.setItem('auth-token', val);
    } else {
      sessionStorage.removeItem('auth-token');
    }
  }

  // ----- events

  on(name, fn)  {
    this._listeners[name] = this._listeners[name] || [];
    this._listeners[name].push(fn);
  }

  off(name, fn) {
    if (!this._listeners[name]) {
      return;
    }
    if (!fn) {
      this._listeners[name] = [];
    } else {
      this._listeners[name] = this._listeners[name].filter(f => f !== fn);
    }
  }

  async _raise(name, data) {
    if (!this._listeners[name]) {
      return;
    }
    this._listeners[name].forEach(fn => fn(data));
  }

  // -----

  async submitAction(action, data) {
    const method = action.method || 'GET';
    const headers = new Headers();
    action.type && headers.set('content-type', action.type);
    this._token && headers.set('authorization', `Bearer ${this._token}`);

    let body;
    let url = action.href;

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

    return fetch(url, options);
  }

  // submit a request and display the response
  async fetch(action, data) {
    this._raise('fetch', { message: 'Doing a fetch.', action, data });
    const response = await this.submitAction(action, data);
    if (!response.ok) {
      this._raise('error', { message: `Request failed, status: ${response.status} (${response.statusText})` });
      return;
    }
    this._raise('success', { message: `Request success, status: ${response.status} (${response.statusText})` });
    try {
      const json = await response.json();
      const entity = new SirenEntity(json);
      await this.render(entity, this.target);
      this._raise('update', { message: 'Updated Entity', entity });
    } catch (err) {
      console.warn(err); // eslint-disable-line no-console
    }
  }

  // display the markup and attach and logic
  async render(entity, target) {
    target.innerHTML = markup.ship(entity);

    // Tabs
    const contents = target.querySelectorAll('.shipwreck > .content');
    const tabs = target.querySelectorAll('.shipwreck > .tabs > a');
    tabs.forEach(tab => {
      tab.onclick = () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        contents.forEach(c => c.style.display = c.id === tab.name ? 'block' : 'none');
      };
    });
    tabs[0].click();

    // Sub-Entities
    const parent = target.querySelector('.entity-entities');
    entity.entities.forEach(e => {
      const card = _html(markup.card(e));
      parent.appendChild(card);
      // toggle body visibility when head is clicked
      const body = card.querySelector('.body');
      const head = card.querySelector('.head');
      head.onclick = () =>  body.style.display = body.style.display === 'block' ? 'none' : 'block';
    });

    // Links (do this after sub entities are added)
    target.querySelectorAll('.current-path a, #content-entity a')
      .forEach(a => a.addEventListener('click', (e) => {
        e.preventDefault();
        this.fetch({ href: e.target.href });
      }));
  }
}
