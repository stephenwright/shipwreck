/**
 * Shipwreck : Heed the Sirens' call
 *
 * A simple client for working with Siren Hypermedia APIs
 */

//import * from './siren.js';
//import markup from './markup.js';

/**
 * Convert a JSON object into a URL encoded parameter string.
 * Usefull for sending data in a query string, or as form parameters
 */
const _urlencode = data => {
  return Object
    .keys(data)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
    .join('&');
}

/** Convert a string to a DOM node */
const _html = str => {
  const template = document.createElement('template');
  template.innerHTML = str.trim();
  return template.content.firstChild;
}

/**
 */
class Shipwreck {

  constructor(target) {
    this.target = target;
    this._token = sessionStorage.getItem('auth-token') || '';
    this._listeners = {};
    this._href = '';
  }

  get token() {
    return this._token;
  }

  set token(val) {
    if (val === this._token) return;
    this._token = val;
    if (val)
      sessionStorage.setItem('auth-token', val);
    else
      sessionStorage.removeItem('auth-token');
  }

  // ----- events

  on(name, fn)  {
    this._listeners[name] = this._listeners[name] || [];
    this._listeners[name].push(fn);
  }

  off(name, fn) {
    if (!this._listeners[name]) return;
    if (!fn) this._listeners[name] = [];
    else this._listeners[name] = this._listeners[name].filter(f => f != fn);
  }

  async _raise(name, data) {
    if (!this._listeners[name]) return;
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
      }
      else if (action.type.indexOf('json') !== -1) {
        body = JSON.stringify(data);
      }
      else {
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
  async fetch(action, data, force = false) {
    if (!force && action.href === this._href) return;
    this._raise('fetch', { message: 'Doing a fetch.', action, data });
    const response = await this.submitAction(action, data);
    if (!response.ok) {
      this._raise('error', { message: `Request failed, status: ${response.status} (${response.statusText})` });
      return;
    }
    this._raise('success', { message: `Request success, status: ${response.status} (${response.statusText})` });
    this._href = action.href;
    try {
      const json = await response.json();
      const entity = new SirenEntity(json);
      await this.render(entity, this.target);
      this._raise('update', { message: 'Updated Entity', entity });
    }
    catch (err) {
      console.warn(err);
    }
  }

  pathClick(e) {
    const href = e.target.href;
    e.preventDefault();
    if (this._href === href) return;
    this.fetch({ href });
  }

  fixForm(form, entity) {
    const action = entity.action(form.getAttribute('name'));
    if (!action) return;
    form.onsubmit = (e) => {
      e.preventDefault();
      const data = {};
      action.fields.forEach(f => data[f.name] = form.elements[f.name].value);
      this.fetch(action, data, true);
    };
  }

  async render(entity, target) {
    target.innerHTML = markup.ship(entity);

    // Current Path
    const pathLinks = target.querySelectorAll('.current-path a');
    pathLinks.forEach(a => a.addEventListener('click', this.pathClick.bind(this)));

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

    // intercept form submission
    target.querySelectorAll('.entity-actions form').forEach(form => this.fixForm(form, entity));

    // sub entities
    const parent = target.querySelector('.entity-entities');
    entity.entities.forEach(e => {
      const card = _html(markup.card(e));
      parent.appendChild(card);
      // intercept form submission
      card.querySelectorAll('.entity-actions form').forEach(form => this.fixForm(form, e));
      // toggle body visibility when head is clicked
      const body = card.querySelector('.body');
      const head = card.querySelector('.head');
      head.onclick = () =>  body.style.display = body.style.display === 'block' ? 'none' : 'block';
    });
  }
}
