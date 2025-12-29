# ChartSpec Documentation

Welcome to the ChartSpec documentation hub. This guide will help you get the most out of ChartSpec, whether you're trying it for the first time, adding your own datasets, or extending the system.

## What You'll Learn

This documentation will help you:
- Understand the two UI options (Classic and Workbench)
- Master the three operating modes (LLM, Smart, and Local)
- Work with datasets and the demo gallery
- Understand and create ChartSpec JSON specifications
- Extend ChartSpec with new renderers
- Test, build, and deploy your own instance

## Quick Links

### 🚀 Getting Started
- **[Try it Live](https://evcatalyst.github.io/ChartSpec/)** - Classic UI (no install needed)
- **[Workbench UI](https://evcatalyst.github.io/ChartSpec/workbench.html)** - Full-screen workspace
- **[Main README](../README.md)** - Quick start and feature overview

### 📖 Core Documentation
- **[ChartSpec Schema](schema.md)** - Complete field reference with examples for all chart types
- **[Architecture Guide](architecture.md)** - Pipeline, renderer abstraction, and extending ChartSpec
- **[Dataset Management](datasets.md)** - Registration, limits, caching, and demo gallery
- **[Testing Guide](testing.md)** - Running tests and local development workflow
- **[Deployment Guide](deployment.md)** - GitHub Pages setup and link hygiene

### 🎯 Specialized Topics
- **[Smart Mode Guide](SMART_MODE.md)** - API-less chart creation with discrete commands
- **[UI Architecture](ui-architecture.md)** - Workbench component system and event bus
- **[Storage Schema](storage-schema.md)** - IndexedDB and localStorage design
- **[Local LLM Evaluation](LOCAL_LLM_EVALUATION.md)** - Browser-based AI analysis
- **[Chart Rendering](CHART_RENDERING.md)** - Renderer implementations
- **[Demo Datasets](DEMO_DATASETS.md)** - Quick reference for included datasets

## UI Map: Classic vs Workbench

ChartSpec provides two user interfaces optimized for different workflows:

### Classic UI (`index.html`)

**Best for:** First-time users, simple charts, mobile devices

**Features:**
- Single-pane layout with chat and chart side-by-side
- Mobile-responsive design
- Simpler dataset management
- Lightweight and fast

**When to use:**
- Quick chart creation
- Learning ChartSpec
- Mobile/tablet access
- Sharing simple visualizations

### Workbench UI (`workbench.html`)

**Best for:** Data exploration, multiple charts, power users

**Features:**
- Multi-tile workspace with draggable grid
- Simultaneous charts, tables, and inspectors
- Layout presets (single, 2-up, dashboard)
- Keyboard shortcuts (Ctrl+B, Ctrl+P, ESC)
- IndexedDB storage for large datasets
- LED sampler for visual data control
- Presentation mode

**When to use:**
- Exploring datasets with multiple views
- Creating dashboard-style layouts
- Working with larger datasets (>1MB)
- Advanced data analysis workflows

**See:** [UI Architecture](ui-architecture.md) for detailed Workbench documentation.

## Operating Modes

ChartSpec supports three modes of operation:

### 🤖 LLM Mode (Default)
Full AI-powered natural language processing using OpenAI or Grok.

- **Requires:** API key from OpenAI or Grok
- **Best for:** Natural language queries, complex specifications
- **Security:** Keys stored in browser localStorage only, never transmitted except to chosen provider

**Resources:**
- [Getting API Keys](../README.md#2-choose-your-mode)
- [Security Notes](../README.md#security-notes)

### 🧠 Smart Mode (API-less)
Intelligent chart creation without API keys using AVA and local language parsing.

- **Requires:** Nothing! Completely free
- **Best for:** Demos, learning, privacy-conscious users
- **How it works:** Discrete vocabulary commands parsed locally, AVA recommends chart types

**Resources:**
- [Smart Mode Guide](SMART_MODE.md)
- [Command Reference](SMART_MODE.md#command-vocabulary)

### 📝 Local Mode
Manual ChartSpec JSON editing for advanced users.

- **Requires:** Understanding of ChartSpec schema
- **Best for:** Precise control, debugging, learning the schema
- **How it works:** Direct JSON editing and rendering

**Resources:**
- [ChartSpec Schema](schema.md)
- [Schema Examples](schema.md#complete-examples-by-chart-type)

## User Journeys

### "Try it in-browser in 2 minutes"
1. Visit [https://evcatalyst.github.io/ChartSpec/](https://evcatalyst.github.io/ChartSpec/)
2. Select "Sample Sales" dataset
3. Type "show revenue by region as a bar chart"
4. Done! (Smart Mode works without API key)

### "Add my dataset and get a chart"
1. Click "Add Dataset" in the sidebar
2. Enter name and CSV URL (local or remote)
3. Click "Register"
4. Select your dataset from dropdown
5. Ask for your chart in natural language

**Resources:** [Dataset Management](datasets.md)

### "Understand the ChartSpec schema and extend renderers"
1. Read [ChartSpec Schema](schema.md) for field reference
2. Study [Architecture Guide](architecture.md) for pipeline overview
3. Review [Chart Rendering](CHART_RENDERING.md) for renderer details
4. See [Architecture Guide](architecture.md#adding-a-new-renderer) for implementation steps

### "Run tests and ship to GitHub Pages"
1. Run `npm test` locally to verify ([Testing Guide](testing.md))
2. Fork the repository
3. Configure GitHub Pages ([Deployment Guide](deployment.md))
4. Push to main branch
5. Access at `https://yourusername.github.io/ChartSpec/`

## Storage and Data

ChartSpec uses multiple storage mechanisms:

### localStorage
- **Classic UI:** Dataset metadata and data
- **Both UIs:** API keys, user preferences
- **Limit:** ~5-10MB total
- **Best for:** Small datasets (<1MB)

### IndexedDB
- **Workbench UI only:** Large datasets, samples, cache
- **Limit:** Much larger (typically 50MB+)
- **Best for:** Large datasets, demo gallery data

**Resources:**
- [Storage Schema](storage-schema.md)
- [Dataset Management](datasets.md)

## Failure Modes and Troubleshooting

Common failure scenarios and solutions:

### Invalid ChartSpec
**Symptom:** Chart doesn't render, console errors  
**Cause:** Missing required fields, invalid chart type, column mismatch  
**Solution:** Check [Schema Documentation](schema.md), validate against examples  

### Missing Columns
**Symptom:** "Column not found" errors  
**Cause:** ChartSpec references columns not in dataset  
**Solution:** Check dataset columns, use exact case-sensitive names  

### Storage Quota Exceeded
**Symptom:** "QuotaExceededError" when adding datasets  
**Cause:** Dataset too large for localStorage  
**Solution:** Use Workbench (IndexedDB), or sample/filter data first  

### Renderer Load Failure
**Symptom:** Charts not rendering, Plotly/D3 errors  
**Cause:** CDN blocked, network issues, renderer not available  
**Solution:** Check browser console, verify CDN access, wait for retry  

### API Key Issues
**Symptom:** LLM not responding, 401/403 errors  
**Cause:** Invalid key, insufficient credits, wrong provider  
**Solution:** Verify key in provider dashboard, check credits, try Smart Mode  

**Resources:**
- [Troubleshooting](../README.md#troubleshooting)
- [Testing Guide](testing.md)

## Link Hygiene (Pages-Safe URLs)

All documentation and code should use relative URLs for GitHub Pages compatibility:

✅ **Good:**
- `./datasets/sample-sales.csv`
- `../docs/schema.md`
- `[Schema](schema.md)`

❌ **Bad:**
- `/datasets/sample-sales.csv` (absolute, breaks with subdirectory deployment)
- `https://example.com/ChartSpec/docs/schema.md` (hardcoded domain)

**Resources:** [Deployment Guide](deployment.md)

## Contributing

Contributions welcome! Key areas:
- New renderers (see [Architecture Guide](architecture.md))
- Additional chart types
- Documentation improvements
- Bug fixes and tests

**Important:** Run `./check-sync.sh` before committing to ensure root and `/docs` files stay synchronized. See [SYNC_POLICY.md](../SYNC_POLICY.md).

## Support

- **Issues:** [GitHub Issues](https://github.com/evcatalyst/ChartSpec/issues)
- **Documentation:** This guide
- **Examples:** [Demo Datasets](DEMO_DATASETS.md)
- **Community:** Check existing issues and discussions

---

**Navigation:** [↑ Back to README](../README.md) | [Schema →](schema.md) | [Architecture →](architecture.md)
