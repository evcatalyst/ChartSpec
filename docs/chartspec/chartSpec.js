// ChartSpec schema definition and default specification

export const ChartSpec = {
  // Schema describing the structure of a chart specification
  schema: {
    title: "string (optional) - Chart title",
    description: "string (optional) - Chart description",
    
    filters: "array (optional) - Data filters to apply before charting",
    // Filter types:
    // - { type: 'array', column: string, values: array }
    // - { type: 'equality', column: string, value: any }
    // - { type: 'op', column: string, operator: '>|<|>=|<=|!=', value: number }
    
    groupBy: "object (optional) - Group and aggregate data",
    // { columns: [string], aggregations: { column: { func: 'sum|mean|count|min|max' } } }
    
    sort: "object (optional) - Sort results",
    // { column: string, order: 'asc|desc' }
    
    limit: "number (optional) - Limit number of rows",
    
    chartType: "string - Plotly chart type or special types",
    // Plotly types: 'scatter', 'bar', 'line', 'pie', 'histogram', 'box', 'heatmap', etc.
    // Special types: 'table', 'pivot', 'tableOnly'
    
    x: "string - Column for x-axis",
    y: "string|array - Column(s) for y-axis",
    color: "string (optional) - Column for color grouping",
    size: "string (optional) - Column for size (scatter plots)",
    
    facet: "object (optional) - Create small multiples",
    // { column: string, wrap: number }
    
    layout: "object (optional) - Plotly layout options",
    config: "object (optional) - Plotly config options"
  }
};

export const defaultSpec = {
  title: "",
  description: "",
  filters: [],
  groupBy: null,
  sort: null,
  limit: null,
  chartType: "bar",
  x: "",
  y: "",
  color: null,
  size: null,
  facet: null,
  layout: {},
  config: { responsive: true }
};
