// ChartSpec Workbench - Chat Drawer Component
// Side drawer for chat interface with toggle and resize

import store from '../state/store.js';

class ChatDrawer extends HTMLElement {
  constructor() {
    super();
    this.state = {
      open: true,
      messages: [],
    };
  }
  
  connectedCallback() {
    this.render();
    this.setupEventListeners();
    this.syncWithStore();
  }
  
  render() {
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
        <cs-nl-settings></cs-nl-settings>
        <textarea 
          class="chat-input" 
          id="chat-input" 
          placeholder="Ask for a visualization... (e.g., 'Show revenue by region as a bar chart')"
          rows="3"></textarea>
        <div class="chat-input-actions">
          <button class="btn btn-primary" id="send-message">
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
  
  setupEventListeners() {
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
    this.addEventListener('click', (e) => {
      const actionBtn = e.target.closest('.chat-message-action');
      if (actionBtn) {
        const action = actionBtn.dataset.action;
        const messageId = actionBtn.dataset.messageId;
        this.handleMessageAction(action, messageId);
      }
    });
    
    // Store listeners
    store.on('chat:message', (message) => {
      this.state.messages = store.get('chatHistory');
      this.render();
      this.setupEventListeners();
      this.scrollToBottom();
    });
    
    store.on('chat:cleared', () => {
      this.state.messages = [];
      this.render();
      this.setupEventListeners();
    });
    
    store.on('chat:drawer:toggled', (open) => {
      this.state.open = open;
      this.render();
      if (open) {
        this.setupEventListeners();
      }
    });
  }
  
  syncWithStore() {
    this.state.open = store.get('chatDrawerOpen');
    this.state.messages = store.get('chatHistory');
    
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
