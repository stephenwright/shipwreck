import { SirenEntity, SirenLink, SirenAction } from './siren/index.js';

let datalistId = 0;

/** helpers for generating HTML markup */
const markup = {

  htmlEscape(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  json(json) {
    return `<pre><code>${JSON.stringify(json, null, 2)}</code></pre>`;
  },

  card(item) {
    if (item instanceof SirenEntity) {
      return markup.entityCard(item);
    } if (item instanceof SirenLink) {
      return markup.linkCard(item);
    } if (item instanceof SirenAction) {
      return markup.actionCard(item);
    }
    return '';
  },

  title(entity) {
    return !entity.title ? '' : `
      <div>
        <label>title:</label>
        <span class='title'>${markup.htmlEscape(entity.title)}</span>
      </div>
    `;
  },

  // Entities

  entityCard(entity) {
    return `
      <div class="card">
        <span class="type-tag">Entity</span>
        <div class="head">
          ${markup.title(entity)}
          <div><label>class:</label> [ ${entity.class.join(', ')} ]</div>
          <div><label>rel:</label> [ ${entity.rel.join(', ')} ]</div>
        </div>
        <div class="body tabbed">
          <div class="entity-links">
            <label>links:</label>
            <ul>${entity.links.map((l) => `<li>${markup.linkAnchor(l)}</li>`).join('\n')}</ul>
          </div>
          <div class="tabs">
            <a name="entity-properties">Properties</a>
            ${entity.actions.length ? '<a name="entity-actions">Actions</a>' : ''}
            ${entity.entities.length ? '<a name="entity-entities">Sub-Entities</a>' : ''}
          </div>
          <div class="content entity-properties entity-raw">
            ${markup.json(entity.properties)}
          </div>
          <div class="content entity-actions">
            ${entity.actions.map(markup.card).join('\n')}
          </div>
          <div class="content entity-entities">
            ${entity.entities.map(markup.card).join('\n')}
          </div>
        </div>
      </div>
    `;
  },

  // Links

  linkAnchor(link) {
    const notSiren = link.type && link.type.search(/application\/(vnd.siren\+)?json/) === -1;
    const external = notSiren ? 'rel="external"' : '';
    const rels = link.rel.map((rel) => `<a href="${markup.htmlEscape(link.href)}" ${external}>${markup.htmlEscape(rel)}</a>`).join(', ');
    const parts = [`[ ${rels} ]`];
    if (link.title) {
      parts.push(`<a href="${markup.htmlEscape(link.href)}" ${external}>${markup.htmlEscape(link.title)}</a>`);
    }
    return parts.join(' ');
  },

  linkCard(link) {
    return `
      <div class="card">
      <span class="type-tag">Link</span>
        <div class="head">
          ${markup.title(link)}
          <div><label>class:</label> [ ${link.class.join(', ')} ]</div>
          <div><label>rel:</label> [ ${link.rel.join(', ')} ]</div>
          <div><label>href:</label> <a href="${markup.htmlEscape(link.href)}">${markup.htmlEscape(link.href)}</a></div>
        </div>
      </div>
    `;
  },

  // Actions

  actionForm(action) {
    return `
      <form
        name="${markup.htmlEscape(action.name)}"
        enctype="${markup.htmlEscape(action.type)}"
        action="${markup.htmlEscape(action.href)}"
        method="${markup.htmlEscape(action.method)}">
        <input type="hidden" name="_method" value="${markup.htmlEscape(action.method)}">
        <h3>
          <span class="title">${markup.htmlEscape(action.title)}</span>
          <span class="name">${markup.htmlEscape(action.name)}</span>
        </h3>
        ${action.class.length ? `<div><label>class:</label> [ ${action.class.join(', ')} ]</div>` : ''}
        <div class="form-fields">
          ${action.fields.map(markup.fieldForm).join('\n')}
        </div>
        <div class="form-actions">
          <input type="submit" value="Submit">
        </div>
        <p class="entity-action-href">${markup.htmlEscape(action.method)} ${markup.htmlEscape(action.href)}</p>
      </form>
    `;
  },

  selectOptions(field) {
    return field.options.map((opt) => `
      <option
        value="${markup.htmlEscape(opt.value || opt.title)}"
        ${(field.selected || field.value === opt.value) ? 'selected' : ''}
      >
        ${markup.htmlEscape(opt.title || opt.value)}
      </option>
    `).join('\n');
  },

  inputWrapper(field, input) {
    return `
      <div class="form-field">
        <label>
          <span class="title">${markup.htmlEscape(field.title)}</span>
          <span class="name">${markup.htmlEscape(field.name)}</span>
          ${input}
        </label>
      </div>
    `;
  },

  datalist(field, id) {
    return `
      <datalist id="${markup.htmlEscape(id)}">
        ${field.options.map((o) => `
        <option>${markup.htmlEscape(o.value)}</option>
        `).join('')}
      </datalist>
    `;
  },

  text(field) {
    let input;
    // if the value contains new lines, use a textarea
    const lineCount = (field.value || "").split('\n').length;
    if (lineCount > 1 || field.class?.includes('multiline')) {
      const min = 2;
      const max = 10;
      const rows = Math.min(Math.max(lineCount, min), max);
      input = `<textarea name="${markup.htmlEscape(field.name)}" rows="${rows}">${markup.htmlEscape(field.value)}</textarea>`;
    } else if (field.options) {
      const id = `datalist-${++datalistId}`;
      input = `
        <input type="${markup.htmlEscape(field.type)}" value="${markup.htmlEscape(field.value)}" name="${markup.htmlEscape(field.name)}" list="${markup.htmlEscape(id)}" />
        ${markup.datalist(field, id)}
      `;
    } else {
      input = `<input type="${markup.htmlEscape(field.type)}" value="${markup.htmlEscape(field.value)}" name="${markup.htmlEscape(field.name)}" />`;
    }
    return markup.inputWrapper(field, input);
  },

  radio(field) {
    if (field.options) {
      return `
        <div class="form-field">
          <label>
            <span class="title">${markup.htmlEscape(field.title)}</span>
            <span class="name">${markup.htmlEscape(field.name)}</span>
          </label>
          ${field.options.map((option) => `
          <div class="radio-option">
            <label>
              <input type="${markup.htmlEscape(field.type)}" name="${markup.htmlEscape(field.name)}" value="${markup.htmlEscape(option.value || '')}" ${option.checked ? 'checked' : ''} />
              <span class="title">${markup.htmlEscape(option.title)}</span>
              <span class="value">"${markup.htmlEscape(option.value)}"</span>
            </label>
          </div>
          `).join('')}
        </div>
      `;
    }
    return `
      <div class="form-field">
        <label>
          <input type="${markup.htmlEscape(field.type)}" name="${markup.htmlEscape(field.name)}" value="${markup.htmlEscape(field.value)}" ${field.checked ? 'checked' : ''} />
          <span class="title">${markup.htmlEscape(field.title)}</span>
          <span class="name">${markup.htmlEscape(field.name)}</span>
        </label>
      </div>
      `;
  },

  checkbox(field) {
    if (field.options) {
      return `
        <div class="form-field">
          <label>
            <span class="title">${markup.htmlEscape(field.title)}</span>
            <span class="name">${markup.htmlEscape(field.name)}</span>
          </label>
          ${field.options.map((option) => `
          <div class="radio-option">
            <label>
              <input type="${markup.htmlEscape(field.type)}" name="${markup.htmlEscape(field.name)}" value="${markup.htmlEscape(option.value || '')}" ${option.checked ? 'checked' : ''} />
              <span class="title">${markup.htmlEscape(option.title)}</span>
              <span class="value">"${markup.htmlEscape(option.value)}"</span>
            </label>
          </div>
          `).join('')}
        </div>
      `;
    }
    return markup.inputWrapper(field, `<input name="${markup.htmlEscape(field.name)}" value="${markup.htmlEscape(field.value)}" type="${markup.htmlEscape(field.type)}" ${field.checked ? 'checked' : ''} />`);
  },

  fieldForm(field) {
    switch (field.type.toLowerCase()) {
    case 'hidden':
      return `
        <input type="${markup.htmlEscape(field.type)}" value="${markup.htmlEscape(field.value)}" name="${markup.htmlEscape(field.name)}">
        <div class="form-field hidden">
          <span class="type-tag">Hidden</span>
          <label>
            <span class="title">${markup.htmlEscape(field.title)}</span>
            <span class="name">${markup.htmlEscape(field.name)}</span>
            <span class="hidden-field">${markup.htmlEscape(field.value)}</span>
          </label>
        </div>
        `;

    // case 'date':
    // case 'datetime':
    // case 'datetime-local':
    case 'number':
      return markup.inputWrapper(field, `<input name="${markup.htmlEscape(field.name)}" value="${markup.htmlEscape(field.value)}" type="${markup.htmlEscape(field.type)}" step="any" />`);

    case 'checkbox':
      return markup.checkbox(field);

    case 'select':
      return markup.inputWrapper(field, `<select name="${markup.htmlEscape(field.name)}">${markup.selectOptions(field)}</select>`);

    case 'radio':
      return markup.radio(field);

    case 'text':
      return markup.text(field);

    default:
      return markup.inputWrapper(field, `<input type="${markup.htmlEscape(field.type)}" value="${markup.htmlEscape(field.value)}" name="${markup.htmlEscape(field.name)}" />`);
    }
  },

  actionCard(action) {
    return `
      <div class="card">
        ${markup.actionForm(action)}
      </div>
    `;
  },

  propertyRows(entity) {
    return Object
      .keys(entity.properties)
      .map((key) => {
        let val = entity.properties[key];
        val = typeof val === 'object' ? markup.json(val) : `<code>${markup.htmlEscape(val)}</code>`;
        return `
          <tr>
            <td class="key">${markup.htmlEscape(key)}:</td>
            <td class="value">${val}</td>
          </tr>`;
      })
      .join('\n');
  },

  uriCrumbs(uri) {
    const url = new URL(uri);
    let href = url.origin;
    const path = `${url.pathname}${url.search}`
      .split('/')
      .filter((i) => i)
      .map((part) => `<a href="${markup.htmlEscape(href = `${href}/${part}`)}">${markup.htmlEscape(part.indexOf('?') < 0 ? part : part.substring(0, part.indexOf('?')))}</a>`)
      .join(' / ');
    return `<a href="${markup.htmlEscape(url.origin)}/">${markup.htmlEscape(url.origin)}</a> / ${path}`;
  },

  uriParams(uri) {
    const url = new URL(uri);
    const params = [];
    for (const p of url.searchParams.entries()) {
      let [key, val] = p;
      try {
        val = `<a href="${markup.htmlEscape(new URL(val).href)}">${markup.htmlEscape(val)}</a>`;
      } catch (err) { // eslint-disable-line no-unused-vars
        // not a valid url. meh.
        val = markup.htmlEscape(val);
      }
      params.push(`<li>${markup.htmlEscape(key)} = ${val}</li>`);
    }
    return params.length === 0 ? '' : `
      <strong>Query Params:</strong>
      <ul>${params.join('')}</ul>
    `;
  },

  // Display the [self] href in a nice clickable manner
  currentPath(entity) {
    const link = entity && entity.getLink('self');
    return link ? markup.uriCrumbs(link.href) : '';
  },

  // Display the query parameters - if present - of [self] href
  queryParams(entity) {
    const link = entity.getLink('self');
    return link ? markup.uriParams(link.href) : '';
  },

  entity(entity) {
    return `
      ${entity.title ? `<div class="entity-title"><h1>${markup.htmlEscape(entity.title)}</h1></div>` : ''}
      <div class="flex-parent">
        <div class="flex-1">

          <div class="entity-class" ${entity.class.length === 0 ? 'hidden' : ''}>
            <h2>Class</h2>
            [ ${entity.class.join(', ')} ]
          </div>

          <div class="entity-links" ${entity.links.length === 0 ? 'hidden' : ''}>
            <h2>Links</h2>
            ${entity.links.map((l) => `<div>${markup.linkAnchor(l)}</div>`).join('\n')}
          </div>

          <div class="entity-properties" ${Object.keys(entity.properties).length === 0 ? 'hidden' : ''}>
            <h2>Properties</h2>
            <table><tbody>${markup.propertyRows(entity)}</tbody></table>
          </div>

          <div class="entity-actions" ${entity.actions.length === 0 ? 'hidden' : ''}>
            <h2>Actions</h2>
            ${entity.actions.map(markup.card).join('\n')}
          </div>

        </div>
        <div class="flex-2" ${entity.entities.length === 0 ? 'hidden' : ''}>

          <!-- Sub-Entities -->
          <div class="entity-entities">
            <h2>Sub-Entities</h2>
            ${entity.entities.map(markup.card).join('\n')}
          </div>

        </div>
      </div>
    `;
  },

  // Main Container

  main({ path, params, raw, pretty }) {
    return `
      <div class="shipwreck tabbed">
        <!-- Display the current location in a nice clickable manner -->
        <div class="current-path">${path}</div>
        <div class="current-path-params">${params}</div>

        <!-- Tabs to switch between raw and pretty views -->
        <div class="tabs">
          ${pretty ? '<a name="main-entity">Entity</a>' : ''}
          ${raw ? '<a name="main-raw">Raw</a>' : ''}
        </div>

        ${pretty ? `
          <!-- Pretty view of an entity -->
          <div class="content main-entity">${pretty}</div>
        ` : ''}

        ${raw ? `
          <!-- Raw JSON entity object -->
          <div class="content main-raw">${raw}</div>
        ` : ''}
      </div>
    `;
  },

  ship(entity) {
    return markup.main({
      path: markup.currentPath(entity),
      params: markup.queryParams(entity),
      raw: `<div class="entity-raw">${markup.json(entity.raw)}</div>`,
      pretty: markup.entity(entity),
    });
  },

  raw(content, url) {
    return markup.main({
      path: markup.uriCrumbs(url),
      params: markup.uriParams(url),
      raw: `<pre>${markup.htmlEscape(content)}</pre>`,
    });
  },

};

export default markup;
