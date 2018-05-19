/**
 * Classes for working with Siren Entities
 *
 * Entity
 * - Links
 * - Actions
 *   - Fields
 */

/**
 */
class SirenField {
  constructor(json) {
    this.raw = json;
    // required
    this.name = json['name'] || '';
    // optional
    this.class = json['class'] || '';
    this.type = json['type'] || 'text';
    this.value = json['value'] || '';
    this.title = json['title'] || '';
  }
}

/**
 */
class SirenAction {
  constructor(json) {
    this.raw = json;
    // required
    this.name = json['name'] || '';
    this.href = json['href'] || '';
    // optional
    this.class = json['class'] || [];
    this.method = json['method'] || 'GET';
    this.title = json['title'] || '';
    this.type = json['type'] || 'application/x-www-form-urlencoded;charset=UTF-8';
    this.fields = (json['fields'] || []).map(f => new SirenField(f))
  }

  // get field by name
  field(name) {
    return this.actions.find(a => a.name === name);
  }
}

/**
 */
class SirenLink {
  constructor(json) {
    this.raw = json;
    // required
    this.rel = json['rel'] || [];
    this.href = json['href'] || '';
    // optional
    this.class = json['class'] = [];
    this.type = json['type'] = '';
    this.title = json['title'] = '';
  }
}

/**
 * The Primary thing return by a request to a Siren API
 */
class SirenEntity {
  constructor(json) {
    this.raw = json;
    // optional
    this.actions = (json['actions'] || []).map(a => new SirenAction(a));
    this.class = json['class'] || [];
    this.links = (json['links'] || []).map(l => new SirenLink(l));
    this.properties = json['properties'] || {};
    this.title = json['title'] || '';
    // optional property of sub-entities
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
}
