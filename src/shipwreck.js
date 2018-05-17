/**
 * Shipwreck : Heed the Sirens' call
 *
 * A simple client for working with Siren Hypermedia APIs
 */

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

/**
 * Convert a string to a DOM node
 */
const _html = str => {
  const template = document.createElement('template');
  template.innerHTML = str.trim();
  return template.content.firstChild;
}

/**
 * Stringify a JSON object into a code block
 */
const _code = json => `<pre><code>${JSON.stringify(json, null, 2)}</code></pre>`;

/**
 */
class Shipwreck {
  constructor(target) {
    this.target = target;
    this._token = sessionStorage.getItem('auth-token') || '';
    this._listeners = {};
  }

  // register an event listener
  on(name, fn)  {
    this._listeners[name] = this._listeners[name] || [];
    this._listeners[name].push(fn);
  }

  get token() {
    return this._token;
  }

  set token(val) {
    if (val === this._token) return;
    this._token = val;
    sessionStorage.setItem('auth-token', val);
  }

  _raiseEvent(name, data) {
    if (!this._listeners[name]) return;
    this._listeners[name].forEach(fn => fn(data));
  }

  async submitAction(action, data) {
    const headers = new Headers();
    action.type && headers.set('content-type', action.type);
    this._token && headers.set('authorization', `Bearer ${this._token}`);

    let body;
    let url = action.href;

    if (data) {
      if (['GET', 'HEAD'].includes(action.method)) {
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
      method: action.method || 'GET',
      mode: 'cors',
    };

    return await fetch(url, options);
  }

  async fetch(action, data) {
    try {
      const response = await this.submitAction(action, data);
      if (!response.ok) {
        if (response.status === 401) {
          this.token = '';
          this._raiseEvent('error', { message: 'Auth token is no longer valid.' });
        }
        throw new Error(`Request failed, status: ${response.status} (${response.statusText})`);
      }
      const json = await response.json();
      const entity = new SirenEntity(json);
      this.render(entity, this.target);
    }
    catch(err) {
      console.error(err);
    }
  }

  render(entity, target) {
    // clear the content of the target output element before refilling it
    target.innerHTML = '';

    // Entity class
    target.appendChild(_html(`
      <div class="entity-class">
        <h2>Class</h2>
        [ ${entity.class.join(', ')} ]
      </div>
    `));

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
        ${entity.links.map(l => `<div>${l.anchor}</div>`).join('\n')}
      </div>
    `));

    // Display Entites
    const entities = target.appendChild(_html(`
      <div class="entity-entities">
        <h2>Entities</h2>
        ${entity.entities.map(e => e.card).join('\n')}
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
