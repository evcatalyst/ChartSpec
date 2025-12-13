// ChartSpec Workbench - Table Tile Component
// Renders data tables

import store from '../state/store.js';

class TableTile extends HTMLElement {
  constructor() {
    super();
    this.tileId = null;
  }
  
  static get observedAttributes() {
    return ['tile-id'];
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'tile-id' && oldValue !== newValue) {
      this.tileId = newValue;
      if (this.isConnected) {
        this.render();
      }
    }
  }
  
  connectedCallback() {
    this.tileId = this.getAttribute('tile-id');
    this.render();
    this.setupEventListeners();
  }
  
  render() {
    const tile = store.getTile(this.tileId);
    
    if (!tile || !tile.data || !tile.data.rows || tile.data.rows.length === 0) {
      this.innerHTML = '<div class="tile-placeholder">No data</div>';
      return;
    }
    
    const { rows, columns } = tile.data;
    const cols = columns || Object.keys(rows[0]);
    
    this.innerHTML = `
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              ${cols.map(col => `<th>${this.escapeHtml(col)}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows.map(row => `
              <tr>
                ${cols.map(col => `<td>${this.escapeHtml(String(row[col] ?? ''))}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div style="padding: var(--space-3); font-size: var(--text-xs); color: var(--text-dim); text-align: center;">
          Showing ${rows.length} rows
        </div>
      </div>
    `;
  }
  
  setupEventListeners() {
    // Listen for tile data updates
    store.on('tile:updated', (tileId, updates) => {
      if (tileId === this.tileId && updates.data) {
        this.render();
      }
    });
  }
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

customElements.define('cs-table-tile', TableTile);

export default TableTile;
