/**
 * Shipwreck : Heed the Sirens' call
 *
 * A simple client for working with Siren Hypermedia APIs
 */

import EntityStore from './util/entity-store.js';
import EventEmitter from './util/event-emitter.js';
import markup from './markup.js';

/** Convert a string to a DOM node */
export const _html = str => {
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
export class Shipwreck extends EventEmitter {
  constructor(target) {
    super();
    this.target = target;
    this._baseUri = sessionStorage.getItem('ship-baseUri') || '';
    this._token = sessionStorage.getItem('ship-authToken') || '';
    this._entity = undefined;

    this._store = new EntityStore();
    this._store.on('error', this._onStoreError.bind(this));
    this._store.on('update', this._onStoreUpdate.bind(this));
    this._store.on('inflight', this._onStoreInFlight.bind(this));

    document.body.addEventListener('submit', async (e) => {
      if (this.target && this.target.contains(e.target)) {
        e.preventDefault();
        this.formSubmit(e.target);
      }
    });
  }

  async formSubmit(form) {
    const fields = [];
    for (const { name, value, type, checked } of form.elements) {
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
      name && fields.push({ name, value });
    }
    const action = {
      name: form.name,
      type: form.enctype,
      href: form.action,
      method: method || form.method || 'GET',
      fields,
    };
    this._raise('fetch', {});
    try {
      const { entity } = await this._store.submitAction({ action, token: this._token });
      if (entity) {
        this.entity = entity;
        await this.renderEntity();
        this._raise('success', { message: 'Action submitted.' });
      }
    } catch (err) {
      this._raise('error', { message: err.message });
    }
    this._raise('complete', {});
  }

  _onStoreInFlight(e) {
    this._raise('inflight', { count: e.detail.count });
  }

  _onStoreUpdate(e) {
    this._entity = e.detail.entity;
  }

  _onStoreError(e) {
    const { message, response } = e.detail;
    this._raise('error', { message, response });
  }

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
    uri = uri || undefined; // falsey = undefined
    if (uri === this._baseUri) {
      return;
    }
    this._baseUri = uri;
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
    newToken = newToken || undefined; // falsey = undefined
    if (newToken === this._token) {
      return;
    }
    this._token = newToken;
    if (newToken) {
      sessionStorage.setItem('ship-authToken', newToken);
    } else {
      sessionStorage.removeItem('ship-authToken');
    }
  }

  // submit a request and display the response
  async fetch(path) {
    this._raise('fetch', {});
    try {
      const { href } = new URL(ABSOLUTE_URL_REGEX.test(path) ? path : `${this.baseUri}${path}`);
      const { entity, response } = await this._store.get({ href, token: this._token });
      if (entity) {
        this.entity = entity;
        await this.renderEntity();
      } else if (response) {
        await this.renderResponse(response);
        this._raise('update', { message: 'Displaying raw response', href: response.url });
      } else {
        throw new Error('invalid response');
      }
      this._raise('success', { message: 'Request success', href });
    } catch (err) {
      console.warn(err); // eslint-disable-line no-console
      this._raise('error', { message: err.message, error: err });
    }
    this._raise('complete', { message: 'Fetch complete.' });
  }

  async watchLinks() {
    const { target } = this;
    // Links (do this after sub entities are added)
    target.querySelectorAll('.current-path a, .current-path-params a, #content-entity a')
      .forEach(a => a.addEventListener('click', (e) => {
        const { href } = e.target;
        if (!href) {
          return;
        }
        e.preventDefault();
        this.fetch(href);
      }));
  }

  async initTabs() {
    const { target } = this;
    // Main tabs
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

    // Body tabs
    const tabbed = target.querySelectorAll('.shipwreck .tabbed');
    tabbed.forEach(group => {
      const groupContents = group.querySelectorAll('.tab-content');
      groupContents.forEach(c => c.style.display = 'none');
      const groupTabs = group.querySelectorAll('.tabs a');
      groupTabs.forEach(tab => {
        tab.onclick = () => {
          groupTabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          groupContents.forEach(c => c.style.display = c.className.includes(tab.name) ? 'block' : 'none');
        };
      });
      groupTabs.length && groupTabs[0].click();
    });
  }

  async renderResponse(response) {
    const { target } = this;
    const text = await response.text();
    target.innerHTML = markup.raw(text, response.url);
    this.initTabs();
    this.watchLinks();
  }

  // display the markup and attach some logic
  async renderEntity() {
    const { entity, target } = this;
    target.innerHTML = markup.ship(entity);

    // Sub-Entities
    const parent = target.querySelector('.entity-entities');
    entity._entities.forEach(e => {
      const card = _html(markup.card(e));
      parent.appendChild(card);
      // toggle body visibility when head is clicked
      const body = card.querySelector('.body');
      const head = card.querySelector('.head');
      if (head && body) {
        head.onclick = () =>  body.style.display = body.style.display === 'none' ? '' : 'none';
      }
    });
    this.initTabs();
    this.watchLinks();
  }
}
