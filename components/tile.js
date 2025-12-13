// ChartSpec Workbench - Base Tile Component
// Reusable tile frame with header and actions

import store from '../state/store.js';

class Tile extends HTMLElement {
  constructor() {
    super();
    this.tileId = null;
    this.tileType = 'text';
    this.tileTitle = 'Untitled';
  }
  
  static get observedAttributes() {
    return ['tile-id', 'tile-type', 'tile-title'];
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    
    switch (name) {
      case 'tile-id':
        this.tileId = newValue;
        break;
      case 'tile-type':
        this.tileType = newValue;
        break;
      case 'tile-title':
        this.tileTitle = newValue;
        break;
    }
    
    if (this.isConnected) {
      this.render();
    }
  }
  
  connectedCallback() {
    this.tileId = this.getAttribute('tile-id');
    this.tileType = this.getAttribute('tile-type') || 'text';
    this.tileTitle = this.getAttribute('tile-title') || 'Untitled';
    
    this.render();
    this.setupEventListeners();
  }
  
  render() {
    this.innerHTML = `
      <div class="tile-header">
        <h3 class="tile-title">${this.escapeHtml(this.tileTitle)}</h3>
        <div class="tile-actions">
          <button class="tile-action-btn" data-action="maximize" title="Maximize">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
            </svg>
          </button>
          <button class="tile-action-btn" data-action="duplicate" title="Duplicate">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
            </svg>
          </button>
          <button class="tile-action-btn" data-action="close" title="Close">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="tile-content" id="tile-content-${this.tileId}">
        ${this.renderContent()}
      </div>
    `;
  }
  
  renderContent() {
    // Get tile data from store
    const tile = store.getTile(this.tileId);
    if (!tile) {
      return '<div class="tile-placeholder">Loading...</div>';
    }
    
    // Render based on type
    switch (this.tileType) {
      case 'chart':
        return `<cs-chart-tile tile-id="${this.tileId}"></cs-chart-tile>`;
      case 'text':
        return `<cs-text-tile tile-id="${this.tileId}"></cs-text-tile>`;
      case 'table':
        return `<cs-table-tile tile-id="${this.tileId}"></cs-table-tile>`;
      case 'inspector':
        return `<cs-inspector-tile tile-id="${this.tileId}"></cs-inspector-tile>`;
      default:
        return '<div class="tile-placeholder">Unknown tile type</div>';
    }
  }
  
  setupEventListeners() {
    // Tile actions
    this.querySelectorAll('.tile-action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        this.handleAction(action);
      });
    });
    
    // Listen for tile updates
    store.on('tile:updated', (tileId, updates) => {
      if (tileId === this.tileId) {
        if (updates.title) {
          this.tileTitle = updates.title;
        }
        if (updates.type) {
          this.tileType = updates.type;
        }
        this.render();
      }
    });
  }
  
  handleAction(action) {
    switch (action) {
      case 'maximize':
        this.maximize();
        break;
      case 'duplicate':
        this.duplicate();
        break;
      case 'close':
        this.close();
        break;
    }
  }
  
  maximize() {
    // Toggle between maximized and normal
    const tile = store.getTile(this.tileId);
    if (!tile) return;
    
    if (tile.maximized) {
      // Restore original size
      store.updateTile(this.tileId, {
        maximized: false,
        x: tile.originalX,
        y: tile.originalY,
        w: tile.originalW,
        h: tile.originalH,
      });
    } else {
      // Save original size and maximize
      store.updateTile(this.tileId, {
        maximized: true,
        originalX: tile.x,
        originalY: tile.y,
        originalW: tile.w,
        originalH: tile.h,
        x: 0,
        y: 0,
        w: 12,
        h: 8,
      });
    }
    
    store.emit('tile:maximize', this.tileId);
  }
  
  duplicate() {
    const tile = store.getTile(this.tileId);
    if (!tile) return;
    
    const newTile = {
      ...tile,
      id: `tile-${Date.now()}`,
      x: (tile.x + 2) % 10,
      y: tile.y + 1,
      title: `${tile.title} (Copy)`,
    };
    
    store.addTile(newTile);
  }
  
  close() {
    if (confirm('Remove this tile?')) {
      store.removeTile(this.tileId);
    }
  }
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

customElements.define('cs-tile', Tile);

export default Tile;
