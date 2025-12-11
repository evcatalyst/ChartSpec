# ChartSpec Development Roadmap

This document outlines the planned evolution of ChartSpec from a browser-based LLM charting assistant to a polished, enterprise-ready multi-model charting and insights copilot.

## Vision

Transform ChartSpec into a comprehensive, production-ready charting assistant that:
- Supports multiple visualization libraries (renderer abstraction)
- Provides intelligent insights and recommendations
- Offers token-aware prompt optimization
- Delivers a modern, polished user experience
- Maintains browser-only, lightweight architecture

---

## Short-Term Goals (Current Sprint)

### 1. Renderer Abstraction Layer ⚡ Priority
**Status**: In Progress  
**Goal**: Decouple visualization logic from specific rendering libraries

**Implementation Plan**:
- Create `rendererFactory.js` with abstract renderer interface
- Define standard methods: `render(container, data, spec)`, `supports(chartType)`, `validate(spec)`
- Refactor existing `chartRenderer.js` into `PlotlyRenderer` implementation
- Add skeleton `D3Renderer` for basic chart types (bar, line, scatter)
- Update `main.js` to use renderer factory

**Benefits**:
- Easy to add new visualization libraries
- A/B testing different renderers
- Fallback options when CDN unavailable
- Chart type optimization per renderer

**Files to Modify**:
- New: `/chartspec/rendererFactory.js`
- New: `/chartspec/renderers/PlotlyRenderer.js`
- New: `/chartspec/renderers/D3Renderer.js`
- Modify: `/chartspec/main.js`
- Modify: `/chartspec/chartRenderer.js` (deprecate or convert to factory)

---

### 2. Token Counting & Estimation ⚡ Priority
**Status**: Planned  
**Goal**: Help users understand and manage LLM token usage

**Implementation Plan**:
- Add lightweight token counting utility (tiktoken-compatible or approximation)
- Display estimated tokens in UI: "Est. tokens: X / Y limit"
- Break down token usage: system prompt, user message, sample data
- Add warning when approaching token limits
- Allow users to adjust sample row count
- Show how changes affect token estimates

**UI Components**:
- Token counter display in LLM Settings panel
- Warning indicator when >80% of limit
- Slider for sample row count adjustment
- "Show Token Breakdown" expandable section

**Files to Create/Modify**:
- New: `/chartspec/tokenCounter.js`
- Modify: `/chartspec/llmRouter.js` (add token estimation)
- Modify: `/index.html` (add token UI elements)
- Modify: `/styles.css` (add token indicator styles)

---

### 3. ROADMAP.md Documentation ✅ Complete
**Status**: Complete  
**Goal**: Organize development plans and milestones

---

## Mid-Term Goals (Next 2-4 Weeks)

### 4. Insights Panel & Recommendations
**Status**: Planned  
**Goal**: Provide AI-powered chart improvement suggestions

**Features**:
- Side panel (collapsible) showing insights
- LLM-generated suggestions based on current chart + data
- Suggestions include:
  - Alternative chart types
  - Outlier highlights
  - Better aggregations
  - Visual improvements
- Click-to-apply mechanism (doesn't auto-change)
- Maintains chat context when suggestion applied

**User Flow**:
1. User creates chart via LLM or local mode
2. Insights panel shows 3-5 suggestions
3. User clicks suggestion → updates ChartSpec → re-renders
4. Chat history preserves context

**UI Layout**:
```
[Dataset Panel] [Main Chart Area] [Insights Panel]
                [Chat Section]
```

**Files to Create/Modify**:
- New: `/chartspec/insightsEngine.js`
- Modify: `/index.html` (add insights panel)
- Modify: `/styles.css` (insights panel styles)
- Modify: `/chartspec/main.js` (insights event handlers)
- Modify: `/chartspec/llmRouter.js` (insights generation)

---

### 5. UI/UX Modernization
**Status**: Planned  
**Goal**: Move beyond generic Bootstrap look to polished, modern design

**Approach**:
- Keep lightweight (no heavy frameworks)
- Consider utility-first CSS (Tailwind CDN or custom utilities)
- Improve visual hierarchy and spacing
- Better typography and color scheme
- Enhanced mobile responsiveness
- Smooth transitions and micro-interactions

**Design Principles**:
- Clean, minimal interface
- Clear information hierarchy
- Consistent spacing (8px grid)
- Modern color palette
- Accessible (WCAG AA minimum)
- Fast load times

**Components to Redesign**:
- Header and branding
- Dataset panel (cards instead of plain forms)
- LLM settings (toggle switches, better inputs)
- Chat interface (modern messaging UI)
- Chart area (better placeholder states)
- Button styles and interactions

**Files to Modify**:
- Major: `/styles.css` (complete redesign)
- Minor: `/index.html` (semantic improvements)

---

### 6. Enhanced Model Configuration
**Status**: Partially Complete  
**Goal**: Robust multi-provider, multi-model support

**Current State**:
- ✅ Provider selection (OpenAI, Grok)
- ✅ Model defaults (gpt-4o-mini, grok-3)
- ✅ localStorage persistence
- ⚠️ Limited error handling

**Improvements Needed**:
- Custom model selection dropdown per provider
- Detect deprecated/404 models with helpful messages
- Better JSON parsing error recovery
- Rate limit handling
- Cost estimation per model
- Model capability indicators (vision, tokens, etc.)

**Files to Modify**:
- Modify: `/chartspec/llmRouter.js` (model config, error handling)
- Modify: `/index.html` (model selection UI)
- Modify: `/chartspec/main.js` (settings persistence)

---

## Long-Term Goals (1-3 Months)

### 7. D3.js Renderer Implementation
**Status**: Future  
**Goal**: Full-featured D3 renderer as Plotly alternative

**Scope**:
- Complete implementation for all supported chart types
- Interactive features (tooltips, zoom, pan)
- Animation and transitions
- Custom styling capabilities
- Performance optimization for large datasets

---

### 8. Advanced Data Pipeline
**Status**: Future  
**Goal**: More sophisticated data transformations

**Features**:
- Derived columns (calculations, transformations)
- Multiple groupBy levels
- Window functions (rolling averages, etc.)
- Join operations across datasets
- Data caching and incremental updates

---

### 9. Export & Sharing
**Status**: Future  
**Goal**: Save and share visualizations

**Features**:
- Export charts as PNG/SVG/PDF
- Export ChartSpec JSON for reproducibility
- Share via URL (encode spec in hash)
- Embed code generation
- Export to notebook formats

---

### 10. Enterprise Features
**Status**: Future  
**Goal**: Production-ready enterprise deployment

**Features**:
- SSO integration
- Backend API mode (server-side processing)
- Database connectors
- Scheduled report generation
- Team collaboration (shared datasets, specs)
- Audit logging
- Custom branding/theming

---

## Technical Debt & Maintenance

### Code Quality
- [ ] Add JSDoc comments throughout
- [ ] Standardize error handling patterns
- [ ] Add input validation utilities
- [ ] Create reusable UI components

### Testing
- [ ] Add unit tests for data engine
- [ ] Add integration tests for LLM router
- [ ] Browser compatibility testing
- [ ] Performance benchmarks

### Documentation
- [ ] API reference documentation
- [ ] Developer contribution guide
- [ ] User tutorials and examples
- [ ] Video walkthroughs

### Security
- [ ] Content Security Policy (CSP) headers
- [ ] Input sanitization review
- [ ] Dependency security scanning (when added)
- [ ] Rate limiting for API calls

---

## Decision Log

### Why Browser-Only?
- **Pro**: No backend complexity, easy deployment, privacy-first
- **Con**: LocalStorage limits, no server-side processing
- **Decision**: Keep browser-only for core, offer backend mode as optional enhancement

### Why Renderer Abstraction?
- **Pro**: Flexibility, vendor independence, optimization opportunities
- **Con**: Additional complexity, maintenance overhead
- **Decision**: Implement now while codebase is small and manageable

### Why Token Counting?
- **Pro**: User awareness, cost control, better prompt engineering
- **Con**: Approximation may not be exact
- **Decision**: Implement with clear "estimated" language in UI

### CSS Framework?
- **Options**: Tailwind, Bootstrap, Custom
- **Decision**: Custom utility-first approach to stay lightweight
- **Rationale**: Full Tailwind too heavy, Bootstrap too generic, custom gives control

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on contributing to ChartSpec.

For specific roadmap items, check the GitHub Issues tagged with roadmap milestones.

---

## Milestones

- **v0.2.0** - Renderer Abstraction + Token Counting (Current)
- **v0.3.0** - Insights Panel + UI Modernization
- **v0.4.0** - Enhanced Model Configuration
- **v0.5.0** - D3 Renderer + Advanced Data Pipeline
- **v1.0.0** - Production-Ready Release

---

**Last Updated**: December 11, 2024  
**Maintained By**: ChartSpec Team
