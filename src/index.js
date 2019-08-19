import { Shipwreck, _html } from './shipwreck.js';

// notifications
const flash = {
  box: document.getElementById('flash'),
  clear: () => flash.box.innerHTML = '',
  add: (msg, type) => flash.box.appendChild(_html(`<div class="banner ${type}">${msg}</div>`)),
};

// handles to key elements
const shipBase = document.getElementById('ship-base');
const shipPath = document.getElementById('ship-path');
const shipToken = document.getElementById('ship-token');
const shipOutput = document.getElementById('ship-output');
const loadingBar = document.getElementById('loading-bar');

// create shipwreck instance
const ship = new Shipwreck(shipOutput);

shipBase.value = ship.baseUri;

ship.on('fetch', () => {
  loadingBar.style.backgroundColor = 'var(--purple-base)';
  loadingBar.style.width = '10%';
  flash.clear();
});

ship.on('update', (e) => {
  const { entity, href } = e.detail;
  const self = entity && entity.link({ rel: 'self' });
  let uri = self && self.href || href;
  if (uri) {
    uri = uri.replace(ship.baseUri, '');
    shipPath.value = uri;
    window.location.hash = uri;
  }
  document.body.scrollTop = document.documentElement.scrollTop = 0;
});

ship.on('success', () => {
  loadingBar.style.backgroundColor = 'var(--green-base)';
});

ship.on('error', async (e) => {
  loadingBar.style.backgroundColor = 'var(--red-base)';
  const { message, response } = e.detail;
  flash.add(message, 'critical');
  if (response) {
    const text = await response.clone().text();
    text && flash.add(text, 'critical');
  }
});

ship.on('complete', () => {
  loadingBar.style.width = '100%';
});

shipToken.value = ship.token;
shipToken.addEventListener('change', (e) => ship.token = e.target.value);

// submit API reqest
let active = false;
const _setSail = async function () {
  // one request at a time
  if (active) {
    return;
  }
  active = true;
  try {
    ship.token = shipToken.value;
    ship.baseUri = shipBase.value;
    await ship.fetch(shipPath.value);
  } catch (err) {
    console.error(err); // eslint-disable-line no-console
  }
  active = false; // eslint-disable-line require-atomic-updates
};

// clear auth token and reload
const clearToken = async function () {
  flash.clear();
  shipToken.value = '';
  ship.token = null;
  _setSail();
};
document.getElementById('clear-token-button').addEventListener('click', clearToken);

// pull auth token from current entity properties
const pullToken = async function () {
  flash.clear();
  const { entity } = ship;
  if (!entity) {
    flash.add('There is currently no entity loaded.', 'warning');
    return;
  }
  const token = entity.properties && entity.properties.token;
  if (!token) {
    flash.add('No token property was found in the current entity.', 'warning');
  } else if (token === shipToken.value) {
    flash.add('Token unchanged.', 'warning');
  } else {
    shipToken.value = token;
    ship.token = token;
    _setSail();
    flash.add('Token updated.', 'success');
  }
};
document.getElementById('pull-token-button').addEventListener('click', pullToken);

// submit form
const submitRequest = function (e) {
  e.preventDefault();
  window.location.hash = shipPath.value;
  _setSail();
};
document.getElementById('main-form').addEventListener('submit', submitRequest);

// sync the location hash with the api href input field
const _checkHash = function () {
  const hash = window.location.hash.slice(1);
  if (shipPath.value === hash) {
    return;
  }
  shipPath.value = hash;
  _setSail();
};

window.onhashchange = _checkHash;
window.onload = _checkHash;
