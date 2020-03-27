import { SirenBase } from './siren-base.js';
import { SirenLink } from './siren-link.js';
import { SirenAction } from './siren-action.js';

function finder(q) {
  if (typeof q === 'string') {
    q = { rel: q, class: q, href: q };
  }
  return (e) => (q.rel && e.rel.includes(q.rel)) || (q.class && e.class.includes(q.class)) || e.href === q.href;
}

/**
 * SirenEntity
 */
export class SirenEntity extends SirenBase {
  constructor(json) {
    super(json);
    // optional
    this._actions = (this._json['actions'] || []).map((a) => new SirenAction(a));
    this._entities = [];
    this._links = (this._json['links'] || []).map((l) => new SirenLink(l));
    this.class = this._json['class'] || [];
    this.properties = this._json['properties'] || {};
    this.title = this._json['title'] || '';
    // required for sub-entities
    this.rel = this._json['rel'] || [];
    // sub entities can be entities or links
    // if it has an `href` it's a link, otherwise it's an entity
    this._entities = (this._json['entities'] || []).map((e) => e.href ? new SirenLink(e) : new SirenEntity(e));
  }

  // get action by name
  action(name) {
    return this._actions.find((a) => a.name === name);
  }

  // get all actions
  actions() {
    return this._actions;
  }

  // get first sub entity by rel or class
  entity(query) {
    return this._entities.find(finder(query));
  }

  // get all sub entities by rel or class
  entities(query) {
    if (!query) {
      return this._entities;
    }
    return this._entities.filter(finder(query));
  }

  // get first link by rel or class
  link(query) {
    return this._links.find(finder(query));
  }

  // get all links by rel or class
  links(query) {
    if (!query) {
      return this._links;
    }
    return this._links.filter(finder(query));
  }

  // safely get deep property using dot notation ('some.deep.property')
  property(name) {
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
    if (this._actions.length !== 0) {
      data['actions'] = this._actions.map((action) => action.json);
    }
    if (this.class.length !== 0) {
      data['class'] = this.class;
    }
    if (this._links.length !== 0) {
      data['links'] = this._links.map((link) => link.json);
    }
    if (this._entities.length !== 0) {
      data['entities'] = this._entities.map((entity) => entity.json);
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
    this._actions.forEach((e) => e._validate());
    this._entities.forEach((e) => {
      e._validate();
      if (e.rel === undefined) {
        this._error('rel', 'Required.');
      }
      if (!(e.rel instanceof Array) || rel.length === 0) {
        this._error('rel', 'MUST be a non-empty array of strings.');
      }
    });
    this._links.forEach((e) => e._validate());
  }
}
