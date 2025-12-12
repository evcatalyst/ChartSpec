# Smart Mode Feature Documentation

## Overview

Smart Mode is a new API-less demo option for ChartSpec that enables users to create visualizations using natural language commands without requiring an LLM API key. It combines:

1. **AVA (AntV) Integration** - Intelligent chart type recommendations based on data characteristics
2. **Local Language Parser** - In-browser command parsing with discrete vocabulary
3. **Interactive Guidance** - Tooltips, suggestions, and vocabulary help

## Features

### 1. Intelligent Chart Selection with AVA

Smart Mode integrates AVA (Automated Visual Analytics) from AntV to provide data-driven chart recommendations:

- Analyzes data structure (numeric vs categorical columns, row count, date columns)
- Recommends optimal chart types based on visualization best practices
- Provides reasoning for recommendations
- Falls back to heuristic-based recommendations if AVA is unavailable

### 2. Local Language Parser

A built-in natural language parser understands commands without external APIs:

**Supported Vocabulary:**

#### Chart Types
- `bar` / `column` - Bar charts
- `line` / `trend` - Line charts  
- `scatter` / `plot` - Scatter plots
- `pie` / `donut` - Pie charts
- `histogram` - Histograms
- `box` / `boxplot` - Box plots
- `heatmap` / `matrix` - Heatmaps
- `table` / `grid` - Data tables

#### Operations
- `show` / `display` / `visualize` - Show data
- `filter` / `where` - Filter data
- `group by` - Group and aggregate
- `sort` / `order` - Sort results
- `top N` / `first N` - Limit results

#### Aggregations
- `sum` / `total` - Sum values
- `average` / `mean` - Average values
- `count` - Count rows
- `min` / `minimum` - Minimum value
- `max` / `maximum` - Maximum value

### 3. Interactive Guidance

**Command Suggestions:**
- Real-time suggestions appear as you type
- Click suggestions to auto-complete commands
- Contextual to your selected dataset

**Vocabulary Help Modal:**
- Complete reference of all supported commands
- Examples for common use cases
- Accessible via "View Commands" link

## Usage

### Enabling Smart Mode

1. Select a dataset from the Dataset panel
2. Check the "Smart Mode (AVA-Powered)" checkbox in LLM Settings
3. The chat interface will show command suggestions

### Example Commands

```
show bar chart of Revenue by Region
display line chart of Temperature
show pie chart grouped by Product
show top 10 by Revenue descending
filter where Region equals North
```

### Command Structure

Smart Mode understands flexible command patterns:

1. **Basic visualization:**
   `show [chart type] of [column]`
   
2. **With grouping:**
   `show [chart type] of [column] by [group column]`
   
3. **With aggregation:**
   `show [aggregation] of [column] by [group column]`
   
4. **With sorting and limiting:**
   `show top [N] [chart type] by [column] [ascending/descending]`

### Confidence Scoring

Each parsed command receives a confidence score (0-100%):
- Higher scores indicate better command understanding
- Scores are displayed in the chat response
- AVA recommendations boost confidence by +25%

## Implementation Details

### Architecture

```
User Input
    ↓
Language Parser (languageParser.js)
    ↓
AVA Enhancement (avaIntegration.js)
    ↓
ChartSpec Generation (commandToSpec)
    ↓
Data Engine (applySpecToRows)
    ↓
Renderer (PlotlyRenderer/D3Renderer)
    ↓
Visualization
```

### Module Files

- **chartspec/languageParser.js** - Natural language command parsing
- **chartspec/avaIntegration.js** - AVA integration and fallback heuristics
- **chartspec/main.js** - Smart Mode integration and UI handling

### Smart Mode vs Other Modes

| Feature | Smart Mode | LLM Mode | Local Mode |
|---------|------------|----------|------------|
| API Key Required | No | Yes | No |
| Natural Language | Limited vocabulary | Full NL | No |
| Chart Recommendations | AVA-powered | LLM-based | Manual |
| Offline Capable | Yes | No | Yes |
| Flexibility | Medium | High | Low |

## Benefits

1. **No API Costs** - Completely free to use, no API keys needed
2. **Privacy** - All processing happens in browser, no data sent to external services
3. **Speed** - Instant responses, no network latency
4. **Learning** - Vocabulary help teaches users the command structure
5. **Intelligent** - AVA provides data-driven chart recommendations

## Limitations

1. **Limited Vocabulary** - Only supports predefined command patterns
2. **Simpler Queries** - Cannot handle complex multi-step transformations
3. **AVA Dependency** - Requires AVA CDN to be accessible for full functionality
4. **Column Name Matching** - Works best with simple, descriptive column names

## Future Enhancements

- Expand vocabulary with more command patterns
- Add support for multiple filters and complex conditions
- Implement query builder UI for visual command construction
- Add command history and favorites
- Support for saved command templates
- Multi-language support for international users

## Technical Notes

### AVA Availability Detection

The system checks if AVA is loaded:
```javascript
function isAvaAvailable() {
  return typeof window !== 'undefined' && window.AVA && window.AVA.Advisor;
}
```

If AVA is unavailable, the system falls back to heuristic-based recommendations based on data characteristics.

### Command Parsing Algorithm

1. Normalize input (lowercase, trim)
2. Tokenize into words
3. Match chart types against vocabulary
4. Detect operations and aggregations
5. Extract column names from input
6. Apply contextual rules (e.g., "by" indicates grouping)
7. Calculate confidence score based on matches
8. Enhance with AVA if available

### Heuristic Fallback Rules

When AVA is unavailable:
- Date column + numeric → Line chart
- 1 categorical + 1 numeric → Bar chart
- 2+ numeric columns → Scatter plot
- Few categories (≤10) → Pie chart
- Many rows + 1 numeric → Histogram
- Default → Bar chart

## Browser Compatibility

Smart Mode requires:
- ES6 Module support
- Modern JavaScript (arrow functions, template literals, etc.)
- LocalStorage API
- Recommended: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

## Security

- All processing happens client-side
- No data sent to external servers (when AVA loads from CDN)
- No API keys or credentials required
- Safe for sensitive data

## Examples

### Sales Analysis
```
show bar chart of Revenue by Region
show top 5 products by Revenue descending
show line chart of Revenue grouped by Date
```

### Weather Data
```
show line chart of Temperature
show scatter plot of Temperature vs Humidity
show box plot of Temperature by City
```

### General Exploration
```
show table
show histogram of Age
show pie chart grouped by Category
```

---

**Note:** Smart Mode is designed as a demo/educational tool and API-less alternative. For production use cases with complex requirements, LLM Mode provides more flexibility and power.
