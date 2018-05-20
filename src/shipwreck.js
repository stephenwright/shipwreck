/**
 * Shipwreck : Heed the Sirens' call
 *
 * A simple client for working with Siren Hypermedia APIs
 */
class Shipwreck {

  constructor(target) {
    this.target = target;
    this._token = sessionStorage.getItem('auth-token') || '';
    this._listeners = {};
  }

  get token() {
    return this._token;
  }

  set token(val) {
    if (val === this._token) return;
    this._token = val;
    sessionStorage.setItem('auth-token', val);
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

  async _raiseEvent(name, data) {
    if (!this._listeners[name]) return;
    this._listeners[name].forEach(fn => fn(data));
  }

  // -----

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

  // submit a request and display the response
  async fetch(action, data) {
    const response = await this.submitAction(action, data);
    if (!response.ok) {
      this._raiseEvent('error', { message: `Request failed, status: ${response.status} (${response.statusText})` });
      return;
    }
    const json = await response.json();
    const entity = new SirenEntity(json);
    await this.render(entity, this.target);
    await this._raiseEvent('update', { entity });
  }

  async render(entity, target) {
    // clear the content of the target output element before refilling it
    target.innerHTML = `
      <div class="shipwreck">
      <div class="current-path"></div>
      <div class="tabs"></div>
        <div class="fancy">
          <div class="flex-parent">
            <div class="root"></div>
          </div>
        </div>
        <div class="raw"></div>
      </div>
    `;

    const root = target.querySelector('.root');
    const fancy = target.querySelector('.fancy');
    const flexParent = target.querySelector('.flex-parent');
    const raw = target.querySelector('.raw');

    // Display the raw JSON received from the API request
    raw.innerHTML = `<div class="entity-raw">${markup.code(entity.raw)}</div>`;

    // --- tabs
    const tabs = target.querySelector('.tabs');
    const tab1 = _html('<a name="shipwreck-entity" class="active">Entity</a>');
    const tab2 = _html('<a name="shipwreck-raw">Raw</a>');
    tab1.onclick = () => {
      fancy.style.display = 'block';
      raw.style.display = 'none';
      tab1.classList.add('active');
      tab2.classList.remove('active');
    };
    tab2.onclick = () => {
      fancy.style.display = 'none';
      raw.style.display = 'block';
      tab1.classList.remove('active');
      tab2.classList.add('active');
    };
    tabs.appendChild(tab1);
    tabs.appendChild(tab2);
    raw.style.display = 'none';
    // ---

    // Current path
    const link = entity.link('self');
    if (link) {
      const url = new URL(link.href);
      const parts = url.pathname.split('/').filter(i => i);
      let href = url.origin;
      target.querySelector('.current-path').innerHTML = `
          <a href="#${href}">${href}</a> /
          ${parts.map(p => `<a href="#${href = href + '/' + p}">${p}</a>`).join(' / ')}
      `;
    }

    // Entity class
    entity.class.length !== 0 && root.appendChild(_html(`
      <div class="entity-class">
        <h2>Class</h2>
        [ ${entity.class.join(', ')} ]
      </div>
    `));

    // Display the Properties
    if (Object.keys(entity.properties).length !== 0) {
      const rows = Object
        .keys(entity.properties)
        .map(k => `
          <tr>
            <td class="key">${k}:</td>
            <td class="value">${entity.properties[k]}</td>
          </tr>`)
        .join('\n');

      root.appendChild(_html(`
        <div class="entity-properties">
          <h2>Properties</h2>
          <table><tbody>${rows}</tbody></table>
        </div>
      `));
    }

    // Display all the Links
    entity.links.length !== 0 && root.appendChild(_html(`
      <div class="entity-links">
        <h2>Links</h2>
        ${entity.links.map(l => `<div>${markup.linkAnchor(l)}</div>`).join('\n')}
      </div>
    `));

    // Display Entites
    if (entity.entities.length !== 0) {
      const entities = _html(`
        <div class="entity-entities">
          <h2>Entities</h2>
        </div>
      `);

      const cards = entity.entities.forEach(e => {
        const card = _html(markup.card(e));
        const body = card.querySelector('.body');
        const head = card.querySelector('.head');
        head.onclick = () =>  body.style.display = body.style.display === 'block' ? 'none' : 'block';
        if (e.actions.length !== 0) {
          body.appendChild(_html('<label>actions:</label>'));
          e.actions.forEach(a => body.appendChild(this.actionForm(a)));
        }
        entities.appendChild(card);
      });

      flexParent.appendChild(entities);
    }

    // Display a form for each Action
    if (entity.actions.length !== 0) {
      const actions = _html(`
        <div class="entity-actions">
          <h2>Actions</h2>
        </div>
      `);
      entity.actions.forEach(a => {
        const card = _html(`<div class="card"></div>`);
        card.appendChild(this.actionForm(a));
        actions.appendChild(card);
      });
      root.appendChild(actions);
    }
  }

  actionForm(action) {
    const form = _html(markup.actionForm(action));
    form.onsubmit = () => {
      const data = {};
      action.fields.forEach(f => data[f.name] = form.elements[f.name].value);
      this.fetch(action, data);
      return false;
    };
    return form;
  }

}
