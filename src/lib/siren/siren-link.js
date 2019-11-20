import { SirenBase } from './siren-base.js';

/**
 * Links represent navigational transitions.
 */
export class SirenLink extends SirenBase {
  constructor(json) {
    super(json);
    // required
    this.rel = this._json['rel'] || [];
    this.href = this._json['href'] || '';
    // optional
    this.class = this._json['class'] || [];
    this.type = this._json['type'] || '';
    this.title = this._json['title'] || '';
  }

  get json() {
    const data = {
      'rel': this.rel,
      'href': this.href,
    };
    if (this.class.length !== 0) {
      data['class'] = this.class;
    }
    if (this.type) {
      data['type'] = this.type;
    }
    if (this.title) {
      data['title'] = this.title;
    }
    return data;
  }

  _validate() {
    super._validate();
    const { rel } = this;
    if (rel === undefined) {
      this._error('rel', 'Required.');
    }
    if (!(rel instanceof Array) || rel.length === 0) {
      this._error('rel', 'MUST be a non-empty array of strings.');
    }
  }
}
