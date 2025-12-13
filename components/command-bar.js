// ChartSpec Workbench - Command Bar Component
// Top bar with dataset selector, layout presets, and settings

import store from '../state/store.js';

class CommandBar extends HTMLElement {
  constructor() {
    super();
    this.state = {
      datasets: [],
      selectedDataset: null,
      layoutPreset: 'default',
    };
  }
  
  connectedCallback() {
    this.render();
    this.setupEventListeners();
    this.syncWithStore();
  }
  
  render() {
    const { selectedDataset, datasets, layoutPreset } = this.state;
    
    this.innerHTML = `
      <div class="command-bar-left">
        <h1 class="app-title" style="font-size: var(--text-xl); margin: 0; color: var(--accent-bright);">
          ChartSpec
        </h1>
        
        <button class="dataset-pill" id="dataset-pill" title="Select dataset">
          <svg class="dataset-pill-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7M4 7c0-2 1-3 3-3h10c2 0 3 1 3 3M4 7h16M8 3v4m8-4v4"/>
          </svg>
          <span>${selectedDataset || 'No dataset'}</span>
          <svg style="width: 0.75rem; height: 0.75rem; opacity: 0.6;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </button>
      </div>
      
      <div class="command-bar-right">
        <div class="layout-preset-selector" style="display: flex; gap: var(--space-2);">
          <button class="btn btn-sm btn-ghost preset-btn ${layoutPreset === 'default' ? 'active' : ''}" 
                  data-preset="default" title="Default layout">
            <svg style="width: 1rem; height: 1rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5h16M4 12h16M4 19h16"/>
            </svg>
          </button>
          <button class="btn btn-sm btn-ghost preset-btn ${layoutPreset === 'single' ? 'active' : ''}" 
                  data-preset="single" title="Single focus">
            <svg style="width: 1rem; height: 1rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4h16v16H4z"/>
            </svg>
          </button>
          <button class="btn btn-sm btn-ghost preset-btn ${layoutPreset === '2up' ? 'active' : ''}" 
                  data-preset="2up" title="2-up analysis">
            <svg style="width: 1rem; height: 1rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4h7v16H4zM13 4h7v16h-7z"/>
            </svg>
          </button>
          <button class="btn btn-sm btn-ghost preset-btn ${layoutPreset === 'dashboard' ? 'active' : ''}" 
                  data-preset="dashboard" title="3x2 dashboard">
            <svg style="width: 1rem; height: 1rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4h6v6H4zM4 14h6v6H4zM14 4h6v6h-6zM14 14h6v6h-6z"/>
            </svg>
          </button>
        </div>
        
        <button class="btn btn-sm btn-secondary" id="toggle-settings" title="Toggle settings">
          <svg style="width: 1rem; height: 1rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </button>
        
        <button class="btn btn-sm btn-ghost" id="toggle-presentation" title="Presentation mode (Ctrl+P)">
          <svg style="width: 1rem; height: 1rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4v16M17 4v16M3 8h18M3 16h18"/>
          </svg>
        </button>
      </div>
    `;
  }
  
  setupEventListeners() {
    // Dataset selector
    this.querySelector('#dataset-pill')?.addEventListener('click', () => {
      store.emit('command:select-dataset');
    });
    
    // Layout presets
    this.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const preset = btn.dataset.preset;
        store.setLayoutPreset(preset);
      });
    });
    
    // Settings toggle
    this.querySelector('#toggle-settings')?.addEventListener('click', () => {
      store.emit('command:toggle-settings');
    });
    
    // Presentation mode
    this.querySelector('#toggle-presentation')?.addEventListener('click', () => {
      store.togglePresentationMode();
    });
    
    // Store listeners
    store.on('datasets:loaded', (datasets) => {
      this.state.datasets = datasets;
      this.render();
    });
    
    store.on('dataset:selected', (datasetName) => {
      this.state.selectedDataset = datasetName;
      this.render();
    });
    
    store.on('layout:preset:changed', (preset) => {
      this.state.layoutPreset = preset;
      this.render();
    });
  }
  
  syncWithStore() {
    this.state.datasets = store.get('datasets');
    this.state.selectedDataset = store.get('selectedDataset');
    this.state.layoutPreset = store.get('layoutPreset');
  }
}

customElements.define('cs-command-bar', CommandBar);

export default CommandBar;
