import { SirenBase } from './siren-base.js';

const optionsMapping = ({ title, value = '', checked, selected }) => ({ title, value, checked, selected });

/**
 * Fields represent controls inside of actions.
 */
export class SirenField extends SirenBase {
  constructor(json) {
    super(json);
    // required
    this.name = this._json['name'] || '';
    // optional
    this.class = this._json['class'] || [];
    this.title = this._json['title'] || '';
    this.type = this._json['type'] || 'text';
    this.value = this._json['value'] === undefined ? '' : this._json['value'];
    // NON-SPEC
    if (this.value instanceof Array) {
      this.options = this.value.map(optionsMapping);
      this.value = this.options.find((o) => o.checked || o.selected)?.value || '';
    } else if (this._json['options'] instanceof Array) {
      this.options = this._json['options'].map(optionsMapping);
      this.value ||= this.options.find((o) => o.checked || o.selected)?.value || '';
    }
    this.checked = this._json['checked'];
  }

  get json() {
    const data = {
      'name': this.name,
    };
    if (this.class.length !== 0) {
      data['class'] = this.class;
    }
    if (this.title) {
      data['title'] = this.title;
    }
    if (this.type) {
      data['type'] = this.type;
    }
    if (this.value) {
      data['value'] = this.value;
    }
    return data;
  }

  _validate() {
    if (!this.name) {
      this._error('name', 'Required.');
    }
  }
}
