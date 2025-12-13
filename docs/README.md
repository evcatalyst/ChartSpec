# ChartSpec Documentation

AI-powered data visualization assistant that runs entirely in your browser. ChartSpec uses LLMs (OpenAI/Grok) to generate chart specifications from natural language, then renders them with Plotly.js.

## Documentation Index

### 📚 Main Documentation
- **[Main README](../README.md)** - Project overview and getting started guide
- **[Roadmap](../ROADMAP.md)** - Development roadmap and milestones

### 🤖 Local LLM Evaluation (December 2024)

Comprehensive evaluation of transformers.js for browser-based local LLM mode:

- **[📊 Evaluation Summary](LOCAL_LLM_EVALUATION_SUMMARY.md)** - Executive summary and recommendations
  - Start here for overview and final recommendations
  - Key metrics, benefits, and implementation roadmap
  
- **[📖 Full Evaluation](LOCAL_LLM_EVALUATION.md)** - Comprehensive technical evaluation (23KB)
  - Detailed analysis of all evaluated models
  - Performance benchmarks and quality testing
  - Implementation guidance and security considerations
  
- **[📸 Model Comparison Snapshots](MODEL_COMPARISON_SNAPSHOTS.md)** - Test results and comparisons (14KB)
  - Side-by-side quality comparisons
  - Real test case outputs
  - Browser compatibility testing
  
- **[⚡ Quick Reference Guide](LOCAL_LLM_QUICK_REFERENCE.md)** - Implementation quick start (10KB)
  - TL;DR recommendations
  - Code examples and best practices
  - Common issues and solutions

#### Key Findings

**Recommended Models**:
- 🏆 **Primary**: SmolLM2-1.7B-Instruct (900MB, 8.5/10 quality, 20 tok/s)
- 🚀 **Lightweight**: SmolLM2-360M-Instruct (180MB, 7/10 quality, 15 tok/s)
- 💎 **Advanced**: Phi-3-mini-4k-instruct (2.2GB, 9.5/10 quality, 25 tok/s)

**Benefits**:
- ✅ Zero API costs
- ✅ Complete privacy (client-side processing)
- ✅ Offline capable after initial download
- ✅ No API key required

---

## Original Docs README

## Overview

ChartSpec is a fully serverless, browser-only application for creating interactive data visualizations through natural language. Simply load a CSV dataset, describe the chart you want, and let AI do the rest.

**Key Features:**
- 🌐 **Fully Browser-Based**: No server required, runs entirely client-side
- 🎨 **Natural Language**: Describe charts in plain English
- 📊 **Multiple Chart Types**: Bar, line, scatter, histogram, box, heatmap, table, and more
- 📱 **Mobile-First Design**: Responsive layout works on all devices
- 🔌 **Provider Agnostic**: Supports OpenAI and Grok (X.AI) LLM providers
- 💾 **Local Storage**: Datasets stored in browser localStorage
- 🎯 **Advanced Features**: Filtering, grouping, aggregations, faceting

## Getting Started

### Opening the Application

**Local File:**
1. Open `index.html` directly in a modern web browser
2. No web server needed for basic functionality

**GitHub Pages:**
This repository is configured to serve from the `/docs` directory:
1. Ensure GitHub Pages is enabled in repository Settings
2. Select "Deploy from a branch" → `main` → `/docs`
3. Access at `https://[username].github.io/[repository-name]/`

### Initial Setup

1. **Load Demo Datasets** (automatic on first run)
   - Sample Sales: Product sales by region
   - Sample Weather: Weather data by city

2. **Configure LLM Provider**
   - Select provider: OpenAI or Grok
   - Enter your API key
   - Keys are stored in browser localStorage only

3. **Start Creating Charts**
   - Select a dataset
   - Type your chart request
   - Watch the visualization appear

## Adding Datasets

### Dataset Requirements

**CSV Format:**
- First row must contain column headers
- Values should be comma-separated
- Headers should be alphanumeric (use underscores for spaces)
- Avoid special characters

**File Size Limitations:**
⚠️ **Important**: Browser localStorage has limitations:
- **Typical limit**: 5-10MB total across all stored data
- **Recommended**: Keep individual CSV files under 1MB
- **Large files**: May cause:
  - Storage quota exceeded errors
  - Slow browser performance
  - Import failures

For large datasets, consider:
- Data sampling or filtering before import
- Server-side processing with API endpoints
- Using a database backend instead of localStorage

### Adding a Dataset

**Method 1: Built-in Demo Datasets**
The app auto-registers demo datasets on first load:
- `Sample Sales`: `./datasets/sample-sales.csv`
- `Sample Weather`: `./datasets/sample-weather.csv`

**Method 2: Local CSV Files**
1. Place your CSV in the `datasets/` directory
2. Click "Add Dataset" in the app
3. Enter name and relative path:
   ```
   Name: My Data
   URL: ./datasets/my-data.csv
   ```
4. Click "Register"

**Method 3: Remote CSV Files**
1. Click "Add Dataset"
2. Enter name and full URL:
   ```
   Name: Remote Data
   URL: https://example.com/data.csv
   ```
3. Click "Register"

**Note**: The CSV parser is simplified for demo purposes. For complex CSVs with quoted fields, escaped characters, or multiline fields, consider pre-processing your data.

### Dataset Operations

- **Select**: Choose from dropdown to load dataset
- **Reload**: Re-fetch from original URL to update data
- **Delete**: Remove dataset and all stored data from localStorage

## Demo Datasets

### Sample Sales (`datasets/sample-sales.csv`)
**Columns:**
- Date: Transaction date
- Region: North, South, East, West
- Product: Widget A, B, C
- Quantity: Units sold
- Revenue: Sales revenue in dollars

**Use Cases:**
- Sales trends over time
- Regional performance comparison
- Product analysis
- Revenue aggregations

### Sample Weather (`datasets/sample-weather.csv`)
**Columns:**
- Date: Observation date
- City: New York, Los Angeles, Chicago, Houston
- Temperature: Temperature in Fahrenheit
- Humidity: Humidity percentage
- Precipitation: Precipitation in inches

**Use Cases:**
- Temperature trends
- City weather comparison
- Humidity vs temperature analysis
- Precipitation patterns

## Chart Types

ChartSpec supports multiple Plotly chart types:

- **bar**: Bar charts (vertical/horizontal)
- **line**: Line charts for trends
- **scatter**: Scatter plots with optional sizing
- **histogram**: Distribution histograms
- **box**: Box plots for statistical analysis
- **heatmap**: Heatmap visualizations
- **table**: Data tables
- **pivot**: Pivot table views
- **tableOnly**: Table-only display

## ChartSpec Schema

The LLM generates JSON specifications following this schema:

```json
{
  "title": "string - Chart title",
  "description": "string - Optional description",
  "chartType": "bar|line|scatter|histogram|box|heatmap|table|pivot|tableOnly",
  "x": "string - Column for x-axis",
  "y": "string or array - Column(s) for y-axis",
  "color": "string - Column for color grouping",
  "size": "string - Column for size (scatter plots)",
  "filters": [
    {
      "type": "array",
      "column": "Region",
      "values": ["North", "South"]
    },
    {
      "type": "equality",
      "column": "Product",
      "value": "Widget A"
    },
    {
      "type": "op",
      "column": "Revenue",
      "operator": ">",
      "value": 1000
    }
  ],
  "groupBy": {
    "columns": ["Region"],
    "aggregations": {
      "Revenue": { "func": "sum" }
    }
  },
  "sort": {
    "column": "Revenue",
    "order": "asc|desc"
  },
  "limit": 10,
  "facet": {
    "column": "Year",
    "wrap": 3
  }
}
```

### Aggregation Functions

- **sum**: Sum of values
- **mean**: Average value
- **count**: Count of rows
- **min**: Minimum value
- **max**: Maximum value

### Filter Operations

- **array**: Match any value in array
- **equality**: Exact match
- **op**: Numeric comparisons (>, <, >=, <=, !=)

## API Key Configuration

### Security Notice

🔒 **Never commit API keys to repositories**

API keys are:
- Stored in browser localStorage only
- Never sent anywhere except to your chosen LLM provider
- Not accessible to other websites
- Removable by clearing localStorage

### Getting API Keys

**OpenAI:**
1. Visit https://platform.openai.com/api-keys
2. Sign up or log in
3. Create a new API key
4. Copy and paste into ChartSpec

**Grok (X.AI):**
1. Visit https://console.x.ai/
2. Sign up or log in
3. Generate an API key
4. Copy and paste into ChartSpec

**Important**: API keys require payment/credits with the provider.

### Model Selection

ChartSpec allows you to select which model to use:

**Default Models:**
- **OpenAI**: `gpt-4o-mini` (recommended for cost-effectiveness)
- **Grok**: `grok-3` (recommended, replaces deprecated `grok-beta`)

**Note**: The `grok-beta` model has been deprecated by X.AI and will return errors. Please use `grok-3` or other current Grok models instead.

You can also specify custom models in the settings. The app provides a dropdown with common models and a freeform input for custom model names.

## GitHub Pages Deployment

This application is designed to work with GitHub Pages.

### Configuration

**Repository Settings:**
1. Go to Settings → Pages
2. Source: "Deploy from a branch"
3. Branch: `main` (or your default branch)
4. Folder: `/docs` ← **This repository uses /docs**
5. Save

**Alternative (root deployment):**
You can also deploy from root (`/`) by moving all files from `/docs` to repository root.

### Relative Paths

All assets use relative paths for GitHub Pages compatibility:
- `./styles.css` - Stylesheet
- `./chartspec/main.js` - Main application
- `./datasets/sample-sales.csv` - Demo datasets

This ensures the app works:
- From local filesystem
- From GitHub Pages (with or without custom domain)
- From any subdirectory path

### Verification

After deployment:
1. Visit your GitHub Pages URL
2. Check browser console for errors
3. Test dataset loading
4. Try creating a chart

## File Structure

```
docs/
├── index.html              # Main HTML entry point
├── styles.css              # Responsive CSS styles
├── chartspec/              # Application modules
│   ├── chartSpec.js        # Schema definition
│   ├── dataEngine.js       # Data transformations
│   ├── datasetRegistry.js  # Dataset management
│   ├── chartRenderer.js    # Plotly rendering
│   ├── llmRouter.js        # LLM integration
│   └── main.js             # Application orchestration
├── datasets/               # Demo CSV datasets
│   ├── sample-sales.csv
│   └── sample-weather.csv
└── README.md               # This file
```

## Running Locally

**Method 1: Direct File Open**
```bash
# Simply open in browser
open docs/index.html  # macOS
xdg-open docs/index.html  # Linux
start docs/index.html  # Windows
```

**Method 2: Local Web Server**
```bash
# Python 3
cd docs
python -m http.server 8000

# Node.js
cd docs
npx http-server -p 8000

# Then visit http://localhost:8000
```

## Technical Details

### Architecture

- **Pure JavaScript**: No build step, no bundler, no frameworks
- **ES6 Modules**: Modern import/export syntax
- **Plotly.js CDN**: Chart rendering via CDN
- **localStorage**: Data persistence
- **Fetch API**: CSV loading and LLM requests

### Mobile-First Design

**Responsive Breakpoints:**
- **< 768px**: Single column, stacked layout
- **>= 768px**: Two columns (sidebar + main area)
- **>= 1024px**: Expanded visualization area

**Facet Grid:**
- Uses CSS Grid: `repeat(auto-fit, minmax(260px, 1fr))`
- Automatically fits charts to available space
- Maintains minimum 260px width per facet

### Browser Compatibility

**Requirements:**
- ES6 Module support
- Fetch API
- localStorage
- CSS Grid
- Plotly.js compatibility

**Recommended Browsers:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Limitations & Considerations

### CSV File Size
- localStorage typically limited to 5-10MB total
- Recommended max file size: ~1MB per CSV
- Large files may cause performance issues
- Consider server-side processing for production

### CSV Parsing
- Simple parser for basic CSV files
- Does not handle quoted fields with commas
- Does not handle escaped quotes
- Does not handle multiline fields
- For complex CSVs, use proper CSV library

### LLM Accuracy
- Chart specifications depend on LLM understanding
- May require prompt refinement
- Results vary by model and prompt
- Review and adjust generated specs as needed

### Data Privacy
- All data stored in browser localStorage
- Data sent to chosen LLM provider for processing
- Review provider privacy policies
- Avoid using with sensitive/private data

## Troubleshooting

### "Storage quota exceeded" Error
**Cause**: Dataset too large for localStorage  
**Solution**: 
- Use smaller CSV file
- Delete unused datasets
- Clear localStorage: `localStorage.clear()` in console

### Charts Not Rendering
**Cause**: Plotly.js not loaded or data issues  
**Solution**:
- Check browser console for errors
- Verify internet connection (Plotly CDN)
- Ensure dataset is selected
- Verify CSV format

### LLM Not Responding
**Cause**: API key or network issues  
**Solution**:
- Verify API key is correct
- Check internet connection
- Verify API key has credits
- Check browser console for error details

### CSV Not Loading
**Cause**: File path or format issues  
**Solution**:
- Verify URL is accessible
- Check CSV format (comma-separated, headers)
- For local files, use relative paths
- Check browser console for fetch errors

### GitHub Pages 404 Errors
**Cause**: Incorrect deployment configuration  
**Solution**:
- Verify Pages is enabled in Settings
- Ensure "/docs" folder is selected
- Check branch is correct
- Wait a few minutes after enabling
- Clear browser cache

## Advanced Usage

### Custom Chart Specifications
You can manually edit chart specifications in the chat to fine-tune:
- Adjust colors
- Modify titles
- Change aggregations
- Add/remove filters

### Auto-Refine Feature
Enable "Auto-refine charts" to automatically improve charts:
- Takes snapshot of rendered chart
- Sends to LLM for analysis
- Generates improved specification
- Re-renders automatically

**Note**: Uses additional LLM API calls (costs credits)

### Example Queries

```
"Create a bar chart of total revenue by region"
"Show temperature trends over time as a line chart"
"Make a scatter plot of temperature vs humidity, colored by city"
"Display a pivot table of sales by region and product"
"Show me a box plot of revenue distribution by region"
"Create a heatmap of temperature by city and date"
"Group by product and show average quantity sold"
"Filter for revenue > 2000 and show by region"
"Facet charts by region showing revenue over time"
```

## Contributing

To extend or modify ChartSpec:

**Add Chart Types**: Edit `chartRenderer.js`  
**Add LLM Providers**: Edit `llmRouter.js`  
**Customize Styles**: Edit `styles.css`  
**Modify Schema**: Edit `chartSpec.js`

## License

Provided as-is for educational and personal use.

---

**Built with**: Plotly.js, Vanilla JavaScript, Modern Web APIs  
**Repository**: https://github.com/evcatalyst/ChartSpec
