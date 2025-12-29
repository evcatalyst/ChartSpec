# ChartSpec Architecture

## What You'll Learn

This guide covers:
- The complete data pipeline: prompt → spec → transform → render
- Renderer abstraction layer and factory pattern
- How to add a new renderer safely
- Module structure and responsibilities
- Extension points for customization

## Architecture Overview

ChartSpec uses a modular, pipeline-based architecture with clear separation of concerns:

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────────┐
│   User      │───▶│  LLM Router  │───▶│    Data     │───▶│  Renderer    │
│  Prompt     │    │   / Smart    │    │   Engine    │    │   Factory    │
└─────────────┘    │    Parser    │    └─────────────┘    └──────────────┘
                   └──────────────┘                              │
                          │                                      │
                          ▼                                      ▼
                   ┌──────────────┐                      ┌──────────────┐
                   │  ChartSpec   │                      │   Plotly /   │
                   │     JSON     │                      │   D3 Chart   │
                   └──────────────┘                      └──────────────┘
```

## Pipeline Stages

### Stage 1: Prompt Processing

**Input:** Natural language prompt from user  
**Output:** ChartSpec JSON

**Three modes:**

#### LLM Mode (OpenAI/Grok)
```javascript
// llmRouter.js
async function generateChartSpec(prompt, dataset, provider, apiKey, model) {
  // 1. Build system prompt with schema and dataset info
  const systemPrompt = buildSystemPrompt(dataset);
  
  // 2. Call LLM API
  const response = await callLLMAPI(provider, {
    system: systemPrompt,
    user: prompt,
    model: model
  });
  
  // 3. Parse JSON from response
  const spec = JSON.parse(response);
  
  return spec;
}
```

#### Smart Mode (AVA + Local Parser)
```javascript
// smartMode.js
function parseSmartCommand(prompt, dataset) {
  // 1. Parse discrete command vocabulary
  const intent = parseIntent(prompt); // "show", "display", "create"
  const chartType = extractChartType(prompt); // "bar chart", "line chart"
  const column = extractColumn(prompt); // "Revenue", "Temperature"
  const groupBy = extractGroupBy(prompt); // "by Region"
  
  // 2. Use AVA to recommend chart type based on data
  const recommendation = AVA.autoChart(dataset, {
    fields: [column, groupBy],
    purpose: intent
  });
  
  // 3. Build ChartSpec JSON
  const spec = buildSpecFromIntent({
    chartType: chartType || recommendation.type,
    x: groupBy,
    y: column
  });
  
  return spec;
}
```

#### Local Mode (Manual JSON)
```javascript
// User directly provides ChartSpec JSON
const spec = JSON.parse(userInput);
```

### Stage 2: Data Transformation

**Input:** ChartSpec JSON + Raw dataset  
**Output:** Transformed data rows

**Transformation pipeline in `dataEngine.js`:**

```javascript
// dataEngine.js
function transformData(rows, spec) {
  let result = rows;
  
  // 1. Apply filters
  if (spec.filters && spec.filters.length > 0) {
    result = applyFilters(result, spec.filters);
  }
  
  // 2. Group and aggregate
  if (spec.groupBy) {
    result = groupByAgg(result, spec.groupBy);
  }
  
  // 3. Sort
  if (spec.sort) {
    result = sortData(result, spec.sort);
  }
  
  // 4. Limit
  if (spec.limit) {
    result = result.slice(0, spec.limit);
  }
  
  return result;
}
```

**Transformation details:**

#### 1. Filters (`applyFilters`)
```javascript
function applyFilters(rows, filters) {
  return rows.filter(row => {
    return filters.every(filter => {
      const value = row[filter.column];
      
      switch (filter.type) {
        case 'array':
          return filter.values.includes(value);
        case 'equality':
          return value === filter.value;
        case 'op':
          const numValue = parseFloat(value);
          const numTarget = parseFloat(filter.value);
          switch (filter.operator) {
            case '>': return numValue > numTarget;
            case '<': return numValue < numTarget;
            case '>=': return numValue >= numTarget;
            case '<=': return numValue <= numTarget;
            case '!=': return numValue !== numTarget;
          }
      }
    });
  });
}
```

#### 2. GroupBy and Aggregation (`groupByAgg`)
```javascript
function groupByAgg(rows, groupBySpec) {
  const { columns, aggregations } = groupBySpec;
  
  // Group rows by unique combinations of column values
  const groups = {};
  rows.forEach(row => {
    const key = columns.map(col => row[col]).join('|||');
    if (!groups[key]) {
      groups[key] = { rows: [], keyValues: {} };
      columns.forEach(col => groups[key].keyValues[col] = row[col]);
    }
    groups[key].rows.push(row);
  });
  
  // Apply aggregations to each group
  const result = [];
  Object.values(groups).forEach(group => {
    const aggregatedRow = { ...group.keyValues };
    
    Object.keys(aggregations).forEach(col => {
      const aggSpec = aggregations[col];
      const values = group.rows.map(r => parseFloat(r[col])).filter(v => !isNaN(v));
      
      switch (aggSpec.func) {
        case 'sum':
          aggregatedRow[col] = values.reduce((a, b) => a + b, 0);
          break;
        case 'mean':
          aggregatedRow[col] = values.reduce((a, b) => a + b, 0) / values.length;
          break;
        case 'count':
          aggregatedRow[col] = group.rows.length;
          break;
        case 'min':
          aggregatedRow[col] = Math.min(...values);
          break;
        case 'max':
          aggregatedRow[col] = Math.max(...values);
          break;
      }
    });
    
    result.push(aggregatedRow);
  });
  
  return result;
}
```

#### 3. Sort (`sortData`)
```javascript
function sortData(rows, sortSpec) {
  const { column, order } = sortSpec;
  
  return [...rows].sort((a, b) => {
    const aVal = parseFloat(a[column]) || a[column];
    const bVal = parseFloat(b[column]) || b[column];
    
    if (order === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });
}
```

### Stage 3: Rendering

**Input:** Transformed data + ChartSpec  
**Output:** Rendered visualization in DOM

**Renderer abstraction in `rendererFactory.js`:**

```javascript
// rendererFactory.js
class RendererFactory {
  constructor() {
    this.renderers = [];
  }
  
  register(renderer) {
    this.renderers.push(renderer);
  }
  
  getRenderer(chartType) {
    // Find first renderer that supports this chart type and is available
    for (const renderer of this.renderers) {
      if (renderer.supports(chartType) && renderer.isAvailable()) {
        return renderer;
      }
    }
    
    // Fallback to first available renderer
    return this.renderers.find(r => r.isAvailable());
  }
  
  async render(container, rows, spec) {
    const renderer = this.getRenderer(spec.chartType);
    
    if (!renderer) {
      throw new Error('No renderer available');
    }
    
    // Validate spec for this renderer
    const validation = renderer.validate(spec);
    if (!validation.valid) {
      throw new Error(`Invalid spec: ${validation.errors.join(', ')}`);
    }
    
    // Render
    await renderer.renderChart(container, rows, spec);
  }
}
```

## Renderer Abstraction

### BaseRenderer Interface

All renderers must extend `BaseRenderer` and implement these methods:

```javascript
// rendererFactory.js
class BaseRenderer {
  getName() {
    // Return renderer name (e.g., "Plotly", "D3")
    throw new Error('getName() must be implemented');
  }
  
  supports(chartType) {
    // Return true if this renderer supports the chart type
    throw new Error('supports() must be implemented');
  }
  
  validate(spec) {
    // Return { valid: boolean, errors: string[] }
    throw new Error('validate() must be implemented');
  }
  
  isAvailable() {
    // Return true if renderer library is loaded
    throw new Error('isAvailable() must be implemented');
  }
  
  async renderSingleChart(container, rows, spec, facetValue) {
    // Render a single chart to the container
    throw new Error('renderSingleChart() must be implemented');
  }
  
  async renderChart(container, rows, spec) {
    // Handle faceting and call renderSingleChart
    // Default implementation provided in BaseRenderer
  }
}
```

### PlotlyRenderer Implementation

```javascript
// renderers/PlotlyRenderer.js
class PlotlyRenderer extends BaseRenderer {
  getName() {
    return 'Plotly';
  }
  
  supports(chartType) {
    const supported = ['bar', 'line', 'scatter', 'pie', 'histogram', 
                       'box', 'heatmap', 'table', 'tableOnly'];
    return supported.includes(chartType);
  }
  
  isAvailable() {
    return typeof Plotly !== 'undefined';
  }
  
  validate(spec) {
    const errors = [];
    
    if (!spec.chartType) {
      errors.push('chartType is required');
    }
    
    if (!this.supports(spec.chartType)) {
      errors.push(`Unsupported chart type: ${spec.chartType}`);
    }
    
    // Check for required fields based on chart type
    if (spec.chartType !== 'tableOnly' && !spec.x) {
      errors.push('x field is required');
    }
    
    if (spec.chartType !== 'tableOnly' && !spec.y) {
      errors.push('y field is required');
    }
    
    return { valid: errors.length === 0, errors };
  }
  
  async renderSingleChart(container, rows, spec, facetValue) {
    // Build Plotly data structure
    const data = this.buildPlotlyData(rows, spec);
    
    // Build layout
    const layout = {
      title: facetValue ? `${spec.title} - ${facetValue}` : spec.title,
      ...spec.layout
    };
    
    // Render with Plotly
    await Plotly.newPlot(container, data, layout, spec.config);
  }
  
  buildPlotlyData(rows, spec) {
    // Convert ChartSpec to Plotly trace format
    // Implementation varies by chart type
    switch (spec.chartType) {
      case 'bar':
        return [{
          type: 'bar',
          x: rows.map(r => r[spec.x]),
          y: rows.map(r => r[spec.y]),
          marker: { color: spec.color ? rows.map(r => r[spec.color]) : undefined }
        }];
      
      case 'line':
        // ... line chart logic
        
      // ... other chart types
    }
  }
}
```

### D3Renderer Implementation (Skeleton)

```javascript
// renderers/D3Renderer.js
class D3Renderer extends BaseRenderer {
  getName() {
    return 'D3';
  }
  
  supports(chartType) {
    // Currently limited support
    return ['bar', 'line', 'scatter'].includes(chartType);
  }
  
  isAvailable() {
    return typeof d3 !== 'undefined';
  }
  
  validate(spec) {
    // Similar to PlotlyRenderer
  }
  
  async renderSingleChart(container, rows, spec, facetValue) {
    // D3-based rendering
    const svg = d3.select(container).append('svg');
    
    // ... D3 chart construction
  }
}
```

## Adding a New Renderer

Follow these steps to safely add a new renderer:

### 1. Create Renderer Class

Create a new file in `chartspec/renderers/`:

```javascript
// chartspec/renderers/MyRenderer.js
import { BaseRenderer } from '../rendererFactory.js';

export class MyRenderer extends BaseRenderer {
  getName() {
    return 'MyRenderer';
  }
  
  supports(chartType) {
    // List supported chart types
    return ['bar', 'line'].includes(chartType);
  }
  
  isAvailable() {
    // Check if your library is loaded
    return typeof window.MyChartLib !== 'undefined';
  }
  
  validate(spec) {
    const errors = [];
    
    // Add validation logic
    if (!spec.chartType) {
      errors.push('chartType is required');
    }
    
    if (!this.supports(spec.chartType)) {
      errors.push(`Unsupported chart type: ${spec.chartType}`);
    }
    
    // Add field validation based on chart type
    
    return { valid: errors.length === 0, errors };
  }
  
  async renderSingleChart(container, rows, spec, facetValue) {
    // Clear container
    container.innerHTML = '';
    
    // Build your chart library's data structure
    const chartData = this.buildChartData(rows, spec);
    
    // Create chart
    const chart = new window.MyChartLib.Chart(container, {
      type: spec.chartType,
      data: chartData,
      options: {
        title: facetValue ? `${spec.title} - ${facetValue}` : spec.title
      }
    });
    
    // Render
    await chart.render();
  }
  
  buildChartData(rows, spec) {
    // Convert ChartSpec format to your library's format
    return {
      labels: rows.map(r => r[spec.x]),
      datasets: [{
        data: rows.map(r => r[spec.y])
      }]
    };
  }
}
```

### 2. Load Library

Add your chart library to HTML:

```html
<!-- index.html -->
<script src="https://cdn.example.com/my-chart-lib.min.js"></script>
```

### 3. Register Renderer

Register your renderer in the main application:

```javascript
// chartspec/main.js
import { RendererFactory } from './rendererFactory.js';
import { PlotlyRenderer } from './renderers/PlotlyRenderer.js';
import { D3Renderer } from './renderers/D3Renderer.js';
import { MyRenderer } from './renderers/MyRenderer.js';

// Create factory
const rendererFactory = new RendererFactory();

// Register renderers (order matters - first available wins)
rendererFactory.register(new MyRenderer());    // Try this first
rendererFactory.register(new PlotlyRenderer()); // Fallback to Plotly
rendererFactory.register(new D3Renderer());     // Last resort

// Use in render function
async function renderChart(container, rows, spec) {
  await rendererFactory.render(container, rows, spec);
}
```

### 4. Test Thoroughly

Create test specs for all supported chart types:

```javascript
// Test basic rendering
const testSpec = {
  chartType: 'bar',
  x: 'Region',
  y: 'Revenue'
};

await rendererFactory.render(container, testData, testSpec);

// Test validation
const renderer = rendererFactory.getRenderer('bar');
const validation = renderer.validate(testSpec);
console.assert(validation.valid, 'Spec should be valid');

// Test failure modes
const invalidSpec = { chartType: 'unknown' };
const invalidValidation = renderer.validate(invalidSpec);
console.assert(!invalidValidation.valid, 'Should reject invalid spec');
```

### 5. Update Documentation

Add your renderer to this documentation and the README.

## Module Structure

```
chartspec/
├── chartSpec.js           # Schema definition and defaults
├── dataEngine.js          # Data transformation pipeline
├── datasetRegistry.js     # Dataset storage and management
├── llmRouter.js           # LLM API integration (OpenAI/Grok)
├── smartMode.js           # Smart Mode parser and AVA integration
├── tokenCounter.js        # Token estimation for LLM calls
├── rendererFactory.js     # Renderer abstraction and factory
├── renderers/
│   ├── PlotlyRenderer.js  # Plotly.js implementation
│   └── D3Renderer.js      # D3.js implementation
└── main.js                # Application orchestration
```

### Module Responsibilities

#### chartSpec.js
- Defines the ChartSpec schema
- Provides default spec and samples
- Lists valid chart types

#### dataEngine.js
- Filters data (array, equality, operator)
- Groups and aggregates
- Sorts and limits
- Pure functions, no side effects

#### datasetRegistry.js
- Loads CSV files
- Stores datasets in localStorage
- Manages dataset metadata
- Handles reload and delete operations

#### llmRouter.js
- Builds system prompts
- Calls OpenAI/Grok APIs
- Parses JSON responses
- Handles errors and retries

#### smartMode.js
- Parses discrete command vocabulary
- Integrates with AVA for recommendations
- Builds ChartSpec from parsed intent
- No external API calls

#### tokenCounter.js
- Estimates token usage for prompts
- Tracks system, user, spec, response tokens
- Provides warnings for limits
- Provider-specific counting

#### rendererFactory.js
- Manages renderer registry
- Selects appropriate renderer
- Validates specs
- Handles fallback

#### main.js
- Initializes application
- Wires up event handlers
- Coordinates modules
- Manages UI state

## Extension Points

### Adding New LLM Providers

Edit `llmRouter.js`:

```javascript
async function callLLMAPI(provider, options) {
  switch (provider) {
    case 'openai':
      return await callOpenAI(options);
    case 'grok':
      return await callGrok(options);
    case 'my-provider':
      return await callMyProvider(options);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

async function callMyProvider(options) {
  const response = await fetch('https://api.myprovider.com/v1/chat', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${options.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: options.system },
        { role: 'user', content: options.user }
      ],
      model: options.model
    })
  });
  
  const data = await response.json();
  return data.choices[0].message.content;
}
```

### Adding New Aggregation Functions

Edit `dataEngine.js`:

```javascript
export function groupByAgg(rows, groupBySpec) {
  // ... existing code ...
  
  switch (aggSpec.func) {
    case 'sum':
      aggregatedRow[col] = values.reduce((a, b) => a + b, 0);
      break;
    case 'median':
      values.sort((a, b) => a - b);
      const mid = Math.floor(values.length / 2);
      aggregatedRow[col] = values.length % 2 === 0
        ? (values[mid - 1] + values[mid]) / 2
        : values[mid];
      break;
    // ... other functions ...
  }
}
```

### Adding New Filter Types

Edit `dataEngine.js`:

```javascript
export function applyFilters(rows, filters) {
  return rows.filter(row => {
    return filters.every(filter => {
      const value = row[filter.column];
      
      switch (filter.type) {
        case 'regex':
          return new RegExp(filter.pattern).test(value);
        case 'range':
          return value >= filter.min && value <= filter.max;
        // ... existing types ...
      }
    });
  });
}
```

## Performance Considerations

### Data Size Limits
- **localStorage:** ~5-10MB total
- **IndexedDB (Workbench):** Much larger, typically 50MB+
- **Recommendation:** Sample large datasets before storing

### Rendering Performance
- **Large datasets (>10k rows):** Consider aggregation before rendering
- **Faceting:** Each facet creates a new chart - limit facet cardinality
- **DOM updates:** Use virtual DOM or batch updates for better performance

### LLM API Calls
- **Token limits:** Track with `tokenCounter.js`
- **Cost optimization:** Use cheaper models (gpt-4o-mini) for simple queries
- **Caching:** Smart Mode avoids API calls entirely

## Next Steps

- **[Schema Guide](schema.md)** - Detailed ChartSpec field reference
- **[Testing Guide](testing.md)** - Test your extensions
- **[Deployment Guide](deployment.md)** - Deploy your customized version
- **[Back to Index](index.md)** - Documentation hub

---

**Navigation:** [← Back to Index](index.md) | [Schema →](schema.md) | [Datasets →](datasets.md)
