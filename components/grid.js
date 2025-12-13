// ChartSpec Workbench - Grid Component
// Tile grid host with Gridstack integration

import store from '../state/store.js';

class Grid extends HTMLElement {
  constructor() {
    super();
    this.grid = null;
    this.tiles = [];
  }
  
  connectedCallback() {
    this.render();
    this.initializeGrid();
    this.setupEventListeners();
    this.syncWithStore();
  }
  
  disconnectedCallback() {
    if (this.grid) {
      this.grid.destroy(false);
    }
  }
  
  render() {
    this.innerHTML = `
      <div class="grid-stack" id="grid-stack"></div>
    `;
  }
  
  async initializeGrid() {
    // Check if Gridstack is available
    if (typeof GridStack === 'undefined') {
      console.warn('GridStack not loaded, using fallback layout');
      this.useFallbackLayout();
      return;
    }
    
    const gridEl = this.querySelector('#grid-stack');
    
    // Initialize Gridstack
    this.grid = GridStack.init({
      cellHeight: 80,
      margin: 16,
      animate: true,
      float: false,
      minRow: 1,
      acceptWidgets: true,
      resizable: {
        handles: 'e, se, s, sw, w'
      },
      draggable: {
        handle: '.tile-header',
      }
    }, gridEl);
    
    // Listen to grid changes
    this.grid.on('change', (event, items) => {
      this.handleGridChange(items);
    });
    
    // Load saved layout or create default
    this.loadLayout();
  }
  
  useFallbackLayout() {
    // Simple flexbox fallback when Gridstack isn't available
    const gridEl = this.querySelector('#grid-stack');
    gridEl.style.display = 'grid';
    gridEl.style.gridTemplateColumns = 'repeat(auto-fit, minmax(300px, 1fr))';
    gridEl.style.gap = 'var(--space-4)';
    gridEl.style.padding = 'var(--space-4)';
  }
  
  setupEventListeners() {
    // Listen for tile addition
    store.on('tile:added', (tile) => {
      this.addTile(tile);
    });
    
    // Listen for tile removal
    store.on('tile:removed', (tileId) => {
      this.removeTile(tileId);
    });
    
    // Listen for tile updates
    store.on('tile:updated', (tileId, updates) => {
      this.updateTile(tileId, updates);
    });
    
    // Listen for layout preset changes
    store.on('layout:preset:changed', (preset) => {
      this.applyLayoutPreset(preset);
    });
  }
  
  syncWithStore() {
    // Load existing tiles from store
    const tiles = store.get('tiles');
    if (tiles && tiles.length > 0) {
      tiles.forEach(tile => this.addTile(tile, false));
    } else {
      // Create a default welcome tile if no tiles exist
      this.createWelcomeTile();
    }
  }
  
  addTile(tile, saveLayout = true) {
    if (!this.grid) {
      console.warn('Grid not initialized');
      return;
    }
    
    // Create tile element
    const tileEl = this.createTileElement(tile);
    
    // Add to grid
    const widget = this.grid.addWidget(tileEl, {
      x: tile.x || 0,
      y: tile.y || 0,
      w: tile.w || 4,
      h: tile.h || 4,
      id: tile.id,
      minW: 2,
      minH: 2,
    });
    
    if (saveLayout) {
      this.saveLayout();
    }
  }
  
  createTileElement(tile) {
    const el = document.createElement('div');
    el.className = 'grid-stack-item';
    el.setAttribute('gs-id', tile.id);
    
    el.innerHTML = `
      <div class="grid-stack-item-content">
        <cs-tile 
          tile-id="${tile.id}" 
          tile-type="${tile.type}"
          tile-title="${tile.title || 'Untitled'}"
        ></cs-tile>
      </div>
    `;
    
    return el;
  }
  
  removeTile(tileId) {
    if (!this.grid) return;
    
    const widget = this.grid.engine.nodes.find(n => n.id === tileId);
    if (widget) {
      this.grid.removeWidget(widget.el, false);
      this.saveLayout();
    }
  }
  
  updateTile(tileId, updates) {
    const tileEl = this.querySelector(`cs-tile[tile-id="${tileId}"]`);
    if (tileEl) {
      Object.keys(updates).forEach(key => {
        if (key === 'title') {
          tileEl.setAttribute('tile-title', updates[key]);
        } else if (key === 'type') {
          tileEl.setAttribute('tile-type', updates[key]);
        }
      });
    }
  }
  
  handleGridChange(items) {
    // Save layout when grid changes
    this.saveLayout();
  }
  
  saveLayout() {
    if (!this.grid) return;
    
    const layout = this.grid.save(false);
    store.setState({ gridLayout: layout });
  }
  
  loadLayout() {
    const savedLayout = store.get('gridLayout');
    
    if (savedLayout && savedLayout.length > 0 && this.grid) {
      this.grid.load(savedLayout);
    }
  }
  
  applyLayoutPreset(preset) {
    if (!this.grid) return;
    
    const tiles = store.get('tiles');
    if (tiles.length === 0) return;
    
    // Clear current layout
    this.grid.removeAll(false);
    
    // Apply preset
    switch (preset) {
      case 'single':
        // Single tile taking full space
        if (tiles[0]) {
          this.addTile({ ...tiles[0], x: 0, y: 0, w: 12, h: 8 });
        }
        break;
        
      case '2up':
        // Two tiles side by side
        if (tiles[0]) {
          this.addTile({ ...tiles[0], x: 0, y: 0, w: 6, h: 8 });
        }
        if (tiles[1]) {
          this.addTile({ ...tiles[1], x: 6, y: 0, w: 6, h: 8 });
        }
        break;
        
      case 'dashboard':
        // 3x2 grid
        tiles.slice(0, 6).forEach((tile, i) => {
          const col = i % 3;
          const row = Math.floor(i / 3);
          this.addTile({
            ...tile,
            x: col * 4,
            y: row * 4,
            w: 4,
            h: 4
          });
        });
        break;
        
      default: // 'default'
        // Auto layout
        tiles.forEach(tile => this.addTile(tile));
        break;
    }
    
    this.saveLayout();
  }
  
  createWelcomeTile() {
    const welcomeTile = {
      id: `tile-${Date.now()}`,
      type: 'text',
      title: 'Welcome to ChartSpec Workbench',
      x: 2,
      y: 1,
      w: 8,
      h: 4,
      config: {},
      data: {
        content: `# Welcome to ChartSpec Workbench

A full-screen visualization workspace optimized for data exploration.

## Getting Started

1. **Select a dataset** from the command bar above
2. **Open the chat drawer** (Ctrl+B) to interact with the AI
3. **Ask for visualizations** and watch tiles appear
4. **Drag and resize tiles** to customize your layout

## Keyboard Shortcuts

- **Ctrl+B** - Toggle chat drawer
- **Ctrl+P** - Presentation mode
- **ESC** - Exit presentation mode or close drawer

## Layout Presets

Use the buttons in the command bar to switch between:
- **Default** - Auto layout
- **Single** - Full-screen focus
- **2-up** - Side-by-side comparison
- **Dashboard** - 3x2 grid

Start exploring your data!`
      }
    };
    
    store.addTile(welcomeTile);
  }
}

customElements.define('cs-grid', Grid);

export default Grid;
