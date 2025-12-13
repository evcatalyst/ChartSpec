// ChartSpec Workbench - Text Tile Component
// Renders markdown/text content

import store from '../state/store.js';

class TextTile extends HTMLElement {
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
    
    if (!tile || !tile.data || !tile.data.content) {
      this.innerHTML = '<div class="tile-placeholder">No content</div>';
      return;
    }
    
    // Simple markdown-like rendering
    const html = this.renderMarkdown(tile.data.content);
    
    this.innerHTML = `<div class="text-content">${html}</div>`;
  }
  
  renderMarkdown(text) {
    let html = text;
    
    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Code
    html = html.replace(/`(.*?)`/g, '<code>$1</code>');
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    
    // Line breaks
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');
    
    // Lists
    html = html.replace(/^- (.*$)/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    // Wrap in paragraph if not already wrapped
    if (!html.startsWith('<')) {
      html = '<p>' + html + '</p>';
    }
    
    return html;
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

customElements.define('cs-text-tile', TextTile);

export default TextTile;
