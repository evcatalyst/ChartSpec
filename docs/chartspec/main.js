// Main application logic - UI event wiring and orchestration

import { autoRegisterDemoDatasets, getDatasets, registerDataset, getDatasetRows, deleteDataset } from './datasetRegistry.js';
import { applySpecToRows } from './dataEngine.js';
import { renderChart } from './chartRenderer.js';
import { getUpdatedChartSpec, refineChartSpec, DEFAULT_MODELS } from './llmRouter.js';

// Application state
let state = {
  datasets: [],
  selectedDataset: null,
  currentRows: [],
  currentSpec: null,
  chatHistory: [],
  provider: 'openai',
  apiKey: '',
  customModel: ''  // Custom model override, empty means use default
};

/**
 * Initialize the application
 */
export async function init() {
  console.log('Initializing ChartSpec application...');
  
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
 * Load settings from localStorage
 */
function loadSettings() {
  const savedProvider = localStorage.getItem('chartspec_provider');
  const savedApiKey = localStorage.getItem('chartspec_apikey');
  const savedModel = localStorage.getItem('chartspec_model');
  
  if (savedProvider) {
    state.provider = savedProvider;
    document.getElementById('llm-provider').value = savedProvider;
  }
  
  if (savedApiKey) {
    state.apiKey = savedApiKey;
    document.getElementById('api-key').value = savedApiKey;
  }
  
  if (savedModel) {
    state.customModel = savedModel;
    document.getElementById('model-input').value = savedModel;
    
    // Ensure 'custom' option exists in the dropdown
    const modelSelect = document.getElementById('model-select');
    let customOption = Array.from(modelSelect.options).find(opt => opt.value === 'custom');
    if (!customOption) {
      // Add 'custom' option if missing
      const option = document.createElement('option');
      option.value = 'custom';
      option.text = 'Custom';
      modelSelect.appendChild(option);
    }
    // Sync the dropdown to match the saved model
    const matchingOption = Array.from(modelSelect.options).find(opt => opt.value === savedModel);
    if (matchingOption) {
      modelSelect.value = savedModel;
    } else if (savedModel) {
      // If custom model doesn't match predefined options, select 'custom'
      modelSelect.value = 'custom';
    }
  }
  
  // Update model input placeholder with default for current provider
  updateModelPlaceholder();
}

/**
 * Save settings to localStorage
 */
function saveSettings() {
  localStorage.setItem('chartspec_provider', state.provider);
  localStorage.setItem('chartspec_apikey', state.apiKey);
  localStorage.setItem('chartspec_model', state.customModel);
}

/**
 * Update model input placeholder with default for current provider
 */
function updateModelPlaceholder() {
  const modelInput = document.getElementById('model-input');
  if (modelInput) {
    const defaultModel = DEFAULT_MODELS[state.provider] || '';
    modelInput.placeholder = `Default: ${defaultModel}`;
  }
}

/**
 * Handle model dropdown selection
 */
function handleModelSelect(e) {
  const selectedModel = e.target.value;
  const modelInput = document.getElementById('model-input');
  
  if (selectedModel === 'custom') {
    // Keep current custom value or empty
    modelInput.focus();
  } else if (selectedModel === 'default') {
    // Clear custom model to use provider default
    state.customModel = '';
    modelInput.value = '';
  } else {
    // Set to selected model
    state.customModel = selectedModel;
    modelInput.value = selectedModel;
  }
  
  // Save settings once after all updates
  if (selectedModel !== 'custom') {
    saveSettings();
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
    updateModelPlaceholder();
    saveSettings();
  });
  
  document.getElementById('api-key').addEventListener('input', (e) => {
    state.apiKey = e.target.value;
    saveSettings();
  });
  
  // Model selection
  document.getElementById('model-select').addEventListener('change', handleModelSelect);
  
  document.getElementById('model-input').addEventListener('input', (e) => {
    state.customModel = e.target.value;
    saveSettings();
  });
  
  // Chat
  document.getElementById('send-message-btn').addEventListener('click', handleSendMessage);
  document.getElementById('user-message').addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  });
  
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
  
  if (!state.apiKey) {
    alert('Please provide an API key');
    return;
  }
  
  if (state.currentRows.length === 0) {
    alert('No data available in selected dataset');
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
    const sampleRows = state.currentRows.slice(0, 5);
    
    // Get chart spec from LLM (use custom model if specified)
    const modelToUse = state.customModel || null;
    const spec = await getUpdatedChartSpec(
      state.provider,
      state.apiKey,
      userMessage,
      columns,
      sampleRows,
      state.currentSpec,
      modelToUse
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
    
    // Render chart
    const vizContainer = document.getElementById('visualization');
    renderChart(vizContainer, transformedRows, spec);
    
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
    
    // Get refined spec (use custom model if specified)
    const modelToUse = state.customModel || null;
    const refinedSpec = await refineChartSpec(
      state.provider,
      state.apiKey,
      spec,
      imageDataUrl,
      columns,
      sampleRows,
      modelToUse
    );
    
    // Apply refined spec
    state.currentSpec = refinedSpec;
    const transformedRows = applySpecToRows(state.currentRows, refinedSpec);
    renderChart(vizContainer, transformedRows, refinedSpec);
    
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
}

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
