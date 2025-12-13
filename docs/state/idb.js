// ChartSpec Workbench - IndexedDB Wrapper
// Handles large dataset storage in IndexedDB

const DB_NAME = 'chartspec';
const DB_VERSION = 1;
const STORE_DATASETS = 'datasets';
const STORE_SAMPLES = 'samples';
const STORE_CACHE = 'cache';

let db = null;

/**
 * Initialize IndexedDB
 */
export async function initDB() {
  if (db) {
    return db;
  }
  
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => {
      console.error('Failed to open IndexedDB:', request.error);
      reject(request.error);
    };
    
    request.onsuccess = () => {
      db = request.result;
      console.log('IndexedDB initialized successfully');
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Datasets store
      if (!db.objectStoreNames.contains(STORE_DATASETS)) {
        const datasetsStore = db.createObjectStore(STORE_DATASETS, { keyPath: 'name' });
        datasetsStore.createIndex('url', 'url', { unique: false });
        datasetsStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
      
      // Samples store (cached samples for LLM calls)
      if (!db.objectStoreNames.contains(STORE_SAMPLES)) {
        const samplesStore = db.createObjectStore(STORE_SAMPLES, { keyPath: 'id' });
        samplesStore.createIndex('datasetName', 'datasetName', { unique: false });
        samplesStore.createIndex('sampleSize', 'sampleSize', { unique: false });
      }
      
      // General cache store
      if (!db.objectStoreNames.contains(STORE_CACHE)) {
        db.createObjectStore(STORE_CACHE, { keyPath: 'key' });
      }
      
      console.log('IndexedDB schema created');
    };
  });
}

/**
 * Generic transaction helper
 */
function transaction(storeName, mode = 'readonly') {
  if (!db) {
    throw new Error('Database not initialized. Call initDB() first.');
  }
  return db.transaction([storeName], mode).objectStore(storeName);
}

/**
 * Save dataset to IndexedDB
 */
export async function saveDataset(dataset) {
  const store = transaction(STORE_DATASETS, 'readwrite');
  
  return new Promise((resolve, reject) => {
    const request = store.put({
      name: dataset.name,
      url: dataset.url,
      rows: dataset.rows,
      columns: dataset.columns,
      rowCount: dataset.rowCount,
      timestamp: Date.now(),
    });
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get dataset from IndexedDB
 */
export async function getDataset(name) {
  const store = transaction(STORE_DATASETS, 'readonly');
  
  return new Promise((resolve, reject) => {
    const request = store.get(name);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all datasets
 */
export async function getAllDatasets() {
  const store = transaction(STORE_DATASETS, 'readonly');
  
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete dataset from IndexedDB
 */
export async function deleteDataset(name) {
  const store = transaction(STORE_DATASETS, 'readwrite');
  
  return new Promise((resolve, reject) => {
    const request = store.delete(name);
    
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save sample to cache
 */
export async function saveSample(datasetName, sampleSize, rows) {
  const store = transaction(STORE_SAMPLES, 'readwrite');
  
  const id = `${datasetName}_${sampleSize}`;
  
  return new Promise((resolve, reject) => {
    const request = store.put({
      id,
      datasetName,
      sampleSize,
      rows,
      timestamp: Date.now(),
    });
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get cached sample
 */
export async function getSample(datasetName, sampleSize) {
  const store = transaction(STORE_SAMPLES, 'readonly');
  
  const id = `${datasetName}_${sampleSize}`;
  
  return new Promise((resolve, reject) => {
    const request = store.get(id);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear old samples for a dataset
 */
export async function clearDatasetSamples(datasetName) {
  const store = transaction(STORE_SAMPLES, 'readwrite');
  const index = store.index('datasetName');
  
  return new Promise((resolve, reject) => {
    const request = index.openCursor(IDBKeyRange.only(datasetName));
    
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        resolve(true);
      }
    };
    
    request.onerror = () => reject(request.error);
  });
}

/**
 * Generic cache operations
 */
export async function setCache(key, value) {
  const store = transaction(STORE_CACHE, 'readwrite');
  
  return new Promise((resolve, reject) => {
    const request = store.put({ key, value, timestamp: Date.now() });
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getCache(key) {
  const store = transaction(STORE_CACHE, 'readonly');
  
  return new Promise((resolve, reject) => {
    const request = store.get(key);
    
    request.onsuccess = () => resolve(request.result?.value);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteCache(key) {
  const store = transaction(STORE_CACHE, 'readwrite');
  
  return new Promise((resolve, reject) => {
    const request = store.delete(key);
    
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear all data from IndexedDB
 */
export async function clearAllData() {
  const stores = [STORE_DATASETS, STORE_SAMPLES, STORE_CACHE];
  
  for (const storeName of stores) {
    const store = transaction(storeName, 'readwrite');
    await new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }
  
  return true;
}

/**
 * Get database size estimate
 */
export async function getDBSize() {
  if (!navigator.storage || !navigator.storage.estimate) {
    return null;
  }
  
  try {
    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage,
      quota: estimate.quota,
      usageMB: (estimate.usage / 1024 / 1024).toFixed(2),
      quotaMB: (estimate.quota / 1024 / 1024).toFixed(2),
      percentUsed: ((estimate.usage / estimate.quota) * 100).toFixed(2),
    };
  } catch (error) {
    console.error('Failed to get storage estimate:', error);
    return null;
  }
}

/**
 * Migrate data from localStorage to IndexedDB
 */
export async function migrateFromLocalStorage() {
  try {
    // Check if old ChartSpec datasets exist in localStorage
    const oldDatasets = JSON.parse(localStorage.getItem('chartspec_datasets') || '[]');
    
    if (oldDatasets.length === 0) {
      console.log('No datasets to migrate from localStorage');
      return 0;
    }
    
    console.log(`Migrating ${oldDatasets.length} datasets from localStorage to IndexedDB`);
    
    let migrated = 0;
    for (const dataset of oldDatasets) {
      try {
        await saveDataset(dataset);
        migrated++;
      } catch (error) {
        console.error(`Failed to migrate dataset "${dataset.name}":`, error);
      }
    }
    
    console.log(`Successfully migrated ${migrated} datasets`);
    
    // Optionally clear old localStorage data
    // localStorage.removeItem('chartspec_datasets');
    
    return migrated;
  } catch (error) {
    console.error('Migration from localStorage failed:', error);
    return 0;
  }
}

// Auto-initialize on import
initDB().catch(error => {
  console.error('Failed to initialize IndexedDB:', error);
});

export default {
  initDB,
  saveDataset,
  getDataset,
  getAllDatasets,
  deleteDataset,
  saveSample,
  getSample,
  clearDatasetSamples,
  setCache,
  getCache,
  deleteCache,
  clearAllData,
  getDBSize,
  migrateFromLocalStorage,
};
