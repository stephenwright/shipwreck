/**
 * Classes for working with Siren Entities
 *
 * Entity
 * - SubEntity
 * - Links
 * - Actions
 *   - Fields
 */

class SirenBase {
  constructor(json) {
    this.raw = json;
  }

  get json() {
    return {};
  }

  toString() {
    return JSON.stringify(this.json);
  }
}

/**
 */
export class SirenLink extends SirenBase {
  constructor(json) {
    super(json);
    // required
    this.rel = json['rel'] || [];
    this.href = json['href'] || '';
    // optional
    this.class = json['class'] = [];
    this.type = json['type'] = '';
    this.title = json['title'] = '';
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
}

/**
 */
export class SirenField extends SirenBase {
  constructor(json) {
    super(json);
    // required
    this.name = json['name'] || '';
    // optional
    this.class = json['class'] || [];
    this.title = json['title'] || '';
    this.type = json['type'] || 'text';
    this.value = json['value'] === undefined ? '' : json['value'];
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
}

/**
 */
export class SirenAction extends SirenBase {
  constructor(json) {
    super(json);
    // required
    this.name = json['name'] || '';
    this.href = json['href'] || '';
    // optional
    this.class = json['class'] || [];
    this.method = json['method'] || 'GET';
    this.title = json['title'] || '';
    this.type = json['type'] || 'application/x-www-form-urlencoded;charset=UTF-8';
    this.fields = (json['fields'] || []).map(f => new SirenField(f));
  }

  // get field by name
  field(name) {
    return this.actions.find(a => a.name === name);
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
      data['fields'] = this.fields.map(field => field.json());
    }
    return data;
  }
}

/**
 * The Primary thing return by a request to a Siren API
 */
export class SirenEntity extends SirenBase {
  constructor(json) {
    super(json);
    // optional
    this.actions = (json['actions'] || []).map(a => new SirenAction(a));
    this.class = json['class'] || [];
    this.links = (json['links'] || []).map(l => new SirenLink(l));
    this.properties = json['properties'] || {};
    this.title = json['title'] || '';
    // optional for sub-entities
    this.rel = json['rel'] || [];
    // sub entities can be entities or links
    // if it has an `href` it's a link, otherwise it's an entity
    this.entities = (json['entities'] || []).map(e => e.href ? new SirenLink(e) : new SirenEntity(e));
  }

  // get action by name
  action(name) {
    return this.actions.find(a => a.name === name);
  }

  // get sub entity by rel
  entity(rel) {
    return this.entities.find(e => e.rel.includes(rel));
  }

  // get link by rel
  link(rel) {
    return this.links.find(l => l.rel.includes(rel));
  }

  get json() {
    const data = {};
    if (this.actions.length !== 0) {
      data['actions'] = this.actions.map(action => action.json());
    }
    if (this.class.length !== 0) {
      data['class'] = this.class;
    }
    if (this.links.length !== 0) {
      data['links'] = this.links.map(link => link.json());
    }
    if (this.entities.length !== 0) {
      data['entities'] = this.entities.map(entity => entity.json());
    }
    if (Object.keys(properties).length !== 0) {
      data['properties'] = this.properties;
    }
    if (this.title) {
      data['title'] = this.title;
    }
    if (this.rel.length !== 0) {
      data['rel'] = this.rel;
    }
    return data;
  }
}
