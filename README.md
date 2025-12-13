# ChartSpec

AI-powered data visualization assistant for browser-based chart creation. ChartSpec uses LLMs (OpenAI/Grok) to generate chart specifications from natural language, then renders them with multiple visualization libraries.

**🚀 [Try ChartSpec Live](https://evcatalyst.github.io/ChartSpec/)** - No installation required!

## 🆕 NEW: Workbench UI

**Try the new full-screen Workbench**: [`workbench.html`](https://evcatalyst.github.io/ChartSpec/workbench.html)

ChartSpec Workbench is a redesigned full-screen visualization workspace optimized for data exploration:

- **🎛️ Tile-Based Workspace**: Multiple charts, tables, and inspectors simultaneously
- **🔀 Draggable Grid**: Rearrange and resize tiles freely
- **💬 Collapsible Chat**: Side drawer that can be hidden (Ctrl+B)
- **🎨 Layout Presets**: Quick layouts (single, 2-up, dashboard)
- **📊 LED Sampler**: Visual data sampling control
- **🗄️ IndexedDB Storage**: Better performance for large datasets
- **⌨️ Keyboard Shortcuts**: Ctrl+B (toggle chat), Ctrl+P (presentation mode), ESC (close)

The classic UI remains available at [`index.html`](https://evcatalyst.github.io/ChartSpec/) for backward compatibility.

**Documentation**: See [UI Architecture](docs/ui-architecture.md), [Storage Schema](docs/storage-schema.md), and [Migration Plan](docs/migration-plan.md).

## Features

- 🎨 **Natural Language Charting**: Describe your desired visualization in plain English
- 🧠 **Smart Mode (NEW)**: API-less demo with AVA-powered chart selection and local language parser
- 📊 **Multiple Chart Types**: Bar, line, scatter, pie, histogram, box plots, heatmaps, and tables
- 🔄 **Data Transformations**: Filters, grouping, aggregations, sorting, and limiting
- 📱 **Mobile-First Design**: Responsive layout that works on all devices
- 💾 **Browser-Based**: No server required - runs entirely in your browser
- 🔌 **Multiple LLM Providers**: Support for OpenAI and Grok (X.AI)
- 🤖 **Local LLM Support** *(Evaluated)*: Browser-based AI with transformers.js (see [evaluation docs](docs/LOCAL_LLM_EVALUATION.md))
- 📁 **Dataset Management**: Upload and manage CSV datasets locally
- 🎯 **Faceted Charts**: Create small multiples for data comparison
- 🔧 **Renderer Abstraction**: Support for multiple visualization libraries (Plotly, D3)
- 📊 **Token Estimation**: Real-time token usage tracking to optimize LLM costs

## Getting Started

### 1. Open the Application

**🌐 Option A: Use the Live Site** (Recommended)
- Visit **[https://evcatalyst.github.io/ChartSpec/](https://evcatalyst.github.io/ChartSpec/)**
- No installation or setup required
- Works on any modern browser

**💻 Option B: Run Locally**
- Clone or download this repository
- Open `index.html` in a modern web browser

**🚀 Option C: Deploy Your Own**
- Fork this repository
- Deploy to GitHub Pages (see deployment section below)
- Access via your GitHub Pages URL

### 2. Choose Your Mode

ChartSpec offers three modes of operation:

#### 🤖 LLM Mode (Default)
Full AI-powered natural language processing using OpenAI or Grok:
1. Select your LLM provider (OpenAI or Grok)
2. Enter your API key in the settings panel
3. Optionally select a specific model (or use the provider default)
4. **Important**: API keys are stored in browser localStorage only - never commit them to repositories

**Getting API Keys:**
- **OpenAI**: https://platform.openai.com/api-keys
- **Grok**: https://console.x.ai/

**Default Models:**
- **OpenAI**: `gpt-4o-mini` (cost-effective, recommended)
- **Grok**: `grok-3` (replaces deprecated `grok-beta`)

**Note**: The `grok-beta` model has been deprecated by X.AI. If you encounter errors about model availability, use `grok-3` or other current models instead.

**Token Estimation:**
- ChartSpec displays real-time token usage estimates
- See breakdown of system prompt, your message, and response tokens
- Get warnings when approaching token limits
- Helps optimize costs and stay within model limits

#### 🧠 Smart Mode (NEW - API-less)
Intelligent chart creation without API keys using AVA and local language parsing:
1. Check the "Smart Mode (AVA-Powered)" checkbox in LLM Settings
2. Use discrete vocabulary commands (click "View Commands" for help)
3. Get instant chart recommendations powered by AVA (AntV)
4. See real-time command suggestions as you type

**Benefits:**
- ✅ No API key required - completely free
- ✅ Instant responses - no network latency
- ✅ Privacy-first - all processing in-browser
- ✅ Intelligent recommendations via AVA
- ✅ Perfect for demos and learning

**Example Commands:**
- `show bar chart of Revenue by Region`
- `display line chart of Temperature`
- `show pie chart grouped by Product`
- `show top 10 by Revenue descending`

📖 **Full documentation**: See [docs/SMART_MODE.md](docs/SMART_MODE.md) for complete vocabulary and usage guide.

#### 📝 Local Mode
Manual ChartSpec JSON editing for advanced users:
1. Check the "Local Mode (No LLM)" checkbox
2. Edit the ChartSpec JSON directly in the textarea
3. Click "Apply ChartSpec" to render

**Best for:**
- Precise control over chart specifications
- Learning the ChartSpec schema
- Debugging and testing

#### 💻 Local Model workflow (Workbench)
- Selecting **Local** in the Workbench provider menu only updates preferences; it does **not** auto-download models.
- Use the **Load model** button in the chat drawer to start a Web Worker–backed download/warmup with progress and cancel controls.
- Warnings surface WebGPU/storage checks and any errors in the in-app System Messages panel (plus console).
- A lightweight stub loader runs when `window.__TEST_MODE__` is set, avoiding large downloads in CI while still exercising the UI.

### 3. Load a Dataset

**Use Demo Datasets:**
The app comes with two demo datasets that are automatically registered on first load:
- **Sample Sales**: Sales data with Date, Region, Product, Quantity, and Revenue
- **Sample Weather**: Weather data with Date, City, Temperature, Humidity, and Precipitation

**Add Your Own Dataset:**
1. Click "Add Dataset"
2. Provide a name and CSV URL (relative or absolute)
3. Click "Register"

**CSV Format Requirements:**
- First row must contain column headers
- Values should be comma-separated
- No special characters in headers (use alphanumeric and underscores)

### 4. Create Visualizations

1. Select a dataset from the dropdown
2. Type your request in the chat box (e.g., "Show revenue by region as a bar chart")
3. Press Send or Enter
4. The AI will generate a chart specification and render it

**Example Requests:**
- "Create a bar chart of revenue by region"
- "Show temperature trends over time as a line chart"
- "Display a pie chart of product sales distribution"
- "Make a scatter plot of temperature vs humidity, colored by city"
- "Group sales by region and show total revenue"

## Dataset Management

### Adding Datasets

You can add datasets in two ways:

1. **Local CSV files**: Place CSV files in the `datasets/` directory and reference them with relative paths:
   ```
   Name: My Data
   URL: ./datasets/mydata.csv
   ```

2. **Remote CSV files**: Use any publicly accessible CSV URL:
   ```
   Name: Remote Data
   URL: https://example.com/data.csv
   ```

### File Size Limitations

⚠️ **Important**: Browser localStorage has limitations:

- **Typical limit**: 5-10MB across all data
- **Recommendation**: Keep CSV files under 1MB for best performance
- **Large files**: May cause storage quota errors or slow performance

For production use with large datasets, consider:
- Server-side data processing
- Data sampling/filtering before import
- Using a backend API instead of localStorage

### Dataset Operations

- **Select**: Choose dataset from dropdown
- **Reload**: Re-fetch and update dataset from original URL
- **Delete**: Remove dataset and its data from localStorage

## Testing & Observability

- End-to-end coverage uses Playwright (`npm test`) with a built-in static server (`npm run serve`).
- CI and local tests enable `window.__TEST_MODE__` to use the stub local-model loader and D3 fallback renderer.
- All unhandled errors are echoed into the System Messages panel in the Workbench; clearing it does not affect console logs.

## Demo Datasets

The application includes two demo datasets in the `datasets/` folder:

### Sample Sales (`datasets/sample-sales.csv`)
- **Columns**: Date, Region, Product, Quantity, Revenue
- **Rows**: 20 entries
- **Use cases**: Sales analysis, regional comparisons, product performance

### Sample Weather (`datasets/sample-weather.csv`)
- **Columns**: Date, City, Temperature, Humidity, Precipitation
- **Rows**: 20 entries
- **Use cases**: Weather trends, city comparisons, climate analysis

These datasets are automatically registered when you first open the app.

## ChartSpec Schema

The LLM generates JSON specifications with the following structure:

```json
{
  "title": "Chart Title",
  "description": "Optional description",
  "filters": [
    { "type": "array", "column": "Region", "values": ["North", "South"] },
    { "type": "equality", "column": "Product", "value": "Widget A" },
    { "type": "op", "column": "Quantity", "operator": ">", "value": 100 }
  ],
  "groupBy": {
    "columns": ["Region"],
    "aggregations": {
      "Revenue": { "func": "sum" }
    }
  },
  "sort": { "column": "Revenue", "order": "desc" },
  "limit": 10,
  "chartType": "bar",
  "x": "Region",
  "y": "Revenue",
  "color": "Product",
  "facet": { "column": "Year", "wrap": 3 },
  "layout": {},
  "config": { "responsive": true }
}
```

### Supported Chart Types

- `bar` - Bar charts
- `line` - Line charts
- `scatter` - Scatter plots
- `pie` - Pie charts
- `histogram` - Histograms
- `box` - Box plots
- `heatmap` - Heatmaps
- `table` - Data tables
- `tableOnly` - Table-only view
- `pivot` - Pivot tables

### Filter Types

- **Array**: Match values in an array
- **Equality**: Exact match
- **Operator**: Numeric comparisons (>, <, >=, <=, !=)

### Aggregation Functions

- `sum` - Sum of values
- `mean` - Average of values
- `count` - Count of rows
- `min` - Minimum value
- `max` - Maximum value

## GitHub Pages Deployment

### Option 1: Deploy from Root

1. Push your code to the main branch
2. Go to repository Settings → Pages
3. Select "Deploy from branch"
4. Choose "main" branch and "/ (root)"
5. Save and wait for deployment

### Option 2: Deploy from /docs

1. Create a `docs` folder and move all files there
2. Push to main branch
3. Go to Settings → Pages
4. Choose "main" branch and "/docs"
5. Save and wait for deployment

### Verify Deployment

- All assets use relative paths (`./styles.css`, `./chartspec/main.js`)
- Demo datasets use relative paths (`./datasets/sample-sales.csv`)
- Should work with or without custom domain

## Browser Compatibility

ChartSpec requires a modern browser with support for:
- ES6 Modules
- Fetch API
- LocalStorage
- Plotly.js

**Recommended browsers:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Security Notes

🔒 **API Key Security**:
- API keys are stored in browser localStorage
- Keys never leave your browser
- **Never commit API keys to git repositories**
- Use `.gitignore` to exclude any files containing keys
- Clear localStorage to remove keys: `localStorage.clear()`

🔒 **Data Privacy**:
- All data processing happens in your browser
- Data is sent to LLM provider only (OpenAI/Grok)
- Review provider terms before using sensitive data

## Local LLM Mode (Evaluation)

ChartSpec has been evaluated for **browser-based local LLM** support using transformers.js, enabling completely offline, privacy-preserving chart generation without API keys.

### 📊 Evaluation Summary

A comprehensive evaluation of decoder-style, instruction-tuned models has been completed. Key findings:

**Recommended Models:**
- **Primary**: SmolLM2-1.7B-Instruct (900MB, 8.5/10 quality)
- **Lightweight**: SmolLM2-360M-Instruct (180MB, 7/10 quality)
- **Advanced**: Phi-3-mini-4k-instruct (2.2GB, 9.5/10 quality)

**Benefits:**
- ✅ Zero API costs
- ✅ Complete privacy (client-side processing)
- ✅ Offline capable after initial download
- ✅ No API key required
- ✅ Works entirely in browser with WebGPU acceleration

**Trade-offs:**
- ⚠️ Initial model download (180MB - 2.2GB)
- ⚠️ Requires modern browser with WebGPU support
- ⚠️ Lower quality than cloud models (GPT-4)
- ⚠️ Higher memory usage

### 📚 Documentation

Detailed evaluation documents are available in the `/docs` folder:

1. **[Local LLM Evaluation](docs/LOCAL_LLM_EVALUATION.md)** - Comprehensive analysis of transformers.js models
2. **[Model Comparison Snapshots](docs/MODEL_COMPARISON_SNAPSHOTS.md)** - Side-by-side test results
3. **[Quick Reference Guide](docs/LOCAL_LLM_QUICK_REFERENCE.md)** - Implementation guidance

### 🚀 Implementation Status

Local LLM mode is **evaluated and documented** but not yet implemented in the application. The evaluation provides a clear roadmap for future implementation with specific model recommendations and code examples.

**Next Steps for Implementation:**
1. Install `@huggingface/transformers` package
2. Create `localLLM.js` module
3. Add UI for local/cloud mode selection
4. Integrate with existing LLM router
5. Add progressive loading and caching

See the [evaluation documentation](docs/LOCAL_LLM_EVALUATION.md) for detailed implementation guidance.

## Troubleshooting

### "Storage quota exceeded" error
- Your dataset is too large for localStorage
- Try a smaller CSV file
- Clear old datasets to free up space

### Charts not rendering
- Check browser console for errors
- Verify Plotly.js loaded from CDN
- Ensure dataset is properly selected

### LLM not responding
- Verify API key is correct
- Check internet connection
- Review browser console for API errors
- Ensure API key has sufficient credits

### CSV not loading
- Verify CSV URL is accessible
- Check CSV format (comma-separated, headers in first row)
- For local files, use relative paths (`./datasets/file.csv`)

## Development

### Architecture Overview

ChartSpec uses a modular architecture with clear separation of concerns:

**Renderer Abstraction Layer:**
- `rendererFactory.js` - Factory pattern for managing multiple renderers
- `renderers/PlotlyRenderer.js` - Plotly.js implementation
- `renderers/D3Renderer.js` - D3.js implementation (skeleton)
- Allows easy switching between visualization libraries
- Automatic fallback when primary renderer unavailable

**Data Pipeline:**
1. Dataset loaded from CSV
2. Filters applied (array, equality, operator)
3. GroupBy and aggregations
4. Sorting and limiting
5. Faceting (if specified)
6. Rendering with selected renderer

**Token Management:**
- `tokenCounter.js` - Estimates token usage for LLM requests
- Real-time feedback as users type
- Breakdown by component (system, user, spec, response)
- Provider-specific limits (OpenAI, Grok)

### File Structure

```
ChartSpec/
├── index.html              # Main HTML file
├── styles.css              # Responsive styles
├── ROADMAP.md             # Development roadmap
├── SYNC_POLICY.md         # File sync requirements (IMPORTANT!)
├── check-sync.sh          # Sync verification script
├── chartspec/              # Application modules
│   ├── chartSpec.js        # Schema definition
│   ├── dataEngine.js       # Data transformations
│   ├── datasetRegistry.js  # Dataset management
│   ├── chartRenderer.js    # Legacy renderer (deprecated)
│   ├── rendererFactory.js  # Renderer abstraction
│   ├── renderers/
│   │   ├── PlotlyRenderer.js  # Plotly implementation
│   │   └── D3Renderer.js      # D3 implementation
│   ├── tokenCounter.js     # Token estimation
│   ├── llmRouter.js        # LLM integration
│   └── main.js             # Application orchestration
├── docs/                   # GitHub Pages deployment (must stay in sync!)
└── datasets/               # Demo datasets
    ├── sample-sales.csv
    └── sample-weather.csv
```

**Important**: Key files exist in both root and `/docs` directories and must be kept in sync. The `/docs` directory is deployed to GitHub Pages. See [SYNC_POLICY.md](SYNC_POLICY.md) for details and run `./check-sync.sh` before committing.

### Extending ChartSpec

**Add new renderers:**
1. Create a new class extending `BaseRenderer` in `chartspec/renderers/`
2. Implement required methods: `getName()`, `supports()`, `isAvailable()`, `validate()`, `renderSingleChart()`
3. Register in `main.js` with `rendererFactory.register(new YourRenderer())`

**Add new chart types:**
Update the renderer implementation to support additional chart types.

**Add new LLM providers:**
Edit `llmRouter.js` to add API integration for new providers.

**Customize styling:**
Edit `styles.css` to change colors, fonts, and layout.

## License

This project is provided as-is for educational and personal use.

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. **Important**: Run `./check-sync.sh` to ensure root and `/docs` files are in sync (see [SYNC_POLICY.md](SYNC_POLICY.md))
5. Submit a pull request

## Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing documentation
- Review browser console for error messages

---

Built with ❤️ using Plotly.js and modern web technologies
