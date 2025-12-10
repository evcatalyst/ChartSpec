// Data transformation engine for filtering, grouping, and aggregation

/**
 * Apply filters to rows
 * @param {Array} rows - Array of data objects
 * @param {Array} filters - Array of filter specifications
 * @returns {Array} Filtered rows
 */
export function applyFilters(rows, filters) {
  if (!filters || filters.length === 0) return rows;
  
  return rows.filter(row => {
    return filters.every(filter => {
      const value = row[filter.column];
      
      switch (filter.type) {
        case 'array':
          // Check if value is in the array
          return filter.values.includes(value);
          
        case 'equality':
          // Exact match
          return value == filter.value;
          
        case 'op':
          // Numeric comparison operators
          const numValue = parseFloat(value);
          const numTarget = parseFloat(filter.value);
          switch (filter.operator) {
            case '>': return numValue > numTarget;
            case '<': return numValue < numTarget;
            case '>=': return numValue >= numTarget;
            case '<=': return numValue <= numTarget;
            case '!=': return numValue != numTarget;
            default: return true;
          }
          
        default:
          return true;
      }
    });
  });
}

/**
 * Group rows by columns and apply aggregations
 * @param {Array} rows - Array of data objects
 * @param {Object} groupBySpec - { columns: [...], aggregations: { col: { func: 'sum|mean|count|min|max' } } }
 * @returns {Array} Grouped and aggregated rows
 */
export function groupByAgg(rows, groupBySpec) {
  if (!groupBySpec || !groupBySpec.columns || groupBySpec.columns.length === 0) {
    return rows;
  }
  
  const { columns, aggregations } = groupBySpec;
  
  // Group rows by specified columns
  const groups = {};
  rows.forEach(row => {
    const key = columns.map(col => row[col]).join('|||');
    if (!groups[key]) {
      groups[key] = {
        rows: [],
        keyValues: {}
      };
      columns.forEach(col => {
        groups[key].keyValues[col] = row[col];
      });
    }
    groups[key].rows.push(row);
  });
  
  // Apply aggregations
  const result = [];
  Object.values(groups).forEach(group => {
    const aggregatedRow = { ...group.keyValues };
    
    if (aggregations) {
      Object.keys(aggregations).forEach(col => {
        const aggSpec = aggregations[col];
        const values = group.rows.map(r => parseFloat(r[col])).filter(v => !isNaN(v));
        
        switch (aggSpec.func) {
          case 'sum':
            aggregatedRow[col] = values.reduce((a, b) => a + b, 0);
            break;
          case 'mean':
            aggregatedRow[col] = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
            break;
          case 'count':
            aggregatedRow[col] = group.rows.length;
            break;
          case 'min':
            aggregatedRow[col] = values.length > 0 ? Math.min(...values) : 0;
            break;
          case 'max':
            aggregatedRow[col] = values.length > 0 ? Math.max(...values) : 0;
            break;
          default:
            aggregatedRow[col] = null;
        }
      });
    }
    
    result.push(aggregatedRow);
  });
  
  return result;
}

/**
 * Apply complete specification to rows (filter, group, sort, limit)
 * @param {Array} rows - Array of data objects
 * @param {Object} spec - ChartSpec object
 * @returns {Array} Transformed rows
 */
export function applySpecToRows(rows, spec) {
  let result = [...rows];
  
  // Apply filters
  if (spec.filters && spec.filters.length > 0) {
    result = applyFilters(result, spec.filters);
  }
  
  // Apply grouping and aggregation
  if (spec.groupBy) {
    result = groupByAgg(result, spec.groupBy);
  }
  
  // Apply sorting
  if (spec.sort && spec.sort.column) {
    result.sort((a, b) => {
      const aVal = a[spec.sort.column];
      const bVal = b[spec.sort.column];
      
      // Try numeric comparison first
      const aNum = parseFloat(aVal);
      const bNum = parseFloat(bVal);
      
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return spec.sort.order === 'desc' ? bNum - aNum : aNum - bNum;
      }
      
      // Fall back to string comparison
      const aStr = String(aVal);
      const bStr = String(bVal);
      
      if (spec.sort.order === 'desc') {
        return bStr.localeCompare(aStr);
      }
      return aStr.localeCompare(bStr);
    });
  }
  
  // Apply limit
  if (spec.limit && spec.limit > 0) {
    result = result.slice(0, spec.limit);
  }
  
  return result;
}
