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
    markup.ship(entity, target);
    // intercept action form submissions
    target.querySelectorAll('.entity-actions form').forEach(form => {
      form.onsubmit = () => {
        const action = entity.action(form.name);
        if (action) {
          const data = {};
          action.fields.forEach(f => data[f.name] = form.elements[f.name].value);
          this.fetch(action, data);
        }
        else {
          this._raise('error', { message: 'Could not find the entity action associated with submitted form.'});
        }
        return false;
      };
    });
  }

}
