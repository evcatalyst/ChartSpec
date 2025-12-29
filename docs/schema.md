# ChartSpec Schema Documentation

## What You'll Learn

This guide covers:
- Complete ChartSpec JSON field reference
- Valid values and types for each field
- Examples for all supported chart types
- Data transformation options (filters, groupBy, sort, limit)
- Encodings (x, y, color, size, facet)
- Common failure modes and how to avoid them

## Schema Overview

ChartSpec is a JSON specification that describes how to transform data and render a chart. The LLM generates these specifications from natural language, but you can also create or edit them manually in Local Mode.

### Minimal Valid Spec

```json
{
  "chartType": "bar",
  "x": "Region",
  "y": "Revenue"
}
```

### Complete Spec with All Fields

```json
{
  "title": "Revenue by Region",
  "description": "Shows total revenue grouped by sales region",
  "filters": [
    { "type": "array", "column": "Region", "values": ["North", "South"] }
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
  "size": null,
  "facet": { "column": "Year", "wrap": 3 },
  "layout": {},
  "config": { "responsive": true }
}
```

## Field Reference

### title (optional)
**Type:** `string`  
**Description:** Chart title displayed above the visualization  
**Default:** Empty string

**Examples:**
```json
"title": "Revenue by Region"
"title": "Temperature Trends Over Time"
"title": ""
```

### description (optional)
**Type:** `string`  
**Description:** Additional context or explanation for the chart  
**Default:** Empty string

**Examples:**
```json
"description": "Shows total revenue grouped by sales region"
"description": "Daily temperature measurements for major cities"
"description": ""
```

### filters (optional)
**Type:** `array` of filter objects  
**Description:** Data filters applied before grouping or charting  
**Default:** `[]`

ChartSpec supports three filter types:

#### Array Filter
Match rows where column value is in the provided array.

```json
{
  "type": "array",
  "column": "Region",
  "values": ["North", "South", "East"]
}
```

#### Equality Filter
Match rows where column value exactly equals the provided value.

```json
{
  "type": "equality",
  "column": "Product",
  "value": "Widget A"
}
```

#### Operator Filter
Match rows where column value satisfies a numeric comparison.

```json
{
  "type": "op",
  "column": "Revenue",
  "operator": ">",
  "value": 1000
}
```

**Supported operators:** `>`, `<`, `>=`, `<=`, `!=`

**Multiple Filters:**
Filters are combined with AND logic (all must match).

```json
"filters": [
  { "type": "array", "column": "Region", "values": ["North", "South"] },
  { "type": "op", "column": "Revenue", "operator": ">", "value": 500 }
]
```

**Failure Mode:** If filter column doesn't exist, rows are not filtered (graceful degradation).

### groupBy (optional)
**Type:** `object` with `columns` and `aggregations`  
**Description:** Groups rows and applies aggregation functions  
**Default:** `null`

```json
{
  "groupBy": {
    "columns": ["Region", "Product"],
    "aggregations": {
      "Revenue": { "func": "sum" },
      "Quantity": { "func": "mean" }
    }
  }
}
```

**Supported aggregation functions:**
- `sum` - Sum of all values
- `mean` - Average of all values
- `count` - Count of rows in group
- `min` - Minimum value
- `max` - Maximum value

**How it works:**
1. Rows are grouped by unique combinations of `columns` values
2. For each aggregated column, the specified function is applied to that group
3. Result is one row per unique group

**Failure Mode:** If aggregation column doesn't exist or contains non-numeric values, result is 0 or NaN.

### sort (optional)
**Type:** `object` with `column` and `order`  
**Description:** Sorts the data before limiting or charting  
**Default:** `null`

```json
{
  "sort": {
    "column": "Revenue",
    "order": "desc"
  }
}
```

**Valid orders:** `asc` (ascending), `desc` (descending)

**Failure Mode:** If sort column doesn't exist, data is not sorted.

### limit (optional)
**Type:** `number`  
**Description:** Limits the number of rows displayed (applied after sorting)  
**Default:** `null` (no limit)

```json
"limit": 10
"limit": 100
"limit": null
```

**Common use case:** Show "Top 10" by sorting descending and limiting to 10.

### chartType (required)
**Type:** `string`  
**Description:** Type of visualization to render  
**Default:** `"bar"`

**Supported types:**
- `bar` - Bar chart (vertical bars)
- `line` - Line chart (connected points)
- `scatter` - Scatter plot (individual points)
- `pie` - Pie chart (proportional slices)
- `histogram` - Histogram (binned frequency)
- `box` - Box plot (distribution summary)
- `heatmap` - Heatmap (2D color-coded grid)
- `table` - Data table (chart + table)
- `tableOnly` - Table only (no chart)
- `pivot` - Pivot table

**Failure Mode:** If chartType is not recognized, renderer may fall back to table view or show an error.

### x (required for most chart types)
**Type:** `string`  
**Description:** Column name for x-axis  
**Default:** `""`

```json
"x": "Region"
"x": "Date"
"x": "Category"
```

**Failure Mode:** If column doesn't exist, chart will not render and console will show error.

### y (required for most chart types)
**Type:** `string` or `array` of strings  
**Description:** Column name(s) for y-axis  
**Default:** `""`

**Single column:**
```json
"y": "Revenue"
```

**Multiple columns (line/bar charts):**
```json
"y": ["Revenue", "Profit", "Cost"]
```

**Failure Mode:** If column doesn't exist, chart will not render or show partial data.

### color (optional)
**Type:** `string`  
**Description:** Column for color grouping/categorization  
**Default:** `null`

```json
"color": "Product"
"color": "Region"
"color": null
```

**How it works:** Different values in the color column get different colors in the chart.

**Failure Mode:** If column doesn't exist, color grouping is ignored.

### size (optional)
**Type:** `string`  
**Description:** Column for point size (scatter plots only)  
**Default:** `null`

```json
"size": "Quantity"
"size": "Population"
"size": null
```

**How it works:** Larger values in the size column create larger points.

**Failure Mode:** If column doesn't exist or chart type doesn't support size, this is ignored.

### facet (optional)
**Type:** `object` with `column` and `wrap`  
**Description:** Creates small multiples (separate charts for each facet value)  
**Default:** `null`

```json
{
  "facet": {
    "column": "Year",
    "wrap": 3
  }
}
```

**How it works:**
- Data is split by unique values in `column`
- A separate chart is created for each value
- Charts are arranged in a grid with `wrap` columns

**Failure Mode:** If facet column doesn't exist, single chart is rendered.

### layout (optional)
**Type:** `object`  
**Description:** Plotly-specific layout options (advanced)  
**Default:** `{}`

```json
{
  "layout": {
    "xaxis": { "title": "Sales Region" },
    "yaxis": { "title": "Revenue ($)" },
    "showlegend": true
  }
}
```

**Note:** This is passed directly to Plotly. See [Plotly documentation](https://plotly.com/javascript/reference/layout/) for options.

### config (optional)
**Type:** `object`  
**Description:** Plotly-specific config options  
**Default:** `{ "responsive": true }`

```json
{
  "config": {
    "responsive": true,
    "displayModeBar": false
  }
}
```

**Note:** This is passed directly to Plotly. See [Plotly documentation](https://plotly.com/javascript/configuration-options/) for options.

## Complete Examples by Chart Type

### Bar Chart
```json
{
  "title": "Revenue by Region",
  "chartType": "bar",
  "x": "Region",
  "y": "Revenue",
  "groupBy": {
    "columns": ["Region"],
    "aggregations": {
      "Revenue": { "func": "sum" }
    }
  },
  "sort": { "column": "Revenue", "order": "desc" },
  "config": { "responsive": true }
}
```

### Line Chart
```json
{
  "title": "Temperature Trends Over Time",
  "chartType": "line",
  "x": "Date",
  "y": "Temperature",
  "color": "City",
  "config": { "responsive": true }
}
```

### Scatter Plot
```json
{
  "title": "Temperature vs Humidity by City",
  "chartType": "scatter",
  "x": "Temperature",
  "y": "Humidity",
  "color": "City",
  "size": "Precipitation",
  "config": { "responsive": true }
}
```

### Pie Chart
```json
{
  "title": "Revenue Distribution by Product",
  "chartType": "pie",
  "x": "Product",
  "y": "Revenue",
  "groupBy": {
    "columns": ["Product"],
    "aggregations": {
      "Revenue": { "func": "sum" }
    }
  },
  "config": { "responsive": true }
}
```

### Histogram
```json
{
  "title": "Distribution of Revenue",
  "chartType": "histogram",
  "x": "Revenue",
  "config": { "responsive": true }
}
```

### Box Plot
```json
{
  "title": "Temperature Distribution by City",
  "chartType": "box",
  "x": "City",
  "y": "Temperature",
  "config": { "responsive": true }
}
```

### Heatmap
```json
{
  "title": "Sales Heatmap: Region vs Product",
  "chartType": "heatmap",
  "x": "Region",
  "y": "Product",
  "color": "Revenue",
  "groupBy": {
    "columns": ["Region", "Product"],
    "aggregations": {
      "Revenue": { "func": "sum" }
    }
  },
  "config": { "responsive": true }
}
```

### Faceted Chart
```json
{
  "title": "Revenue by Region (by Product)",
  "chartType": "bar",
  "x": "Region",
  "y": "Revenue",
  "facet": {
    "column": "Product",
    "wrap": 2
  },
  "groupBy": {
    "columns": ["Region", "Product"],
    "aggregations": {
      "Revenue": { "func": "sum" }
    }
  },
  "config": { "responsive": true }
}
```

### Table (with chart)
```json
{
  "title": "Revenue Summary",
  "chartType": "table",
  "x": "Region",
  "y": "Revenue",
  "groupBy": {
    "columns": ["Region"],
    "aggregations": {
      "Revenue": { "func": "sum" }
    }
  },
  "sort": { "column": "Revenue", "order": "desc" },
  "limit": 10
}
```

### Table Only
```json
{
  "title": "Sales Data",
  "chartType": "tableOnly",
  "filters": [
    { "type": "array", "column": "Region", "values": ["North", "South"] }
  ],
  "sort": { "column": "Revenue", "order": "desc" },
  "limit": 20
}
```

## Common Patterns

### Top N with Sorting and Limiting
```json
{
  "title": "Top 10 Products by Revenue",
  "chartType": "bar",
  "x": "Product",
  "y": "Revenue",
  "groupBy": {
    "columns": ["Product"],
    "aggregations": {
      "Revenue": { "func": "sum" }
    }
  },
  "sort": { "column": "Revenue", "order": "desc" },
  "limit": 10
}
```

### Filtered and Grouped
```json
{
  "title": "North & South Revenue by Product",
  "chartType": "bar",
  "x": "Product",
  "y": "Revenue",
  "filters": [
    { "type": "array", "column": "Region", "values": ["North", "South"] }
  ],
  "groupBy": {
    "columns": ["Product"],
    "aggregations": {
      "Revenue": { "func": "sum" }
    }
  }
}
```

### Multi-Column Y-Axis
```json
{
  "title": "Revenue and Quantity Trends",
  "chartType": "line",
  "x": "Date",
  "y": ["Revenue", "Quantity"],
  "color": "Region"
}
```

## Validation and Failure Modes

### Invalid ChartSpec - Missing Required Fields
**Symptom:** Chart doesn't render, error in console  
**Cause:** Missing `chartType`, `x`, or `y` (for most chart types)  
**Solution:** Ensure all required fields are present

### Invalid ChartSpec - Column Mismatch
**Symptom:** Chart doesn't render, "column not found" error  
**Cause:** ChartSpec references column names that don't exist in the dataset  
**Solution:** Check dataset columns (case-sensitive), update spec to match exact column names

### Invalid ChartSpec - Wrong Chart Type
**Symptom:** Unexpected visualization or error  
**Cause:** ChartSpec uses unsupported chartType  
**Solution:** Use one of the valid chart types listed above

### Invalid Data - Non-Numeric Aggregation
**Symptom:** Chart shows 0 or NaN values  
**Cause:** Aggregation applied to non-numeric column  
**Solution:** Ensure aggregated columns contain numeric data

### Invalid Data - Missing Values
**Symptom:** Gaps or missing points in chart  
**Cause:** Dataset has null/undefined values in key columns  
**Solution:** Clean data or use filters to exclude rows with missing values

### Invalid Filters
**Symptom:** All data filtered out, empty chart  
**Cause:** Filter conditions too restrictive  
**Solution:** Review filter values, ensure they match actual data values (case-sensitive)

## Tips and Best Practices

1. **Start simple:** Begin with minimal spec (chartType, x, y), add features incrementally
2. **Validate columns:** Always check dataset columns before referencing in spec
3. **Use groupBy wisely:** Aggregation is powerful but can hide detail - use facets for drill-down
4. **Sort before limit:** Always sort before limiting to get "Top N" results
5. **Test in Local Mode:** Use Local Mode to quickly iterate on spec without LLM calls
6. **Use descriptive titles:** Good titles make charts self-explanatory
7. **Consider faceting:** Small multiples often reveal patterns better than color grouping

## Next Steps

- **[Architecture Guide](architecture.md)** - Learn how ChartSpec transforms specs into charts
- **[Testing Guide](testing.md)** - Test your custom specs
- **[Dataset Management](datasets.md)** - Work with different datasets
- **[Back to Index](index.md)** - Documentation hub

---

**Navigation:** [← Back to Index](index.md) | [Architecture →](architecture.md)
