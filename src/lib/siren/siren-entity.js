import { SirenBase } from './siren-base.js';
import { SirenLink } from './siren-link.js';
import { SirenAction } from './siren-action.js';

function _finder(q) {
  if (typeof q === 'string') {
    q = { rel: q, class: q, href: q, name: q };
  }
  return (e) => {
    if (q.rel && e.rel.includes(q.rel)) {
      return true;
    }
    if (q.class && e.class.includes(q.class)) {
      return true;
    }
    if (q.href && e.href === q.href) {
      return true;
    }
    if (q.name && e.name === q.name) {
      return true;
    }
    return false;
  };
}

/**
 * SirenEntity
 */
export class SirenEntity extends SirenBase {
  constructor(json) {
    super(json);
    // optional
    this.actions = (this._json['actions'] || []).map((a) => new SirenAction(a));
    this.entities = [];
    this.links = (this._json['links'] || []).map((l) => new SirenLink(l));
    this.class = this._json['class'] || [];
    this.properties = this._json['properties'] || {};
    this.title = this._json['title'] || '';
    // required for sub-entities
    this.rel = this._json['rel'] || [];
    // sub entities can be entities or links
    // if it has an `href` it's a link, otherwise it's an entity
    this.entities = (this._json['entities'] || []).map((e) => e.href ? new SirenLink(e) : new SirenEntity(e));
  }

  getAction(query) {
    return this.actions.find(_finder(query));
  }

  getActions(query) {
    return query ? this.actions.filter(_finder(query)) : this.actions;
  }

  getEntity(query) {
    return this.entities.find(_finder(query));
  }

  getEntities(query) {
    return query ? this.entities.filter(_finder(query)) : this.entities;
  }

  getLink(query) {
    return this.links.find(_finder(query));
  }

  getLinks(query) {
    return query ? this.links.filter(_finder(query)) : this.links;
  }

  // safely get deep property using dot notation ('some.deep.property')
  getProperty(name) {
    if (!name || !this.properties) {
      return;
    }
    const keys = name.split('.');
    let value = this.properties;
    // eslint-disable-next-line no-cond-assign
    for (let key; key = keys.shift();) {
      value = value[key];
      if (value === undefined) {
        return;
      }
    }
    return value;
  }

  get json() {
    const data = {};
    if (this.actions.length !== 0) {
      data['actions'] = this.actions.map((action) => action.json);
    }
    if (this.class.length !== 0) {
      data['class'] = this.class;
    }
    if (this.links.length !== 0) {
      data['links'] = this.links.map((link) => link.json);
    }
    if (this.entities.length !== 0) {
      data['entities'] = this.entities.map((entity) => entity.json);
    }
    if (Object.keys(this.properties).length !== 0) {
      data['properties'] = this.properties;
    }
    if (this.title) {
      data['title'] = this.title;
    }
    return data;
  }

  _validate() {
    this.actions.forEach((e) => e._validate());
    this.entities.forEach((e) => {
      e._validate();
      if (e.rel === undefined) {
        this._error('rel', 'Required.');
      }
      if (!(e.rel instanceof Array) || rel.length === 0) {
        this._error('rel', 'MUST be a non-empty array of strings.');
      }
    });
    this.links.forEach((e) => e._validate());
  }
}
