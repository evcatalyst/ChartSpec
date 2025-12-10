// Chart renderer with Plotly integration and faceting support

/**
 * Group rows by facet column
 * @param {Array} rows - Array of data objects
 * @param {string} facetColumn - Column to facet by
 * @returns {Array} Array of { facetValue, rows } objects
 */
export function groupByFacets(rows, facetColumn) {
  if (!facetColumn) return [{ facetValue: null, rows }];
  
  const groups = {};
  rows.forEach(row => {
    const value = row[facetColumn];
    if (!groups[value]) {
      groups[value] = [];
    }
    groups[value].push(row);
  });
  
  return Object.keys(groups).map(value => ({
    facetValue: value,
    rows: groups[value]
  }));
}

/**
 * Render a single chart with Plotly
 * @param {HTMLElement} container - Container element
 * @param {Array} rows - Array of data objects
 * @param {Object} spec - ChartSpec object
 * @param {string} facetValue - Facet value for title (optional)
 */
export function renderSingleChart(container, rows, spec, facetValue = null) {
  // Handle special table types
  if (spec.chartType === 'table' || spec.chartType === 'tableOnly' || spec.chartType === 'pivot') {
    renderTable(container, rows, spec, facetValue);
    return;
  }
  
  // Check if Plotly is available - if not, fallback to table view
  if (typeof Plotly === 'undefined') {
    console.warn('Plotly is not available. Falling back to table view.');
    
    // Show warning message and render as table
    const warningDiv = document.createElement('div');
    warningDiv.className = 'plotly-fallback-warning';
    warningDiv.style.cssText = 'background: #fff3cd; border: 1px solid #ffc107; color: #856404; padding: 12px; margin-bottom: 12px; border-radius: 4px; font-size: 14px;';
    warningDiv.innerHTML = '<strong>⚠️ Plotly Not Available:</strong> Displaying data as a table instead. To see charts, ensure you have internet connectivity and reload the page.';
    container.appendChild(warningDiv);
    
    // Render as table
    const tableContainer = document.createElement('div');
    container.appendChild(tableContainer);
    renderTable(tableContainer, rows, { ...spec, chartType: 'table' }, facetValue);
    return;
  }
  
  // Prepare Plotly data
  const data = [];
  
  // Handle multiple y columns
  const yColumns = Array.isArray(spec.y) ? spec.y : [spec.y];
  
  yColumns.forEach(yCol => {
    const trace = {
      type: spec.chartType,
      name: yCol
    };
    
    // Set x and y data
    if (spec.x) {
      trace.x = rows.map(r => r[spec.x]);
    }
    trace.y = rows.map(r => r[yCol]);
    
    // Handle color grouping
    if (spec.color) {
      const colorValues = rows.map(r => r[spec.color]);
      
      // For scatter/line charts, split into separate traces by color
      if (spec.chartType === 'scatter' || spec.chartType === 'line') {
        const uniqueColors = [...new Set(colorValues)];
        uniqueColors.forEach(colorVal => {
          const filteredIndices = colorValues.map((v, i) => v === colorVal ? i : -1).filter(i => i >= 0);
          const colorTrace = {
            ...trace,
            name: `${yCol} - ${colorVal}`,
            x: filteredIndices.map(i => trace.x[i]),
            y: filteredIndices.map(i => trace.y[i])
          };
          data.push(colorTrace);
        });
        return; // Skip adding the main trace
      } else {
        // For bar/other charts, use marker colors
        trace.marker = { color: colorValues };
        trace.text = colorValues;
      }
    }
    
    // Handle size (for scatter plots)
    if (spec.size && spec.chartType === 'scatter') {
      trace.marker = trace.marker || {};
      trace.marker.size = rows.map(r => parseFloat(r[spec.size]) || 5);
    }
    
    data.push(trace);
  });
  
  // If color grouping was applied for scatter/line, data already has all traces
  // Otherwise, we have the traces from the loop above
  
  // Prepare layout
  const layout = {
    ...spec.layout,
    title: facetValue ? `${spec.title || ''} - ${facetValue}` : spec.title || '',
    xaxis: { title: spec.x || '' },
    yaxis: { title: Array.isArray(spec.y) ? spec.y.join(', ') : spec.y || '' },
    margin: { l: 50, r: 30, t: 50, b: 50 },
    autosize: true
  };
  
  // Prepare config
  const config = {
    responsive: true,
    ...spec.config
  };
  
  // Render with Plotly
  Plotly.newPlot(container, data, layout, config);
}

/**
 * Render a table view
 * @param {HTMLElement} container - Container element
 * @param {Array} rows - Array of data objects
 * @param {Object} spec - ChartSpec object
 * @param {string} facetValue - Facet value for title (optional)
 */
function renderTable(container, rows, spec, facetValue = null) {
  container.innerHTML = '';
  
  if (rows.length === 0) {
    container.innerHTML = '<p>No data to display</p>';
    return;
  }
  
  const title = document.createElement('h3');
  title.textContent = facetValue ? `${spec.title || 'Data'} - ${facetValue}` : spec.title || 'Data';
  container.appendChild(title);
  
  const table = document.createElement('table');
  table.className = 'data-table';
  
  // Header
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  const columns = Object.keys(rows[0]);
  columns.forEach(col => {
    const th = document.createElement('th');
    th.textContent = col;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);
  
  // Body
  const tbody = document.createElement('tbody');
  rows.forEach(row => {
    const tr = document.createElement('tr');
    columns.forEach(col => {
      const td = document.createElement('td');
      td.textContent = row[col];
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  
  container.appendChild(table);
}

/**
 * Main render function with faceting support
 * @param {HTMLElement} container - Container element
 * @param {Array} rows - Array of data objects
 * @param {Object} spec - ChartSpec object
 */
export function renderChart(container, rows, spec) {
  container.innerHTML = '';
  
  if (!rows || rows.length === 0) {
    container.innerHTML = '<p class="no-data">No data to display</p>';
    return;
  }
  
  // Check if faceting is needed
  if (spec.facet && spec.facet.column) {
    const facets = groupByFacets(rows, spec.facet.column);
    
    // Create grid container for facets
    const gridContainer = document.createElement('div');
    gridContainer.className = 'facet-grid';
    
    facets.forEach(facet => {
      const facetContainer = document.createElement('div');
      facetContainer.className = 'facet-item';
      gridContainer.appendChild(facetContainer);
      
      renderSingleChart(facetContainer, facet.rows, spec, facet.facetValue);
    });
    
    container.appendChild(gridContainer);
  } else {
    // Single chart
    renderSingleChart(container, rows, spec);
  }
}
