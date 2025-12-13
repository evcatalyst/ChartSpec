# Vendor Dependencies

This directory contains vendored JavaScript libraries with pinned versions for offline use.

## Required Libraries

### Gridstack.js (v10.3.1)
**Purpose**: Drag-and-drop dashboard grid system for tiles  
**CDN**: https://cdn.jsdelivr.net/npm/gridstack@10.3.1/dist/gridstack-all.js  
**License**: MIT  
**Size**: ~200KB

**Why Gridstack**:
- Best-in-class grid management with drag/resize
- No jQuery dependency (v10.x)
- TypeScript support
- Touch-friendly for mobile
- Auto-placement and collision detection

### Split.js (v1.6.5)
**Purpose**: Resizable split panels for chat drawer  
**CDN**: https://cdn.jsdelivr.net/npm/split.js@1.6.5/dist/split.min.js  
**License**: MIT  
**Size**: ~3KB

**Why Split.js**:
- Minimal and performant
- Vanilla JS, no dependencies
- Handles resizable panes with drag
- Persists sizes easily

## Installation Instructions

Since CDN access may be limited in some environments, download these files manually:

```bash
# Gridstack.js
curl -L -o gridstack-all.js https://cdn.jsdelivr.net/npm/gridstack@10.3.1/dist/gridstack-all.js
curl -L -o gridstack.min.css https://cdn.jsdelivr.net/npm/gridstack@10.3.1/dist/gridstack.min.css

# Split.js
curl -L -o split.min.js https://cdn.jsdelivr.net/npm/split.js@1.6.5/dist/split.min.js
```

Or use npm (if available):
```bash
npm install gridstack@10.3.1 split.js@1.6.5
cp node_modules/gridstack/dist/gridstack-all.js vendor/
cp node_modules/gridstack/dist/gridstack.min.css vendor/
cp node_modules/split.js/dist/split.min.js vendor/
```

## Fallback: CDN Loading

If vendored files are unavailable, the app will attempt to load from CDN:
- Gridstack: https://cdn.jsdelivr.net/npm/gridstack@10.3.1/dist/gridstack-all.js
- Split.js: https://cdn.jsdelivr.net/npm/split.js@1.6.5/dist/split.min.js

## Version Pinning

Versions are pinned to ensure compatibility and prevent breaking changes:
- Always use exact versions in CDN URLs
- Test before upgrading to new versions
- Document any breaking changes in migration notes
