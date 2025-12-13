import store from '../state/store.js';

class SystemMessages extends HTMLElement {
  constructor() {
    super();
    this.messages = [];
    this.bound = false;
    this.domBound = false;
    this._clearHandler = null;
  }

  connectedCallback() {
    this.classList.add('system-messages-host');
    this.messages = store.get('systemMessages');
    this.render();
    this.attachStoreListeners();
    this.attachDOMListeners();
  }

  attachStoreListeners() {
    if (this.bound) return;
    this.bound = true;
    store.on('system:message', () => {
      this.messages = store.get('systemMessages');
      this.render();
      this.attachDOMListeners();
    });
    store.on('system:cleared', () => {
      this.messages = [];
      this.render();
      this.attachDOMListeners();
    });
  }

  attachDOMListeners() {
    if (this.domBound) return;
    this.domBound = true;
    this._clearHandler = (event) => {
      const actionEl = event.target.closest('[data-action="clear-messages"]');
      if (actionEl) {
        store.clearSystemMessages();
      }
    };
    this.addEventListener('click', this._clearHandler);
  }

  disconnectedCallback() {
    if (this._clearHandler) {
      this.removeEventListener('click', this._clearHandler);
      this._clearHandler = null;
    }
    this.domBound = false;
  }

  render() {
    if (!this.messages || this.messages.length === 0) {
      this.innerHTML = '';
      return;
    }

    this.innerHTML = `
      <div class="system-messages">
        <div class="system-messages__header">
          <strong>System messages</strong>
          <button class="btn btn-xs" data-action="clear-messages">Clear</button>
        </div>
        <ul class="system-messages__list">
          ${this.messages.map(m => `
            <li class="system-messages__item system-messages__item--${m.level}">
              <span class="system-messages__time">${new Date(m.timestamp).toLocaleTimeString()}</span>
              <span class="system-messages__text">${m.message}</span>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  }
}

customElements.define('cs-system-messages', SystemMessages);

export default SystemMessages;
