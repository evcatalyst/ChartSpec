// Renderer Factory - provides abstraction layer for multiple chart renderers
// Supports Plotly, D3, and future rendering engines

/**
 * Base Renderer Interface (Abstract)
 * All renderers must implement these methods
 */
export class BaseRenderer {
  /**
   * Get renderer name
   * @returns {string} Renderer name
   */
  getName() {
    throw new Error('getName() must be implemented');
  }

  /**
   * Check if renderer supports a chart type
   * @param {string} chartType - Chart type to check
   * @returns {boolean} True if supported
   */
  supports(chartType) {
    throw new Error('supports() must be implemented');
  }

  /**
   * Validate chart specification for this renderer
   * @param {Object} spec - ChartSpec object
   * @returns {Object} { valid: boolean, errors: string[] }
   */
  validate(spec) {
    throw new Error('validate() must be implemented');
  }

  /**
   * Check if renderer is available (library loaded)
   * @returns {boolean} True if renderer can be used
   */
  isAvailable() {
    throw new Error('isAvailable() must be implemented');
  }

  /**
   * Render a single chart
   * @param {HTMLElement} container - Container element
   * @param {Array} rows - Array of data objects
   * @param {Object} spec - ChartSpec object
   * @param {string} facetValue - Optional facet value for title
   * @returns {Promise<void>}
   */
  async renderSingleChart(container, rows, spec, facetValue = null) {
    throw new Error('renderSingleChart() must be implemented');
  }

  /**
   * Main render function with faceting support
   * @param {HTMLElement} container - Container element
   * @param {Array} rows - Array of data objects
   * @param {Object} spec - ChartSpec object
   * @returns {Promise<void>}
   */
  async renderChart(container, rows, spec) {
    container.innerHTML = '';
    
    if (!rows || rows.length === 0) {
      container.innerHTML = '<p class="no-data">No data to display</p>';
      return;
    }
    
    // Check if faceting is needed
    if (spec.facet && spec.facet.column) {
      const facets = this.groupByFacets(rows, spec.facet.column);
      
      // Create grid container for facets
      const gridContainer = document.createElement('div');
      gridContainer.className = 'facet-grid';
      
      for (const facet of facets) {
        const facetContainer = document.createElement('div');
        facetContainer.className = 'facet-item';
        gridContainer.appendChild(facetContainer);
        
        await this.renderSingleChart(facetContainer, facet.rows, spec, facet.facetValue);
      }
      
      container.appendChild(gridContainer);
    } else {
      // Single chart
      await this.renderSingleChart(container, rows, spec);
    }
  }

  /**
   * Group rows by facet column (helper method)
   * @param {Array} rows - Array of data objects
   * @param {string} facetColumn - Column to facet by
   * @returns {Array} Array of { facetValue, rows } objects
   */
  groupByFacets(rows, facetColumn) {
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
}

/**
 * Renderer Factory - manages and provides renderer instances
 */
export class RendererFactory {
  constructor() {
    this.renderers = new Map();
    this.defaultRenderer = null;
  }

  /**
   * Register a renderer
   * @param {BaseRenderer} renderer - Renderer instance
   * @param {boolean} setAsDefault - Set as default renderer
   */
  register(renderer, setAsDefault = false) {
    if (!(renderer instanceof BaseRenderer)) {
      throw new Error('Renderer must extend BaseRenderer');
    }
    
    const name = renderer.getName();
    this.renderers.set(name, renderer);
    
    if (setAsDefault || !this.defaultRenderer) {
      this.defaultRenderer = name;
    }
    
    console.log(`Renderer registered: ${name}${setAsDefault ? ' (default)' : ''}`);
  }

  /**
   * Get a renderer by name
   * @param {string} name - Renderer name (optional, uses default if not specified)
   * @returns {BaseRenderer} Renderer instance
   */
  getRenderer(name = null) {
    const rendererName = name || this.defaultRenderer;
    
    if (!rendererName) {
      throw new Error('No renderer specified and no default renderer set');
    }
    
    const renderer = this.renderers.get(rendererName);
    
    if (!renderer) {
      throw new Error(`Renderer not found: ${rendererName}`);
    }
    
    return renderer;
  }

  /**
   * Get best available renderer for a chart type
   * @param {string} chartType - Chart type
   * @returns {BaseRenderer} Best available renderer
   */
  getBestRenderer(chartType) {
    // Try default renderer first if available
    const defaultRenderer = this.getRenderer();
    if (defaultRenderer.isAvailable() && defaultRenderer.supports(chartType)) {
      return defaultRenderer;
    }
    
    // If default renderer (Plotly) is not available, log and find alternative
    if (!defaultRenderer.isAvailable()) {
      console.warn(`Default renderer '${this.defaultRenderer}' is not available. Searching for alternatives...`);
    }
    
    // Find any available renderer that supports the chart type
    for (const [name, renderer] of this.renderers) {
      if (renderer.isAvailable() && renderer.supports(chartType)) {
        console.log(`Using fallback renderer: ${name} for chart type: ${chartType}`);
        return renderer;
      }
    }
    
    // If no renderer supports it or is available, return default (will show error/fallback)
    console.warn(`No available renderer found for chart type: ${chartType}. Using default renderer (may show fallback).`);
    return defaultRenderer;
  }

  /**
   * List all available renderers
   * @returns {Array} Array of { name, available, supportedTypes }
   */
  listRenderers() {
    const result = [];
    
    for (const [name, renderer] of this.renderers) {
      result.push({
        name,
        available: renderer.isAvailable(),
        isDefault: name === this.defaultRenderer
      });
    }
    
    return result;
  }

  /**
   * Set default renderer
   * @param {string} name - Renderer name
   */
  setDefaultRenderer(name) {
    if (!this.renderers.has(name)) {
      throw new Error(`Cannot set default: Renderer not found: ${name}`);
    }
    
    this.defaultRenderer = name;
    console.log(`Default renderer set to: ${name}`);
  }
}

// Global renderer factory instance
export const rendererFactory = new RendererFactory();
