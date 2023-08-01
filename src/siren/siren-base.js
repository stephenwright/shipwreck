/**
 * Base Siren class with stubs for common methods
 */
export class SirenBase {
  constructor(json) {
    this._json = JSON.parse(JSON.stringify(json));
    this.raw = JSON.parse(JSON.stringify(json));
    this.errors = new Map();
  }

  get json() {
    // sub classes should overwrite this method
    return {};
  }

  _validate() {
    // sub classes should overwrite this method
  }

  validate() {
    this._validate();
    return this.errors.size === 0;
  }

  _error(field, message) {
    let errors = this.errors.get(field);
    if (!errors) {
      this.errors.set(field, errors = new Set());
    }
    errors.add(message);
  }

  toString() {
    return JSON.stringify(this.json);
  }
}
