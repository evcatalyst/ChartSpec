// ChartSpec Workbench - Chat Drawer Component
// Side drawer for chat interface with toggle and resize

import store from '../state/store.js';
import { loadSelectedLocalModel, selectLocalModel, cancelLocalModelLoad, getModelInfo } from '../workbench/localModelManager.js';
import { runUIAction } from '../workbench/uiActions.js';

class ChatDrawer extends HTMLElement {
  constructor() {
    super();
    this.state = {
      open: true,
      messages: [],
      localModel: null,
      busy: {},
    };
    this.storeBound = false;
    this.storeUnsubscribers = [];
  }
  
  connectedCallback() {
    this.syncWithStore();
    this.render();
    this.attachDOMListeners();
    this.attachStoreListeners();
  }

  disconnectedCallback() {
    this.storeUnsubscribers.forEach((fn) => fn && fn());
    this.storeUnsubscribers = [];
    this.storeBound = false;
  }
  
  render() {
    const busy = this.state.busy || {};
    const chatBusy = Boolean(busy['chat:send'] || busy['local-inference']);
    const localBusy = Boolean(busy['local-model']);
    
    if (!this.state.open) {
      this.style.display = 'none';
      return;
    }
    
    this.style.display = 'flex';
    
    this.innerHTML = `
      <div class="chat-drawer-header">
        <h2 class="chat-drawer-title">Chat</h2>
        <button class="chat-drawer-toggle" id="close-drawer" title="Close chat (Ctrl+B)">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
      
      <div class="chat-messages" id="chat-messages">
        ${this.renderMessages()}
      </div>
      
      <div class="chat-input-area">
        ${this.renderLocalModelControls(localBusy)}
        <cs-nl-settings></cs-nl-settings>
        <textarea 
          class="chat-input" 
          id="chat-input" 
          placeholder="Ask for a visualization... (e.g., 'Show revenue by region as a bar chart')"
          rows="3"></textarea>
        <div class="chat-input-actions">
          <button class="btn btn-primary" id="send-message" ${chatBusy ? 'disabled' : ''}>
            Send
          </button>
          <button class="btn btn-secondary" id="clear-chat">
            Clear
          </button>
        </div>
      </div>
    `;
  }
  
  renderMessages() {
    if (this.state.messages.length === 0) {
      return `
        <div style="text-align: center; padding: var(--space-6); color: var(--text-dim);">
          <p>No messages yet.</p>
          <p style="font-size: var(--text-sm); margin-top: var(--space-2);">
            Start by asking for a visualization!
          </p>
        </div>
      `;
    }
    
    return this.state.messages.map(msg => this.renderMessage(msg)).join('');
  }
  
  renderMessage(msg) {
    const isUser = msg.role === 'user';
    const actions = !isUser ? this.renderMessageActions(msg) : '';
    
    return `
      <div class="chat-message ${msg.role}" id="msg-${msg.id}">
        <div class="chat-message-role">${isUser ? 'You' : 'Assistant'}</div>
        <div class="chat-message-content">${this.escapeHtml(msg.content)}</div>
        ${actions}
      </div>
    `;
  }
  
  renderMessageActions(msg) {
    return `
      <div class="chat-message-actions">
        <button class="chat-message-action" data-action="create-tile" data-message-id="${msg.id}">
          Create Tile
        </button>
        <button class="chat-message-action" data-action="copy" data-message-id="${msg.id}">
          Copy
        </button>
        <button class="chat-message-action" data-action="regenerate" data-message-id="${msg.id}">
          Regenerate
        </button>
      </div>
    `;
  }

  renderLocalModelControls(localBusy = false) {
    const localModel = this.state.localModel || store.get('localModel') || {};
    const selection = localModel.selection || 'smol-1.7b';
    const info = getModelInfo(selection);
    const status = localModel.status || 'idle';
    const progressText = status === 'loading'
      ? `${localModel.progress || 0}% (${status})`
      : status === 'ready'
        ? 'Ready'
        : 'Not loaded';

    return `
      <div class="local-model-panel">
        <div class="local-model-row">
          <div>
            <div class="local-model-title">Local model</div>
            <div class="local-model-meta">${info.label} • ~${info.sizeMB}MB download • ~${info.memoryGB}GB RAM</div>
          </div>
          <select id="local-model-select" ${localBusy ? 'disabled' : ''}>
            <option value="smol-1.7b" ${selection === 'smol-1.7b' ? 'selected' : ''}>SmolLM 1.7B</option>
            <option value="phi-mini" ${selection === 'phi-mini' ? 'selected' : ''}>Phi Mini</option>
            <option value="stub" ${selection === 'stub' ? 'selected' : ''}>Stub (test)</option>
          </select>
        </div>
        <div class="local-model-actions">
          <button class="btn btn-secondary btn-sm" id="load-local-model" ${localBusy ? 'disabled' : ''}>
            ${status === 'loading' ? 'Loading…' : 'Load model'}
          </button>
          ${status === 'loading' ? `<button class="btn btn-ghost btn-sm" id="cancel-local-model">Cancel</button>` : ''}
          ${status === 'error' ? `<button class="btn btn-primary btn-sm" id="retry-local-model">Retry</button>` : ''}
          ${localModel.lastLoaded ? `<button class="btn btn-ghost btn-sm" id="revert-local-model">Revert to ${localModel.lastLoaded}</button>` : ''}
        </div>
        <div class="local-model-status">
          <div class="local-model-progress">${progressText}</div>
          ${localModel.error ? `<div class="local-model-error">Error: ${localModel.error}</div>` : ''}
        </div>
      </div>
    `;
  }
  
  attachDOMListeners() {
    // Close drawer
    this.querySelector('#close-drawer')?.addEventListener('click', () => {
      store.toggleChatDrawer();
    });

    // Send message
    this.querySelector('#send-message')?.addEventListener('click', () => {
      this.handleSendMessage();
    });

    // Enter to send (Shift+Enter for newline)
    this.querySelector('#chat-input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSendMessage();
      }
    });

    // Clear chat
    this.querySelector('#clear-chat')?.addEventListener('click', () => {
      if (confirm('Clear chat history?')) {
        store.clearChat();
      }
    });

    // Message actions
    if (!this._messageActionHandler) {
      this._messageActionHandler = (e) => {
        const actionBtn = e.target.closest('.chat-message-action');
        if (actionBtn) {
          const action = actionBtn.dataset.action;
          const messageId = actionBtn.dataset.messageId;
          this.handleMessageAction(action, messageId);
        }
      };
      this.addEventListener('click', this._messageActionHandler);
    }

    // Local model controls
    this.querySelector('#local-model-select')?.addEventListener('change', (e) => {
      const selection = e.target.value;
      selectLocalModel(selection);
      this.state.localModel = store.get('localModel');
      this.render();
      this.attachDOMListeners();
    });

    this.querySelector('#load-local-model')?.addEventListener('click', () => {
      const button = this.querySelector('#load-local-model');
      loadSelectedLocalModel({ controls: [button] }).catch((error) => {
        console.error('Local model load failed', error);
      });
    });

    this.querySelector('#cancel-local-model')?.addEventListener('click', () => {
      cancelLocalModelLoad();
    });

    this.querySelector('#retry-local-model')?.addEventListener('click', () => {
      const button = this.querySelector('#retry-local-model');
      loadSelectedLocalModel({ controls: [button] }).catch((error) => {
        console.error('Local model retry failed', error);
      });
    });

    this.querySelector('#revert-local-model')?.addEventListener('click', () => {
      const last = store.get('localModel')?.lastLoaded;
      if (last) {
        selectLocalModel(last);
        store.updateLocalModel({ status: 'ready', progress: 100, error: null });
        this.refresh();
      }
    });
  }

  attachStoreListeners() {
    if (this.storeBound) return;
    this.storeBound = true;

    this.storeUnsubscribers.push(
      store.on('chat:message', () => {
        this.state.messages = store.get('chatHistory');
        this.refresh();
        this.scrollToBottom();
      }),
      store.on('chat:cleared', () => {
        this.state.messages = [];
        this.refresh();
      }),
      store.on('chat:drawer:toggled', (open) => {
        this.state.open = open;
        this.refresh();
      }),
      store.on('localmodel:changed', (localModel) => {
        this.state.localModel = localModel;
        this.refresh();
      }),
      store.on('ui:busy', () => {
        this.state.busy = store.get('uiBusy');
        this.refresh();
      }),
      store.on('ui:idle', () => {
        this.state.busy = store.get('uiBusy');
        this.refresh();
      })
    );
  }

  refresh() {
    this.render();
    this.attachDOMListeners();
  }
  
  syncWithStore() {
    this.state.open = store.get('chatDrawerOpen');
    this.state.messages = store.get('chatHistory');
    this.state.localModel = store.get('localModel');
    this.state.busy = store.get('uiBusy');
    
    const width = store.get('chatDrawerWidth');
    this.style.width = `${width}px`;
  }
  
  handleSendMessage() {
    const input = this.querySelector('#chat-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Check if dataset is selected
    if (!store.get('selectedDataset')) {
      alert('Please select a dataset first');
      return;
    }
    
    // Add user message
    store.addChatMessage('user', message);
    
    // Clear input
    input.value = '';
    
    // Process message
    store.emit('chat:send', message);
  }
  
  handleMessageAction(action, messageId) {
    const message = this.state.messages.find(m => m.id === messageId);
    if (!message) return;
    
    switch (action) {
      case 'create-tile':
        this.createTileFromMessage(message);
        break;
      case 'copy':
        this.copyMessage(message);
        break;
      case 'regenerate':
        this.regenerateMessage(message);
        break;
    }
  }
  
  createTileFromMessage(message) {
    // Try to parse ChartSpec from message content
    try {
      const spec = JSON.parse(message.content);
      
      // Create a chart tile
      const tile = {
        id: `tile-${Date.now()}`,
        type: 'chart',
        title: spec.title || 'Chart',
        x: 0,
        y: 0,
        w: 6,
        h: 4,
        config: {},
        data: {
          spec,
          rows: store.get('currentRows'),
        }
      };
      
      store.addTile(tile);
      
      // Also create an inspector tile
      const inspectorTile = {
        id: `tile-${Date.now() + 1}`,
        type: 'inspector',
        title: 'Inspector',
        x: 6,
        y: 0,
        w: 6,
        h: 4,
        config: {},
        data: {
          spec,
          tokens: null,
          warnings: [],
        }
      };
      
      store.addTile(inspectorTile);
      
    } catch (error) {
      console.error('Failed to create tile from message:', error);
      alert('Could not create tile: message does not contain valid ChartSpec JSON');
    }
  }
  
  async copyMessage(message) {
    try {
      await navigator.clipboard.writeText(message.content);
      // Show temporary feedback
      const btn = this.querySelector(`[data-action="copy"][data-message-id="${message.id}"]`);
      if (btn) {
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => {
          btn.textContent = originalText;
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to copy:', error);
      alert('Failed to copy to clipboard');
    }
  }
  
  regenerateMessage(message) {
    // Find the previous user message
    const messageIndex = this.state.messages.findIndex(m => m.id === message.id);
    if (messageIndex > 0) {
      const userMessage = this.state.messages[messageIndex - 1];
      if (userMessage.role === 'user') {
        store.emit('chat:send', userMessage.content);
      }
    }
  }
  
  scrollToBottom() {
    const messagesContainer = this.querySelector('#chat-messages');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

customElements.define('cs-chat-drawer', ChatDrawer);

export default ChatDrawer;
