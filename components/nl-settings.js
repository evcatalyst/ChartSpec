// ChartSpec Workbench - Natural Language Settings Component
// Inline sentence-style settings control

import store from '../state/store.js';

class NLSettings extends HTMLElement {
  constructor() {
    super();
    this.state = {
      provider: 'openai',
      mode: 'smart',
    };
    this.storeBound = false;
    this.storeUnsub = null;
  }
  
  connectedCallback() {
    this.syncWithStore();
    this.render();
    this.attachDOMListeners();
    this.attachStoreListeners();
  }
  
  render() {
    const { provider, mode } = this.state;
    
    this.innerHTML = `
      <span class="nl-label">Use</span>
      <select class="nl-input" id="nl-provider">
        <option value="openai" ${provider === 'openai' ? 'selected' : ''}>OpenAI</option>
        <option value="grok" ${provider === 'grok' ? 'selected' : ''}>Grok</option>
        <option value="local" ${provider === 'local' ? 'selected' : ''}>Local</option>
      </select>
      <span class="nl-label">in</span>
      <select class="nl-input" id="nl-mode">
        <option value="smart" ${mode === 'smart' ? 'selected' : ''}>Smart Mode</option>
        <option value="llm" ${mode === 'llm' ? 'selected' : ''}>LLM Mode</option>
        <option value="manual" ${mode === 'manual' ? 'selected' : ''}>Manual Mode</option>
      </select>
    `;
  }
  
  attachDOMListeners() {
    const providerSelect = this.querySelector('#nl-provider');
    const modeSelect = this.querySelector('#nl-mode');
    
    if (providerSelect) {
      providerSelect.addEventListener('change', (e) => {
        store.updateSettings({ provider: e.target.value });
      });
    }
    
    if (modeSelect) {
      modeSelect.addEventListener('change', (e) => {
        const mode = e.target.value;
        
        // Update corresponding mode flags
        store.updateSettings({
          localMode: mode === 'manual',
          smartMode: mode === 'smart',
        });
      });
    }
  }

  attachStoreListeners() {
    if (this.storeBound) return;
    this.storeBound = true;
    this.storeUnsub = store.on('settings:changed', (settings) => {
      if (settings.provider !== undefined) {
        this.state.provider = settings.provider;
      }
      
      if (settings.localMode) {
        this.state.mode = 'manual';
      } else if (settings.smartMode) {
        this.state.mode = 'smart';
      } else {
        this.state.mode = 'llm';
      }
      
      this.render();
      this.attachDOMListeners();
    });
  }

  disconnectedCallback() {
    if (this.storeUnsub) {
      this.storeUnsub();
      this.storeUnsub = null;
    }
    this.storeBound = false;
  }
  
  syncWithStore() {
    this.state.provider = store.get('provider');
    
    const localMode = store.get('localMode');
    const smartMode = store.get('smartMode');
    
    if (localMode) {
      this.state.mode = 'manual';
    } else if (smartMode) {
      this.state.mode = 'smart';
    } else {
      this.state.mode = 'llm';
    }
  }
}

customElements.define('cs-nl-settings', NLSettings);

export default NLSettings;
