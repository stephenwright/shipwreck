/**
 * Shipwreck : Heed the Sirens' call
 *
 * A simple client for working with Siren Hypermedia APIs
 */

const _html = (str) => {
  const template = document.createElement('template');
  template.innerHTML = str.trim();
  return template.content.firstChild;
}

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
    return `
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
    this.rel = json['rel'] || []
  }

  link(rel) {
    return links.find(l => l.rel.includes(rel));
  }

  action(name) {
    return actions.find(a => a.name === name);
  }
}

/**
 */
class Shipwreck {
  constructor() {
    this.token = '';
  }

  async submitAction(action, data) {
    const options = {
      cache: 'no-cache',
      headers: {
        'user-agent': 'shipwreck',
        'content-type': action.type || 'application/json',
      },
      method: action.method || 'GET',
      mode: 'cors',
    };

    if (action.method === 'POST' && data) {
      options.headers['content-type'] = action.type;
      options.body = data;
    }

    // append the auth token if it's available
    if (this.token) {
      options.headers['Authentication'] = `Bearer ${this.token}`;
    }

    return await fetch(action.href, options);
  }

  async queryApi(href) {
    //console.info('querying', href);
    try {
      const response = await this.submitAction({ href });
      //console.info(response);
      const json = await response.json();
      const entity = new SirenEntity(json);
      //console.info(entity);
      this.render(entity);
    }
    catch(err) {
      console.error('something went wrong', err);
    }
  }

  render(entity) {
    const output = document.getElementById('output');
    output.innerHTML = '';

    // Display the properties
    output.appendChild(_html(`
      <div class="entity-properties">
        <h2>Properties</h2>
        <pre><code>${JSON.stringify(entity.properties, null, 2)}</code></pre>
      </div>
    `));

    // Display all the links
    output.appendChild(_html(`
      <div class="entity-links">
        <h2>Links</h2>
        <ul>
          ${entity.links.map(l => `<li>${l.anchor}</li>`).join('\n')}
        </ul>
      </div>
    `));

    // Display a form for each action
    const actions = _html(`
      <div class="entity-actions">
        <h2>Actions</h2>
      </div>
    `);

    entity.actions.forEach(a => {
      const card = _html(`<div class="card"></div>`);
      const form = _html(a.form);
      form.onsubmit = () => {
        // get the form data
        const data = [];
        for (let i = 0; i < form.elements.length; ++i) {
          const el = form.elements[i];
          if (!el.name) continue;
          data.push(`${el.name}=${el.value}`);
        }
        // submit the action
        this.submitAction(a, data.join('&'))
          .then(response => response.json())
          .then(json => this.render(new SirenEntity(json)));
        return false;
      };
      card.appendChild(form);
      actions.appendChild(card);
    });

    output.appendChild(actions);

    // Display the raw JSON received from the API request
    output.appendChild(_html(`
      <div class="entity-raw">
        <h2>Raw</h2>
        <pre><code>${JSON.stringify(entity.raw, null, 2)}</code><pre>
      </div>
    `));
  }
}

// Fun with globals!

const ship = new Shipwreck();

const shipHref = document.getElementById('ship-href');
const shipToken = document.getElementById('ship-token');

const _submit = async () => {
  location.hash = shipHref.value;
  ship.token = shipToken.value;
  await ship.queryApi(shipHref.value);
}

const _update = async (href) => {
  shipHref.value = href;
  _submit();
}

// sync the location hash with the api href
_checkHash = () => {
  if (shipHref.value === location.hash) return;
  shipHref.value = location.hash.slice(1);
  _submit();
}
window.onhashchange = _checkHash;
window.onload = _checkHash;
