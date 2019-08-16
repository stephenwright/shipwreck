import { SirenEntity, SirenSubEntity, SirenLink, SirenAction } from './siren.js';

/** helpers for generating HTML markup */
const markup = {

  code(json) {
    return `<pre><code>${JSON.stringify(json, null, 2)}</code></pre>`;
  },

  card(item) {
    if (item instanceof SirenEntity || item instanceof SirenSubEntity) {
      return markup.entityCard(item);
    } else if (item instanceof SirenLink) {
      return markup.linkCard(item);
    } else if (item instanceof SirenAction) {
      return markup.actionCard(item);
    } else {
      return '';
    }
  },

  title(entity) {
    return !entity.title ? '' : `
      <div>
        <label>title:</label>
        <span class='title'>${entity.title}</span>
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
            <ul>${entity.links().map(l => `<li>${markup.linkAnchor(l)}</li>`).join('\n')}</ul>
          </div>
          <div class="tabs">
            <a name="entity-properties">properties</a>
            ${entity.actions().length ? '<a name="entity-actions">actions</a>' : '' }
          </div>
          <div class="tab-content entity-properties entity-raw">
            ${markup.code(entity.properties)}
          </div>
          <div class="tab-content entity-actions">
            ${entity.actions().map(markup.actionForm).join('\n')}
          </div>
        </div>
      </div>
    `;
  },

  // Links

  linkAnchor(link) {
    const rels = link.rel.map(rel => `<a href="${link.href}">${rel}</a>`).join(', ');
    return `[ ${rels} ] <a href="${link.href}">${link.title}</a>`;
  },

  linkCard(link) {
    return `
      <div class="card">
      <span class="type-tag">Link</span>
        <div class="head">
          ${markup.title(link)}
          <div><label>class:</label> [ ${link.class.join(', ')} ]</div>
          <div><label>rel:</label> [ ${link.rel.join(', ')} ]</div>
          <div><label>href:</label> <a href="${link.href}">${link.href}</a></div>
        </div>
      </div>
    `;
  },

  // Actions

  actionForm(action) {
    return `
      <form
        name="${action.name}"
        type="${action.type}"
        action="${action.href}"
        method="${action.method}">
        <input type="hidden" name="_method" value="${action.method}">
        <h3>${action.title || action.name}</h3>
        <div class="form-fields">
          ${action.fields.map(markup.fieldForm).join('\n')}
        </div>
        <input type="submit" value="submit">
        <p class="entity-action-href">${action.method} ${action.href}</p>
      </form>
    `;
  },

  selectOptions(field) {
    const options = field.options.map(opt => {
      const attributes = [];
      field.value !== undefined && [opt.value, opt.title].includes(field.value) && attributes.push('selected');
      opt.value !== undefined && attributes.push(`value="${opt.value}"`);
      return `<option ${attributes.join(' ')}>${opt.title || opt.value}</option>`;
    });
    return options.join('\n');
  },

  fieldForm(field) {
    switch (field.type.toLowerCase()) {
    case 'hidden':
      return `<input type="${field.type}" value="${field.value}" name="${field.name}">`;

    case 'number':
      return `
        <div class="form-field">
          <label>
            ${field.title || field.name}
            <input type="${field.type}" value="${field.value}" name="${field.name}" step="any" />
          </label>
        </div>
        `;

    case 'select':
      return `
        <div class="form-field">
          <label>
            ${field.title || field.name}
            <select name="${field.name}">
              ${markup.selectOptions(field)}
            </select>
          </label>
        </div>
        `;

    case 'checkbox':
      return `
        <div class="form-field">
          <label>
            ${field.title || field.name}
            <input type="${field.type}" name="${field.name}" value="${field.value}" ${ field.raw.checked ? 'checked' : '' } />
          </label>
        </div>
        `;

    case 'radio':
      if (field.value instanceof Array) {
        return `
          <div class="form-field">
            <h4>${field.title || field.name}</h4>
            ${field.value.map((option) => `
            <div>
              <label>
                <input type="${field.type}" name="${field.name}" value="${option.value}" ${ option.checked ? 'checked' : '' } />
                ${option.title}
              </label>
            </div>
            `).join('')}
          </div>
        `;
      }
      return `
        <div class="form-field">
          <label>
            <input type="${field.type}" name="${field.name}" value="${field.value}" ${ field.checked ? 'checked' : '' } />
            ${field.title || field.name}
          </label>
        </div>
        `;

    default:
      return `
        <div class="form-field">
          <label>
            ${field.title || field.name}
            <input type="${field.type}" value="${field.value}" name="${field.name}" />
          </label>
        </div>
        `;
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
      .map(key => {
        let val = entity.properties[key];
        val = typeof val === 'object' ? markup.code(val) : `<code>${val}</code>`;
        return `
          <tr>
            <td class="key">${key}:</td>
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
      .filter(i => i)
      .map(part => `<a href="${href = href + '/' + part}">${part.indexOf('?') < 0 ? part : part.substring(0, part.indexOf('?'))}</a>`)
      .join(' / ');
    return `<a href="${url.origin}/">${url.origin}</a> / ${path}`;
  },

  uriParams(uri) {
    const url = new URL(uri);
    const params = [];
    for (const p of url.searchParams.entries()) {
      let val = p[1];
      try {
        val = `<a href="${new URL(val).href}">${val}</a>`;
      } catch (err) {
        // not a valid url. meh.
      }
      params.push(`<li>${p[0]} = ${val}</li>`);
    }
    return params.length === 0 ? '' : `
      <strong>Query Params:</strong>
      <ul>${params.join('')}</ul>
    `;
  },

  // Display the [self] href in a nice clickable manner
  currentPath(entity) {
    const link = entity && entity.link({ rel: 'self' });
    return link ? markup.uriCrumbs(link.href) : '';
  },

  // Display the query parameters - if present - of [self] href
  queryParams(entity) {
    const link = entity.link({ rel: 'self' });
    return link ? markup.uriParams(link.href) : '';
  },

  entity(entity) {
    return `
      ${entity.title ? `<div class="entity-title"><h1>${entity.title}</h1></div>` : ''}
      <div class="flex-parent">
        <div class="flex-1">

          <div class="entity-class" ${entity.class.length === 0 ? 'hidden': ''}>
            <h2>Class</h2>
            [ ${entity.class.join(', ')} ]
          </div>

          <div class="entity-links" ${entity.links().length === 0 ? 'hidden': ''}>
            <h2>Links</h2>
            ${entity.links().map(l => `<div>${markup.linkAnchor(l)}</div>`).join('\n')}
          </div>

          <div class="entity-properties" ${Object.keys(entity.properties).length === 0 ? 'hidden': ''}>
            <h2>Properties</h2>
            <table><tbody>${markup.propertyRows(entity)}</tbody></table>
          </div>

          <div class="entity-actions" ${entity.actions().length === 0 ? 'hidden': ''}>
            <h2>Actions</h2>
            ${entity.actions().map(markup.card).join('\n')}
          </div>

        </div>
        <div class="flex-2" ${entity.entities().length === 0 ? 'hidden': ''}>

          <!-- Sub-Entities -->
          <div class="entity-entities">
            <h2>Entities</h2>
          </div>

        </div>
      </div>
    `;
  },

  // Main Container

  ship(entity) {
    return `
      <div class="shipwreck">

        <!-- Display the current location in a nice clickable manner -->
        <div class="current-path">${markup.currentPath(entity)}</div>
        <div class="current-path-params">${markup.queryParams(entity)}</div>

        <!-- Tabs to switch between raw and pretty views -->
        <div class="tabs">
          <a name="content-entity">Entity</a>
          <a name="content-raw">Raw</a>
        </div>

        <!-- Pretty view of an entity -->
        <div class="content" id="content-entity">${markup.entity(entity)}</div>

        <!-- Raw JSON entity object -->
        <div class="content" id="content-raw">
          <div class="entity-raw">${markup.code(entity.raw)}</div>
        </div>

      </div>
    `;
  },

  raw(content, url) {
    return `
      <div class="shipwreck raw-response">
        <div class="current-path">${markup.uriCrumbs(url)}</div>
        <div class="current-path-params">${markup.uriParams(url)}</div>

        <!-- Tabs to switch between raw and pretty views -->
        <div class="tabs">
          <a name="content-raw">Raw</a>
        </div>

        <!-- Raw content -->
        <div class="content" id="content-raw">${content}</div>
      </div>
    `;
  },

};

export default markup;
