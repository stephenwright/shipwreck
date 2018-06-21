import { Shipwreck, _html } from './shipwreck.js';

// notifications
const flash = {
  box: document.getElementById('flash'),
  clear: () => flash.box.innerHTML = '',
  add: (msg, type) => flash.box.appendChild(_html(`<div class="banner ${type}">${msg}</div>`)),
};

// handles to key elements
const shipHref = document.getElementById('ship-href');
const shipToken = document.getElementById('ship-token');
const shipOutput = document.getElementById('ship-output');
const loadingBar = document.getElementById('loading-bar');

// create shipwreck instance
const ship = new Shipwreck(shipOutput);

ship.on('fetch', () => {
  loadingBar.style.backgroundColor = 'var(--purple-base)';
  loadingBar.style.width = '10%';
  flash.clear();
});

ship.on('error', data => {
  loadingBar.style.backgroundColor = 'var(--red-base)';
  loadingBar.style.width = '100%';
  flash.add(data.message, 'critical');
});

ship.on('success', () => {
  loadingBar.style.backgroundColor = 'var(--green-base)';
  loadingBar.style.width = '100%';
  //flash.add(data.message, 'success');
});

ship.on('update', data => {
  const { entity } = data;
  const self = entity.link('self');
  if (!self) {
    return;
  }
  shipHref.value = self.href;
  location.hash = self.href;
});

shipToken.value = ship.token;
shipToken.addEventListener('change', e => ship.token = e.target.value);

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
    await ship.fetch({ href: shipHref.value });
  } catch (err) {
    console.error(err); // eslint-disable-line no-console
  }
  active = false;
};

// clear auth token
const clearStorage = async function () {
  flash.clear();
  shipToken.value = '';
  ship.token = null;
  flash.add('Session storage has been cleared.', 'success');
};
document
  .getElementById('clear-storage-button')
  .addEventListener('click', clearStorage);

// submit form
const submitRequest = function (e) {
  e.preventDefault();
  location.hash = shipHref.value;
  _setSail();
};
document
  .getElementById('main-form')
  .addEventListener('submit', submitRequest);

// sync the location hash with the api href input field
const _checkHash = function () {
  const hash = location.hash.slice(1);
  if (shipHref.value === hash) {
    return;
  }
  shipHref.value = hash;
  _setSail();
};

window.onhashchange = _checkHash;
window.onload = _checkHash;
