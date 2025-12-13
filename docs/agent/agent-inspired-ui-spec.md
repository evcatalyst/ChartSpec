# ChartSpec UI Spec (Agent-Inspired Layout)

## Design Goal

A calm, technical, agent-style interface inspired by GitHub Copilot Agent and PR views.
Focus on clarity, state, and traceability — not chat gimmicks.

---

## Overall Layout

Three-pane, resizable layout:

```
┌─────────────┬───────────────────────┬─────────────────┐
│             │                       │                 │
│   LEFT      │      MIDDLE           │     RIGHT       │
│             │                       │                 │
│   Data      │      Workbench        │    Inspector    │
│   Sources / │      (Chat + Data     │    (Charts /    │
│   Inventory │       Ops)            │     Specs /     │
│             │                       │   Dashboards)   │
│             │                       │                 │
└─────────────┴───────────────────────┴─────────────────┘
```

**LEFT** = Data Sources / Inventory  
**MIDDLE** = Workbench (Chat + Data Ops)  
**RIGHT** = Inspector (Charts / Specs / Dashboards)

### Pane Properties

All panes:
- **Resizable** - User can adjust width by dragging dividers
- **Collapsible** - Can be minimized to maximize other panes
- **Persistent** - Size and state remembered in local storage

### Visual Foundation

- **Dark-first UI** - Background color: `#0d1117` (or similar GitHub dark theme)
- **Neutral grayscale** - Minimal color accents, professional appearance
- **Subtle borders** - Border color: `#30363d` for clean separation
- **Typography** - System UI / Inter / SF Mono for technical feel

---

## LEFT PANE: Data Sources

### Purpose
Show what data exists, its state, and what actions are possible.

### Sections (collapsible)

1. **Datasets**
2. **Views**
3. **Artifacts**
4. **Jobs**

### Dataset Row

Each dataset entry displays:

```
┌────────────────────────────────────────────────┐
│ 📊 Sales.csv                      [Profiled]   │
│    125.3 MB · 1.2M rows                        │
└────────────────────────────────────────────────┘
```

**Components:**
- **Name** + file type icon (CSV, JSON, etc.)
- **Size** - File size in MB
- **Status pill** - Current processing state:
  - `Imported` - Data loaded, not yet analyzed
  - `Profiling…` - Analysis in progress
  - `Profiled` - Ready for use
  - `Error` - Something went wrong
- **Row count estimate** - Number of rows (if known)

### Hover Actions

When hovering over a dataset row, show action buttons:

- **Profile** - Analyze column types, distributions, null counts
- **Sample** - Generate stratified sample for preview
- **Rollups** - Create aggregated views (daily, by category, etc.)
- **Delete** - Remove dataset from workspace

### Click Behavior

- **Single click** - Select dataset (sets as active context)
- **Double click** - Open Profile view in middle pane

### Empty State

When no datasets exist:

```
┌────────────────────────────────────────────────┐
│                                                │
│          📁                                    │
│                                                │
│    Drag files here or click Import            │
│                                                │
└────────────────────────────────────────────────┘
```

---

## MIDDLE PANE: Workbench

### Purpose
This is the **active thinking surface**.  
Everything that happens appears here as a timeline + interactive views.

### Tabs

1. **Chat** - Agent-style conversation
2. **Data** - Schema and table preview
3. **Timeline** - Audit trail of operations

---

### Chat Tab

**Agent-style chat** - Concise, technical, not conversational fluff.

#### Suggestion Blocks

Suggestions appear as actionable blocks, not prose:

```
┌────────────────────────────────────────────────┐
│ 💡 Revenue is highly skewed                    │
│                                                │
│ [Apply log scale]  [Create daily rollup]      │
│ [Inspect outliers]                             │
└────────────────────────────────────────────────┘
```

**Structure:**
- **Insight** - Short observation or finding
- **Action buttons** - Clear, reversible operations
- **No chart rendering** - Charts never appear in chat

#### Rules

- ✅ Chat operates on **profiles, samples, rollups only**
- ✅ Suggestions are **explicit and actionable**
- ❌ Chat **never renders charts directly**
- ❌ Chat **never handles raw data** (>10k rows)
- ❌ No "magic" operations without explanation

#### Example Conversation Flow

```
User: "Show me revenue trends"

Agent: "Analyzing Sales.csv (1.2M rows)..."
       [Profiling complete]
       
       Revenue column:
       • Type: Numeric (USD)
       • Range: $12 - $45,890
       • Skew: 2.3 (highly skewed)
       • Null count: 0
       
       Suggestion: Create daily rollup?
       [Yes, rollup by date] [Show distribution first]

User: [Clicks "Yes, rollup by date"]

Agent: "Creating rollup: revenue_by_day..."
       [Success] Generated 365 rows
       
       Ready to chart.
       [Create line chart] [Create bar chart]
```

---

### Data Tab

**Schema browser + Table preview**

#### Features

- **Schema Browser**
  - Column names
  - Data types (inferred)
  - Null counts
  - Basic stats (min, max, unique values)

- **Table Preview**
  - Bounded rows only (max 1000)
  - Pagination controls
  - Column sorting

- **Filters** (lightweight)
  - Simple equality filters
  - Range filters for numbers/dates
  - Text search

- **Column Stats on Hover**
  - Distribution preview (sparkline)
  - Top 5 values
  - Null percentage

#### Use Cases

- Inspecting rollups
- Verifying joins
- Sanity checking samples
- Understanding data shape before charting

---

### Timeline Tab

**Copilot-Agent-inspired audit trail**

This is crucial for **trust and debuggability**.

#### Operation Log

Each operation logs:

```
┌────────────────────────────────────────────────┐
│ 10:23 AM  Imported Sales.csv                   │
│           ✓ Success · 1.2M rows                │
├────────────────────────────────────────────────┤
│ 10:23 AM  Inferred schema                      │
│           ✓ 18 columns detected                │
├────────────────────────────────────────────────┤
│ 10:24 AM  Generated stratified sample          │
│           ✓ 5,000 rows sampled                 │
├────────────────────────────────────────────────┤
│ 10:25 AM  Built rollup: revenue_by_day         │
│           ✓ 365 rows · Saved to Artifacts      │
└────────────────────────────────────────────────┘
```

**Entry Components:**
- **Timestamp** - When the operation occurred
- **Operation name** - What happened
- **Dataset(s) involved** - Which data was affected
- **Status** - Success, warning, or error
- **Details** - Row counts, column names, etc.

#### Benefits

- **Traceability** - See exactly what the system did
- **Debugging** - Identify where things went wrong
- **Trust** - No hidden "magic" operations
- **Reproducibility** - Could reconstruct workflow from timeline

---

## RIGHT PANE: Inspector / Charts

### Purpose
Show the **current artifact** in detail.  
Never overloaded. Never scroll-janky.

### Tabs

1. **Preview** - Rendered visualization
2. **Spec** - ChartSpec JSON
3. **Data** - Data provenance
4. **Insights** - Auto-generated observations

---

### Preview Tab

**Rendered chart or dashboard**

```
┌────────────────────────────────────────────────┐
│  Revenue by Region                             │
│                                                │
│  ⚠️  Downsampled to 5k points                  │
│                                                │
│  [Chart renders here]                          │
│                                                │
│                                                │
└────────────────────────────────────────────────┘
```

**Features:**
- Always uses **aggregated data** (never raw 100k+ rows)
- **Warnings inline** for downsampling, truncation, etc.
- Responsive sizing
- Export options (PNG, SVG, PDF)

---

### Spec Tab

**ChartSpec / Vega-like JSON**

```json
{
  "title": "Revenue by Region",
  "chartType": "bar",
  "data": "revenue_by_region",
  "x": "Region",
  "y": "TotalRevenue",
  "color": "#4c8bf5",
  "config": {
    "responsive": true,
    "showGrid": true
  }
}
```

**Features:**
- **Readable, formatted** - Indented, syntax-highlighted
- **Copy button** - Copy to clipboard
- **Export button** - Download as JSON
- **Edit mode** - Advanced users can tweak manually

---

### Data Tab

**What data feeds this chart**

```
┌────────────────────────────────────────────────┐
│ Data Provenance                                │
├────────────────────────────────────────────────┤
│ Source Dataset(s):                             │
│   • Sales.csv (1.2M rows)                      │
│                                                │
│ Rollup Used:                                   │
│   • revenue_by_region                          │
│   • Created: 10:25 AM                          │
│                                                │
│ Filters Applied:                               │
│   • Date >= 2024-01-01                         │
│   • Region != "Unknown"                        │
│                                                │
│ Final Row Count: 5 rows                        │
└────────────────────────────────────────────────┘
```

**Purpose:**
- Show **lineage** - Where did this data come from?
- Show **transformations** - What operations were applied?
- Show **size** - How many rows are being visualized?

---

### Insights Tab

**Auto-generated observations**

```
┌────────────────────────────────────────────────┐
│ Insights                                       │
├────────────────────────────────────────────────┤
│ • North region accounts for 45% of revenue     │
│ • Revenue increased 23% Q4 vs Q3               │
│ • Outlier detected: Dec 25 (holiday spike)     │
│                                                │
│ ✏️ Notes                                       │
│ [User can add editable notes here]             │
│                                                │
└────────────────────────────────────────────────┘
```

**Features:**
- **LLM-friendly summaries** - Key observations
- **Editable notes** - User can annotate
- **Export** - Include in reports

---

## Interaction Principles

### Safety and Trust

1. **Never auto-run expensive operations**
   - Always show row count estimate before operations
   - Require explicit confirmation for large datasets
   - Show progress indicators

2. **Always show estimates before joins**
   - "This join will produce ~500k rows. Continue?"
   - Preview join keys and match counts

3. **Always show data provenance**
   - Every chart links back to source dataset
   - Every rollup shows original row count

4. **Always keep UI responsive (Web Workers)**
   - Heavy computations in background
   - UI never freezes
   - Can cancel long-running operations

### Traceability

All chat suggestions must be:

- **Explicit** - Clear what will happen
- **Reversible** - Can undo or delete artifacts
- **Logged in Timeline** - Audit trail of all actions

### Example: Before/After

**❌ Bad (Magic):**
```
User: "chart revenue"
[Chart appears instantly, no explanation]
```

**✅ Good (Transparent):**
```
User: "chart revenue"

Agent: "Sales.csv has 1.2M rows. 
       Creating daily rollup (365 rows)...
       [Done]
       
       Ready to chart.
       [Line chart] [Bar chart]"

User: [Clicks "Line chart"]

Agent: "Created chart: Revenue over time
       Data: revenue_by_day (365 rows)
       Added to Inspector →"
```

---

## Visual Style

### Color Palette

**Background:**
- Primary: `#0d1117` (GitHub dark background)
- Secondary: `#161b22` (Slightly lighter)
- Tertiary: `#21262d` (Panel backgrounds)

**Borders:**
- `#30363d` (Subtle separation)

**Text:**
- Primary: `#c9d1d9` (High contrast)
- Secondary: `#8b949e` (Muted)
- Tertiary: `#6e7681` (Disabled)

**Accents:**
- Blue: `#58a6ff` (Links, primary actions)
- Green: `#3fb950` (Success, completed)
- Yellow: `#d29922` (Warning)
- Red: `#f85149` (Error, destructive)

### Status Pills

```css
.pill {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.pill-imported { background: #1f6feb; color: #fff; }
.pill-profiling { background: #d29922; color: #000; }
.pill-profiled { background: #3fb950; color: #fff; }
.pill-error { background: #f85149; color: #fff; }
```

### Typography

- **Headings**: SF Pro Text, system-ui, -apple-system
- **Body**: Inter, system-ui, sans-serif
- **Code/Specs**: SF Mono, Consolas, monospace

**Sizes:**
- XL: 20px (Pane titles)
- L: 16px (Section headings)
- M: 14px (Body text, default)
- S: 12px (Labels, meta info)
- XS: 11px (Timestamps, hints)

### Icons

- **Minimal, monochrome** - GitHub Octicons style
- **16px or 20px** - Consistent sizing
- **No gradients** - Flat, professional
- **Semantic** - Database, chart, warning, etc.

### Layout Principles

- **No skeuomorphism** - Flat design
- **Clean lines** - Subtle borders, no heavy shadows
- **Spacious** - Adequate padding, never cramped
- **Calm** - No animations unless purposeful (loading spinners)

### Feels Like

✅ **GitHub PR view** - Clean, technical, state-focused  
✅ **Copilot Agent** - Conversational but professional  
✅ **Data tooling** - Observable, Jupyter, Tableau  

❌ **Not like:** ChatGPT (too casual), Slack (too social), Excel (too dense)

---

## Non-Goals

What this UI **does not** do:

- ❌ **No spreadsheet-style editing**
  - Not trying to be Excel or Google Sheets
  - Read-only data views (except filters)

- ❌ **No raw 100k+ row rendering**
  - Always work with profiles, samples, or rollups
  - Prevent browser crashes from large tables

- ❌ **No "magic" charts without explanation**
  - Every chart has clear lineage
  - User understands what data is being shown

- ❌ **No chat-first UI**
  - Chat is one tool, not the only interface
  - Can operate entirely via Data + Inspector panes

---

## Success Criteria

A user can:

1. **Import a 200MB CSV**
   - Without browser crash
   - See progress indicator
   - Get confirmation when complete

2. **See its profile in < 10s**
   - Column types inferred
   - Basic stats calculated
   - Ready for operations

3. **Understand its shape before charting**
   - Row count visible
   - Column list browsable
   - Sample data previewable

4. **Build charts without freezing the browser**
   - All heavy ops in Web Workers
   - UI stays responsive
   - Can cancel long operations

5. **Trust what the system did and why**
   - Timeline shows all operations
   - Data provenance always visible
   - No hidden transformations

---

## Technical Implementation Notes

### Responsive Grid

Use CSS Grid for three-pane layout:

```css
.app-layout {
  display: grid;
  grid-template-columns: 
    minmax(200px, 300px)  /* LEFT */
    1fr                   /* MIDDLE */
    minmax(300px, 500px); /* RIGHT */
  grid-template-rows: 100vh;
  gap: 0;
}

.pane {
  overflow-y: auto;
  border-right: 1px solid var(--border-color);
}
```

### Resizable Dividers

Use libraries like `react-resizable-panels` or `split.js`:

```javascript
Split(['.left-pane', '.middle-pane', '.right-pane'], {
  sizes: [20, 50, 30], // percentages
  minSize: [200, 400, 300], // pixels
  gutterSize: 8,
  onDragEnd: (sizes) => {
    localStorage.setItem('paneSizes', JSON.stringify(sizes));
  }
});
```

### State Persistence

Save to localStorage:

```javascript
const state = {
  paneSizes: [20, 50, 30],
  leftPaneCollapsed: false,
  rightPaneCollapsed: false,
  selectedDataset: 'Sales.csv',
  chatHistory: [...],
  timeline: [...]
};

localStorage.setItem('chartspec-state', JSON.stringify(state));
```

### Web Workers for Heavy Ops

```javascript
// main.js
const worker = new Worker('data-worker.js');

worker.postMessage({
  operation: 'profile',
  dataset: salesData,
  rowCount: 1200000
});

worker.onmessage = (e) => {
  const { profile } = e.data;
  updateUI(profile);
};
```

---

## Accessibility

### Keyboard Navigation

- **Tab** - Navigate between panes and interactive elements
- **Enter** - Activate buttons, expand/collapse sections
- **Arrow keys** - Navigate lists (datasets, timeline)
- **Escape** - Close modals, cancel operations

### Screen Readers

- Semantic HTML (`<nav>`, `<main>`, `<aside>`)
- ARIA labels for icons and actions
- Status announcements for operations
- Accessible data tables

### Color Contrast

- All text meets WCAG AA (4.5:1 for normal, 3:1 for large)
- Status pills have sufficient contrast
- Focus indicators visible and high-contrast

---

## Performance Budget

- **Initial load**: < 2s on 3G
- **Time to interactive**: < 3s
- **Dataset profile (1M rows)**: < 10s
- **Chart render (aggregated)**: < 500ms
- **UI response to interaction**: < 100ms

---

## Open Questions

1. **Should Views be a separate pane or part of Datasets?**
   - Leaning toward: Combined in LEFT pane, different icon

2. **How to handle multiple charts in Inspector?**
   - Option A: Tabs for each chart
   - Option B: Dropdown selector
   - Leaning toward: **Option A** (tabs)

3. **Should Timeline be always-visible or only a tab?**
   - Leaning toward: **Tab in MIDDLE**, but consider minimap

4. **What to show when no dataset is selected?**
   - Welcome screen with recent datasets?
   - Empty state with import prompt?

---

## Future Enhancements

### Version 2.0 Features

- **Multi-dataset joins** - Combine multiple datasets
- **Scheduled rollups** - Auto-refresh daily aggregates
- **Export workspace** - Share entire state as JSON
- **Collaborative features** - Multiple users, comments
- **Custom visualizations** - Plugin system for chart types

### Version 3.0 Vision

- **SQL interface** - For power users
- **Python notebook integration** - Embed code cells
- **Real-time data sources** - Connect to databases, APIs
- **AI-powered insights** - LLM analyzes data automatically

---

## Inspiration & References

- [GitHub Copilot Agent UI](https://github.com) - Technical, state-focused
- [Observable](https://observablehq.com) - Data exploration
- [Jupyter Lab](https://jupyterlab.readthedocs.io/) - Multi-pane workspace
- [Tableau](https://www.tableau.com) - Data source inventory
- [Mode Analytics](https://mode.com) - Query + viz workflow

---

## Appendix: Mockup Sketches

### Desktop Layout (1920x1080)

```
┌──────────────────────────────────────────────────────────────┐
│ ChartSpec                                    [Settings] [?]   │
├─────────────┬──────────────────────┬──────────────────────────┤
│ Datasets ▼  │ Chat | Data | Timeline        │ Preview | Spec │
│             │                               │                 │
│ 📊 Sales    │ User: Show revenue trends     │ [Line Chart]   │
│ Profiled    │                               │                 │
│ 125MB·1.2M  │ Agent: Creating rollup...     │ Revenue over   │
│             │                               │ time           │
│ 📊 Weather  │ [Rollup complete]             │                 │
│ Imported    │                               │ ⚠️ Downsampled  │
│ 8MB·50k     │ Ready to chart.               │ to 365 points  │
│             │ [Line] [Bar]                  │                 │
├─────────────┤                               │                 │
│ Views ▼     │                               ├─────────────────┤
│             │                               │ Data │ Insights │
│ + New View  │                               │                 │
├─────────────┤                               │ Source:         │
│ Artifacts ▼ │                               │ Sales.csv       │
│             │                               │                 │
│ revenue_by  │                               │ Rollup:         │
│ _day        │                               │ revenue_by_day  │
│ 365 rows    │                               │                 │
│             │                               │ 365 rows        │
└─────────────┴──────────────────────┴──────────────────────────┘
```

### Mobile Layout (375x667)

```
┌─────────────────────────┐
│ ChartSpec        [≡]    │
├─────────────────────────┤
│                         │
│ [Datasets ▼]            │
│                         │
│ 📊 Sales.csv            │
│ Profiled · 1.2M rows    │
│                         │
│ [Show Chart]            │
│                         │
├─────────────────────────┤
│ Chat                    │
│                         │
│ User: Revenue trends?   │
│                         │
│ Agent: Creating rollup  │
│ [Line] [Bar]            │
│                         │
└─────────────────────────┘
```

Mobile is **simplified, single-pane** with drawer navigation.

---

## Conclusion

This specification describes a **calm, professional, agent-inspired UI** for ChartSpec that prioritizes:

✅ **Clarity** - See what data exists and its state  
✅ **Traceability** - Understand what operations occurred  
✅ **Trust** - No magic, transparent lineage  
✅ **Performance** - Responsive, never freezing  

The three-pane layout separates concerns cleanly:
- **LEFT** - Inventory and state
- **MIDDLE** - Active work surface
- **RIGHT** - Detailed inspection

This design enables users to work with large datasets confidently, understand their data before visualizing, and trust the system's operations.
