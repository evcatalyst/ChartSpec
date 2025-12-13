# ChartSpec Workbench - Storage Schema

## Overview

ChartSpec Workbench uses two storage mechanisms:
- **localStorage**: UI state, preferences, small metadata
- **IndexedDB**: Large datasets, cached samples

## localStorage Keys

All localStorage keys use the prefix `chartspec_workbench_` to avoid conflicts.

### UI State Keys

#### `chartspec_workbench_drawer_open`
- **Type**: Boolean
- **Default**: `true`
- **Description**: Chat drawer visibility state
- **Example**: `true`

#### `chartspec_workbench_drawer_width`
- **Type**: Number (pixels)
- **Default**: `384`
- **Description**: Chat drawer width
- **Range**: 320-640px
- **Example**: `400`

#### `chartspec_workbench_presentation_mode`
- **Type**: Boolean
- **Default**: `false`
- **Description**: Presentation mode (hides chrome)
- **Example**: `false`

#### `chartspec_workbench_layout_preset`
- **Type**: String
- **Default**: `'default'`
- **Description**: Current grid layout preset
- **Options**: `'default'`, `'single'`, `'2up'`, `'dashboard'`
- **Example**: `"2up"`

#### `chartspec_workbench_grid_layout`
- **Type**: JSON Array
- **Default**: `null`
- **Description**: Gridstack layout state
- **Example**:
```json
[
  {"x": 0, "y": 0, "w": 6, "h": 4, "id": "tile-123"},
  {"x": 6, "y": 0, "w": 6, "h": 4, "id": "tile-456"}
]
```

### Settings Keys

#### `chartspec_workbench_provider`
- **Type**: String
- **Default**: `'openai'`
- **Description**: LLM provider selection
- **Options**: `'openai'`, `'grok'`, `'local'`
- **Example**: `"openai"`

#### `chartspec_workbench_api_key`
- **Type**: String
- **Default**: `''`
- **Description**: API key for LLM provider (encrypted by browser)
- **Security**: Never log or display in plain text
- **Example**: `"sk-..."`

#### `chartspec_workbench_local_mode`
- **Type**: Boolean
- **Default**: `false`
- **Description**: Manual ChartSpec JSON mode
- **Example**: `false`

#### `chartspec_workbench_smart_mode`
- **Type**: Boolean
- **Default**: `false`
- **Description**: AVA + language parser mode
- **Example**: `true`

#### `chartspec_workbench_sampling_preset`
- **Type**: String
- **Default**: `'10'`
- **Description**: Data sampling percentage
- **Options**: `'1'`, `'5'`, `'10'`, `'20'`, `'50'`, `'100'`
- **Example**: `"20"`

### Dataset Keys

#### `chartspec_workbench_selected_dataset`
- **Type**: String
- **Default**: `null`
- **Description**: Currently selected dataset name
- **Example**: `"Sample Sales"`

### Theme Keys

#### `chartspec_workbench_theme`
- **Type**: String
- **Default**: `'dark'`
- **Description**: Color theme
- **Options**: `'dark'`, `'light'`
- **Example**: `"dark"`

### Tile Keys

#### `chartspec_workbench_tiles`
- **Type**: JSON Array
- **Default**: `[]`
- **Description**: Array of tile configurations
- **Example**:
```json
[
  {
    "id": "tile-1234567890",
    "type": "chart",
    "title": "Revenue by Region",
    "x": 0,
    "y": 0,
    "w": 6,
    "h": 4,
    "config": {},
    "data": {
      "spec": {...},
      "rows": [...]
    }
  }
]
```

#### `chartspec_workbench_active_tile`
- **Type**: String
- **Default**: `null`
- **Description**: ID of currently active/selected tile
- **Example**: `"tile-1234567890"`

### Version Keys

#### `chartspec_workbench_version`
- **Type**: Number
- **Default**: `1`
- **Description**: Storage schema version for migrations
- **Example**: `1`

## localStorage Size Limits

### Browser Limits
- **Typical**: 5-10 MB per origin
- **Safari**: ~5 MB
- **Chrome/Edge**: ~10 MB
- **Firefox**: ~10 MB

### Mitigation Strategies
1. **Large data → IndexedDB**: Datasets, samples, large tile data
2. **Compression**: JSON.stringify with minimal whitespace
3. **Cleanup**: Remove old/unused data periodically
4. **Warnings**: Display storage usage warnings at 80%

### Checking Storage Usage

```javascript
import { getStorageInfo } from './state/persistence.js';

const info = getStorageInfo();
console.log(`Used: ${info.totalSizeKB} KB / ~5 MB`);
```

## IndexedDB Schema

### Database Name
`chartspec`

### Database Version
`1`

### Object Stores

#### `datasets` Store
Primary store for dataset storage.

**Schema**:
```javascript
{
  name: String,        // Primary key
  url: String,         // Original CSV URL
  rows: Array,         // Parsed data rows
  columns: Array,      // Column names
  rowCount: Number,    // Total row count
  timestamp: Number    // Last updated timestamp
}
```

**Indexes**:
- `url`: For finding datasets by URL
- `timestamp`: For sorting by recency

**Example**:
```javascript
{
  name: "Sample Sales",
  url: "./datasets/sample-sales.csv",
  rows: [
    {"Date": "2024-01-01", "Region": "North", "Revenue": 1500},
    ...
  ],
  columns: ["Date", "Region", "Product", "Quantity", "Revenue"],
  rowCount: 20,
  timestamp: 1702425600000
}
```

#### `samples` Store
Cached data samples for LLM requests.

**Schema**:
```javascript
{
  id: String,           // Primary key: datasetName_sampleSize
  datasetName: String,  // Dataset reference
  sampleSize: Number,   // Number of rows sampled
  rows: Array,          // Sampled rows
  timestamp: Number     // Cache timestamp
}
```

**Indexes**:
- `datasetName`: For finding samples by dataset
- `sampleSize`: For finding samples by size

**Example**:
```javascript
{
  id: "Sample Sales_10",
  datasetName: "Sample Sales",
  sampleSize: 10,
  rows: [...], // First 10 rows
  timestamp: 1702425600000
}
```

#### `cache` Store
General-purpose cache for API responses, computations, etc.

**Schema**:
```javascript
{
  key: String,      // Primary key
  value: Any,       // Cached value
  timestamp: Number // Cache timestamp
}
```

**Example**:
```javascript
{
  key: "ava_recommendation_Sample Sales_bar",
  value: {
    chartType: "bar",
    reasoning: "Categorical comparison best shown with bar chart",
    confidence: 0.95
  },
  timestamp: 1702425600000
}
```

## IndexedDB Size Limits

### Browser Quotas
Modern browsers provide generous storage:
- **Chrome/Edge**: 60% of available disk space
- **Firefox**: 50% of available disk space  
- **Safari**: ~1 GB initial, can request more

### Checking Quota

```javascript
import { getDBSize } from './state/idb.js';

const size = await getDBSize();
console.log(`Used: ${size.usageMB} MB / ${size.quotaMB} MB`);
console.log(`${size.percentUsed}% used`);
```

### Cleanup Strategy

When approaching quota limits:
1. Delete old cached samples
2. Remove unused datasets
3. Compress data rows (remove unnecessary fields)
4. Prompt user to manage storage

## Migration Strategy

### Version 0 → Version 1

Migrates from old ChartSpec localStorage to new Workbench structure.

**Old Keys** (ChartSpec v0.2):
```
chartspec_provider
chartspec_apikey
chartspec_localmode
chartspec_smartmode
chartspec_datasets (large JSON array)
```

**Migration Steps**:
1. Copy settings to new keys with prefix
2. Move datasets from localStorage to IndexedDB
3. Set version to 1
4. Optional: Clean up old keys

**Code**:
```javascript
// Handled automatically by persistence.js
import { checkVersion } from './state/persistence.js';
checkVersion(); // Runs migration if needed
```

### Future Migrations

When schema changes, increment version and add migration logic:

```javascript
// persistence.js
function migrateStorage(fromVersion, toVersion) {
  if (fromVersion === 1 && toVersion === 2) {
    // Example: Add new field to tiles
    const tiles = load(STORAGE_KEYS.TILES, []);
    const updatedTiles = tiles.map(tile => ({
      ...tile,
      newField: 'defaultValue'
    }));
    save(STORAGE_KEYS.TILES, updatedTiles);
  }
}
```

## Security Considerations

### API Keys
- **Storage**: localStorage (browser-encrypted)
- **Transmission**: Only to selected LLM provider over HTTPS
- **Best Practice**: Use environment variables or secure vaults in production
- **Clearing**: Provide "Clear API Key" button in settings

### Data Privacy
- **Scope**: All data scoped to origin (same-origin policy)
- **Encryption**: Browser-level encryption for localStorage
- **Transmission**: No data sent to external servers except LLM API calls

### Content Security Policy
Recommended CSP headers for production:

```
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' https://cdn.jsdelivr.net https://d3js.org https://unpkg.com;
  style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;
  connect-src 'self' https://api.openai.com https://api.x.ai;
  img-src 'self' data:;
```

## Backup & Export

### Export Workspace

```javascript
function exportWorkspace() {
  const state = store.getState();
  const datasets = await idb.getAllDatasets();
  
  const workspace = {
    version: 1,
    exportedAt: Date.now(),
    state,
    datasets
  };
  
  const blob = new Blob([JSON.stringify(workspace, null, 2)], {
    type: 'application/json'
  });
  
  // Download as file
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `chartspec-workspace-${Date.now()}.json`;
  a.click();
}
```

### Import Workspace

```javascript
async function importWorkspace(file) {
  const text = await file.text();
  const workspace = JSON.parse(text);
  
  // Restore state
  store.setState(workspace.state);
  
  // Restore datasets
  for (const dataset of workspace.datasets) {
    await idb.saveDataset(dataset);
  }
  
  // Refresh UI
  location.reload();
}
```

## Maintenance Operations

### Clear All Data

```javascript
import { clearAll } from './state/persistence.js';
import { clearAllData } from './state/idb.js';

// Clear localStorage
clearAll();

// Clear IndexedDB
await clearAllData();

// Reload
location.reload();
```

### Reset to Defaults

```javascript
// Clear storage
await clearAll();
await clearAllData();

// Reload (will initialize with defaults)
location.reload();
```

### Compact Database

```javascript
// Delete old samples
const samples = await idb.getAllSamples();
const oldSamples = samples.filter(s => {
  const age = Date.now() - s.timestamp;
  return age > 7 * 24 * 60 * 60 * 1000; // Older than 7 days
});

for (const sample of oldSamples) {
  await idb.deleteSample(sample.id);
}
```

## Monitoring & Debugging

### Storage Events

Listen for storage changes:

```javascript
window.addEventListener('storage', (e) => {
  console.log('Storage changed:', e.key, e.newValue);
});
```

### Debug Mode

Enable debug logging:

```javascript
// In browser console
localStorage.setItem('chartspec_debug', 'true');
location.reload();
```

### Inspect Storage

```javascript
// In browser console
console.log('State:', window.chartSpecWorkbench.store.getState());
console.log('Storage:', await window.chartSpecWorkbench.persistence.getStorageInfo());
console.log('DB Size:', await window.chartSpecWorkbench.idb.getDBSize());
```

## Performance Tips

### Minimize Writes
- Batch state updates when possible
- Use debouncing for frequent changes
- Only persist changed values

### Optimize Reads
- Cache frequently accessed data in memory
- Use indexes for IDB queries
- Lazy-load large datasets

### Storage Quota Management
- Monitor usage regularly
- Implement cleanup policies
- Warn users before hitting limits
- Provide manual cleanup tools
