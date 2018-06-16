// import Shipwreck from './shipwreck.js';

// notifications
const flash = {
  box: document.getElementById('flash'),
  clear: () => flash.box.innerHTML = '',
  add: (msg, type) => flash.box.appendChild(_html(`<div class="banner ${type}">${msg}</div>`)),
}

// handles to form inputs
const shipHref = document.getElementById('ship-href');
const shipToken = document.getElementById('ship-token');
const shipOutput = document.getElementById('ship-output');

// create shipwreck instance
const ship = new Shipwreck(shipOutput);

ship.on('fetch', data => {
  flash.clear();
});

ship.on('error', data => {
  flash.add(data.message, 'critical');
});

ship.on('success', data => {
  //flash.add(data.message, 'success');
});

ship.on('update', data => {
  const { entity } = data;
  const self = entity.link('self');
  if (!self) return;
  shipHref.value = self.href;
  location.hash = self.href;
});

shipToken.value = ship.token;

// submit API reqest
let active = false;
const _setSail = async function () {
  // one request at a time
  if (active) return;
  active = true;
  try {
    ship.token = shipToken.value;
    await ship.fetch({ href: shipHref.value });
  }
  catch(err) {
    console.error(err);
  }
  active = false;
}

// clear auth token
const clearStorage = async function () {
  flash.clear();
  shipToken.value = '';
  ship.token = null;
  flash.add('Session storage has been cleared.', 'success');
}

// submit form
const submitRequest = function (e) {
  e.preventDefault();
  location.hash = shipHref.value;
  _setSail();
};
const mainForm = document.getElementById('main-form')
mainForm.addEventListener('submit', submitRequest);

// sync the location hash with the api href input field
const _checkHash = function (e) {
  shipHref.value = location.hash.slice(1);
  _setSail();
};

window.onhashchange = _checkHash;
window.onload = _checkHash;
