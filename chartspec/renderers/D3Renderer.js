// D3 Renderer - implements chart rendering using D3.js
// This is a skeleton implementation for future extension
import { BaseRenderer } from '../rendererFactory.js';

/**
 * D3Renderer - Renders charts using D3.js library (SKELETON)
 * 
 * Note: This is a basic skeleton implementation showing the structure.
 * Full D3 implementation will be added in future iterations.
 * Currently supports: bar, line, scatter (basic implementations)
 */
export class D3Renderer extends BaseRenderer {
  constructor() {
    super();
    // Expand supported chart types
    this.supportedTypes = ['bar', 'line', 'scatter', 'pie', 'table'];
  }

  getName() {
    return 'd3';
  }

  supports(chartType) {
    return this.supportedTypes.includes(chartType);
  }

  isAvailable() {
    // Check if D3 is loaded (from CDN or local)
    return typeof d3 !== 'undefined';
  }

  validate(spec) {
    const errors = [];
    
    if (!spec.chartType) {
      errors.push('chartType is required');
    } else if (!this.supports(spec.chartType)) {
      errors.push(`Unsupported chart type for D3 renderer: ${spec.chartType}`);
    }
    
    if (spec.chartType !== 'table' && !spec.x) {
      errors.push(`Chart type '${spec.chartType}' requires 'x' field`);
    }
    
    if (spec.chartType !== 'table' && !spec.y) {
      errors.push(`Chart type '${spec.chartType}' requires 'y' field`);
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  async renderSingleChart(container, rows, spec, facetValue = null) {
    // Handle table type
    if (spec.chartType === 'table') {
      this.renderTable(container, rows, spec, facetValue);
      return;
    }
    
    // Check if D3 is available
    if (!this.isAvailable()) {
      this.renderNotAvailableMessage(container);
      return;
    }
    
    // Clear container
    container.innerHTML = '';
    
    // Set up SVG dimensions
    const margin = { top: 50, right: 30, bottom: 50, left: 60 };
    const width = container.offsetWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    
    // Create SVG
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Add title
    if (spec.title || facetValue) {
      const titleText = facetValue ? `${spec.title || ''} - ${facetValue}` : spec.title || '';
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', -20)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('font-weight', 'bold')
        .text(titleText);
    }
    
    // Delegate to specific chart type renderer
    switch (spec.chartType) {
      case 'bar':
        this.renderBarChart(svg, rows, spec, width, height);
        break;
      case 'line':
        this.renderLineChart(svg, rows, spec, width, height);
        break;
      case 'scatter':
        this.renderScatterChart(svg, rows, spec, width, height);
        break;
      case 'pie':
        // Pie chart doesn't use the standard svg, render differently
        container.innerHTML = '';
        this.renderPieChart(container, rows, spec, facetValue);
        break;
      default:
        this.renderNotImplementedMessage(container, spec.chartType);
    }
  }

  /**
   * Render bar chart with D3
   */
  renderBarChart(svg, rows, spec, width, height) {
    if (rows.length === 0) return;
    
    const xValues = rows.map(r => r[spec.x]);
    const yValues = rows.map(r => parseFloat(r[spec.y]) || 0);
    
    // X scale
    const x = d3.scaleBand()
      .domain(xValues)
      .range([0, width])
      .padding(0.2);
    
    // Y scale with safe domain
    const yMax = d3.max(yValues) || 0;
    const yMin = d3.min(yValues) || 0;
    const y = d3.scaleLinear()
      .domain([Math.min(0, yMin), Math.max(0, yMax)])
      .range([height, 0]);
    
    // Add bars
    svg.selectAll('.bar')
      .data(rows)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d[spec.x]))
      .attr('y', d => y(parseFloat(d[spec.y]) || 0))
      .attr('width', x.bandwidth())
      .attr('height', d => height - y(parseFloat(d[spec.y]) || 0))
      .attr('fill', '#667eea');
    
    // Add X axis
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end');
    
    // Add Y axis
    svg.append('g')
      .call(d3.axisLeft(y));
    
    // Add axis labels
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height + 45)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .text(spec.x);
    
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -40)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .text(spec.y);
  }

  /**
   * Render line chart with D3
   */
  renderLineChart(svg, rows, spec, width, height) {
    if (rows.length === 0) return;
    
    const xValues = rows.map((r, i) => spec.x ? r[spec.x] : i);
    const yValues = rows.map(r => parseFloat(r[spec.y]) || 0);
    
    // X scale (assume ordinal/index for simplicity)
    const x = d3.scaleLinear()
      .domain([0, Math.max(1, xValues.length - 1)])
      .range([0, width]);
    
    // Y scale with safe domain
    const yMax = d3.max(yValues) || 0;
    const yMin = d3.min(yValues) || 0;
    const y = d3.scaleLinear()
      .domain([Math.min(0, yMin), Math.max(0, yMax)])
      .range([height, 0]);
    
    // Line generator
    const line = d3.line()
      .x((d, i) => x(i))
      .y(d => y(parseFloat(d[spec.y]) || 0));
    
    // Add line
    svg.append('path')
      .datum(rows)
      .attr('fill', 'none')
      .attr('stroke', '#667eea')
      .attr('stroke-width', 2)
      .attr('d', line);
    
    // Add dots
    svg.selectAll('.dot')
      .data(rows)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', (d, i) => x(i))
      .attr('cy', d => y(parseFloat(d[spec.y]) || 0))
      .attr('r', 4)
      .attr('fill', '#667eea');
    
    // Add axes
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(xValues.length).tickFormat((d, i) => xValues[i]));
    
    svg.append('g')
      .call(d3.axisLeft(y));
  }

  /**
   * Render scatter chart with D3
   */
  renderScatterChart(svg, rows, spec, width, height) {
    if (rows.length === 0) return;
    
    const xValues = rows.map(r => parseFloat(r[spec.x]) || 0);
    const yValues = rows.map(r => parseFloat(r[spec.y]) || 0);
    
    // X scale with safe extent
    const xExtent = d3.extent(xValues);
    const x = d3.scaleLinear()
      .domain([xExtent[0] || 0, xExtent[1] || 1])
      .range([0, width])
      .nice();
    
    // Y scale with safe extent
    const yExtent = d3.extent(yValues);
    const y = d3.scaleLinear()
      .domain([yExtent[0] || 0, yExtent[1] || 1])
      .range([height, 0])
      .nice();
    
    // Add dots
    svg.selectAll('.dot')
      .data(rows)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', d => x(parseFloat(d[spec.x]) || 0))
      .attr('cy', d => y(parseFloat(d[spec.y]) || 0))
      .attr('r', spec.size ? d => Math.max(2, parseFloat(d[spec.size]) || 5) : 5)
      .attr('fill', '#667eea')
      .attr('opacity', 0.7);
    
    // Add axes
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x));
    
    svg.append('g')
      .call(d3.axisLeft(y));
    
    // Add axis labels
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height + 40)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .text(spec.x);
    
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -40)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .text(spec.y);
  }

  /**
   * Render table (same as Plotly renderer)
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
   * Render not available message
   */
  renderNotAvailableMessage(container) {
    container.innerHTML = `
      <div class="renderer-message warning">
        <strong>⚠️ D3.js Not Available</strong>
        <p>The D3 renderer requires the D3.js library to be loaded.</p>
        <p>To use D3 charts, add D3.js to your page:</p>
        <pre>&lt;script src="https://d3js.org/d3.v7.min.js"&gt;&lt;/script&gt;</pre>
      </div>
    `;
  }

  /**
   * Render not implemented message
   */
  renderNotImplementedMessage(container, chartType) {
    container.innerHTML = `
      <div class="renderer-message info">
        <strong>ℹ️ Chart Type Not Yet Implemented</strong>
        <p>The D3 renderer does not yet support chart type: <code>${chartType}</code></p>
        <p>Currently supported: bar, line, scatter, pie, table</p>
        <p>Full D3 implementation coming in future releases.</p>
      </div>
    `;
  }

  /**
   * Render pie chart with D3
   */
  renderPieChart(container, rows, spec, facetValue) {
    if (rows.length === 0) return;
    
    const width = container.offsetWidth || 600;
    const height = 400;
    const radius = Math.min(width, height) / 2 - 40;
    
    // Create SVG
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);
    
    // Add title
    if (spec.title || facetValue) {
      const titleText = facetValue ? `${spec.title || ''} - ${facetValue}` : spec.title || '';
      svg.append('text')
        .attr('x', 0)
        .attr('y', -radius - 20)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('font-weight', 'bold')
        .text(titleText);
    }
    
    // Prepare data
    const valueColumn = spec.y || 'value';
    const labelColumn = spec.x || 'label';
    
    const pieData = rows.map(r => ({
      label: r[labelColumn],
      value: parseFloat(r[valueColumn]) || 0
    }));
    
    // Create pie layout
    const pie = d3.pie()
      .value(d => d.value)
      .sort(null);
    
    const arc = d3.arc()
      .innerRadius(0)
      .outerRadius(radius);
    
    // Color scale
    const color = d3.scaleOrdinal()
      .domain(pieData.map(d => d.label))
      .range(d3.schemeCategory10);
    
    // Add pie slices
    const g = svg.selectAll('.arc')
      .data(pie(pieData))
      .enter()
      .append('g')
      .attr('class', 'arc');
    
    g.append('path')
      .attr('d', arc)
      .attr('fill', d => color(d.data.label))
      .attr('stroke', 'white')
      .attr('stroke-width', 2);
    
    // Add labels
    g.append('text')
      .attr('transform', d => `translate(${arc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', 'white')
      .text(d => {
        const total = d3.sum(pieData, p => p.value);
        if (total === 0) return d.data.label; // Avoid division by zero
        const percent = ((d.data.value / total) * 100).toFixed(1);
        return `${d.data.label}: ${percent}%`;
      });
  }

  /**
   * Render table
   */
  renderTable(container, rows, spec, facetValue) {
    if (rows.length === 0) {
      container.innerHTML = '<p class="no-data">No data to display</p>';
      return;
    }
    
    const tableContainer = document.createElement('div');
    tableContainer.className = 'table-container';
    
    // Add title if present
    if (spec.title || facetValue) {
      const title = document.createElement('h3');
      title.textContent = facetValue ? `${spec.title || ''} - ${facetValue}` : spec.title || '';
      tableContainer.appendChild(title);
    }
    
    const table = document.createElement('table');
    table.className = 'data-table';
    
    // Create header
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
    
    // Create body
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
    tableContainer.appendChild(table);
    container.appendChild(tableContainer);
  }
}
