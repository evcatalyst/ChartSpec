// ChartSpec Workbench - App Shell Component
// Main layout orchestration component

import store from '../state/store.js';

class AppShell extends HTMLElement {
  constructor() {
    super();
    this.state = {
      presentationMode: false,
    };
  }
  
  connectedCallback() {
    this.render();
    this.setupEventListeners();
    this.syncWithStore();
  }
  
  render() {
    this.innerHTML = `
      <cs-command-bar></cs-command-bar>
      
      <div class="workbench-layout" style="display: flex; flex: 1; overflow: hidden;">
        <cs-grid style="flex: 1;"></cs-grid>
        <div class="splitter" id="drawer-splitter" style="display: none;"></div>
        <cs-chat-drawer></cs-chat-drawer>
      </div>
    `;
    
    this.classList.add('fullscreen');
  }
  
  setupEventListeners() {
    // Listen for presentation mode toggle
    store.on('presentation:toggled', (enabled) => {
      this.state.presentationMode = enabled;
      this.updatePresentationMode();
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // ESC to exit presentation mode or close drawer
      if (e.key === 'Escape') {
        if (this.state.presentationMode) {
          store.togglePresentationMode();
        } else if (store.get('chatDrawerOpen')) {
          store.toggleChatDrawer();
        }
      }
      
      // Ctrl+B to toggle chat drawer
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        store.toggleChatDrawer();
      }
      
      // Ctrl+P to toggle presentation mode
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        store.togglePresentationMode();
      }
    });
  }
  
  syncWithStore() {
    // Initialize from store
    const presentationMode = store.get('presentationMode');
    if (presentationMode) {
      this.state.presentationMode = presentationMode;
      this.updatePresentationMode();
    }
  }
  
  updatePresentationMode() {
    document.documentElement.setAttribute(
      'data-presentation-mode',
      this.state.presentationMode
    );
  }
}

// Define custom element
customElements.define('cs-app-shell', AppShell);

export default AppShell;
