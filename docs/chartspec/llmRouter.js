// LLM router for provider-agnostic chart specification generation

import { ChartSpec } from './chartSpec.js';

// Default models for each provider
export const DEFAULT_MODELS = {
  openai: 'gpt-4o-mini',
  grok: 'grok-3'  // Updated from deprecated grok-beta
};

/**
 * Build system prompt with ChartSpec schema
 * @param {Array} columns - Available columns in the dataset
 * @param {Array} sampleRows - Sample rows from dataset
 * @returns {string} System prompt
 */
function buildSystemPrompt(columns, sampleRows) {
  const schema = JSON.stringify(ChartSpec.schema, null, 2);
  const sample = JSON.stringify(sampleRows.slice(0, 3), null, 2);
  
  return `You are a data visualization assistant. Generate ChartSpec JSON specifications for user requests.

Available columns: ${columns.join(', ')}

Sample data:
${sample}

ChartSpec Schema:
${schema}

IMPORTANT:
1. Return ONLY valid JSON matching the ChartSpec schema
2. Do not include explanations, markdown, or code blocks
3. Use only the available columns
4. Choose appropriate chart types (scatter, bar, line, pie, histogram, box, heatmap, table)
5. Apply filters, groupBy, and aggregations when appropriate
6. For groupBy, specify columns array and aggregations object with format: { columnName: { func: 'sum|mean|count|min|max' } }

Example response:
{
  "title": "Sales by Region",
  "chartType": "bar",
  "x": "Region",
  "y": "Revenue",
  "groupBy": {
    "columns": ["Region"],
    "aggregations": {
      "Revenue": { "func": "sum" }
    }
  }
}`;
}

/**
 * Parse JSON response robustly
 * @param {string} text - Response text
 * @returns {Object} Parsed JSON object
 */
function parseJSONResponse(text) {
  // Try direct parse
  try {
    return JSON.parse(text);
  } catch (e) {
    // Try to extract JSON from markdown code blocks
    const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (codeBlockMatch) {
      try {
        return JSON.parse(codeBlockMatch[1]);
      } catch (e2) {
        // Continue to next attempt
      }
    }
    
    // Try to find JSON object in text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e3) {
        // Continue to next attempt
      }
    }
    
    throw new Error('Failed to parse JSON from LLM response');
  }
}

/**
 * Make LLM API request
 * @param {string} provider - 'openai' or 'grok'
 * @param {string} apiKey - API key
 * @param {Array} messages - Array of message objects
 * @param {string} customModel - Optional custom model override
 * @returns {Promise<string>} Response text
 */
async function callLLM(provider, apiKey, messages, customModel = null) {
  let url, headers, body;
  
  // Validate provider before accessing DEFAULT_MODELS
  if (!Object.prototype.hasOwnProperty.call(DEFAULT_MODELS, provider)) {
    throw new Error(`Unsupported provider: ${provider}`);
  }
  // Use custom model if provided, otherwise use default for provider
  const model = customModel || DEFAULT_MODELS[provider];
  
  if (provider === 'openai') {
    url = 'https://api.openai.com/v1/chat/completions';
    headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };
    body = {
      model,
      messages,
      temperature: 0.7,
      max_tokens: 2000
    };
  } else if (provider === 'grok') {
    url = 'https://api.x.ai/v1/chat/completions';
    headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };
    body = {
      model,
      messages,
      temperature: 0.7,
      max_tokens: 2000
    };
  } else {
    throw new Error(`Unsupported provider: ${provider}`);
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `LLM API error: ${response.status} - ${errorText}`;
    
    // Add helpful hint for 404/deprecation errors
    if (response.status === 404 || errorText.includes('deprecated') || errorText.includes('not found')) {
      if (provider === 'grok' && (model === 'grok-beta' || model?.endsWith('-beta'))) {
        errorMessage += '\n\nHint: The model "grok-beta" has been deprecated. Try using "grok-3" instead.';
      }
    }
    
    throw new Error(errorMessage);
  }
  
  const data = await response.json();
  
  if (!data.choices || data.choices.length === 0) {
    throw new Error('No response from LLM');
  }
  
  return data.choices[0].message.content;
}

/**
 * Get updated ChartSpec from LLM
 * @param {string} provider - 'openai' or 'grok'
 * @param {string} apiKey - API key
 * @param {string} userMessage - User's request
 * @param {Array} columns - Available columns
 * @param {Array} sampleRows - Sample rows
 * @param {Object} currentSpec - Current ChartSpec (optional)
 * @param {string} customModel - Optional custom model override
 * @returns {Promise<Object>} New ChartSpec object
 */
export async function getUpdatedChartSpec(provider, apiKey, userMessage, columns, sampleRows, currentSpec = null, customModel = null) {
  const systemPrompt = buildSystemPrompt(columns, sampleRows);
  
  const messages = [
    { role: 'system', content: systemPrompt }
  ];
  
  if (currentSpec) {
    messages.push({
      role: 'assistant',
      content: `Current spec: ${JSON.stringify(currentSpec)}`
    });
  }
  
  messages.push({
    role: 'user',
    content: userMessage
  });
  
  const responseText = await callLLM(provider, apiKey, messages, customModel);
  const spec = parseJSONResponse(responseText);
  
  return spec;
}

/**
 * Refine ChartSpec based on chart snapshot
 * @param {string} provider - 'openai' or 'grok'
 * @param {string} apiKey - API key
 * @param {Object} currentSpec - Current ChartSpec
 * @param {string} imageDataUrl - Base64 image data URL
 * @param {Array} columns - Available columns
 * @param {Array} sampleRows - Sample rows
 * @param {string} customModel - Optional custom model override
 * @returns {Promise<Object>} Refined ChartSpec object
 */
export async function refineChartSpec(provider, apiKey, currentSpec, imageDataUrl, columns, sampleRows, customModel = null) {
  const systemPrompt = buildSystemPrompt(columns, sampleRows);
  
  const messages = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `Current specification: ${JSON.stringify(currentSpec, null, 2)}

Please analyze the chart and suggest improvements. Consider:
- Title and axis labels clarity
- Color and styling
- Data organization
- Chart type appropriateness

Return an improved ChartSpec JSON.`
    }
  ];
  
  // Note: Image analysis would require vision-capable models
  // For now, we'll refine based on the spec itself
  
  const responseText = await callLLM(provider, apiKey, messages, customModel);
  const spec = parseJSONResponse(responseText);
  
  return spec;
}
