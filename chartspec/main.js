// Main application logic - UI event wiring and orchestration

import { autoRegisterDemoDatasets, getDatasets, registerDataset, getDatasetRows, deleteDataset } from './datasetRegistry.js';
import { applySpecToRows } from './dataEngine.js';
import { renderChart } from './chartRenderer.js';
import { getUpdatedChartSpec, refineChartSpec } from './llmRouter.js';
import { sampleLocalSpec, validChartTypes } from './chartSpec.js';
import { rendererFactory } from './rendererFactory.js';
import { PlotlyRenderer } from './renderers/PlotlyRenderer.js';
import { D3Renderer } from './renderers/D3Renderer.js';
import { getTokenBreakdown, getTokenLimit, checkTokenUsage } from './tokenCounter.js';

// Configuration constants
const DEFAULT_SAMPLE_ROW_COUNT = 5; // Number of sample rows to send with LLM requests

// Application state
let state = {
  datasets: [],
  selectedDataset: null,
  currentRows: [],
  currentSpec: null,
  chatHistory: [],
  provider: 'openai',
  apiKey: '',
  localMode: false,
  manualChartSpec: null,
  currentRenderer: 'plotly' // Default renderer
};

/**
 * Initialize the application
 */
export async function init() {
  console.log('Initializing ChartSpec application...');
  
  // Initialize renderers
  initializeRenderers();
  
  // Auto-register demo datasets
  await autoRegisterDemoDatasets();
  
  // Load datasets
  refreshDatasetList();
  
  // Load saved settings
  loadSettings();
  
  // Wire up event listeners
  setupEventListeners();
  
  console.log('ChartSpec application initialized');
}

/**
 * Initialize and register renderers
 */
function initializeRenderers() {
  // Register Plotly renderer (default)
  rendererFactory.register(new PlotlyRenderer(), true);
  
  // Register D3 renderer (alternative)
  rendererFactory.register(new D3Renderer(), false);
  
  // Log available renderers
  const renderers = rendererFactory.listRenderers();
  console.log('Available renderers:', renderers);
}

/**
 * Load settings from localStorage
 */
function loadSettings() {
  const savedProvider = localStorage.getItem('chartspec_provider');
  const savedApiKey = localStorage.getItem('chartspec_apikey');
  const savedLocalMode = localStorage.getItem('chartspec_localmode');
  const savedManualSpec = localStorage.getItem('chartspec_manualspec');
  
  if (savedProvider) {
    state.provider = savedProvider;
    document.getElementById('llm-provider').value = savedProvider;
  }
  
  if (savedApiKey) {
    state.apiKey = savedApiKey;
    document.getElementById('api-key').value = savedApiKey;
  }
  
  // Load local mode state
  if (savedLocalMode === 'true') {
    state.localMode = true;
    document.getElementById('local-mode').checked = true;
    updateLocalModeUI();
  }
  
  // Load manual ChartSpec or use sample
  if (savedManualSpec) {
    try {
      state.manualChartSpec = JSON.parse(savedManualSpec);
      document.getElementById('chartspec-input').value = savedManualSpec;
    } catch (e) {
      // If invalid, use sample and log error
      console.warn('Failed to parse saved ChartSpec, using sample instead:', e.message);
      state.manualChartSpec = sampleLocalSpec;
      document.getElementById('chartspec-input').value = JSON.stringify(sampleLocalSpec, null, 2);
    }
  } else {
    // Use sample by default
    state.manualChartSpec = sampleLocalSpec;
    document.getElementById('chartspec-input').value = JSON.stringify(sampleLocalSpec, null, 2);
  }
}

/**
 * Save settings to localStorage
 */
function saveSettings() {
  localStorage.setItem('chartspec_provider', state.provider);
  localStorage.setItem('chartspec_apikey', state.apiKey);
  localStorage.setItem('chartspec_localmode', state.localMode.toString());
  if (state.manualChartSpec) {
    // Store the formatted JSON for readability
    localStorage.setItem('chartspec_manualspec', JSON.stringify(state.manualChartSpec, null, 2));
  }
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
  // Dataset management
  document.getElementById('add-dataset-btn').addEventListener('click', showAddDatasetForm);
  document.getElementById('register-dataset-btn').addEventListener('click', handleRegisterDataset);
  document.getElementById('cancel-dataset-btn').addEventListener('click', hideAddDatasetForm);
  document.getElementById('dataset-select').addEventListener('change', handleDatasetSelection);
  document.getElementById('reload-dataset-btn').addEventListener('click', handleReloadDataset);
  document.getElementById('delete-dataset-btn').addEventListener('click', handleDeleteDataset);
  
  // LLM settings
  document.getElementById('llm-provider').addEventListener('change', (e) => {
    state.provider = e.target.value;
    saveSettings();
    updateTokenEstimation();
  });
  
  document.getElementById('api-key').addEventListener('input', (e) => {
    state.apiKey = e.target.value;
    saveSettings();
  });
  
  // Token details toggle
  document.getElementById('toggle-token-details').addEventListener('click', toggleTokenDetails);
  
  // Local mode toggle
  document.getElementById('local-mode').addEventListener('change', handleLocalModeToggle);
  
  // Local mode ChartSpec
  document.getElementById('apply-chartspec-btn').addEventListener('click', handleApplyChartSpec);
  document.getElementById('chartspec-input').addEventListener('input', (e) => {
    // Clear error on input
    document.getElementById('chartspec-error').style.display = 'none';
  });
  
  // Chat
  document.getElementById('send-message-btn').addEventListener('click', handleSendMessage);
  document.getElementById('user-message').addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  });
  
  // Update token estimation as user types
  document.getElementById('user-message').addEventListener('input', updateTokenEstimation);
  
  document.getElementById('clear-chat-btn').addEventListener('click', handleClearChat);
}

/**
 * Refresh dataset list in UI
 */
function refreshDatasetList() {
  state.datasets = getDatasets();
  
  const select = document.getElementById('dataset-select');
  select.innerHTML = '<option value="">Select a dataset...</option>';
  
  state.datasets.forEach(dataset => {
    const option = document.createElement('option');
    option.value = dataset.name;
    option.textContent = `${dataset.name} (${dataset.rowCount} rows)`;
    select.appendChild(option);
  });
  
  // Update dataset info
  updateDatasetInfo();
}

/**
 * Update dataset info display
 */
function updateDatasetInfo() {
  const infoDiv = document.getElementById('dataset-info');
  
  if (!state.selectedDataset) {
    infoDiv.innerHTML = '<p class="placeholder">No dataset selected</p>';
    return;
  }
  
  const dataset = state.datasets.find(d => d.name === state.selectedDataset);
  if (!dataset) {
    infoDiv.innerHTML = '<p class="placeholder">Dataset not found</p>';
    return;
  }
  
  infoDiv.innerHTML = `
    <div class="dataset-details">
      <p><strong>Name:</strong> ${dataset.name}</p>
      <p><strong>Rows:</strong> ${dataset.rowCount}</p>
      <p><strong>Columns:</strong> ${dataset.columns.join(', ')}</p>
    </div>
  `;
}

/**
 * Show add dataset form
 */
function showAddDatasetForm() {
  document.getElementById('add-dataset-form').style.display = 'block';
}

/**
 * Hide add dataset form
 */
function hideAddDatasetForm() {
  document.getElementById('add-dataset-form').style.display = 'none';
  document.getElementById('dataset-name').value = '';
  document.getElementById('dataset-url').value = '';
}

/**
 * Handle dataset registration
 */
async function handleRegisterDataset() {
  const name = document.getElementById('dataset-name').value.trim();
  const url = document.getElementById('dataset-url').value.trim();
  
  if (!name || !url) {
    alert('Please provide both name and URL');
    return;
  }
  
  try {
    document.getElementById('register-dataset-btn').disabled = true;
    document.getElementById('register-dataset-btn').textContent = 'Registering...';
    
    await registerDataset(name, url);
    
    hideAddDatasetForm();
    refreshDatasetList();
    
    alert(`Dataset "${name}" registered successfully`);
  } catch (error) {
    alert(`Failed to register dataset: ${error.message}`);
  } finally {
    document.getElementById('register-dataset-btn').disabled = false;
    document.getElementById('register-dataset-btn').textContent = 'Register';
  }
}

/**
 * Handle dataset selection
 */
function handleDatasetSelection(e) {
  const datasetName = e.target.value;
  
  if (!datasetName) {
    state.selectedDataset = null;
    state.currentRows = [];
    updateDatasetInfo();
    return;
  }
  
  state.selectedDataset = datasetName;
  state.currentRows = getDatasetRows(datasetName);
  updateDatasetInfo();
  updateTokenEstimation();
  
  console.log(`Loaded dataset: ${datasetName} (${state.currentRows.length} rows)`);
}

/**
 * Handle reload dataset
 */
async function handleReloadDataset() {
  if (!state.selectedDataset) {
    alert('No dataset selected');
    return;
  }
  
  const dataset = state.datasets.find(d => d.name === state.selectedDataset);
  if (!dataset) return;
  
  try {
    await registerDataset(dataset.name, dataset.url);
    state.currentRows = getDatasetRows(dataset.name);
    refreshDatasetList();
    alert('Dataset reloaded successfully');
  } catch (error) {
    alert(`Failed to reload dataset: ${error.message}`);
  }
}

/**
 * Handle delete dataset
 */
function handleDeleteDataset() {
  if (!state.selectedDataset) {
    alert('No dataset selected');
    return;
  }
  
  if (!confirm(`Are you sure you want to delete "${state.selectedDataset}"?`)) {
    return;
  }
  
  deleteDataset(state.selectedDataset);
  state.selectedDataset = null;
  state.currentRows = [];
  refreshDatasetList();
}

/**
 * Handle local mode toggle
 */
function handleLocalModeToggle(e) {
  state.localMode = e.target.checked;
  saveSettings();
  updateLocalModeUI();
}

/**
 * Update UI based on local mode state
 */
function updateLocalModeUI() {
  const llmConfig = document.getElementById('llm-config');
  const localModeConfig = document.getElementById('local-mode-config');
  
  if (state.localMode) {
    llmConfig.style.display = 'none';
    localModeConfig.style.display = 'block';
  } else {
    llmConfig.style.display = 'block';
    localModeConfig.style.display = 'none';
  }
}

/**
 * Validate ChartSpec JSON
 * @param {Object} spec - Parsed ChartSpec object
 * @returns {Object} { valid: boolean, error: string }
 */
function validateChartSpec(spec) {
  if (!spec || typeof spec !== 'object') {
    return { valid: false, error: 'ChartSpec must be a JSON object' };
  }
  
  if (!spec.chartType) {
    return { valid: false, error: 'ChartSpec must include a "chartType" property' };
  }
  
  if (!validChartTypes.includes(spec.chartType)) {
    return { valid: false, error: `Invalid chartType: ${spec.chartType}. Must be one of: ${validChartTypes.join(', ')}` };
  }
  
  return { valid: true, error: null };
}

/**
 * Handle apply ChartSpec in local mode
 */
function handleApplyChartSpec() {
  const chartSpecInput = document.getElementById('chartspec-input').value.trim();
  const errorDiv = document.getElementById('chartspec-error');
  
  // Validation
  if (!state.selectedDataset) {
    alert('Please select a dataset first');
    return;
  }
  
  if (state.currentRows.length === 0) {
    alert('No data available in selected dataset');
    return;
  }
  
  if (!chartSpecInput) {
    errorDiv.textContent = 'ChartSpec JSON cannot be empty';
    errorDiv.style.display = 'block';
    return;
  }
  
  // Parse JSON
  let spec;
  try {
    spec = JSON.parse(chartSpecInput);
  } catch (e) {
    errorDiv.textContent = `JSON Parse Error: ${e.message}`;
    errorDiv.style.display = 'block';
    return;
  }
  
  // Validate ChartSpec
  const validation = validateChartSpec(spec);
  if (!validation.valid) {
    errorDiv.textContent = validation.error;
    errorDiv.style.display = 'block';
    return;
  }
  
  // Clear error
  errorDiv.style.display = 'none';
  
  // Store spec
  state.currentSpec = spec;
  state.manualChartSpec = spec;
  saveSettings();
  
  // Apply spec to data
  const transformedRows = applySpecToRows(state.currentRows, spec);
  
  console.log(`Transformed ${state.currentRows.length} rows to ${transformedRows.length} rows`);
  
  // Render chart using renderer factory
  const vizContainer = document.getElementById('visualization');
  const renderer = rendererFactory.getBestRenderer(spec.chartType);
  renderer.renderChart(vizContainer, transformedRows, spec);
  
  // Add message to chat
  addChatMessage('assistant', `Applied ChartSpec in local mode:\n${JSON.stringify(spec, null, 2)}`);
}

/**
 * Handle send message
 */
async function handleSendMessage() {
  const userMessage = document.getElementById('user-message').value.trim();
  
  if (!userMessage) return;
  
  // Validation
  if (!state.selectedDataset) {
    alert('Please select a dataset first');
    return;
  }
  
  if (state.currentRows.length === 0) {
    alert('No data available in selected dataset');
    return;
  }
  
  // In local mode, direct users to use the Apply ChartSpec button
  if (state.localMode) {
    alert('In Local Mode, please edit the ChartSpec JSON and click "Apply ChartSpec" button instead of sending messages.');
    return;
  }
  
  if (!state.apiKey) {
    alert('Please provide an API key');
    return;
  }
  
  // Clear input
  document.getElementById('user-message').value = '';
  
  // Add user message to chat
  addChatMessage('user', userMessage);
  
  // Show loading
  const loadingId = addChatMessage('assistant', 'Generating chart specification...');
  
  try {
    // Get dataset info
    const dataset = state.datasets.find(d => d.name === state.selectedDataset);
    const columns = dataset.columns;
    const sampleRows = state.currentRows.slice(0, DEFAULT_SAMPLE_ROW_COUNT);
    
    // Get chart spec from LLM
    const spec = await getUpdatedChartSpec(
      state.provider,
      state.apiKey,
      userMessage,
      columns,
      sampleRows,
      state.currentSpec
    );
    
    // Update chat with spec
    updateChatMessage(loadingId, JSON.stringify(spec, null, 2));
    
    // Store spec
    state.currentSpec = spec;
    state.chatHistory.push({ role: 'user', content: userMessage });
    state.chatHistory.push({ role: 'assistant', content: spec });
    
    // Apply spec to data
    const transformedRows = applySpecToRows(state.currentRows, spec);
    
    console.log(`Transformed ${state.currentRows.length} rows to ${transformedRows.length} rows`);
    
    // Render chart using renderer factory
    const vizContainer = document.getElementById('visualization');
    const renderer = rendererFactory.getBestRenderer(spec.chartType);
    renderer.renderChart(vizContainer, transformedRows, spec);
    
    // Optional auto-refine
    const autoRefine = document.getElementById('auto-refine')?.checked;
    if (autoRefine && spec.chartType !== 'table' && spec.chartType !== 'tableOnly') {
      setTimeout(() => handleAutoRefine(spec, columns, sampleRows), 1000);
    }
    
  } catch (error) {
    console.error('Error generating chart:', error);
    updateChatMessage(loadingId, `Error: ${error.message}`);
    alert(`Error: ${error.message}`);
  }
}

/**
 * Handle auto-refine
 */
async function handleAutoRefine(spec, columns, sampleRows) {
  try {
    // Get chart snapshot
    const vizContainer = document.getElementById('visualization');
    const plotlyDiv = vizContainer.querySelector('.plotly');
    
    if (!plotlyDiv) return;
    
    const imageDataUrl = await Plotly.toImage(plotlyDiv, { format: 'png', width: 800, height: 600 });
    
    // Get refined spec
    const refinedSpec = await refineChartSpec(
      state.provider,
      state.apiKey,
      spec,
      imageDataUrl,
      columns,
      sampleRows
    );
    
    // Apply refined spec
    state.currentSpec = refinedSpec;
    const transformedRows = applySpecToRows(state.currentRows, refinedSpec);
    const renderer = rendererFactory.getBestRenderer(refinedSpec.chartType);
    renderer.renderChart(vizContainer, transformedRows, refinedSpec);
    
    addChatMessage('assistant', `Auto-refined chart with improved settings.`);
    
  } catch (error) {
    console.error('Auto-refine error:', error);
  }
}

/**
 * Add message to chat
 */
function addChatMessage(role, content) {
  const chatLog = document.getElementById('chat-log');
  const messageDiv = document.createElement('div');
  const messageId = `msg-${Date.now()}`;
  messageDiv.id = messageId;
  messageDiv.className = `chat-message ${role}-message`;
  
  const roleLabel = document.createElement('div');
  roleLabel.className = 'role-label';
  roleLabel.textContent = role === 'user' ? 'You' : 'Assistant';
  messageDiv.appendChild(roleLabel);
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  
  if (role === 'assistant' && content.startsWith('{')) {
    const pre = document.createElement('pre');
    pre.textContent = content;
    contentDiv.appendChild(pre);
  } else {
    contentDiv.textContent = content;
  }
  
  messageDiv.appendChild(contentDiv);
  chatLog.appendChild(messageDiv);
  chatLog.scrollTop = chatLog.scrollHeight;
  
  return messageId;
}

/**
 * Update existing chat message
 */
function updateChatMessage(messageId, content) {
  const messageDiv = document.getElementById(messageId);
  if (!messageDiv) return;
  
  const contentDiv = messageDiv.querySelector('.message-content');
  if (content.startsWith('{')) {
    contentDiv.innerHTML = '';
    const pre = document.createElement('pre');
    pre.textContent = content;
    contentDiv.appendChild(pre);
  } else {
    contentDiv.textContent = content;
  }
}

/**
 * Handle clear chat
 */
function handleClearChat() {
  if (!confirm('Clear chat history?')) return;
  
  state.chatHistory = [];
  state.currentSpec = null;
  document.getElementById('chat-log').innerHTML = '';
  document.getElementById('visualization').innerHTML = '<p class="placeholder">No visualization yet</p>';
  updateTokenEstimation();
}

/**
 * Update token estimation display
 */
function updateTokenEstimation() {
  // Only show token estimation when not in local mode and dataset is selected
  if (state.localMode || !state.selectedDataset) {
    document.getElementById('token-indicator').style.display = 'none';
    return;
  }
  
  const userMessage = document.getElementById('user-message').value.trim() || 'example request';
  const dataset = state.datasets.find(d => d.name === state.selectedDataset);
  
  if (!dataset) {
    document.getElementById('token-indicator').style.display = 'none';
    return;
  }
  
  // Get token breakdown
  const breakdown = getTokenBreakdown({
    columns: dataset.columns,
    sampleRows: state.currentRows.slice(0, DEFAULT_SAMPLE_ROW_COUNT),
    userMessage,
    currentSpec: state.currentSpec
  });
  
  // Get token limit
  const limit = getTokenLimit(state.provider);
  
  // Check usage
  const usage = checkTokenUsage(breakdown.total, limit);
  
  // Update UI
  document.getElementById('token-indicator').style.display = 'block';
  document.getElementById('token-count').textContent = breakdown.total.toLocaleString();
  document.getElementById('token-limit').textContent = limit.toLocaleString();
  
  // Update progress bar
  const fillElement = document.getElementById('token-bar-fill');
  fillElement.style.width = `${usage.percentage}%`;
  fillElement.className = 'token-bar-fill';
  
  if (usage.percentage > 80) {
    fillElement.classList.add('danger');
  } else if (usage.percentage > 60) {
    fillElement.classList.add('warning');
  }
  
  // Update warning
  const warningElement = document.getElementById('token-warning');
  if (usage.warning) {
    warningElement.textContent = usage.warning;
    warningElement.style.display = 'block';
  } else {
    warningElement.style.display = 'none';
  }
  
  // Update breakdown details
  document.getElementById('token-system').textContent = breakdown.breakdown.systemPrompt;
  document.getElementById('token-user').textContent = breakdown.breakdown.userMessage;
  document.getElementById('token-spec').textContent = breakdown.breakdown.currentSpec;
  document.getElementById('token-response').textContent = breakdown.breakdown.estimatedResponse;
}

/**
 * Toggle token details visibility
 */
function toggleTokenDetails() {
  const detailsElement = document.getElementById('token-details');
  const toggleButton = document.getElementById('toggle-token-details');
  
  if (detailsElement.style.display === 'none') {
    detailsElement.style.display = 'block';
    toggleButton.textContent = 'Hide Details';
  } else {
    detailsElement.style.display = 'none';
    toggleButton.textContent = 'Show Details';
  }
}

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
