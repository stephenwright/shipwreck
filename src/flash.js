
class Flash {
  constructor(el) {
    this.box = el;
  }

  clear() {
    this.box.innerHTML = '';
  }

  add(msg, type) {
    this.box.appendChild(_html(`
      <div class="banner ${type}">
        ${msg}
      </div>
    `));
  }
}
