// AVA (AntV) Integration for Intelligent Chart Recommendations
// Uses AVA's Chart Advisor for data-driven chart type selection

/**
 * Check if AVA library is available
 * @returns {boolean} True if AVA is loaded
 */
export function isAvaAvailable() {
  return typeof window !== 'undefined' && window.AVA && window.AVA.Advisor;
}

/**
 * Get chart recommendation from AVA
 * @param {Array} data - Dataset rows
 * @param {Object} options - Additional options
 * @returns {Object} Recommended chart configuration
 */
export function getAvaRecommendation(data, options = {}) {
  if (!isAvaAvailable()) {
    console.warn('AVA library not loaded, falling back to heuristics');
    return getHeuristicRecommendation(data, options);
  }
  
  try {
    const advisor = new window.AVA.Advisor();
    const results = advisor.advise({ 
      data,
      options: {
        purpose: options.purpose || 'Comparison',
        preferences: options.preferences || {}
      }
    });
    
    if (results && results.length > 0) {
      const topRecommendation = results[0];
      
      return {
        chartType: mapAvaChartType(topRecommendation.type),
        score: topRecommendation.score || 1.0,
        reasoning: topRecommendation.reasoning || 'AVA recommendation',
        config: topRecommendation.spec || {}
      };
    }
  } catch (error) {
    console.error('AVA recommendation error:', error);
    return getHeuristicRecommendation(data, options);
  }
  
  return getHeuristicRecommendation(data, options);
}

/**
 * Map AVA chart type to ChartSpec chart type
 * @param {string} avaType - AVA chart type
 * @returns {string} ChartSpec chart type
 */
function mapAvaChartType(avaType) {
  const typeMap = {
    'bar_chart': 'bar',
    'column_chart': 'bar',
    'line_chart': 'line',
    'scatter_plot': 'scatter',
    'pie_chart': 'pie',
    'histogram': 'histogram',
    'box_plot': 'box',
    'heatmap': 'heatmap',
    'table': 'table'
  };
  
  return typeMap[avaType] || avaType;
}

/**
 * Heuristic-based chart recommendation (fallback when AVA not available)
 * @param {Array} data - Dataset rows
 * @param {Object} options - Additional options
 * @returns {Object} Recommended chart configuration
 */
function getHeuristicRecommendation(data, options = {}) {
  if (!data || data.length === 0) {
    return {
      chartType: 'table',
      score: 0.5,
      reasoning: 'No data available, showing table',
      config: {}
    };
  }
  
  // Analyze data structure
  const analysis = analyzeData(data);
  
  // Decision tree for chart type
  let chartType = 'bar';
  let reasoning = '';
  
  if (analysis.numericColumns === 0) {
    chartType = 'table';
    reasoning = 'No numeric columns, showing table';
  } else if (analysis.hasDateColumn && analysis.numericColumns >= 1) {
    chartType = 'line';
    reasoning = 'Time series data detected, recommending line chart';
  } else if (analysis.categoricalColumns === 1 && analysis.numericColumns === 1) {
    chartType = 'bar';
    reasoning = 'One category, one value - bar chart is ideal';
  } else if (analysis.numericColumns >= 2 && analysis.rowCount <= 100) {
    chartType = 'scatter';
    reasoning = 'Multiple numeric columns, scatter plot shows relationships';
  } else if (analysis.categoricalColumns >= 1 && analysis.distinctValues <= 10) {
    chartType = 'pie';
    reasoning = 'Few categories, pie chart shows distribution';
  } else if (analysis.numericColumns === 1 && analysis.rowCount > 50) {
    chartType = 'histogram';
    reasoning = 'Single numeric column with many rows, histogram shows distribution';
  } else {
    chartType = 'bar';
    reasoning = 'Default to bar chart for general comparison';
  }
  
  return {
    chartType,
    score: 0.7,
    reasoning,
    config: {}
  };
}

/**
 * Analyze data structure for recommendation
 * @param {Array} data - Dataset rows
 * @returns {Object} Data analysis results
 */
function analyzeData(data) {
  if (!data || data.length === 0) {
    return {
      rowCount: 0,
      numericColumns: 0,
      categoricalColumns: 0,
      hasDateColumn: false,
      distinctValues: 0
    };
  }
  
  const firstRow = data[0];
  const columns = Object.keys(firstRow);
  
  let numericColumns = 0;
  let categoricalColumns = 0;
  let hasDateColumn = false;
  let distinctValues = 0;
  
  columns.forEach(col => {
    const values = data.map(row => row[col]);
    const uniqueValues = new Set(values).size;
    
    // Check if numeric
    const numericValues = values.filter(v => !isNaN(parseFloat(v)) && isFinite(v));
    if (numericValues.length > values.length * 0.8) {
      numericColumns++;
    } else {
      categoricalColumns++;
      distinctValues = Math.max(distinctValues, uniqueValues);
    }
    
    // Check if date
    if (col.toLowerCase().includes('date') || col.toLowerCase().includes('time')) {
      hasDateColumn = true;
    }
  });
  
  return {
    rowCount: data.length,
    numericColumns,
    categoricalColumns,
    hasDateColumn,
    distinctValues
  };
}

/**
 * Get multiple chart recommendations with scores
 * @param {Array} data - Dataset rows
 * @param {number} count - Number of recommendations to return
 * @returns {Array} Array of recommendations
 */
export function getMultipleRecommendations(data, count = 3) {
  const primary = getAvaRecommendation(data);
  const analysis = analyzeData(data);
  
  const recommendations = [primary];
  
  // Add alternative recommendations
  const alternatives = [];
  
  if (analysis.numericColumns >= 2) {
    alternatives.push({
      chartType: 'scatter',
      score: 0.6,
      reasoning: 'Compare two numeric variables',
      config: {}
    });
  }
  
  if (analysis.hasDateColumn) {
    alternatives.push({
      chartType: 'line',
      score: 0.65,
      reasoning: 'Show trends over time',
      config: {}
    });
  }
  
  if (analysis.categoricalColumns >= 1) {
    alternatives.push({
      chartType: 'bar',
      score: 0.55,
      reasoning: 'Compare categories',
      config: {}
    });
  }
  
  // Always offer table as fallback
  alternatives.push({
    chartType: 'table',
    score: 0.5,
    reasoning: 'View raw data',
    config: {}
  });
  
  // Remove duplicates and sort by score
  const unique = alternatives.filter(alt => 
    alt.chartType !== primary.chartType
  );
  
  unique.sort((a, b) => b.score - a.score);
  
  return [...recommendations, ...unique].slice(0, count);
}

/**
 * Enhance parsed command with AVA recommendation
 * @param {Object} parsedCommand - Parsed command from language parser
 * @param {Array} data - Dataset rows
 * @returns {Object} Enhanced command with AVA insights
 */
export function enhanceWithAva(parsedCommand, data) {
  const recommendation = getAvaRecommendation(data);
  
  // If user didn't specify a chart type, use AVA's recommendation
  if (!parsedCommand.chartType) {
    parsedCommand.chartType = recommendation.chartType;
    parsedCommand.confidence += 25;
    parsedCommand.avaReasoning = recommendation.reasoning;
  } else {
    // User specified type, but record AVA's suggestion
    parsedCommand.avaAlternative = recommendation.chartType;
    parsedCommand.avaReasoning = recommendation.reasoning;
  }
  
  return parsedCommand;
}
