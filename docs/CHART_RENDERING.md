# Chart Rendering Architecture

## Overview

ChartSpec uses a **renderer factory pattern** that supports multiple visualization libraries with automatic fallback. This ensures charts render even when some libraries are unavailable.

## Supported Renderers

### 1. Plotly Renderer (Primary)
- **Library**: Plotly.js v2.27.0
- **CDN**: https://cdn.jsdelivr.net/npm/plotly.js-dist@2.27.0/plotly.min.js
- **Supports**: bar, line, scatter, pie, histogram, box, heatmap, table, pivot
- **Status**: Default renderer

### 2. D3 Renderer (Fallback)
- **Library**: D3.js v7
- **CDN**: https://d3js.org/d3.v7.min.js
- **Supports**: bar, line, scatter, pie, table
- **Status**: Automatic fallback when Plotly unavailable

## How It Works

### Normal Operation (Production)

```
User requests chart
    ↓
Renderer Factory checks Plotly availability
    ↓
✅ Plotly available → Use Plotly (rich, interactive charts)
    ↓
Chart renders successfully
```

### Fallback Mode (Network Issues)

```
User requests chart
    ↓
Renderer Factory checks Plotly availability
    ↓
❌ Plotly NOT available → Search for alternatives
    ↓
Renderer Factory checks D3 availability
    ↓
✅ D3 available → Use D3 (SVG-based charts)
    ↓
Chart renders successfully (different style, same data)
```

### No Renderers Available (Extreme Case)

```
User requests chart
    ↓
Renderer Factory checks all renderers
    ↓
❌ No renderers available
    ↓
Display table with warning message
    ↓
User sees data in table format
```

## Renderer Factory Logic

The `getBestRenderer()` method:

1. **Try default renderer** (Plotly)
   - Check if `Plotly` global object exists
   - Check if it supports the requested chart type

2. **If default unavailable, search alternatives**
   - Iterate through all registered renderers
   - Find first available renderer that supports chart type
   - Log fallback usage for debugging

3. **If no renderers available**
   - Return default renderer anyway
   - Renderer shows warning and table fallback

## Chart Type Support Matrix

| Chart Type | Plotly | D3 | Fallback |
|------------|--------|-----|----------|
| bar        | ✅     | ✅  | Table    |
| line       | ✅     | ✅  | Table    |
| scatter    | ✅     | ✅  | Table    |
| pie        | ✅     | ✅  | Table    |
| histogram  | ✅     | ❌  | Table    |
| box        | ✅     | ❌  | Table    |
| heatmap    | ✅     | ❌  | Table    |
| table      | ✅     | ✅  | Native   |
| pivot      | ✅     | ❌  | Table    |

## D3 Renderer Features

### Bar Chart
- SVG-based rendering
- Automatic scaling (x: band scale, y: linear scale)
- Axis labels with rotation for readability
- Colored bars (#667eea)
- Tooltips on hover

### Line Chart
- Linear interpolation
- Automatic y-axis scaling
- Dots at data points
- Grid lines for readability

### Scatter Plot
- Circle markers
- Opacity for overlapping points
- Optional size encoding (via `size` field)
- Extent-based scaling

### Pie Chart
- Arc-based layout
- Percentage labels
- Color scheme from d3.schemeCategory10
- Centered with title

### Table
- HTML table rendering
- Responsive design
- Header row with column names
- Scrollable for large datasets

## Common Issues and Solutions

### Issue: "Chart libraries not available" warning

**Cause**: CDN scripts blocked by network, ad blocker, or CSP policy

**Solutions**:
1. **Check internet connectivity** - Ensure device can access external CDNs
2. **Disable ad blockers** - Some ad blockers block CDN scripts
3. **Check Content Security Policy** - Ensure CSP allows script-src from CDNs
4. **Use local copies** - Download libraries and serve locally (advanced)

### Issue: Charts show as tables

**Cause**: Both Plotly and D3 unavailable

**Expected Behavior**: This is the intentional fallback
- Data is still visible in table format
- All transformations (filters, groupBy, sort) applied correctly
- User can still interact with data

**Resolution**: Fix CDN access, then reload page

### Issue: D3 charts look different from Plotly

**Expected Behavior**: This is normal
- D3 charts use SVG (scalable, crisp)
- Plotly charts use Canvas (interactive, animated)
- Both show same data, different visual style

## Testing Locally

### With CDN Access (Normal)
```bash
# Start local server
python3 -m http.server 8000

# Open in browser
http://localhost:8000

# Expected: Charts render with Plotly
```

### Without CDN Access (Fallback Test)
```bash
# Block CDNs in browser DevTools:
# 1. Open DevTools → Network
# 2. Right-click → Block request URL
# 3. Add patterns: *plotly*, *d3js*

# Expected: Charts render with D3 or table fallback
```

## Production Deployment

### GitHub Pages (Recommended)
- CDN scripts load automatically
- Both Plotly and D3 available
- Charts render perfectly

### Custom Server
- Ensure outbound internet access
- Allow requests to:
  - cdn.jsdelivr.net
  - d3js.org
  - unpkg.com (for AVA)

### Offline Deployment (Advanced)
1. Download libraries:
   ```bash
   wget https://cdn.jsdelivr.net/npm/plotly.js-dist@2.27.0/plotly.min.js
   wget https://d3js.org/d3.v7.min.js
   ```

2. Update script tags in index.html:
   ```html
   <script src="./libs/plotly.min.js"></script>
   <script src="./libs/d3.v7.min.js"></script>
   ```

3. Serve files with proper MIME types

## Console Messages

### Success
```
Renderer registered: plotly (default)
Renderer registered: d3
Available renderers: [{name: 'plotly', available: true}, {name: 'd3', available: true}]
```

### Plotly Unavailable (Using D3)
```
⚠️ Default renderer 'plotly' is not available. Searching for alternatives...
✓ Using fallback renderer: d3 for chart type: bar
```

### No Renderers Available
```
⚠️ Default renderer 'plotly' is not available. Searching for alternatives...
⚠️ No available renderer found for chart type: bar. Using default renderer (may show fallback).
⚠️ Chart Rendering Issue: Chart libraries (Plotly/D3) are not available...
```

## Future Enhancements

### Planned
- [ ] Expand D3 support for histogram, box, heatmap
- [ ] Add Chart.js as third fallback option
- [ ] Implement progressive enhancement (start with table, upgrade to chart)
- [ ] Add renderer preference in settings UI
- [ ] Download libraries locally for offline mode

### Under Consideration
- [ ] Canvas-based renderer (lightweight)
- [ ] ASCII art charts (terminal/text mode)
- [ ] Export to static image server-side

## Related Files

- `/chartspec/rendererFactory.js` - Factory pattern implementation
- `/chartspec/renderers/PlotlyRenderer.js` - Plotly implementation
- `/chartspec/renderers/D3Renderer.js` - D3 implementation
- `/chartspec/main.js` - Renderer initialization (line 60-68)
- `/index.html` - CDN script tags (line 8-11)

## Support

If you encounter issues:
1. Check browser console for specific error messages
2. Verify CDN accessibility: `curl -I https://cdn.jsdelivr.net/npm/plotly.js-dist@2.27.0/plotly.min.js`
3. Test with different chart types to isolate renderer-specific issues
4. Review this documentation for common solutions

---

**Last Updated**: December 12, 2024
**Architecture Version**: v0.2.0
