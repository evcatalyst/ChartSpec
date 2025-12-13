// ChartSpec Workbench - LocalStorage Persistence
// Handles saving/loading UI state and preferences

const STORAGE_PREFIX = 'chartspec_workbench_';
const STORAGE_VERSION = 1;

/**
 * localStorage keys used by the application
 */
export const STORAGE_KEYS = {
  // UI State
  DRAWER_OPEN: `${STORAGE_PREFIX}drawer_open`,
  DRAWER_WIDTH: `${STORAGE_PREFIX}drawer_width`,
  PRESENTATION_MODE: `${STORAGE_PREFIX}presentation_mode`,
  LAYOUT_PRESET: `${STORAGE_PREFIX}layout_preset`,
  GRID_LAYOUT: `${STORAGE_PREFIX}grid_layout`,
  
  // Settings
  PROVIDER: `${STORAGE_PREFIX}provider`,
  API_KEY: `${STORAGE_PREFIX}api_key`,
  LOCAL_MODE: `${STORAGE_PREFIX}local_mode`,
  SMART_MODE: `${STORAGE_PREFIX}smart_mode`,
  SAMPLING_PRESET: `${STORAGE_PREFIX}sampling_preset`,
  
  // Dataset
  SELECTED_DATASET: `${STORAGE_PREFIX}selected_dataset`,
  
  // Theme
  THEME: `${STORAGE_PREFIX}theme`,
  
  // Version
  VERSION: `${STORAGE_PREFIX}version`,
  
  // Tiles
  TILES: `${STORAGE_PREFIX}tiles`,
  ACTIVE_TILE: `${STORAGE_PREFIX}active_tile`,
};

/**
 * Save a value to localStorage
 */
export function save(key, value) {
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    console.error(`Failed to save to localStorage (${key}):`, error);
    return false;
  }
}

/**
 * Load a value from localStorage
 */
export function load(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return defaultValue;
    }
    return JSON.parse(item);
  } catch (error) {
    console.error(`Failed to load from localStorage (${key}):`, error);
    return defaultValue;
  }
}

/**
 * Remove a value from localStorage
 */
export function remove(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Failed to remove from localStorage (${key}):`, error);
    return false;
  }
}

/**
 * Clear all ChartSpec storage
 */
export function clearAll() {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    return true;
  } catch (error) {
    console.error('Failed to clear localStorage:', error);
    return false;
  }
}

/**
 * Check storage version and migrate if needed
 */
export function checkVersion() {
  const storedVersion = load(STORAGE_KEYS.VERSION, 0);
  
  if (storedVersion < STORAGE_VERSION) {
    console.log(`Migrating storage from v${storedVersion} to v${STORAGE_VERSION}`);
    migrateStorage(storedVersion, STORAGE_VERSION);
    save(STORAGE_KEYS.VERSION, STORAGE_VERSION);
  }
}

/**
 * Migrate storage between versions
 */
function migrateStorage(fromVersion, toVersion) {
  // Migration logic for future versions
  if (fromVersion === 0 && toVersion === 1) {
    // Migrate from old ChartSpec to new Workbench
    const oldKeys = {
      provider: 'chartspec_provider',
      apiKey: 'chartspec_apikey',
      localMode: 'chartspec_localmode',
      smartMode: 'chartspec_smartmode',
    };
    
    // Copy old values if they exist
    const oldProvider = localStorage.getItem(oldKeys.provider);
    if (oldProvider) {
      save(STORAGE_KEYS.PROVIDER, oldProvider);
    }
    
    const oldApiKey = localStorage.getItem(oldKeys.apiKey);
    if (oldApiKey) {
      save(STORAGE_KEYS.API_KEY, oldApiKey);
    }
    
    const oldLocalMode = localStorage.getItem(oldKeys.localMode);
    if (oldLocalMode !== null) {
      save(STORAGE_KEYS.LOCAL_MODE, oldLocalMode === 'true');
    }
    
    const oldSmartMode = localStorage.getItem(oldKeys.smartMode);
    if (oldSmartMode !== null) {
      save(STORAGE_KEYS.SMART_MODE, oldSmartMode === 'true');
    }
  }
}

/**
 * Load initial state from localStorage
 */
export function loadInitialState() {
  checkVersion();
  
  return {
    // UI State
    chatDrawerOpen: load(STORAGE_KEYS.DRAWER_OPEN, true),
    chatDrawerWidth: load(STORAGE_KEYS.DRAWER_WIDTH, 384),
    presentationMode: load(STORAGE_KEYS.PRESENTATION_MODE, false),
    layoutPreset: load(STORAGE_KEYS.LAYOUT_PRESET, 'default'),
    gridLayout: load(STORAGE_KEYS.GRID_LAYOUT, null),
    
    // Settings
    provider: load(STORAGE_KEYS.PROVIDER, 'openai'),
    apiKey: load(STORAGE_KEYS.API_KEY, ''),
    localMode: load(STORAGE_KEYS.LOCAL_MODE, false),
    smartMode: load(STORAGE_KEYS.SMART_MODE, false),
    samplingPreset: load(STORAGE_KEYS.SAMPLING_PRESET, '10'),
    
    // Dataset
    selectedDataset: load(STORAGE_KEYS.SELECTED_DATASET, null),
    
    // Theme
    theme: load(STORAGE_KEYS.THEME, 'dark'),
    
    // Tiles
    tiles: load(STORAGE_KEYS.TILES, []),
    activeTileId: load(STORAGE_KEYS.ACTIVE_TILE, null),
  };
}

/**
 * Save state to localStorage
 */
export function saveState(state) {
  save(STORAGE_KEYS.DRAWER_OPEN, state.chatDrawerOpen);
  save(STORAGE_KEYS.DRAWER_WIDTH, state.chatDrawerWidth);
  save(STORAGE_KEYS.PRESENTATION_MODE, state.presentationMode);
  save(STORAGE_KEYS.LAYOUT_PRESET, state.layoutPreset);
  save(STORAGE_KEYS.GRID_LAYOUT, state.gridLayout);
  
  save(STORAGE_KEYS.PROVIDER, state.provider);
  save(STORAGE_KEYS.API_KEY, state.apiKey);
  save(STORAGE_KEYS.LOCAL_MODE, state.localMode);
  save(STORAGE_KEYS.SMART_MODE, state.smartMode);
  save(STORAGE_KEYS.SAMPLING_PRESET, state.samplingPreset);
  
  save(STORAGE_KEYS.SELECTED_DATASET, state.selectedDataset);
  save(STORAGE_KEYS.THEME, state.theme);
  
  save(STORAGE_KEYS.TILES, state.tiles);
  save(STORAGE_KEYS.ACTIVE_TILE, state.activeTileId);
}

/**
 * Save grid layout
 */
export function saveGridLayout(layout) {
  save(STORAGE_KEYS.GRID_LAYOUT, layout);
}

/**
 * Load grid layout
 */
export function loadGridLayout() {
  return load(STORAGE_KEYS.GRID_LAYOUT, null);
}

/**
 * Get storage usage info
 */
export function getStorageInfo() {
  let totalSize = 0;
  const items = {};
  
  try {
    for (const key in localStorage) {
      if (key.startsWith(STORAGE_PREFIX)) {
        const value = localStorage.getItem(key);
        const size = value ? value.length : 0;
        totalSize += size;
        items[key] = {
          size,
          sizeKB: (size / 1024).toFixed(2),
        };
      }
    }
    
    return {
      totalSize,
      totalSizeKB: (totalSize / 1024).toFixed(2),
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
      items,
      // Approximate available space (varies by browser)
      estimatedLimit: 5 * 1024 * 1024, // 5MB typical
      estimatedLimitMB: 5,
    };
  } catch (error) {
    console.error('Failed to get storage info:', error);
    return null;
  }
}

/**
 * Auto-save middleware for store
 */
export function createPersistenceMiddleware() {
  let saveTimeout = null;
  
  return (oldState, newState) => {
    // Debounce saves
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      saveState(newState);
    }, 500);
  };
}

export default {
  STORAGE_KEYS,
  save,
  load,
  remove,
  clearAll,
  loadInitialState,
  saveState,
  saveGridLayout,
  loadGridLayout,
  getStorageInfo,
  createPersistenceMiddleware,
};
