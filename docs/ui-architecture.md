# ChartSpec Workbench - UI Architecture

## Overview

ChartSpec Workbench is a full-screen, local-first visualization workspace built with vanilla JavaScript and Web Components. The architecture emphasizes modularity, performance, and maintainability.

## Architecture Layers

### 1. Foundation Layer
- **CSS Tokens** (`/styles/tokens.css`): Design system with colors, spacing, typography
- **Base Styles** (`/styles/app.css`): Global resets, utilities, animations
- **Component Styles** (`/styles/components.css`): Component-specific styling

### 2. State Layer
- **Store** (`/state/store.js`): Central state management with pub/sub event bus
- **Persistence** (`/state/persistence.js`): localStorage operations with migration support
- **IndexedDB** (`/state/idb.js`): Large data storage for datasets and samples

### 3. Component Layer
All components are implemented as Web Components (Custom Elements) for encapsulation and reusability.

#### Shell Components
- **cs-app-shell**: Top-level container, manages keyboard shortcuts and presentation mode
- **cs-command-bar**: Top bar with dataset selector, layout presets, and settings

#### Grid Components
- **cs-grid**: Gridstack.js integration, tile management, layout presets
- **cs-tile**: Base tile with header, actions (maximize, duplicate, close)

#### Specialized Tiles
- **cs-chart-tile**: Chart rendering using existing renderer factory
- **cs-text-tile**: Markdown/text content display
- **cs-table-tile**: Data table view
- **cs-inspector-tile**: ChartSpec JSON, token estimates, warnings

#### Chat & Settings
- **cs-chat-drawer**: Resizable side drawer with message history and actions
- **cs-nl-settings**: Natural language settings control
- **cs-led-sampler**: LED-style data sampling control

### 4. Integration Layer
- **Workbench Main** (`/workbench/main.js`): Application initialization and event wiring
- **ChartSpec Modules**: Reuses existing data engine, LLM router, renderers

## Component Communication

### Event Bus Pattern
The central store implements a pub/sub pattern for component communication:

```javascript
// Subscribe to events
store.on('tile:added', (tile) => {
  // Handle tile addition
});

// Emit events
store.emit('chat:send', message);

// State changes auto-emit events
store.setState({ tiles: newTiles });
// Emits: 'state:changed', 'state:tiles'
```

### Common Events

#### Dataset Events
- `datasets:loaded` - Datasets loaded from IndexedDB
- `dataset:selected` - Dataset selection changed
- `dataset:rows:changed` - Current dataset rows updated

#### Tile Events
- `tile:added` - New tile added to grid
- `tile:updated` - Tile properties updated
- `tile:removed` - Tile removed from grid
- `tile:maximize` - Tile maximized/restored

#### Chat Events
- `chat:send` - User sent a message
- `chat:message` - New message added
- `chat:message:updated` - Message updated
- `chat:cleared` - Chat history cleared

#### UI Events
- `chat:drawer:toggled` - Drawer opened/closed
- `chat:drawer:resized` - Drawer width changed
- `presentation:toggled` - Presentation mode toggled
- `layout:preset:changed` - Layout preset selected

#### Command Events
- `command:select-dataset` - Dataset selector requested
- `command:toggle-settings` - Settings dialog requested

## Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│ cs-command-bar                                          │
├───────────────────────────────────┬─────────────────────┤
│                                   │                     │
│                                   │  cs-chat-drawer     │
│          cs-grid                  │  ┌───────────────┐  │
│   ┌─────────┬─────────┬────────┐  │  │  Messages     │  │
│   │ cs-tile │ cs-tile │cs-tile │  │  │               │  │
│   │         │         │        │  │  │               │  │
│   │ chart   │inspector│ text   │  │  │               │  │
│   └─────────┴─────────┴────────┘  │  ├───────────────┤  │
│   ┌─────────┬─────────────────┐   │  │  nl-settings  │  │
│   │ cs-tile │     cs-tile     │   │  │  led-sampler  │  │
│   │         │                 │   │  │  chat-input   │  │
│   │ table   │     chart       │   │  └───────────────┘  │
│   └─────────┴─────────────────┘   │                     │
└───────────────────────────────────┴─────────────────────┘
```

## State Management

### Store State Schema

```javascript
{
  // Dataset state
  datasets: [],              // Array of dataset metadata
  selectedDataset: null,     // Current dataset name
  currentRows: [],           // Current dataset rows
  
  // Tiles state
  tiles: [],                 // Array of tile configs
  activeTileId: null,        // Currently active tile
  gridLayout: null,          // Gridstack layout JSON
  
  // Chat state
  chatHistory: [],           // Message array
  chatDrawerOpen: true,      // Drawer visible
  chatDrawerWidth: 384,      // Drawer width in pixels
  
  // Settings
  provider: 'openai',        // LLM provider
  apiKey: '',                // API key (encrypted in localStorage)
  localMode: false,          // Manual ChartSpec mode
  smartMode: false,          // AVA + language parser mode
  samplingPreset: '10',      // Data sampling percentage
  
  // UI state
  presentationMode: false,   // Hide UI chrome
  layoutPreset: 'default',   // Grid layout preset
  theme: 'dark'              // Color theme
}
```

### Tile Schema

```javascript
{
  id: 'tile-1234567890',    // Unique ID
  type: 'chart',            // Type: chart, text, table, inspector
  title: 'Revenue by Region', // Display title
  x: 0,                     // Grid X position
  y: 0,                     // Grid Y position
  w: 6,                     // Grid width (12-column grid)
  h: 4,                     // Grid height
  config: {},               // Tile-specific config
  data: {                   // Tile-specific data
    spec: {...},            // ChartSpec JSON
    rows: [...]             // Data rows
  },
  maximized: false,         // Is maximized
  originalX: 0,             // Original position before maximize
  originalY: 0,
  originalW: 6,
  originalH: 4
}
```

## Data Flow

### Chat Message to Visualization

```
User Input → chat:send event
  ↓
handleChatMessage()
  ↓
Mode Detection (Smart/LLM/Manual)
  ↓
[Smart Mode] → parseCommand() → enhanceWithAva() → commandToSpec()
[LLM Mode] → getUpdatedChartSpec() → API call
  ↓
ChartSpec JSON
  ↓
createTilesFromSpec()
  ↓
store.addTile() × 2 (chart + inspector)
  ↓
tile:added event
  ↓
cs-grid adds tiles to Gridstack
  ↓
cs-chart-tile renders chart
cs-inspector-tile shows spec
```

### Dataset Loading Flow

```
App Init → loadDatasets()
  ↓
idb.getAllDatasets()
  ↓
If empty → autoRegisterDemoDatasets() → save to IDB
  ↓
store.setDatasets()
  ↓
datasets:loaded event
  ↓
cs-command-bar updates dataset pill
```

## Keyboard Shortcuts

- **Ctrl+B** - Toggle chat drawer
- **Ctrl+P** - Toggle presentation mode
- **ESC** - Exit presentation mode or close drawer
- **Enter** (in chat) - Send message
- **Shift+Enter** (in chat) - New line

## Responsive Behavior

### Grid Layout
- Uses Gridstack.js responsive grid (12 columns)
- Tiles have minimum width/height constraints
- Auto-reflow on window resize

### Chat Drawer
- Default width: 384px
- Min width: 320px
- Max width: 640px
- Collapsible (hidden in presentation mode)

### Presentation Mode
- Hides command bar
- Hides chat drawer
- Maximizes grid area
- Removes tile padding

## Performance Considerations

### Lazy Loading
- Components imported as ES modules
- Gridstack loaded from CDN with fallback
- Charts rendered on-demand

### Debouncing
- State persistence debounced (500ms)
- Grid layout saves debounced

### Efficient Rendering
- Web Components use attribute observation
- Only re-render affected components on state changes
- Virtual scrolling not needed (limited tiles)

## Accessibility

### Keyboard Navigation
- All interactive elements keyboard-accessible
- Logical tab order
- Focus visible styles

### Screen Readers
- Semantic HTML structure
- ARIA labels where needed
- Status announcements for state changes

### Reduced Motion
- CSS variables control animation duration
- `prefers-reduced-motion` media query support
- Fallback to instant transitions

## Browser Compatibility

### Minimum Requirements
- ES6 Modules support
- Custom Elements v1
- IndexedDB
- CSS Grid
- CSS Variables

### Supported Browsers
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Extensibility

### Adding New Tile Types

1. Create tile component:
```javascript
// components/my-tile.js
class MyTile extends HTMLElement {
  connectedCallback() {
    const tile = store.getTile(this.getAttribute('tile-id'));
    // Render tile content
  }
}
customElements.define('cs-my-tile', MyTile);
```

2. Update tile component:
```javascript
// components/tile.js
case 'my-type':
  return `<cs-my-tile tile-id="${this.tileId}"></cs-my-tile>`;
```

3. Import in main.js:
```javascript
import '../components/my-tile.js';
```

### Adding New Layout Presets

Update grid component:
```javascript
// components/grid.js
case 'my-preset':
  // Define tile layout
  tiles.forEach((tile, i) => {
    this.addTile({ ...tile, x, y, w, h });
  });
  break;
```

## Security

### API Key Storage
- Stored in localStorage (browser-level encryption)
- Never transmitted except to selected LLM provider
- Can be cleared on logout

### Content Security Policy
- No inline scripts
- All scripts loaded as ES modules
- External libraries from trusted CDNs

### Data Privacy
- All data processing happens in-browser
- No server-side storage
- IndexedDB scoped to origin

## Testing Strategy

### Component Tests
- Each component should be testable in isolation
- Mock store for state interactions
- Test event emissions and subscriptions

### Integration Tests
- Test complete user flows
- Dataset loading → Chat → Tile creation
- Layout persistence → Reload → Restore

### Browser Tests
- Manual testing across supported browsers
- Automated tests with Playwright/Puppeteer

## Future Enhancements

### Planned Features
- Proper modal dialogs (replace prompt/confirm)
- Drag-and-drop dataset upload
- Export tiles as images
- Share workspace via URL
- Collaborative features
- Custom tile types via plugins

### Performance Optimizations
- Service Worker for offline support
- Virtual scrolling for large datasets
- WebGL-accelerated charts
- Web Worker for data processing

## Troubleshooting

### Gridstack Not Loading
- Check browser console for CDN errors
- Fallback to basic flexbox grid
- Consider vendoring Gridstack

### IndexedDB Errors
- Check browser privacy settings
- Verify storage quota
- Migrate to localStorage fallback

### State Not Persisting
- Check localStorage available
- Verify no quota exceeded errors
- Check persistence middleware attached

### Components Not Rendering
- Verify all imports in main.js
- Check Custom Elements defined
- Look for JavaScript errors in console
