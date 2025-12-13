// ChartSpec Workbench - LED Sampler Component
// LED-style data sampling control with presets

import store from '../state/store.js';

class LEDSampler extends HTMLElement {
  constructor() {
    super();
    this.presets = ['1', '5', '10', '20', '50', '100'];
    this.state = {
      selected: '10',
    };
  }
  
  connectedCallback() {
    this.render();
    this.setupEventListeners();
    this.syncWithStore();
  }
  
  render() {
    const { selected } = this.state;
    
    this.innerHTML = `
      <div class="led-sampler-label">Data Sampling</div>
      <div class="led-segments">
        ${this.presets.map(preset => `
          <button 
            class="led-segment ${selected === preset ? 'active' : ''}" 
            data-preset="${preset}"
            title="Sample ${preset}% of data">
            ${preset}%
          </button>
        `).join('')}
      </div>
      <div class="led-info">
        ${this.getInfoText()}
      </div>
    `;
  }
  
  getInfoText() {
    const { selected } = this.state;
    const rows = store.get('currentRows') || [];
    const totalRows = rows.length;
    const sampleSize = Math.ceil((totalRows * parseInt(selected)) / 100);
    
    if (totalRows === 0) {
      return 'No dataset loaded';
    }
    
    return `Sampling ${sampleSize.toLocaleString()} of ${totalRows.toLocaleString()} rows (~${this.estimateTokens(sampleSize)} tokens)`;
  }
  
  estimateTokens(rows) {
    // Rough estimate: ~10 tokens per row
    const estimate = rows * 10;
    if (estimate < 1000) return estimate;
    if (estimate < 1000000) return `${(estimate / 1000).toFixed(1)}K`;
    return `${(estimate / 1000000).toFixed(1)}M`;
  }
  
  setupEventListeners() {
    // Segment clicks
    this.querySelectorAll('.led-segment').forEach(segment => {
      segment.addEventListener('click', () => {
        const preset = segment.dataset.preset;
        this.state.selected = preset;
        store.updateSettings({ samplingPreset: preset });
        this.render();
        this.setupEventListeners();
      });
    });
    
    // Listen for dataset changes
    store.on('dataset:rows:changed', () => {
      this.render();
      this.setupEventListeners();
    });
    
    // Listen for sampling preset changes
    store.on('settings:changed', (settings) => {
      if (settings.samplingPreset !== undefined) {
        this.state.selected = settings.samplingPreset;
        this.render();
        this.setupEventListeners();
      }
    });
  }
  
  syncWithStore() {
    this.state.selected = store.get('samplingPreset') || '10';
  }
}

customElements.define('cs-led-sampler', LEDSampler);

export default LEDSampler;
