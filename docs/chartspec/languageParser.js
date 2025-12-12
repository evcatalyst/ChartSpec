// Local language parser for API-less chart commands
// Provides discrete vocabulary for chart navigation and creation

/**
 * Chart command vocabulary and patterns
 */
export const vocabulary = {
  chartTypes: {
    bar: ['bar', 'bars', 'column', 'columns'],
    line: ['line', 'lines', 'trend', 'trends'],
    scatter: ['scatter', 'plot', 'points', 'dots'],
    pie: ['pie', 'donut', 'circle'],
    histogram: ['histogram', 'distribution', 'frequency'],
    box: ['box', 'boxplot', 'quartile'],
    heatmap: ['heatmap', 'matrix', 'heat'],
    table: ['table', 'grid', 'list']
  },
  
  operations: {
    show: ['show', 'display', 'visualize', 'plot', 'chart', 'create', 'make', 'draw'],
    filter: ['filter', 'where', 'only', 'exclude'],
    groupBy: ['group', 'grouped', 'by', 'aggregate'],
    sort: ['sort', 'order', 'arrange'],
    limit: ['top', 'first', 'limit', 'head']
  },
  
  aggregations: {
    sum: ['sum', 'total', 'add'],
    mean: ['average', 'mean', 'avg'],
    count: ['count', 'number'],
    min: ['minimum', 'min', 'lowest'],
    max: ['maximum', 'max', 'highest']
  },
  
  directions: {
    asc: ['ascending', 'asc', 'lowest', 'smallest'],
    desc: ['descending', 'desc', 'highest', 'largest', 'biggest']
  }
};

/**
 * Parse user input into ChartSpec components
 * @param {string} input - User's natural language input
 * @param {Array} columns - Available column names
 * @returns {Object} Parsed components
 */
export function parseCommand(input, columns) {
  const normalized = input.toLowerCase().trim();
  const tokens = normalized.split(/\s+/);
  
  const result = {
    chartType: null,
    operation: null,
    xColumn: null,
    yColumn: null,
    groupColumn: null,
    filterColumn: null,
    filterValue: null,
    aggregation: null,
    sortColumn: null,
    sortOrder: null,
    limit: null,
    confidence: 0
  };
  
  // Detect chart type
  for (const [type, keywords] of Object.entries(vocabulary.chartTypes)) {
    if (keywords.some(kw => normalized.includes(kw))) {
      result.chartType = type;
      result.confidence += 20;
      break;
    }
  }
  
  // Detect operation
  for (const [op, keywords] of Object.entries(vocabulary.operations)) {
    if (keywords.some(kw => tokens.includes(kw))) {
      result.operation = op;
      result.confidence += 10;
      break;
    }
  }
  
  // Detect aggregation
  for (const [agg, keywords] of Object.entries(vocabulary.aggregations)) {
    if (keywords.some(kw => normalized.includes(kw))) {
      result.aggregation = agg;
      result.confidence += 15;
      break;
    }
  }
  
  // Detect columns (case-insensitive match)
  const columnMatches = columns.filter(col => 
    normalized.includes(col.toLowerCase())
  );
  
  if (columnMatches.length > 0) {
    result.confidence += 15 * columnMatches.length;
    
    // Smart column assignment based on context
    if (columnMatches.length === 1) {
      // Single column - likely y-axis or group
      if (result.chartType === 'pie') {
        result.groupColumn = columnMatches[0];
      } else {
        result.yColumn = columnMatches[0];
      }
    } else if (columnMatches.length === 2) {
      // Two columns - x and y
      result.xColumn = columnMatches[0];
      result.yColumn = columnMatches[1];
    } else if (columnMatches.length > 2) {
      // Multiple columns - use first two for x/y
      result.xColumn = columnMatches[0];
      result.yColumn = columnMatches[1];
    }
  }
  
  // Detect "by" pattern for grouping
  const byIndex = tokens.indexOf('by');
  if (byIndex !== -1 && byIndex < tokens.length - 1) {
    const nextToken = tokens[byIndex + 1];
    const matchingColumn = columns.find(col => 
      col.toLowerCase() === nextToken || 
      col.toLowerCase().includes(nextToken)
    );
    if (matchingColumn) {
      result.groupColumn = matchingColumn;
      result.confidence += 10;
    }
  }
  
  // Detect sort order
  for (const [order, keywords] of Object.entries(vocabulary.directions)) {
    if (keywords.some(kw => normalized.includes(kw))) {
      result.sortOrder = order;
      result.confidence += 5;
      break;
    }
  }
  
  // Detect numeric limit (e.g., "top 5", "first 10")
  const numberMatch = normalized.match(/\b(\d+)\b/);
  if (numberMatch && (normalized.includes('top') || normalized.includes('first') || normalized.includes('limit'))) {
    result.limit = parseInt(numberMatch[1]);
    result.confidence += 5;
  }
  
  return result;
}

/**
 * Convert parsed command to ChartSpec
 * @param {Object} parsed - Parsed command components
 * @param {Array} columns - Available columns
 * @returns {Object} ChartSpec object
 */
export function commandToSpec(parsed, columns) {
  const spec = {
    title: '',
    chartType: parsed.chartType || 'bar',
    config: { responsive: true }
  };
  
  // Set x and y axes
  if (parsed.xColumn) {
    spec.x = parsed.xColumn;
  } else if (parsed.groupColumn) {
    spec.x = parsed.groupColumn;
  } else if (columns.length > 0) {
    // Default to first column
    spec.x = columns[0];
  }
  
  if (parsed.yColumn) {
    spec.y = parsed.yColumn;
  } else if (columns.length > 1) {
    // Default to second column
    spec.y = columns[1];
  }
  
  // Add grouping if specified
  if (parsed.groupColumn && parsed.aggregation) {
    spec.groupBy = {
      columns: [parsed.groupColumn],
      aggregations: {
        [spec.y]: { func: parsed.aggregation }
      }
    };
  }
  
  // Add sorting if specified
  if (parsed.sortOrder && spec.y) {
    spec.sort = {
      column: spec.y,
      order: parsed.sortOrder
    };
  }
  
  // Add limit if specified
  if (parsed.limit) {
    spec.limit = parsed.limit;
  }
  
  // Generate title
  spec.title = generateTitle(spec);
  
  return spec;
}

/**
 * Generate a human-readable title from spec
 * @param {Object} spec - ChartSpec
 * @returns {string} Generated title
 */
function generateTitle(spec) {
  const parts = [];
  
  if (spec.y) parts.push(spec.y);
  if (spec.x) parts.push(`by ${spec.x}`);
  if (spec.groupBy) parts.push('(grouped)');
  
  return parts.join(' ') || 'Chart';
}

/**
 * Get suggestions for partial input
 * @param {string} input - Partial user input
 * @param {Array} columns - Available columns
 * @returns {Array} Array of suggestion strings
 */
export function getSuggestions(input, columns) {
  const normalized = input.toLowerCase().trim();
  const suggestions = [];
  
  if (normalized.length < 2) {
    return [
      'show bar chart',
      'show line chart',
      'show pie chart',
      'show table'
    ];
  }
  
  // Suggest chart types
  for (const [type, keywords] of Object.entries(vocabulary.chartTypes)) {
    if (keywords.some(kw => kw.startsWith(normalized) || normalized.includes(kw))) {
      suggestions.push(`show ${type} chart`);
    }
  }
  
  // Suggest column-based commands
  columns.forEach(col => {
    if (col.toLowerCase().includes(normalized)) {
      suggestions.push(`show ${col} by ...`);
      suggestions.push(`filter by ${col}`);
    }
  });
  
  return suggestions.slice(0, 5);
}

/**
 * Get command vocabulary help
 * @returns {Object} Help documentation
 */
export function getCommandHelp() {
  return {
    title: 'Command Vocabulary',
    sections: [
      {
        title: 'Chart Types',
        commands: [
          'bar / column - Create a bar chart',
          'line / trend - Create a line chart',
          'scatter / plot - Create a scatter plot',
          'pie / donut - Create a pie chart',
          'histogram - Create a histogram',
          'box / boxplot - Create a box plot',
          'heatmap / matrix - Create a heatmap',
          'table / grid - Show as table'
        ]
      },
      {
        title: 'Operations',
        commands: [
          'show / display - Show data',
          'filter / where - Filter data',
          'group by - Group and aggregate',
          'sort / order - Sort results',
          'top N / first N - Limit results'
        ]
      },
      {
        title: 'Aggregations',
        commands: [
          'sum / total - Sum values',
          'average / mean - Average values',
          'count - Count rows',
          'min / minimum - Minimum value',
          'max / maximum - Maximum value'
        ]
      },
      {
        title: 'Examples',
        commands: [
          'show bar chart of Revenue by Region',
          'display line chart of Temperature',
          'show pie chart grouped by Product',
          'show top 10 by Revenue descending',
          'filter where Region equals North'
        ]
      }
    ]
  };
}
