/**
 * Shipwreck : Heed the Sirens' call
 *
 * A simple client for working with Siren Hypermedia APIs
 */

const _html = str => {
  const template = document.createElement('template');
  template.innerHTML = str.trim();
  return template.content.firstChild;
}

const _code = json => `<pre><code>${JSON.stringify(json, null, 2)}</code></pre>`;

/**
 */
class SirenLink {
  constructor(json) {
    this.rel = json['rel'] || [];
    this.href = json['href'] || '';
    // optional
    this.class = json['class'] = [];
    this.type = json['type'] = '';
    this.title = json['title'] = '';
  }

  get anchor() {
    return `[${this.rel.join(',')}] <a href="#${this.href}">${this.href}</a>`;
  }
}

/**
 */
class SirenField {
  constructor(json) {
    this.name = json['name'] || '';
    // optional
    this.class = json['class'] || '';
    this.type = json['type'] || 'text';
    this.value = json['value'] || '';
    this.title = json['title'] || '';
  }

  get form() {
    return this.type === 'hidden'
    ? `<input type="${this.type}" value="${this.value}" name="${this.name}">`
    : `
      <div class="form-field">
        <label>${this.name}</label>
        <input type="${this.type}" value="${this.value}" name="${this.name}">
      </div>
    `;
  }
}

/**
 */
class SirenAction {
  constructor(json) {
    this.name = json['name'] || '';
    this.href = json['href'] || '';
    // optional
    this.class = json['class'] || [];
    this.method = json['method'] || 'GET';
    this.title = json['title'] || '';
    this.type = json['type'] || 'application/x-www-form-urlencoded;charset=UTF-8';
    this.fields = (json['fields'] || []).map(f => new SirenField(f))
  }

  get form() {
    return `
      <form action='${this.href}' method='${this.method}' type='${this.type}' onsubmit='return false;'>
        <h3>${this.name}</h3>
        <p>${this.method} ${this.href}</p>
        <div class='form-fields'>
          ${this.fields.map(f => f.form).join('\n')}
        </div>
        <input type='submit' value='submit'>
      </form>
    `;
  }
}

/**
 */
class SirenEntity {
  constructor(json) {
    this.raw = json;
    // optional
    this.actions = (json['actions'] || []).map(a => new SirenAction(a));
    this.links = (json['links'] || []).map(l => new SirenLink(l));
    this.properties = json['properties'] || {};
    this.class = json['classes'] || [];
    this.entities = json['entities'] || [];
    this.title = json['title'] || '';
    // for sub-entities
    this.rel = json['rel'] || [];
  }

  action(name) {
    return this.actions.find(a => a.name === name);
  }

  entity(rel) {
    return this.entities.find(e => e.rel.includes(rel));
  }

  link(rel) {
    return this.links.find(l => l.rel.includes(rel));
  }
}

/**
 */
class Shipwreck {
  constructor() {
    this.token = '';
  }

  _urlencode(data) {
    return Object
      .keys(data)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
      .join('&');
  }

  async submitAction(action, data) {
    const headers = new Headers();
    action.type && headers.set('content-type', action.type);
    this.token && headers.set('authorization', `Bearer ${this.token}`);

    let body;
    let url = action.href;

    if (data) {
      if (['GET', 'HEAD'].includes(action.method)) {
        url = `${url}?${this._urlencode(data)}`;
      }
      else if (action.type.indexOf('json') !== -1) {
        body = JSON.stringify(data);
      }
      else {
        body = this._urlencode(data);
      }
    }

    const options = {
      body,
      cache: 'no-cache',
      headers,
      method: action.method || 'GET',
      mode: 'cors',
    };

    return await fetch(url, options);
  }

  async fetch(action, data) {
    try {
      const response = await this.submitAction(action, data);
      if (!response.ok)
        throw new Error(`Request failed, status: ${response.status} (${response.statusText})`);
      const json = await response.json();
      const entity = new SirenEntity(json);
      this.render(entity, document.getElementById('output'));
    }
    catch(err) {
      console.error(err);
    }
  }

  render(entity, target) {
    // clear the content of the target output element before refilling it
    target.innerHTML = '';

    // Display the Properties
    const rows = Object
      .keys(entity.properties)
      .map(k => `<tr>
        <td class="key">${k}:</td>
        <td class="value">${entity.properties[k]}</td></tr>`)
      .join('\n');

    target.appendChild(_html(`
      <div class="entity-properties">
        <h2>Properties</h2>
        <table><tbody>${rows}</tbody></<table>
      </div>
    `));

    // Display all the Links
    target.appendChild(_html(`
      <div class="entity-links">
        <h2>Links</h2>
        <ul>${entity.links.map(l => `<li>${l.anchor}</li>`).join('\n')}</ul>
      </div>
    `));

    // Display Entites
    target.appendChild(_html(`
      <div class="entity-entities">
        <h2>Entities</h2>
        ${entity.entities.map(e => {
          const link = new SirenEntity(e).link('self');
          return `
          <div class="card">
            <h3>
              [${e.class.join(',')}]
              <a href="#${link.href}">${e.properties.name || e.properties.title}</a>
            </h3>
            <div class="entity-raw">${_code(e.properties)}</div>
          </div>
        `;}).join('\n')}
      </div>
    `));

    // Display a form for each Action
    const actions = _html(`
      <div class="entity-actions">
        <h2>Actions</h2>
      </div>
    `);

    entity.actions.forEach(a => {
      const card = _html(`<div class="card"></div>`);
      const form = _html(a.form);
      form.onsubmit = () => {
        const data = {};
        a.fields.forEach(f => data[f.name] = form.elements[f.name].value);
        this.fetch(a, data);
        return false;
      };
      card.appendChild(form);
      actions.appendChild(card);
    });

    target.appendChild(actions);

    // Display the raw JSON received from the API request
    target.appendChild(_html(`
      <div class="entity-raw">
        <h2>Raw</h2>
        ${_code(entity.raw)}
      </div>
    `));
  }
}

/**
 * Application Entry Point
 */

// create shipwreck instance
const ship = new Shipwreck();

// get handle to form inputs
const shipHref = document.getElementById('ship-href');
const shipToken = document.getElementById('ship-token');

// keep auth token in session storage
shipToken.value = sessionStorage.getItem('auth-token') || '';

const _clearStorage = async () => {
  shipToken.value = '';
  sessionStorage.clear();
}

// submit API reqest
const _submit = async () => {
  location.hash = shipHref.value;
  ship.token = shipToken.value;
  ship.token && sessionStorage.setItem('auth-token', ship.token);
  await ship.fetch({ href: shipHref.value });
}

// sync the location hash with the api href input field
const _checkHash = () => {
  if (shipHref.value === location.hash) return;
  shipHref.value = location.hash.slice(1);
  _submit();
}

window.onhashchange = _checkHash;
window.onload = _checkHash;
