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

/**
 * Emits the following events:
 *  fetch - starting a fetch
 *  success - fetch was successful
 *  update - then entity has been updated
 *  complete - fetch complete (calls wether it was successful or not)
 *  error - something went wrong
 */
export class Shipwreck extends EventEmitter {
  constructor(target) {
    super();
    this.target = target;
    this._entity = undefined;
    this._token = sessionStorage.getItem('auth-token') || '';
    this._cachingEnabled = true;

    this._store = new EntityStore();
    this._store.on('error', this._onStoreError.bind(this));
    this._store.on('update', this._onStoreUpdate.bind(this));

    document.body.addEventListener('submit', async (e) => {
      if (this.target && this.target.contains(e.target)) {
        e.preventDefault();
        this.formSubmit(e.target);
      }
    });
  }

  async formSubmit(form) {
    const fields = [];
    let method;
    // const data = new FormData(form);
    // if (data.has('_method')) {
    //   method = data.get('_method');
    //   data.delete('_method');
    // }
    // data.forEach((value, name) => fields.push({ name, value }));
    for (const { name, value, type, checked } of form.elements) {
      if (name === '_method') {
        method = value;
        continue;
      }
      name && fields.push({ name, value: type === 'checkbox' ? checked : value });
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
      const entity = await this._store.submitAction(action, {
        token: this._token,
        useCache: this._cachingEnabled,
      });
      if (entity) {
        this.entity = entity;
        await this.render();
        this._raise('success', { message: 'Action submitted.' });
      }
    } catch (err) {
      this._raise('error', { message: err.message });
    }
    this._raise('complete', {});
  }

  _onStoreError(data) {
    this._raise('error', data);
  }

  _onStoreUpdate({ href, entity }) {
    this._entity = entity;
    this._raise('change', { href, entity });
  }

  get entity() {
    return this._entity;
  }

  set entity(entity) {
    this._entity = entity;
    this._raise('update', { message: 'Entity was been updated', entity });
  }

  get cachingEnabled() {
    return this._cachingEnabled;
  }

  set cachingEnabled(val) {
    this._cachingEnabled = val === true;
    if (!this._cachingEnabled) {
      this._store.clear(this._token);
    }
    return this._cachingEnabled;
  }

  get token() {
    return this._token;
  }

  set token(newToken) {
    newToken = newToken || undefined; // falsey = undefined
    if (newToken === this._token) {
      return;
    }
    this._store.clear(this._token);
    this._token = newToken;
    if (newToken) {
      sessionStorage.setItem('auth-token', newToken);
    } else {
      sessionStorage.removeItem('auth-token');
    }
  }

  // submit a request and display the response
  async fetch(href) {
    this._raise('fetch', { message: 'Doing a fetch.', href });
    try {
      const entity = await this._store.get(href, {
        token: this._token,
        useCache: this._cachingEnabled,
      });
      if (entity) {
        this.entity = entity;
        await this.render();
        this._raise('success', { message: 'Request success' });
      }
    } catch (err) {
      console.warn(err); // eslint-disable-line no-console
    }
    this._raise('complete', { message: 'Fetch complete.' });
  }

  // display the markup and attach some logic
  async render() {
    const { entity, target } = this;
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
      if (head && body) {
        head.onclick = () =>  body.style.display = body.style.display === 'block' ? 'none' : 'block';
      }
    });

    // Links (do this after sub entities are added)
    target.querySelectorAll('.current-path a, #content-entity a')
      .forEach(a => a.addEventListener('click', (e) => {
        e.preventDefault();
        this.fetch(e.target.href);
      }));
  }
}
