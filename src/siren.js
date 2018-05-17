/**
 * classes for working with Siren Entities
 */

/**
 */
class SirenLink {
  constructor(json) {
    this.rel = json['rel'] || [];
    this.href = json['href'] || '';
    // optional
    this.class = json['class'] = [];
    this.type = json['type'] = '';
    this.title = json['title'] = '';
  }

  get anchor() {
    return `[${this.rel.join(',')}] <a href="#${this.href}">${this.href}</a>`;
  }
}

/**
 */
class SirenField {
  constructor(json) {
    this.name = json['name'] || '';
    // optional
    this.class = json['class'] || '';
    this.type = json['type'] || 'text';
    this.value = json['value'] || '';
    this.title = json['title'] || '';
  }

  get form() {
    return this.type === 'hidden'
    ? `<input type="${this.type}" value="${this.value}" name="${this.name}">`
    : `
      <div class="form-field">
        <label>${this.name}</label>
        <input type="${this.type}" value="${this.value}" name="${this.name}">
      </div>
    `;
  }
}

/**
 */
class SirenAction {
  constructor(json) {
    this.name = json['name'] || '';
    this.href = json['href'] || '';
    // optional
    this.class = json['class'] || [];
    this.method = json['method'] || 'GET';
    this.title = json['title'] || '';
    this.type = json['type'] || 'application/x-www-form-urlencoded;charset=UTF-8';
    this.fields = (json['fields'] || []).map(f => new SirenField(f))
  }

  get form() {
    return `
      <form action='${this.href}' method='${this.method}' type='${this.type}' onsubmit='return false;'>
        <h3>${this.name}</h3>
        <p>${this.method} ${this.href}</p>
        <div class='form-fields'>
          ${this.fields.map(f => f.form).join('\n')}
        </div>
        <input type='submit' value='submit'>
      </form>
    `;
  }
}

/**
 */
class SirenEntity {
  constructor(json) {
    this.raw = json;
    // optional
    this.actions = (json['actions'] || []).map(a => new SirenAction(a));
    this.links = (json['links'] || []).map(l => new SirenLink(l));
    this.properties = json['properties'] || {};
    this.class = json['classes'] || [];
    this.entities = json['entities'] || [];
    this.title = json['title'] || '';
    // for sub-entities
    this.rel = json['rel'] || [];
  }

  action(name) {
    return this.actions.find(a => a.name === name);
  }

  entity(rel) {
    return this.entities.find(e => e.rel.includes(rel));
  }

  link(rel) {
    return this.links.find(l => l.rel.includes(rel));
  }
}
