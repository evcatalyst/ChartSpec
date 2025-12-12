// Token Counter - Estimates token usage for LLM prompts
// This is an approximation based on common tokenization patterns
// For exact counts, use actual tiktoken library (requires WASM)

/**
 * Approximate token count for text
 * Uses a simple heuristic: ~4 characters per token on average
 * This is a conservative estimate for GPT-style models
 * 
 * NOTE: This is an approximation and may differ significantly from
 * actual tokenization, especially for:
 * - Non-English text (can be 2-6 chars/token)
 * - Code or structured data
 * - Special characters and emojis
 * For exact counts, use the actual tiktoken library (requires WASM)
 * 
 * @param {string} text - Text to count tokens for
 * @returns {number} Estimated token count
 */
export function estimateTokens(text) {
  if (!text) return 0;
  
  // Simple approximation: 4 chars per token on average
  // This is conservative - actual can vary from 2-6 chars/token
  const charCount = text.length;
  const estimate = Math.ceil(charCount / 4);
  
  return estimate;
}

/**
 * Estimate tokens for a JSON object
 * @param {Object} obj - Object to count tokens for
 * @returns {number} Estimated token count
 */
export function estimateTokensForJSON(obj) {
  const jsonString = JSON.stringify(obj);
  return estimateTokens(jsonString);
}

/**
 * Get detailed token breakdown for ChartSpec prompt
 * @param {Object} params - Parameters
 * @param {Array} params.columns - Dataset columns
 * @param {Array} params.sampleRows - Sample data rows
 * @param {string} params.userMessage - User's message
 * @param {Object} params.currentSpec - Current ChartSpec (optional)
 * @returns {Object} Token breakdown
 */
export function getTokenBreakdown(params) {
  const { columns, sampleRows, userMessage, currentSpec } = params;
  
  // Estimate system prompt tokens
  const schemaEstimate = 500; // ChartSpec schema is fairly fixed
  const columnsText = `Available columns: ${columns.join(', ')}`;
  const sampleDataText = JSON.stringify(sampleRows.slice(0, 3), null, 2);
  
  const systemPromptTokens = schemaEstimate + 
    estimateTokens(columnsText) + 
    estimateTokens(sampleDataText);
  
  // User message tokens
  const userTokens = estimateTokens(userMessage);
  
  // Current spec tokens (if continuing conversation)
  const specTokens = currentSpec ? estimateTokensForJSON(currentSpec) : 0;
  
  // Response budget (estimate for response)
  const responseTokens = 300; // Typical ChartSpec response
  
  const total = systemPromptTokens + userTokens + specTokens + responseTokens;
  
  return {
    breakdown: {
      systemPrompt: systemPromptTokens,
      userMessage: userTokens,
      currentSpec: specTokens,
      estimatedResponse: responseTokens
    },
    total,
    sampleRowCount: sampleRows.length
  };
}

/**
 * Get token limit for a provider/model
 * @param {string} provider - Provider name
 * @param {string} model - Model name (optional)
 * @returns {number} Token limit
 */
export function getTokenLimit(provider, model = null) {
  const limits = {
    openai: {
      'gpt-4o-mini': 128000,
      'gpt-4o': 128000,
      'gpt-4-turbo': 128000,
      'gpt-4': 8192,
      'gpt-3.5-turbo': 16385,
      'default': 128000
    },
    grok: {
      'grok-3': 131072,
      'grok-beta': 131072,
      'default': 131072
    }
  };
  
  const providerLimits = limits[provider];
  if (!providerLimits) {
    return 8192; // Conservative default
  }
  
  return model && providerLimits[model] 
    ? providerLimits[model] 
    : providerLimits.default;
}

/**
 * Check if token usage is within safe limits
 * @param {number} tokenCount - Estimated token count
 * @param {number} limit - Token limit
 * @returns {Object} { safe: boolean, percentage: number, warning: string }
 */
export function checkTokenUsage(tokenCount, limit) {
  const percentage = (tokenCount / limit) * 100;
  
  let warning = null;
  if (percentage > 90) {
    warning = 'Critical: Very close to token limit';
  } else if (percentage > 80) {
    warning = 'Warning: Approaching token limit';
  } else if (percentage > 60) {
    warning = 'Notice: Consider reducing sample data';
  }
  
  return {
    safe: percentage <= 90,
    percentage: Math.round(percentage),
    warning
  };
}

// Configuration constants
const ESTIMATED_TOKENS_PER_ROW = 30; // Approximate tokens per sample data row

/**
 * Suggest optimizations to reduce token usage
 * @param {Object} breakdown - Token breakdown from getTokenBreakdown
 * @param {number} currentSampleCount - Current sample row count
 * @returns {Array} Array of suggestion objects
 */
export function suggestOptimizations(breakdown, currentSampleCount) {
  const suggestions = [];
  
  if (currentSampleCount > 3) {
    const savings = Math.floor((currentSampleCount - 3) * ESTIMATED_TOKENS_PER_ROW);
    suggestions.push({
      action: 'reduce_samples',
      description: `Reduce sample rows from ${currentSampleCount} to 3`,
      estimatedSavings: savings
    });
  }
  
  if (breakdown.currentSpec > 200) {
    suggestions.push({
      action: 'simplify_spec',
      description: 'Simplify current ChartSpec (remove optional fields)',
      estimatedSavings: 50
    });
  }
  
  if (breakdown.userMessage > 200) {
    suggestions.push({
      action: 'shorten_message',
      description: 'Make your request more concise',
      estimatedSavings: Math.floor(breakdown.userMessage / 2)
    });
  }
  
  return suggestions;
}
