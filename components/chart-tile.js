// ChartSpec Workbench - Chart Tile Component
// Renders charts using existing renderer factory

import store from '../state/store.js';

class ChartTile extends HTMLElement {
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
    
    if (!tile || !tile.data) {
      this.innerHTML = '<div class="tile-placeholder">No chart data</div>';
      return;
    }
    
    this.innerHTML = '<div class="chart-container" id="chart-container-' + this.tileId + '"></div>';
    
    // Render chart if we have spec and rows
    if (tile.data.spec && tile.data.rows) {
      this.renderChart(tile.data.spec, tile.data.rows);
    }
  }
  
  async renderChart(spec, rows) {
    // Import renderer factory dynamically
    try {
      const { rendererFactory } = await import('../chartspec/rendererFactory.js');
      const { applySpecToRows } = await import('../chartspec/dataEngine.js');
      
      const container = this.querySelector(`#chart-container-${this.tileId}`);
      if (!container) return;
      
      // Apply transformations
      const transformedRows = applySpecToRows(rows, spec);
      
      // Get best renderer for chart type
      const renderer = rendererFactory.getBestRenderer(spec.chartType);
      
      // Render chart
      await renderer.renderChart(container, transformedRows, spec);
      
    } catch (error) {
      console.error('Failed to render chart:', error);
      this.innerHTML = `<div class="tile-placeholder" style="color: var(--danger);">
        Error rendering chart: ${error.message}
      </div>`;
    }
  }
  
  setupEventListeners() {
    // Listen for tile data updates
    store.on('tile:updated', (tileId, updates) => {
      if (tileId === this.tileId && updates.data) {
        this.render();
      }
    });
  }
}

customElements.define('cs-chart-tile', ChartTile);

export default ChartTile;
