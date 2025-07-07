import { Shipwreck } from './shipwreck.js';

// notifications
const flash = {
  box: document.getElementById('flash'),
  clear: () => flash.box.innerHTML = '',
  add: (msg, type) => {
    const div = document.createElement('div');
    div.className = 'banner';
    div.classList.add(type);
    div.innerHTML = msg;
    flash.box.appendChild(div);
  },
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
  const self = entity && entity.getLink('self');
  let uri = self && self.href || href;
  if (uri) {
    uri = uri.replace(ship.baseUri, '');
    shipPath.value = uri;
    window.location.hash = uri;
    document.title = `Shipwreck - ${uri}`;
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

// submit API request
let active = false;
const setSail = async function () {
  // one request at a time
  if (active) {
    return;
  }
  active = true;
  try {
    ship.token = shipToken.value;
    ship.baseUri = shipBase.value;
    // check if path is url encoded
    const path = shipPath.value;
    if (path.startsWith('http%3A') || path.startsWith('https%3A')) {
      shipPath.value = decodeURIComponent(path);
    }
    await ship.fetch(shipPath.value);
  } catch (err) {
    console.error(err);
  } finally {
    active = false;
  }
};

// clear auth token and reload
const clearToken = async function () {
  flash.clear();
  shipToken.value = '';
  ship.token = null;
  setSail();
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
  const token = entity.properties?.token;
  if (!token) {
    flash.add('No token property was found in the current entity.', 'warning');
  } else if (token === shipToken.value) {
    flash.add('Token unchanged.', 'warning');
  } else {
    shipToken.value = token;
    ship.token = token;
    setSail();
    flash.add('Token updated.', 'success');
  }
};
document.getElementById('pull-token-button').addEventListener('click', pullToken);

// submit form
const submitRequest = function (e) {
  e.preventDefault();
  setSail();
};
document.getElementById('main-form').addEventListener('submit', submitRequest);

// sync the location hash with the api href input field
const checkHash = function () {
  const hash = window.location.hash.slice(1);
  if (shipPath.value === hash) {
    return;
  }
  shipPath.value = hash;
  setSail();
};

window.onhashchange = checkHash;
window.onload = checkHash;
