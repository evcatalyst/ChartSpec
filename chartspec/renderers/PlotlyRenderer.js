// Plotly Renderer - implements chart rendering using Plotly.js
import { BaseRenderer } from '../rendererFactory.js';

/**
 * PlotlyRenderer - Renders charts using Plotly.js library
 */
export class PlotlyRenderer extends BaseRenderer {
  constructor() {
    super();
    this.supportedTypes = [
      'bar', 'line', 'scatter', 'pie', 'histogram', 
      'box', 'heatmap', 'table', 'tableOnly', 'pivot'
    ];
  }

  getName() {
    return 'plotly';
  }

  supports(chartType) {
    return this.supportedTypes.includes(chartType);
  }

  isAvailable() {
    return typeof Plotly !== 'undefined';
  }

  validate(spec) {
    const errors = [];
    
    if (!spec.chartType) {
      errors.push('chartType is required');
    } else if (!this.supports(spec.chartType)) {
      errors.push(`Unsupported chart type: ${spec.chartType}`);
    }
    
    // Chart-specific validation
    const requiresX = ['bar', 'line', 'scatter', 'histogram'];
    const requiresY = ['bar', 'line', 'scatter', 'box'];
    
    if (requiresX.includes(spec.chartType) && !spec.x) {
      errors.push(`Chart type '${spec.chartType}' requires 'x' field`);
    }
    
    if (requiresY.includes(spec.chartType) && !spec.y) {
      errors.push(`Chart type '${spec.chartType}' requires 'y' field`);
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  async renderSingleChart(container, rows, spec, facetValue = null) {
    // Handle special table types
    if (spec.chartType === 'table' || spec.chartType === 'tableOnly' || spec.chartType === 'pivot') {
      this.renderTable(container, rows, spec, facetValue);
      return;
    }
    
    // Check if Plotly is available
    if (!this.isAvailable()) {
      this.renderFallbackWarning(container, rows, spec, facetValue);
      return;
    }
    
    // Prepare Plotly data
    const data = this.prepareData(rows, spec);
    
    // Prepare layout
    const layout = this.prepareLayout(spec, facetValue);
    
    // Prepare config
    const config = {
      responsive: true,
      ...spec.config
    };
    
    // Render with Plotly
    Plotly.newPlot(container, data, layout, config);
  }

  /**
   * Prepare Plotly data traces from rows and spec
   */
  prepareData(rows, spec) {
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
            const filteredIndices = colorValues
              .map((v, i) => v === colorVal ? i : -1)
              .filter(i => i >= 0);
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
    
    return data;
  }

  /**
   * Prepare Plotly layout from spec
   */
  prepareLayout(spec, facetValue) {
    return {
      ...spec.layout,
      title: facetValue ? `${spec.title || ''} - ${facetValue}` : spec.title || '',
      xaxis: { title: spec.x || '' },
      yaxis: { title: Array.isArray(spec.y) ? spec.y.join(', ') : spec.y || '' },
      margin: { l: 50, r: 30, t: 50, b: 50 },
      autosize: true
    };
  }

  /**
   * Render a table view
   */
  renderTable(container, rows, spec, facetValue = null) {
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
   * Render fallback warning when Plotly is not available
   */
  renderFallbackWarning(container, rows, spec, facetValue) {
    const warningDiv = document.createElement('div');
    warningDiv.className = 'plotly-fallback-warning';
    warningDiv.innerHTML = '<strong>⚠️ Plotly Not Available:</strong> Displaying data as a table instead. To see charts, ensure you have internet connectivity and reload the page.';
    container.appendChild(warningDiv);
    
    // Render as table
    const tableContainer = document.createElement('div');
    container.appendChild(tableContainer);
    this.renderTable(tableContainer, rows, { ...spec, chartType: 'table' }, facetValue);
  }
}
