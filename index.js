/**
 * Shipwreck : Heed the Sirens' call
 *
 * A simple client for working with Siren Hypermedia APIs
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
    return `
      <div class='form-field'>
        <label>${this.name}</label>
        <input type='${this.type}' value='${this.value}'>
      </div>
    `;
  }
}

class SirenAction {
  constructor(json) {
    this.name = json['name'] || '';
    this.href = json['href'] || '';
    // optional
    this.class = json['class'] || [];
    this.method = json['method'] || 'GET';
    this.title = json['title'] || '';
    this.type = json['type'] || 'application/x-www-form-urlencoded';
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
    this.rel = json['rel'] || []
  }

  link(rel) {
    return links.find(l => l.rel.includes(rel));
  }

  action(name) {
    return actions.find(a => a.name === name);
  }

  get toString() {

  }
}

class Shipwreck {
  constructor() {
    this.token = '';
  }

  async submitAction(action) {
    //const data = form.elements.map(e => ({e.name : e.value}));
    const options = {
      //body: data,
      cache: 'no-cache',
      headers: {
        'content-type': 'application/json',
        'user-agent': 'shipwreck',
      },
      method: action.method,
      mode: 'cors',
    };

    if (this.token)
      options.headers['Authentication'] = `Bearer ${this.token}`;

    return await fetch(action.href, options);
  }

  async queryApi(href) {
    console.info('querying', href);
    try {
      const response = await this.submitAction({
        href,
        method: 'GET',
        type: 'application/json',
      });
      const json = await response.json();
      const entity = new SirenEntity(json);
      console.info(entity);
      this.render(entity);
    }
    catch(err) {
      console.error('something went wrong', err);
    }
  }

  render(entity) {
    const output = document.getElementById('output');
    output.innerHTML = `
      <h2>Links</h2>
      <ul class='entity-links'>
        ${entity.links.map(l => `<li>${l.anchor}</li>`).join('\n')}
      </ul>

      <h2>Actions</h2>
      <div class='entity-actions'>
        ${entity.actions.map(a => `<div class='card'>${a.form}</div>`).join('\n')}
      </div>

      <h2>Raw</h2>
      <div class="raw-response">
        <pre><code class="language-json">${JSON.stringify(entity.raw, null, 2)}</code><pre>
      </div>
    `;
  }
}

// Fun with globals!

const ship = new Shipwreck();
const shipHref = document.getElementById('ship-href');

const _submit = async () => {
  location.hash = shipHref.value;
  await ship.queryApi(shipHref.value);
}

const _update = async (href) => {
  shipHref.value = href;
  _submit();
}

_checkHash = () => {
  if (shipHref.value === location.hash) return;
  shipHref.value = location.hash.slice(1);
  _submit();
}

window.onhashchange = _checkHash;
window.onload = _checkHash;
