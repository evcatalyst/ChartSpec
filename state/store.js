// ChartSpec Workbench - Central State Store & Event Bus
// Single source of truth for application state with pub/sub pattern

class Store {
  constructor() {
    this.state = {
      // Dataset state
      datasets: [],
      selectedDataset: null,
      currentRows: [],
      
      // Tiles state
      tiles: [], // { id, type, config, data }
      activeTileId: null,
      gridLayout: null,
      
      // Chat state
      chatHistory: [],
      chatDrawerOpen: true,
      chatDrawerWidth: 384, // 24rem default
      
      // Settings state
      provider: 'openai',
      apiKey: '',
      localMode: false,
      smartMode: false,
      samplingPreset: '10', // percentage

      // Local model state
      localModel: {
        selection: 'smol-1.7b',
        status: 'idle',
        progress: 0,
        lastLoaded: null,
        error: null,
        info: null,
      },
      
      // UI state
      presentationMode: false,
      layoutPreset: 'default',

      // Busy state by scope
      uiBusy: {},

      // System messages / instrumentation
      systemMessages: [],
      
      // ChartSpec state
      currentSpec: null,
      
      // Theme
      theme: 'dark',
    };
    
    this.listeners = new Map(); // event -> Set of callbacks
    this.middlewares = []; // State change middlewares
  }

  /**
   * Set busy state for a scope
   */
  setBusy(scope, action = null) {
    const uiBusy = { ...this.state.uiBusy, [scope]: action || true };
    this.setState({ uiBusy });
    this.emit('ui:busy', scope, action);
  }

  /**
   * Clear busy state for a scope
   */
  clearBusy(scope) {
    const uiBusy = { ...this.state.uiBusy };
    delete uiBusy[scope];
    this.setState({ uiBusy });
    this.emit('ui:idle', scope);
  }

  /**
   * Check busy state for scope
   */
  isBusy(scope) {
    return Boolean(this.state.uiBusy[scope]);
  }

  /**
   * Add system message for observability
   */
  addSystemMessage(level, message, meta = {}) {
    const entry = {
      id: `sys-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      level,
      message,
      meta,
      timestamp: Date.now(),
    };
    const systemMessages = [...this.state.systemMessages, entry].slice(-20);
    this.setState({ systemMessages });
    this.emit('system:message', entry);
  }

  clearSystemMessages() {
    this.setState({ systemMessages: [] });
    this.emit('system:cleared');
  }

  /**
   * Get current state (immutable)
   */
  getState() {
    return { ...this.state };
  }
  
  /**
   * Get a specific state value
   */
  get(key) {
    return this.state[key];
  }
  
  /**
   * Update state and notify listeners
   */
  setState(updates) {
    const oldState = { ...this.state };
    const newState = { ...this.state, ...updates };
    
    // Run middlewares
    for (const middleware of this.middlewares) {
      middleware(oldState, newState);
    }
    
    this.state = newState;
    
    // Emit change event with changed keys
    const changedKeys = Object.keys(updates);
    this.emit('state:changed', { oldState, newState, changedKeys });
    
    // Emit specific events for each changed key
    for (const key of changedKeys) {
      this.emit(`state:${key}`, newState[key], oldState[key]);
    }
  }
  
  /**
   * Subscribe to events
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        callbacks.delete(callback);
      }
    };
  }
  
  /**
   * Subscribe once to an event
   */
  once(event, callback) {
    const unsubscribe = this.on(event, (...args) => {
      callback(...args);
      unsubscribe();
    });
    return unsubscribe;
  }
  
  /**
   * Emit an event
   */
  emit(event, ...args) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      for (const callback of callbacks) {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in event listener for "${event}":`, error);
        }
      }
    }
  }
  
  /**
   * Add middleware for state changes
   */
  use(middleware) {
    this.middlewares.push(middleware);
  }
  
  /**
   * Tile management
   */
  addTile(tile) {
    const tiles = [...this.state.tiles, tile];
    this.setState({ tiles });
    this.emit('tile:added', tile);
  }
  
  updateTile(tileId, updates) {
    const tiles = this.state.tiles.map(tile =>
      tile.id === tileId ? { ...tile, ...updates } : tile
    );
    this.setState({ tiles });
    this.emit('tile:updated', tileId, updates);
  }
  
  removeTile(tileId) {
    const tiles = this.state.tiles.filter(tile => tile.id !== tileId);
    this.setState({ tiles });
    this.emit('tile:removed', tileId);
  }
  
  getTile(tileId) {
    return this.state.tiles.find(tile => tile.id === tileId);
  }
  
  /**
   * Chat management
   */
  addChatMessage(role, content, metadata = {}) {
    const message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role,
      content,
      timestamp: Date.now(),
      ...metadata
    };
    const chatHistory = [...this.state.chatHistory, message];
    this.setState({ chatHistory });
    this.emit('chat:message', message);
    return message.id;
  }
  
  updateChatMessage(messageId, updates) {
    const chatHistory = this.state.chatHistory.map(msg =>
      msg.id === messageId ? { ...msg, ...updates } : msg
    );
    this.setState({ chatHistory });
    this.emit('chat:message:updated', messageId, updates);
  }
  
  clearChat() {
    this.setState({ chatHistory: [] });
    this.emit('chat:cleared');
  }
  
  /**
   * Dataset management
   */
  setDatasets(datasets) {
    this.setState({ datasets });
    this.emit('datasets:loaded', datasets);
  }
  
  selectDataset(datasetName) {
    this.setState({ selectedDataset: datasetName });
    this.emit('dataset:selected', datasetName);
  }
  
  setCurrentRows(rows) {
    this.setState({ currentRows: rows });
    this.emit('dataset:rows:changed', rows);
  }
  
  /**
   * Settings management
   */
  updateSettings(settings) {
    this.setState(settings);
    this.emit('settings:changed', settings);
  }

  updateLocalModel(updates) {
    const localModel = { ...this.state.localModel, ...updates };
    this.setState({ localModel });
    this.emit('localmodel:changed', localModel);
  }
  
  /**
   * UI actions
   */
  toggleChatDrawer() {
    const chatDrawerOpen = !this.state.chatDrawerOpen;
    this.setState({ chatDrawerOpen });
    this.emit('chat:drawer:toggled', chatDrawerOpen);
  }
  
  setChatDrawerWidth(width) {
    this.setState({ chatDrawerWidth: width });
    this.emit('chat:drawer:resized', width);
  }
  
  togglePresentationMode() {
    const presentationMode = !this.state.presentationMode;
    this.setState({ presentationMode });
    this.emit('presentation:toggled', presentationMode);
    
    // Update DOM attribute
    document.documentElement.setAttribute('data-presentation-mode', presentationMode);
  }
  
  setLayoutPreset(preset) {
    this.setState({ layoutPreset: preset });
    this.emit('layout:preset:changed', preset);
  }
  
  setTheme(theme) {
    this.setState({ theme });
    this.emit('theme:changed', theme);
    
    // Update DOM attribute
    document.documentElement.setAttribute('data-theme', theme);
  }
}

// Create singleton instance
export const store = new Store();

// Development helper
if (typeof window !== 'undefined') {
  window.chartSpecStore = store;
}

// Default export
export default store;
