// ChartSpec Workbench - Main Entry Point
// Initializes the application and wires everything together

import store from '../state/store.js';
import persistence, { loadInitialState, createPersistenceMiddleware } from '../state/persistence.js';
import idb from '../state/idb.js';

// Import all components
import '../components/app-shell.js';
import '../components/command-bar.js';
import '../components/grid.js';
import '../components/tile.js';
import '../components/chart-tile.js';
import '../components/text-tile.js';
import '../components/table-tile.js';
import '../components/inspector-tile.js';
import '../components/chat-drawer.js';
import '../components/nl-settings.js';
import '../components/led-sampler.js';
import '../components/demo-gallery.js';

// Import existing ChartSpec modules
import { autoRegisterDemoDatasets, getDatasets, registerDataset, getDatasetRows, deleteDataset } from '../chartspec/datasetRegistry.js';
import { applySpecToRows } from '../chartspec/dataEngine.js';
import { getUpdatedChartSpec } from '../chartspec/llmRouter.js';
import { rendererFactory } from '../chartspec/rendererFactory.js';
import { PlotlyRenderer } from '../chartspec/renderers/PlotlyRenderer.js';
import { D3Renderer } from '../chartspec/renderers/D3Renderer.js';
import { parseCommand, commandToSpec } from '../chartspec/languageParser.js';
import { enhanceWithAva } from '../chartspec/avaIntegration.js';

/**
 * Initialize the Workbench application
 */
async function init() {
  console.log('🚀 Initializing ChartSpec Workbench...');
  
  // 1. Load initial state from localStorage
  console.log('📂 Loading saved state...');
  const savedState = loadInitialState();
  store.setState(savedState);
  
  // 2. Set up persistence middleware
  console.log('💾 Setting up auto-save...');
  store.use(createPersistenceMiddleware());
  
  // 3. Initialize IndexedDB
  console.log('🗄️  Initializing IndexedDB...');
  await idb.initDB();
  
  // 4. Migrate datasets from localStorage to IndexedDB if needed
  console.log('🔄 Checking for dataset migration...');
  await migrateDatasets();
  
  // 5. Initialize renderers
  console.log('🎨 Initializing renderers...');
  initializeRenderers();
  
  // 6. Load datasets
  console.log('📊 Loading datasets...');
  await loadDatasets();
  
  // 7. Wire up application events
  console.log('🔌 Wiring up events...');
  wireUpEvents();
  
  // 8. Apply theme
  console.log('🎨 Applying theme...');
  const theme = store.get('theme');
  document.documentElement.setAttribute('data-theme', theme);
  
  // 9. Set up presentation mode
  const presentationMode = store.get('presentationMode');
  document.documentElement.setAttribute('data-presentation-mode', presentationMode);
  
  console.log('✅ ChartSpec Workbench initialized successfully!');
  console.log('💡 Press Ctrl+B to toggle chat, Ctrl+P for presentation mode');
}

/**
 * Initialize chart renderers
 */
function initializeRenderers() {
  rendererFactory.register(new PlotlyRenderer(), true);
  rendererFactory.register(new D3Renderer(), false);
  
  const renderers = rendererFactory.listRenderers();
  console.log('  Available renderers:', renderers);
}

/**
 * Migrate datasets from localStorage to IndexedDB
 */
async function migrateDatasets() {
  const migrated = await idb.migrateFromLocalStorage();
  if (migrated > 0) {
    console.log(`  ✅ Migrated ${migrated} datasets to IndexedDB`);
  }
}

/**
 * Load datasets from IndexedDB
 */
async function loadDatasets() {
  try {
    // Get datasets from IndexedDB
    let datasets = await idb.getAllDatasets();
    
    // If no datasets, register demo datasets
    if (datasets.length === 0) {
      console.log('  📦 No datasets found, registering demo datasets...');
      await autoRegisterDemoDatasets();
      
      // Save demo datasets to IndexedDB
      const demoDatasets = getDatasets();
      for (const dataset of demoDatasets) {
        const rows = getDatasetRows(dataset.name);
        await idb.saveDataset({
          ...dataset,
          rows,
        });
      }
      
      datasets = demoDatasets;
    } else {
      console.log(`  ✅ Loaded ${datasets.length} datasets from IndexedDB`);
    }
    
    // Update store with datasets
    store.setDatasets(datasets);
    
    // Select the previously selected dataset if available
    const selectedDataset = store.get('selectedDataset');
    if (selectedDataset && datasets.find(d => d.name === selectedDataset)) {
      const dataset = await idb.getDataset(selectedDataset);
      if (dataset) {
        store.setCurrentRows(dataset.rows);
      }
    }
    
  } catch (error) {
    console.error('Failed to load datasets:', error);
  }
}

/**
 * Wire up application-level events
 */
function wireUpEvents() {
  // Chat message send event
  store.on('chat:send', async (message) => {
    await handleChatMessage(message);
  });
  
  // Dataset selection from command bar
  store.on('command:select-dataset', () => {
    showDatasetSelector();
  });
  
  // Settings toggle
  store.on('command:toggle-settings', () => {
    showSettingsDialog();
  });
  
  // Dataset selection change
  store.on('dataset:selected', async (datasetName) => {
    const dataset = await idb.getDataset(datasetName);
    if (dataset) {
      store.setCurrentRows(dataset.rows);
    }
  });
}

/**
 * Handle chat message
 */
async function handleChatMessage(message) {
  const mode = determineMode();
  
  try {
    if (mode === 'smart') {
      await handleSmartMode(message);
    } else if (mode === 'llm') {
      await handleLLMMode(message);
    } else {
      store.addChatMessage('assistant', 'Manual mode is active. Please edit ChartSpec JSON directly.');
    }
  } catch (error) {
    console.error('Error handling chat message:', error);
    store.addChatMessage('assistant', `Error: ${error.message}`);
  }
}

/**
 * Determine current mode
 */
function determineMode() {
  const localMode = store.get('localMode');
  const smartMode = store.get('smartMode');
  
  if (localMode) return 'manual';
  if (smartMode) return 'smart';
  return 'llm';
}

/**
 * Handle Smart Mode (AVA + language parser)
 */
async function handleSmartMode(message) {
  const datasets = store.get('datasets');
  const selectedDataset = store.get('selectedDataset');
  const dataset = datasets.find(d => d.name === selectedDataset);
  
  if (!dataset) {
    store.addChatMessage('assistant', 'Please select a dataset first.');
    return;
  }
  
  const rows = store.get('currentRows');
  const columns = dataset.columns;
  
  // Parse command
  let parsed = parseCommand(message, columns);
  
  // Enhance with AVA
  parsed = enhanceWithAva(parsed, rows);
  
  // Build ChartSpec
  const spec = commandToSpec(parsed, columns);
  
  // Add AVA badge if used
  if (parsed.avaReasoning) {
    spec.description = (spec.description || '') + ' [AVA-Recommended]';
  }
  
  // Show result
  const responseText = `📊 Parsed command (confidence: ${parsed.confidence}%)\n\n${parsed.avaReasoning ? `💡 ${parsed.avaReasoning}\n\n` : ''}Generated ChartSpec:\n${JSON.stringify(spec, null, 2)}`;
  
  store.addChatMessage('assistant', JSON.stringify(spec, null, 2));
  
  // Auto-create tiles
  createTilesFromSpec(spec, rows);
}

/**
 * Handle LLM Mode
 */
async function handleLLMMode(message) {
  const provider = store.get('provider');
  const apiKey = store.get('apiKey');
  
  if (!apiKey) {
    store.addChatMessage('assistant', 'Please provide an API key in settings.');
    return;
  }
  
  const datasets = store.get('datasets');
  const selectedDataset = store.get('selectedDataset');
  const dataset = datasets.find(d => d.name === selectedDataset);
  
  if (!dataset) {
    store.addChatMessage('assistant', 'Please select a dataset first.');
    return;
  }
  
  const rows = store.get('currentRows');
  const columns = dataset.columns;
  
  // Calculate sample size based on sampling preset
  const samplingPreset = parseInt(store.get('samplingPreset'));
  const sampleSize = Math.ceil((rows.length * samplingPreset) / 100);
  const sampleRows = rows.slice(0, sampleSize);
  
  // Show loading message
  const loadingId = store.addChatMessage('assistant', 'Generating chart specification...');
  
  try {
    // Get spec from LLM
    const spec = await getUpdatedChartSpec(
      provider,
      apiKey,
      message,
      columns,
      sampleRows,
      store.get('currentSpec')
    );
    
    // Update message with spec
    store.updateChatMessage(loadingId, JSON.stringify(spec, null, 2));
    
    // Store current spec
    store.setState({ currentSpec: spec });
    
    // Auto-create tiles
    createTilesFromSpec(spec, rows);
    
  } catch (error) {
    store.updateChatMessage(loadingId, `Error: ${error.message}`);
    throw error;
  }
}

/**
 * Create tiles from ChartSpec
 */
function createTilesFromSpec(spec, rows) {
  // Create chart tile
  const chartTile = {
    id: `tile-${Date.now()}`,
    type: 'chart',
    title: spec.title || 'Chart',
    x: 0,
    y: 0,
    w: 6,
    h: 4,
    config: {},
    data: { spec, rows }
  };
  
  store.addTile(chartTile);
  
  // Create inspector tile
  const inspectorTile = {
    id: `tile-${Date.now() + 1}`,
    type: 'inspector',
    title: 'Inspector',
    x: 6,
    y: 0,
    w: 6,
    h: 4,
    config: {},
    data: {
      spec,
      tokens: null, // TODO: Calculate tokens
      warnings: []
    }
  };
  
  store.addTile(inspectorTile);
}

/**
 * Show dataset selector modal
 */
function showDatasetSelector() {
  const datasets = store.get('datasets');
  const selectedDataset = store.get('selectedDataset');
  
  // Simple prompt for now (could be replaced with a modal)
  const options = datasets.map((d, i) => `${i + 1}. ${d.name} (${d.rowCount} rows)`).join('\n');
  const choice = prompt(`Select a dataset:\n\n${options}\n\nEnter number (or 0 to cancel):`);
  
  if (choice && parseInt(choice) > 0 && parseInt(choice) <= datasets.length) {
    const dataset = datasets[parseInt(choice) - 1];
    store.selectDataset(dataset.name);
  }
}

/**
 * Show settings dialog
 */
function showSettingsDialog() {
  const provider = store.get('provider');
  const apiKey = store.get('apiKey');
  const mode = determineMode();
  
  // Simple prompt for now (could be replaced with a modal)
  const newApiKey = prompt(
    `Current Settings:\n\nProvider: ${provider}\nMode: ${mode}\n\nEnter new API key (or leave blank to keep current):`,
    apiKey ? '***' : ''
  );
  
  if (newApiKey && newApiKey !== '***') {
    store.updateSettings({ apiKey: newApiKey });
  }
}

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Export for debugging
if (typeof window !== 'undefined') {
  window.chartSpecWorkbench = {
    store,
    persistence,
    idb,
  };
}
