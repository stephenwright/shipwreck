import { SirenBase } from './siren-base.js';
import { SirenField } from './siren-field.js';

/**
 * Actions show available behaviors an entity exposes.
 */
export class SirenAction extends SirenBase {
  constructor(json) {
    super(json);
    // required
    this.name = this._json['name'] || '';
    this.href = this._json['href'] || '';
    // optional
    this.class = this._json['class'] || [];
    this.method = this._json['method'] || 'GET';
    this.title = this._json['title'] || '';
    this.type = this._json['type'] || 'application/x-www-form-urlencoded;charset=UTF-8';
    this.fields = (this._json['fields'] || []).map((f) => new SirenField(f));
  }

  // get field by name
  field(name) {
    return this._actions.find((a) => a.name === name);
  }

  get json() {
    const data = {
      'name': this.name,
      'href': this.href,
    };
    if (this.class.length !== 0) {
      data['class'] = this.class;
    }
    if (this.method) {
      data['method'] = this.method;
    }
    if (this.title) {
      data['title'] = this.title;
    }
    if (this.type) {
      data['type'] = this.type;
    }
    if (this.fields.length !== 0) {
      data['fields'] = this.fields.map((field) => field.json);
    }
    return data;
  }

  _validate() {
    if (!this.name) {
      this._error('name', 'Required.');
    }
    if (!this.href) {
      this._error('href', 'Required.');
    }
    this.fields.forEach((f) => f._validate());
  }
}
