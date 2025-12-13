// ChartSpec Workbench - Inspector Tile Component
// Shows ChartSpec JSON, token estimates, and warnings

import store from '../state/store.js';

class InspectorTile extends HTMLElement {
  constructor() {
    super();
    this.tileId = null;
    this.expanded = {
      spec: true,
      tokens: false,
      warnings: true,
    };
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
      this.innerHTML = '<div class="tile-placeholder">No inspector data</div>';
      return;
    }
    
    const { spec, tokens, warnings } = tile.data;
    
    this.innerHTML = `
      <div class="inspector-content">
        ${this.renderSpecSection(spec)}
        ${this.renderTokensSection(tokens)}
        ${this.renderWarningsSection(warnings)}
      </div>
    `;
  }
  
  renderSpecSection(spec) {
    if (!spec) return '';
    
    return `
      <div class="inspector-section">
        <div class="inspector-section-header" data-section="spec">
          <h4 class="inspector-section-title">ChartSpec JSON</h4>
          <button class="btn btn-sm btn-ghost" data-action="copy-spec">
            <svg style="width: 1rem; height: 1rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
            </svg>
            Copy
          </button>
        </div>
        <div class="inspector-section-content ${this.expanded.spec ? '' : 'hidden'}">
          <pre class="json-viewer">${this.escapeHtml(JSON.stringify(spec, null, 2))}</pre>
        </div>
      </div>
    `;
  }
  
  renderTokensSection(tokens) {
    if (!tokens) return '';
    
    const { total, breakdown, limit } = tokens;
    const percentage = limit ? Math.round((total / limit) * 100) : 0;
    
    return `
      <div class="inspector-section">
        <div class="inspector-section-header" data-section="tokens">
          <h4 class="inspector-section-title">Token Estimate</h4>
          <span style="font-size: var(--text-xs); color: var(--text-dim);">
            ${total.toLocaleString()} / ${limit ? limit.toLocaleString() : '∞'}
          </span>
        </div>
        <div class="inspector-section-content ${this.expanded.tokens ? '' : 'hidden'}">
          <div style="margin-bottom: var(--space-3);">
            <div style="width: 100%; height: 8px; background: var(--led-inactive); border-radius: var(--radius-sm); overflow: hidden;">
              <div style="width: ${percentage}%; height: 100%; background: ${percentage > 80 ? 'var(--led-danger)' : percentage > 60 ? 'var(--led-warning)' : 'var(--led-success)'}; transition: width var(--transition-normal);"></div>
            </div>
          </div>
          ${breakdown ? `
            <div style="font-size: var(--text-xs); color: var(--text-dim);">
              <div>System: ${breakdown.systemPrompt || 0}</div>
              <div>User: ${breakdown.userMessage || 0}</div>
              <div>Spec: ${breakdown.currentSpec || 0}</div>
              <div>Response: ${breakdown.estimatedResponse || 0}</div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }
  
  renderWarningsSection(warnings) {
    if (!warnings || warnings.length === 0) return '';
    
    return `
      <div class="inspector-section">
        <div class="inspector-section-header" data-section="warnings">
          <h4 class="inspector-section-title">Warnings</h4>
          <span style="font-size: var(--text-xs); color: var(--warning);">
            ${warnings.length}
          </span>
        </div>
        <div class="inspector-section-content ${this.expanded.warnings ? '' : 'hidden'}">
          <ul style="list-style: none; padding: 0; margin: 0;">
            ${warnings.map(w => `
              <li style="padding: var(--space-2) 0; font-size: var(--text-sm); color: var(--warning); border-bottom: 1px solid var(--border-subtle);">
                ⚠️ ${this.escapeHtml(w)}
              </li>
            `).join('')}
          </ul>
        </div>
      </div>
    `;
  }
  
  setupEventListeners() {
    // Section toggles
    this.addEventListener('click', (e) => {
      const header = e.target.closest('.inspector-section-header');
      if (header) {
        const section = header.dataset.section;
        this.expanded[section] = !this.expanded[section];
        this.render();
        this.setupEventListeners(); // Re-attach listeners
      }
      
      // Copy button
      const copyBtn = e.target.closest('[data-action="copy-spec"]');
      if (copyBtn) {
        const tile = store.getTile(this.tileId);
        if (tile && tile.data && tile.data.spec) {
          this.copyToClipboard(JSON.stringify(tile.data.spec, null, 2));
        }
      }
    });
    
    // Listen for tile data updates
    store.on('tile:updated', (tileId, updates) => {
      if (tileId === this.tileId && updates.data) {
        this.render();
      }
    });
  }
  
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      // Show temporary success message
      const btn = this.querySelector('[data-action="copy-spec"]');
      if (btn) {
        const originalText = btn.innerHTML;
        btn.innerHTML = '✓ Copied!';
        setTimeout(() => {
          btn.innerHTML = originalText;
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      alert('Failed to copy to clipboard');
    }
  }
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

customElements.define('cs-inspector-tile', InspectorTile);

export default InspectorTile;
