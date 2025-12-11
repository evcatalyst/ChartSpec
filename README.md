# ChartSpec

AI-powered data visualization assistant for browser-based chart creation. ChartSpec uses LLMs (OpenAI/Grok) to generate chart specifications from natural language, then renders them with multiple visualization libraries.

## Features

- 🎨 **Natural Language Charting**: Describe your desired visualization in plain English
- 📊 **Multiple Chart Types**: Bar, line, scatter, pie, histogram, box plots, heatmaps, and tables
- 🔄 **Data Transformations**: Filters, grouping, aggregations, sorting, and limiting
- 📱 **Mobile-First Design**: Responsive layout that works on all devices
- 💾 **Browser-Based**: No server required - runs entirely in your browser
- 🔌 **Multiple LLM Providers**: Support for OpenAI and Grok (X.AI)
- 📁 **Dataset Management**: Upload and manage CSV datasets locally
- 🎯 **Faceted Charts**: Create small multiples for data comparison
- 🔧 **Renderer Abstraction**: Support for multiple visualization libraries (Plotly, D3)
- 📊 **Token Estimation**: Real-time token usage tracking to optimize LLM costs

## Getting Started

### 1. Open the Application

**Option A: Local File**
- Clone or download this repository
- Open `index.html` in a modern web browser

**Option B: GitHub Pages**
- Deploy to GitHub Pages (see deployment section below)
- Access via your GitHub Pages URL

### 2. Configure LLM Access

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
- ChartSpec now displays real-time token usage estimates
- See breakdown of system prompt, your message, and response tokens
- Get warnings when approaching token limits
- Helps optimize costs and stay within model limits

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
└── datasets/               # Demo datasets
    ├── sample-sales.csv
    └── sample-weather.csv
```

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
4. Submit a pull request

## Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing documentation
- Review browser console for error messages

---

Built with ❤️ using Plotly.js and modern web technologies
