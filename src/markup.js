
/**
 * Convert a JSON object into a URL encoded parameter string.
 * Usefull for sending data in a query string, or as form parameters
 */
const _urlencode = data => {
  return Object
    .keys(data)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
    .join('&');
}

/** Convert a string to a DOM node */
const _html = str => {
  const template = document.createElement('template');
  template.innerHTML = str.trim();
  return template.content.firstChild;
}

/** helpers for generating HTML markup */
const markup = {

  a(href, text) {
    return `<a href="#${href}">${text}</a>`;
  },

  /** Stringify a JSON object into a code block */
  code(json) {
    return `<pre><code>${JSON.stringify(json, null, 2)}</code></pre>`;
  },

  card(item) {
    if (item instanceof SirenEntity)
      return markup.entityCard(item);
    else if (item instanceof SirenLink)
      return markup.linkCard(item);
  },

  entityCard(entity) {
    return `
      <div class="card">
        <div><label>class:</label> [ ${entity.class.join(', ')} ]</div>
        <div><label>rel:</label> [ ${entity.rel.join(', ')} ]</div>
        <div class="details">
          <div><label>title:</label> ${entity.title}</div>
          <label>links:</label>
          <ul>
          ${entity.links.map(l => `<li>${markup.linkAnchor(l)}</li>`).join('\n')}
          </ul>
          <div class="entity-properties entity-raw">
            <label>properties:</label>
            ${markup.code(entity.properties)}
          </div>
        </div>
      </div>
    `;
  },

  // Links

  linkAnchor(link) {
    const links = link.rel.map(rel => markup.a(link.href, rel)).join(', ');
    return `[ ${links} ] ${markup.a(link.href, link.title)}`;
  },

  linkCard(link) {
    return `
      <div class="card">
        <h3>${link.anchor}</h3>
      </div>
    `;
  },

  // Actions

  actionForm(action) {
    return `
      <form action='${action.href}' method='${action.method}' type='${action.type}' onsubmit='return false;'>
        <h3>${action.name}</h3>
        <p>${action.method} ${action.href}</p>
        <div class='form-fields'>
          ${action.fields.map(markup.fieldForm).join('\n')}
        </div>
        <input type='submit' value='submit'>
      </form>
    `;
  },

  fieldForm(field) {
    switch (field.type) {
      case 'hidden':
        return `<input type="${field.type}" value="${field.value}" name="${field.name}">`;

      default:
        return `
          <div class="form-field">
            <label>${field.name}</label>
            <input type="${field.type}" value="${field.value}" name="${field.name}">
          </div>
          `;
    }
  },

};
