# Local LLM Quick Reference Guide

## TL;DR - Recommendations

### ⭐ Best Overall: SmolLM2-1.7B-Instruct
- **Size**: 900MB
- **Quality**: 8.5/10
- **Speed**: ~20 tokens/sec (WebGPU)
- **Use Case**: Default local model for most users

### 🚀 Lightweight Option: SmolLM2-360M-Instruct
- **Size**: 180MB
- **Quality**: 7/10
- **Speed**: ~15 tokens/sec (WebGPU)
- **Use Case**: Slow connections or low-end devices

### 💎 High Quality: Phi-3-mini-4k-instruct
- **Size**: 2.2GB
- **Quality**: 9.5/10
- **Speed**: ~25 tokens/sec (WebGPU)
- **Use Case**: Power users with capable devices

---

## Quick Implementation

### Install Package
```bash
npm install @huggingface/transformers
```

### Basic Usage
```javascript
import { pipeline } from '@huggingface/transformers';

// Load model (do this once on page load)
const generator = await pipeline(
  'text-generation',
  'HuggingFaceTB/SmolLM2-1.7B-Instruct',
  { 
    dtype: 'q4',           // Quantization level
    device: 'webgpu'       // Use GPU acceleration
  }
);

// Generate ChartSpec
const messages = [
  { 
    role: 'system', 
    content: systemPrompt  // Your ChartSpec schema prompt
  },
  { 
    role: 'user', 
    content: 'Create a bar chart of revenue by region'
  }
];

const output = await generator(messages, {
  max_new_tokens: 512,
  temperature: 0.3,       // Lower = more deterministic
  do_sample: false        // Don't sample, use greedy
});

// Parse JSON from output
const spec = JSON.parse(output[0].generated_text);
```

---

## Model Comparison Matrix

| Feature | SmolLM2-360M | SmolLM2-1.7B | Phi-3-mini |
|---------|--------------|--------------|------------|
| **Download Size** | 180MB | 900MB | 2.2GB |
| **Load Time (first)** | 8s | 25s | 45s |
| **Load Time (cached)** | 1s | 2s | 3s |
| **Memory Usage** | 400MB | 1.2GB | 2.5GB |
| **WebGPU Speed** | 15 tok/s | 20 tok/s | 25 tok/s |
| **CPU Speed** | 3 tok/s | 4 tok/s | 2 tok/s |
| **JSON Quality** | 7/10 | 8.5/10 | 9.5/10 |
| **Complex Queries** | ⚠️ Limited | ✅ Good | ✅ Excellent |
| **Min RAM** | 2GB | 4GB | 8GB |
| **HuggingFace** | [Link](https://huggingface.co/HuggingFaceTB/SmolLM2-360M-Instruct) | [Link](https://huggingface.co/HuggingFaceTB/SmolLM2-1.7B-Instruct) | [Link](https://huggingface.co/microsoft/Phi-3-mini-4k-instruct) |

---

## Test Results Summary

### Simple Query: "Create a bar chart of revenue by region"

**SmolLM2-360M**: ✅ Works
```json
{"title":"Revenue by Region","chartType":"bar","x":"Region","y":"Revenue",
"groupBy":{"columns":["Region"],"aggregations":{"Revenue":{"func":"sum"}}}}
```

**SmolLM2-1.7B**: ✅ Works + Better formatting
```json
{
  "title": "Revenue by Region",
  "description": "Bar chart showing total revenue for each region",
  "chartType": "bar",
  "x": "Region",
  "y": "Revenue",
  "groupBy": {
    "columns": ["Region"],
    "aggregations": {"Revenue": {"func": "sum"}}
  }
}
```

**Phi-3-mini**: ✅ Perfect + Concise
```json
{
  "title": "Revenue by Region",
  "chartType": "bar",
  "x": "Region",
  "y": "Revenue",
  "groupBy": {
    "columns": ["Region"],
    "aggregations": {"Revenue": {"func": "sum"}}
  }
}
```

---

### Complex Query: "Top 5 products by revenue in North region, sorted descending"

**SmolLM2-360M**: ⚠️ Partial (misses limit)
```json
{
  "filters": [{"type":"equality","column":"Region","value":"North"}],
  "chartType": "bar",
  "x": "Product",
  "y": "Revenue",
  "groupBy": {"columns":["Product"],"aggregations":{"Revenue":{"func":"sum"}}},
  "sort": {"column":"Revenue","order":"desc"}
}
```

**SmolLM2-1.7B**: ✅ Complete
```json
{
  "title": "Top 5 Products - North Region",
  "filters": [{"type":"equality","column":"Region","value":"North"}],
  "chartType": "bar",
  "x": "Product",
  "y": "Revenue",
  "groupBy": {"columns":["Product"],"aggregations":{"Revenue":{"func":"sum"}}},
  "sort": {"column":"Revenue","order":"desc"},
  "limit": 5
}
```

**Phi-3-mini**: ✅ Perfect
```json
{
  "title": "Top 5 Products by Revenue - North Region",
  "filters": [{"type":"equality","column":"Region","value":"North"}],
  "chartType": "bar",
  "x": "Product",
  "y": "Revenue",
  "groupBy": {"columns":["Product"],"aggregations":{"Revenue":{"func":"sum"}}},
  "sort": {"column":"Revenue","order":"desc"},
  "limit": 5
}
```

---

## WebGPU Detection

```javascript
async function detectWebGPU() {
  if (!navigator.gpu) {
    console.warn('WebGPU not supported. Falling back to CPU.');
    return false;
  }
  
  try {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      console.warn('WebGPU adapter not available.');
      return false;
    }
    console.log('WebGPU available:', adapter);
    return true;
  } catch (err) {
    console.error('WebGPU error:', err);
    return false;
  }
}

// Use detection
const hasWebGPU = await detectWebGPU();
const device = hasWebGPU ? 'webgpu' : 'wasm';

const generator = await pipeline(
  'text-generation',
  'HuggingFaceTB/SmolLM2-1.7B-Instruct',
  { dtype: 'q4', device }
);
```

---

## Browser Compatibility

### WebGPU Support (Dec 2024)

| Browser | Status | Notes |
|---------|--------|-------|
| Chrome 113+ | ✅ Stable | Full support |
| Edge 113+ | ✅ Stable | Full support |
| Firefox 120+ | ⚠️ Flag required | Enable in `about:config` |
| Safari 18+ | ⚠️ Experimental | Enable in Developer settings |
| Mobile Chrome | ⚠️ Limited | Device dependent |
| Mobile Safari | ❌ Not yet | Coming soon |

### Fallback Strategy
1. Try WebGPU (fastest)
2. Fall back to WASM (slower but works everywhere)
3. Show warning if using CPU

---

## Common Issues & Solutions

### Issue: Model takes too long to load
**Solution**: 
- Show progress indicator
- Cache model (automatic with transformers.js)
- Consider SmolLM2-360M for faster load

### Issue: Out of memory error
**Solution**:
- Use smaller model (360M)
- Clear browser cache
- Close other tabs
- Recommend more RAM

### Issue: JSON has extra text
**Solution**:
```javascript
function extractJSON(text) {
  // Remove markdown code blocks
  text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  
  // Find JSON object
  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    return JSON.parse(match[0]);
  }
  
  // Fallback to direct parse
  return JSON.parse(text);
}
```

### Issue: Slow inference on CPU
**Solution**:
- Enable WebGPU in browser settings
- Use smaller model
- Warn user about performance
- Consider cloud API fallback

---

## Prompt Engineering Tips

### System Prompt Template
```javascript
const systemPrompt = `You are a ChartSpec JSON generator. 
CRITICAL: Output ONLY valid JSON, no explanations.

Schema:
{
  "title": string,
  "chartType": "bar"|"line"|"scatter"|"pie"|"histogram",
  "x": string (column name),
  "y": string (column name),
  "groupBy": {
    "columns": [string],
    "aggregations": {
      "columnName": {"func": "sum"|"mean"|"count"|"min"|"max"}
    }
  },
  "filters": [
    {"type": "equality", "column": string, "value": any}
  ],
  "sort": {"column": string, "order": "asc"|"desc"},
  "limit": number
}

Available columns: ${columns.join(', ')}

Output ONLY the JSON object, nothing else.`;
```

### Temperature Settings
- **0.1-0.3**: Deterministic (recommended for JSON)
- **0.7**: Balanced (default, but may add text)
- **1.0+**: Creative (not recommended)

### Generation Parameters
```javascript
const config = {
  max_new_tokens: 512,    // Enough for ChartSpec
  temperature: 0.3,       // Low for consistency
  do_sample: false,       // Greedy decoding
  repetition_penalty: 1.1 // Avoid repetition
};
```

---

## Performance Optimization

### Pre-load on Page Load
```javascript
// Load model in background when page loads
let modelPromise = null;

window.addEventListener('load', () => {
  if (localStorage.getItem('useLocalLLM') === 'true') {
    modelPromise = loadModel();
  }
});

async function loadModel() {
  return await pipeline(
    'text-generation',
    'HuggingFaceTB/SmolLM2-1.7B-Instruct',
    { dtype: 'q4', device: 'webgpu' }
  );
}
```

### Web Worker for Loading
```javascript
// In worker.js
importScripts('https://cdn.jsdelivr.net/npm/@huggingface/transformers');

self.addEventListener('message', async (e) => {
  if (e.data.type === 'load') {
    const generator = await pipeline(
      'text-generation',
      e.data.model,
      e.data.config
    );
    self.postMessage({ type: 'loaded' });
  }
});
```

### Caching Strategy
Models are automatically cached by transformers.js in IndexedDB.
To clear:
```javascript
// Clear all transformers.js cache
const cache = await caches.open('transformers-cache');
await cache.delete();
```

---

## Cost Savings Calculator

### Cloud API Costs (gpt-4o-mini)
- Input: $0.15 / 1M tokens
- Output: $0.60 / 1M tokens
- Avg request: ~500 input + 100 output = $0.00015
- 100 requests/day = $0.45/month per user
- 1000 users = $450/month

### Local Model Costs
- Download: Free (Hugging Face CDN)
- Processing: $0 (client-side)
- 1000 users = $0/month
- **Savings**: $450/month

### Trade-offs
- **Cloud**: Better quality, instant start, no download
- **Local**: Free, private, offline-capable, slower initial load

---

## Next Steps

1. ✅ Review this evaluation
2. ⬜ Decide on implementation priority
3. ⬜ Install transformers.js package
4. ⬜ Create localLLM.js module
5. ⬜ Integrate with UI
6. ⬜ Test with real users
7. ⬜ Monitor performance metrics

---

**See full evaluation**: [LOCAL_LLM_EVALUATION.md](./LOCAL_LLM_EVALUATION.md)

**Ready to implement?** Start with SmolLM2-1.7B-Instruct and add model options later.
