// Dataset registry with CSV fetch/parse and localStorage persistence

const STORAGE_KEY = 'chartspec_datasets';
const DEMO_DATASETS = [
  { name: 'Sample Sales', url: './datasets/sample-sales.csv' },
  { name: 'Sample Weather', url: './datasets/sample-weather.csv' }
];

/**
 * Parse CSV text into array of objects
 * NOTE: This is a simple CSV parser for demo purposes. It does not handle:
 * - Quoted fields containing commas
 * - Escaped quotes
 * - Multi-line fields
 * For production use, consider using a proper CSV parsing library like Papa Parse.
 * @param {string} csvText - CSV content
 * @returns {Array} Array of row objects
 */
function parseCSV(csvText) {
  const lines = csvText.trim().split('\n').filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines
    
    const values = line.split(',').map(v => v.trim());
    
    // Skip rows that are all empty
    if (values.every(v => v === '')) continue;
    
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    rows.push(row);
  }
  
  return rows;
}

/**
 * Fetch and parse CSV from URL
 * NOTE: File size limitations - Browser localStorage typically has 5-10MB limit.
 * Large CSV files (>1MB) may cause performance issues or storage failures.
 * For production use, consider server-side processing for large datasets.
 * @param {string} url - CSV file URL
 * @returns {Promise<Array>} Array of row objects
 */
export async function fetchCSV(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const csvText = await response.text();
    return parseCSV(csvText);
  } catch (error) {
    console.error('Error fetching CSV:', error);
    throw error;
  }
}

/**
 * Get all registered datasets from localStorage
 * @returns {Array} Array of dataset metadata
 */
export function getDatasets() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading datasets from localStorage:', error);
    return [];
  }
}

/**
 * Save datasets to localStorage
 * @param {Array} datasets - Array of dataset metadata
 */
function saveDatasets(datasets) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(datasets));
  } catch (error) {
    console.error('Error saving datasets to localStorage:', error);
    throw error;
  }
}

/**
 * Register a new dataset (fetch CSV and store in localStorage)
 * @param {string} name - Dataset name
 * @param {string} url - CSV URL
 * @returns {Promise<Object>} Dataset metadata with rows
 */
export async function registerDataset(name, url) {
  const rows = await fetchCSV(url);
  
  const datasets = getDatasets();
  
  // Check if dataset already exists
  const existingIndex = datasets.findIndex(d => d.name === name);
  
  const dataset = {
    name,
    url,
    rowCount: rows.length,
    columns: rows.length > 0 ? Object.keys(rows[0]) : [],
    registeredAt: new Date().toISOString()
  };
  
  // Store rows separately with dataset name as key
  const rowsKey = `${STORAGE_KEY}_rows_${name}`;
  try {
    localStorage.setItem(rowsKey, JSON.stringify(rows));
  } catch (error) {
    // Handle quota exceeded error
    if (error.name === 'QuotaExceededError') {
      throw new Error('Storage quota exceeded. Dataset is too large for localStorage. Try a smaller file.');
    }
    throw error;
  }
  
  if (existingIndex >= 0) {
    datasets[existingIndex] = dataset;
  } else {
    datasets.push(dataset);
  }
  
  saveDatasets(datasets);
  
  return { ...dataset, rows };
}

/**
 * Get dataset rows from localStorage
 * @param {string} name - Dataset name
 * @returns {Array} Array of row objects
 */
export function getDatasetRows(name) {
  try {
    const rowsKey = `${STORAGE_KEY}_rows_${name}`;
    const stored = localStorage.getItem(rowsKey);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading dataset rows:', error);
    return [];
  }
}

/**
 * Delete a dataset
 * @param {string} name - Dataset name
 */
export function deleteDataset(name) {
  const datasets = getDatasets();
  const filtered = datasets.filter(d => d.name !== name);
  saveDatasets(filtered);
  
  // Remove rows
  const rowsKey = `${STORAGE_KEY}_rows_${name}`;
  localStorage.removeItem(rowsKey);
}

/**
 * Auto-register demo datasets if no datasets exist
 * @returns {Promise<void>}
 */
export async function autoRegisterDemoDatasets() {
  const datasets = getDatasets();
  
  if (datasets.length === 0) {
    console.log('No datasets found. Registering demo datasets...');
    
    for (const demo of DEMO_DATASETS) {
      try {
        await registerDataset(demo.name, demo.url);
        console.log(`Registered demo dataset: ${demo.name}`);
      } catch (error) {
        console.error(`Failed to register demo dataset ${demo.name}:`, error);
      }
    }
  }
}
