# Dataset Management

## What You'll Learn

This guide covers:
- Dataset registration and management
- Storage limits and strategies
- Demo gallery mechanics (NYS Open Data)
- Handling large datasets with sampling and paging
- Caching strategies
- Common failure modes and solutions

## Dataset Registration

### Basic Registration

ChartSpec supports two types of datasets:

#### 1. Local CSV Files

Place CSV files in the `datasets/` directory:

```
datasets/
├── sample-sales.csv
├── sample-weather.csv
└── my-custom-data.csv
```

Register with relative path:

```
Name: My Custom Data
URL: ./datasets/my-custom-data.csv
```

#### 2. Remote CSV Files

Use any publicly accessible CSV URL:

```
Name: Remote Sales Data
URL: https://example.com/data/sales.csv
```

**Requirements:**
- URL must be accessible from the browser (CORS-enabled)
- First row must contain column headers
- Values must be comma-separated
- No special characters in headers (use alphanumeric and underscores)

### CSV Format Requirements

**Valid CSV:**
```csv
Date,Region,Product,Quantity,Revenue
2024-01-15,North,Widget A,120,2400
2024-01-15,South,Widget B,85,1700
2024-01-16,East,Widget C,95,1900
```

**Header Rules:**
- Use alphanumeric characters and underscores only
- No spaces (use underscores: `Sales_Region` not `Sales Region`)
- Case-sensitive (ChartSpec uses exact column names)
- Unique names (no duplicate column names)

**Value Rules:**
- Comma-separated (use quotes for values containing commas)
- Consistent types per column
- Dates in ISO format (YYYY-MM-DD) or common formats
- Numbers without currency symbols or thousands separators

### Auto-Loaded Demo Datasets

ChartSpec automatically registers two demo datasets on first load:

#### Sample Sales
- **File:** `datasets/sample-sales.csv`
- **Rows:** 20
- **Columns:** Date, Region, Product, Quantity, Revenue
- **Use cases:** Sales analysis, regional comparisons, product performance

#### Sample Weather
- **File:** `datasets/sample-weather.csv`
- **Rows:** 20
- **Columns:** Date, City, Temperature, Humidity, Precipitation
- **Use cases:** Weather trends, city comparisons, climate analysis

These datasets are perfect for learning ChartSpec without adding your own data.

## Storage Limits and Strategies

### localStorage (Classic UI)

**Storage mechanism:** Browser localStorage API  
**Typical limit:** 5-10MB across all stored data  
**What's stored:** Dataset metadata + full CSV data  
**Scope:** Per origin (domain)

**Recommendations:**
- Keep CSV files under 1MB for best performance
- Monitor usage with `localStorage.length`
- Clear old datasets regularly

**Example storage usage:**
```javascript
// Check how much space datasets are using
const datasetKeys = Object.keys(localStorage).filter(k => k.startsWith('dataset_'));
const totalSize = datasetKeys.reduce((sum, key) => {
  return sum + localStorage.getItem(key).length;
}, 0);
console.log(`Datasets using ~${(totalSize / 1024 / 1024).toFixed(2)} MB`);
```

### IndexedDB (Workbench UI)

**Storage mechanism:** Browser IndexedDB API  
**Typical limit:** 50MB+ (varies by browser)  
**What's stored:** Dataset samples, cache, larger datasets  
**Scope:** Per origin (domain)

**Recommendations:**
- Use Workbench for datasets >1MB
- Take advantage of 15-minute cache TTL
- Use sampling for very large datasets

**Workbench advantages:**
- Better performance with large datasets
- Structured storage with indexes
- Automatic cleanup of old cache entries
- Visual LED sampler for data control

## Demo Gallery Mechanics

### NYS Open Data Integration

ChartSpec Workbench includes a **Demo Gallery** that loads live data from New York State Open Data portal (Socrata).

**Available datasets:**
1. **Food Service Establishment Inspections** - Health inspection data
2. **Statewide Distributed Solar Projects** - Solar installation data
3. **Utility Energy Registry** - Monthly ZIP code energy use
4. **Motor Vehicle Crashes** - Crash case information

**Access:** Click "Demo Gallery" in the Workbench command bar.

### Data Size Presets

The gallery provides three data size options:

#### Chart-Ready Aggregate (Default)
- **Rows:** ≤1,000
- **Purpose:** Pre-aggregated data ready for charting
- **SoQL:** Custom aggregation queries (e.g., `SELECT county, COUNT(*) GROUP BY county`)
- **Use case:** Quick charts without data prep

#### Quick Sample
- **Rows:** ≤1,000
- **Purpose:** Raw data sample for exploration
- **SoQL:** `LIMIT 1000`
- **Use case:** Exploring data structure and columns

#### Raw Rows (Paged)
- **Rows:** Variable (limit enforced)
- **Purpose:** Larger data samples with paging
- **SoQL:** `LIMIT` with user-specified value
- **Use case:** More comprehensive analysis
- **Warning:** No full dataset pulls to avoid performance issues

### Freshness Presets

#### Live
- **Behavior:** Fetch data on every load
- **Use case:** Latest data for time-sensitive analysis
- **Performance:** Slower (network request each time)

#### Cached
- **Behavior:** Cache data with 15-minute TTL
- **Use case:** Repeated access to same dataset
- **Performance:** Faster (network request only when cache expires)
- **Refresh:** Manual refresh available in UI

### Adding Your Own Socrata Dataset

To add another NYS Open Data dataset:

1. Find dataset on [data.ny.gov](https://data.ny.gov)
2. Note the domain and dataset ID from URL
3. Edit `chartspec/demoDatasets.js`:

```javascript
export const demoDatasets = [
  // ... existing datasets ...
  {
    id: 'my-dataset',
    title: 'My Dataset Title',
    domain: 'data.ny.gov',
    datasetId: 'abcd-1234',
    tags: ['category', 'topic'],
    presets: {
      chartReady: {
        query: 'SELECT category, COUNT(*) as count GROUP BY category',
        limit: 1000
      },
      sample: {
        query: null,
        limit: 1000
      },
      raw: {
        query: null,
        limit: 5000
      }
    }
  }
];
```

4. Copy same changes to `docs/chartspec/demoDatasets.js` (sync requirement)

## Handling Large Datasets

### Sampling Strategies

For datasets larger than storage limits, use sampling:

#### 1. Random Sampling
```javascript
// Sample 10% of rows
const sampleRate = 0.1;
const sampledData = allRows.filter(() => Math.random() < sampleRate);
```

#### 2. Stratified Sampling
```javascript
// Sample evenly across categories
function stratifiedSample(rows, groupColumn, samplesPerGroup) {
  const groups = {};
  
  // Group rows
  rows.forEach(row => {
    const key = row[groupColumn];
    if (!groups[key]) groups[key] = [];
    groups[key].push(row);
  });
  
  // Sample from each group
  const sampled = [];
  Object.values(groups).forEach(group => {
    const shuffled = group.sort(() => Math.random() - 0.5);
    sampled.push(...shuffled.slice(0, samplesPerGroup));
  });
  
  return sampled;
}
```

#### 3. Top-N Sampling
```javascript
// Take top N rows after sorting
const topN = rows
  .sort((a, b) => parseFloat(b.Revenue) - parseFloat(a.Revenue))
  .slice(0, 1000);
```

### Paging Strategies

For very large datasets, implement paging:

#### Server-Side Paging (Recommended)
```javascript
async function loadPage(datasetUrl, page, pageSize) {
  const offset = page * pageSize;
  const url = `${datasetUrl}?$limit=${pageSize}&$offset=${offset}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  return data;
}

// Usage
const page1 = await loadPage('https://data.ny.gov/resource/xyz.json', 0, 1000);
const page2 = await loadPage('https://data.ny.gov/resource/xyz.json', 1, 1000);
```

#### Client-Side Paging
```javascript
// Load full dataset once, page in memory
function paginate(allRows, page, pageSize) {
  const start = page * pageSize;
  const end = start + pageSize;
  return allRows.slice(start, end);
}
```

### Aggregation Before Storage

For analytical use cases, aggregate data before storing:

```javascript
// Instead of storing all rows, store pre-aggregated summaries
function aggregateDataset(rows) {
  const summary = {};
  
  rows.forEach(row => {
    const region = row.Region;
    if (!summary[region]) {
      summary[region] = { region, totalRevenue: 0, count: 0 };
    }
    summary[region].totalRevenue += parseFloat(row.Revenue);
    summary[region].count++;
  });
  
  // Convert to array
  return Object.values(summary).map(s => ({
    Region: s.region,
    Revenue: s.totalRevenue,
    Count: s.count,
    AvgRevenue: s.totalRevenue / s.count
  }));
}

// Store aggregated data instead of raw data
const aggregated = aggregateDataset(largeDataset);
localStorage.setItem('dataset_summary', JSON.stringify(aggregated));
```

## Caching Strategies

### Simple Time-Based Cache (15-minute TTL)

```javascript
// Cache structure
const cache = {
  data: null,
  timestamp: null,
  ttl: 15 * 60 * 1000 // 15 minutes in milliseconds
};

function getCachedData(url) {
  const now = Date.now();
  
  // Check if cache is valid
  if (cache.data && cache.timestamp && (now - cache.timestamp < cache.ttl)) {
    console.log('Using cached data');
    return cache.data;
  }
  
  // Cache expired or empty
  return null;
}

function setCachedData(url, data) {
  cache.data = data;
  cache.timestamp = Date.now();
}

// Usage
async function loadDataset(url) {
  const cached = getCachedData(url);
  if (cached) return cached;
  
  const response = await fetch(url);
  const data = await response.json();
  
  setCachedData(url, data);
  return data;
}
```

### IndexedDB Cache (Workbench)

The Workbench uses IndexedDB for more sophisticated caching:

```javascript
// Store with timestamp
await idb.datasets.put({
  id: 'dataset-xyz',
  name: 'My Dataset',
  data: rows,
  cached_at: Date.now(),
  ttl: 15 * 60 * 1000
});

// Retrieve with TTL check
const dataset = await idb.datasets.get('dataset-xyz');
if (dataset && (Date.now() - dataset.cached_at < dataset.ttl)) {
  return dataset.data;
}
```

### Manual Cache Refresh

Allow users to force cache refresh:

```javascript
async function refreshDataset(datasetId) {
  // Clear cache
  await idb.datasets.delete(datasetId);
  
  // Re-fetch
  const data = await fetchDataset(datasetId);
  
  // Update cache
  await idb.datasets.put({
    id: datasetId,
    data: data,
    cached_at: Date.now()
  });
  
  return data;
}
```

## Dataset Operations

### Select Dataset
```javascript
// Classic UI
const datasetSelect = document.getElementById('dataset-select');
datasetSelect.value = 'sample-sales';
datasetSelect.dispatchEvent(new Event('change'));

// Workbench
store.setState({ selectedDataset: 'sample-sales' });
```

### Reload Dataset
```javascript
async function reloadDataset(datasetId) {
  // Get dataset metadata
  const meta = JSON.parse(localStorage.getItem(`dataset_${datasetId}_meta`));
  
  // Re-fetch from URL
  const response = await fetch(meta.url);
  const csvText = await response.text();
  
  // Re-parse CSV
  const rows = parseCSV(csvText);
  
  // Update storage
  localStorage.setItem(`dataset_${datasetId}`, JSON.stringify(rows));
  
  return rows;
}
```

### Delete Dataset
```javascript
function deleteDataset(datasetId) {
  // Remove metadata
  localStorage.removeItem(`dataset_${datasetId}_meta`);
  
  // Remove data
  localStorage.removeItem(`dataset_${datasetId}`);
  
  // Update registry
  const registry = JSON.parse(localStorage.getItem('dataset_registry') || '[]');
  const updated = registry.filter(d => d.id !== datasetId);
  localStorage.setItem('dataset_registry', JSON.stringify(updated));
}
```

## Failure Modes and Solutions

### Storage Quota Exceeded

**Symptom:** `QuotaExceededError` when registering dataset  
**Cause:** Dataset too large for localStorage (>5-10MB)

**Solutions:**
1. **Use Workbench:** Switch to Workbench UI with IndexedDB support
2. **Sample data:** Reduce dataset size before storing
3. **Delete old datasets:** Clear space by removing unused datasets
4. **Aggregate:** Pre-aggregate data to reduce row count
5. **Server-side:** Fetch data on-demand instead of storing

```javascript
try {
  localStorage.setItem(`dataset_${id}`, JSON.stringify(data));
} catch (e) {
  if (e.name === 'QuotaExceededError') {
    alert('Dataset too large for localStorage. Try using Workbench or sampling data.');
  }
}
```

### Invalid CSV Format

**Symptom:** Dataset fails to load, parsing errors  
**Cause:** Malformed CSV (missing headers, inconsistent columns, encoding issues)

**Solutions:**
1. **Validate headers:** Ensure first row has column names
2. **Check delimiters:** Must be comma-separated
3. **Escape commas:** Use quotes for values containing commas: `"New York, NY"`
4. **Encoding:** Use UTF-8 encoding
5. **Test small sample:** Try with first 10 rows to isolate issue

```javascript
function validateCSV(csvText) {
  const lines = csvText.trim().split('\n');
  
  if (lines.length < 2) {
    throw new Error('CSV must have at least header and one data row');
  }
  
  const headerCount = lines[0].split(',').length;
  
  for (let i = 1; i < lines.length; i++) {
    const colCount = lines[i].split(',').length;
    if (colCount !== headerCount) {
      throw new Error(`Row ${i + 1} has ${colCount} columns, expected ${headerCount}`);
    }
  }
  
  return true;
}
```

### CORS Errors

**Symptom:** Remote dataset fails to load, CORS policy error  
**Cause:** Remote server doesn't allow cross-origin requests

**Solutions:**
1. **Use CORS-enabled URLs:** Many open data portals support CORS
2. **Download and host locally:** Place CSV in `datasets/` directory
3. **Use proxy:** Set up CORS proxy (not recommended for production)
4. **Contact provider:** Ask data provider to enable CORS

### Missing Columns

**Symptom:** Chart doesn't render, "column not found" error  
**Cause:** ChartSpec references column not in dataset

**Solutions:**
1. **Check column names:** Use exact, case-sensitive column names
2. **List available columns:** Display dataset columns in UI
3. **Validate spec:** Check ChartSpec against dataset schema before rendering

```javascript
function validateSpecColumns(spec, datasetColumns) {
  const errors = [];
  
  if (spec.x && !datasetColumns.includes(spec.x)) {
    errors.push(`Column '${spec.x}' not found in dataset`);
  }
  
  if (spec.y && !datasetColumns.includes(spec.y)) {
    errors.push(`Column '${spec.y}' not found in dataset`);
  }
  
  // Check filters
  if (spec.filters) {
    spec.filters.forEach(f => {
      if (!datasetColumns.includes(f.column)) {
        errors.push(`Filter column '${f.column}' not found in dataset`);
      }
    });
  }
  
  return errors;
}
```

### Demo Gallery Load Failure

**Symptom:** Demo gallery dataset fails to load  
**Cause:** Network error, Socrata API limit, invalid query

**Solutions:**
1. **Check network:** Verify internet connection
2. **Try cached mode:** Use cached data if available
3. **Reduce limit:** Use smaller row limit
4. **Verify query:** Test SoQL query in Socrata API console
5. **Check API status:** Visit data.ny.gov status page

## Tips and Best Practices

1. **Start small:** Test with demo datasets before adding large custom data
2. **Use Workbench for large data:** IndexedDB handles larger datasets better
3. **Monitor storage:** Regularly check storage usage and clean up old datasets
4. **Cache wisely:** Use cached mode for static data, live mode for time-sensitive data
5. **Validate early:** Check CSV format and column names before registering
6. **Document datasets:** Add descriptions to help users understand data
7. **Use relative paths:** For local files, use `./datasets/` for portability
8. **Test CORS:** Verify remote URLs are accessible before sharing

## Next Steps

- **[Schema Guide](schema.md)** - Reference ChartSpec columns correctly
- **[Architecture Guide](architecture.md)** - Understand data pipeline
- **[Testing Guide](testing.md)** - Test custom datasets
- **[Back to Index](index.md)** - Documentation hub

---

**Navigation:** [← Back to Index](index.md) | [Schema →](schema.md) | [Testing →](testing.md)
