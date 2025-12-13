# ChartSpec Workbench - Migration Plan

## Overview

This document outlines the migration from the original ChartSpec UI to the new Workbench interface. The migration is designed to be smooth and backward-compatible.

## Migration Strategy

### Approach: Parallel Deployment

- **Old UI**: `index.html` (preserved for backward compatibility)
- **New UI**: `workbench.html` (new full-screen interface)
- **Transition Period**: Users can choose which interface to use
- **Final State**: Workbench becomes default, old UI available as fallback

## Phase 1: Data Migration

### Automatic Data Migration

The Workbench automatically migrates data from localStorage to IndexedDB on first load.

**What Gets Migrated**:
1. Dataset metadata and rows
2. LLM provider settings
3. API keys
4. Mode preferences (local/smart)

**Migration Code**:
```javascript
// Happens automatically in workbench/main.js
async function migrateDatasets() {
  const migrated = await idb.migrateFromLocalStorage();
  if (migrated > 0) {
    console.log(`✅ Migrated ${migrated} datasets to IndexedDB`);
  }
}
```

**User Impact**:
- ✅ Zero manual action required
- ✅ Existing datasets preserved
- ✅ Settings carried over
- ✅ Can still use old UI

### Data Not Migrated

These are fresh starts in Workbench:
- Chat history (fresh start)
- Tile configurations (new feature)
- Layout preferences (new feature)
- Drawer state (new feature)

## Phase 2: Feature Parity

### Features Available in Both UIs

| Feature | Old UI | Workbench | Notes |
|---------|--------|-----------|-------|
| Dataset management | ✅ | ✅ | Same functionality |
| Smart Mode | ✅ | ✅ | Enhanced with tile output |
| LLM Mode | ✅ | ✅ | Enhanced with tile output |
| Manual/Local Mode | ✅ | ✅ | Same functionality |
| Chart rendering | ✅ | ✅ | Same renderers |
| Data transformations | ✅ | ✅ | Same engine |

### New Features in Workbench

| Feature | Description |
|---------|-------------|
| Tile-based workspace | Multiple charts/views simultaneously |
| Draggable grid | Rearrange tiles |
| Resizable tiles | Customize tile sizes |
| Chat drawer | Collapsible chat interface |
| Layout presets | Quick layout switching |
| Presentation mode | Hide UI chrome |
| LED sampling control | Visual data sampling |
| Natural language settings | Inline settings UI |
| Persistent layouts | Save workspace state |

## Phase 3: UI Transition Guide

### For New Users

**Recommended**: Start with Workbench
1. Go to `/workbench.html`
2. Follow welcome tile instructions
3. Explore keyboard shortcuts (Ctrl+B, Ctrl+P)

### For Existing Users

**Option A: Try Workbench**
1. Go to `/workbench.html`
2. Your datasets and settings auto-migrate
3. Explore new features
4. Fallback to `/index.html` if needed

**Option B: Stay on Old UI**
1. Continue using `/index.html`
2. All features still work
3. Upgrade when ready

## Phase 4: Deployment Strategy

### Step 1: Soft Launch (Week 1-2)

**Actions**:
- Deploy workbench.html as separate URL
- Keep index.html as default
- Add link to workbench from old UI
- Monitor usage and bugs

**Old UI Banner**:
```html
<div class="migration-notice">
  🚀 Try the new <a href="./workbench.html">Workbench UI</a> 
  with multi-chart workspace and improved layout!
</div>
```

### Step 2: Beta Period (Week 3-4)

**Actions**:
- Fix bugs reported by early adopters
- Polish UX based on feedback
- Add missing features if critical
- Update documentation

**Workbench Banner**:
```html
<div class="beta-notice">
  ⚠️ Beta - <a href="./index.html">Switch to classic UI</a> 
  if you encounter issues.
</div>
```

### Step 3: Make Default (Week 5)

**Actions**:
- Swap: workbench.html → index.html
- Rename old: index.html → classic.html
- Update all links and documentation
- Add redirect from root to workbench

**index.html** (new):
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta http-equiv="refresh" content="0; url=workbench.html">
  <title>Redirecting to ChartSpec Workbench...</title>
</head>
<body>
  <p>Redirecting to <a href="workbench.html">ChartSpec Workbench</a>...</p>
</body>
</html>
```

### Step 4: Deprecation (Month 2-3)

**Actions**:
- Add deprecation notice to classic UI
- Set sunset date (e.g., 3 months)
- Ensure all features migrated
- Final user communications

**Classic UI Banner**:
```html
<div class="deprecation-notice">
  ⚠️ This UI will be sunset on [DATE]. 
  Please migrate to the <a href="./index.html">new Workbench</a>.
</div>
```

### Step 5: Sunset (Month 4)

**Actions**:
- Remove classic.html
- Archive old code in git
- Celebrate! 🎉

## Technical Migration Details

### File Structure Changes

**Before**:
```
ChartSpec/
├── index.html
├── styles.css
├── chartspec/
│   ├── main.js
│   ├── dataEngine.js
│   └── ...
└── datasets/
```

**After**:
```
ChartSpec/
├── index.html (redirect or new workbench)
├── workbench.html
├── classic.html (old UI, optional)
├── styles.css (old UI styles)
├── styles/
│   ├── tokens.css
│   ├── app.css
│   └── components.css
├── components/
│   ├── app-shell.js
│   └── ...
├── state/
│   ├── store.js
│   ├── persistence.js
│   └── idb.js
├── workbench/
│   └── main.js
├── chartspec/ (unchanged)
└── datasets/ (unchanged)
```

### URL Structure

**Development**:
- Old: `http://localhost:8000/index.html`
- New: `http://localhost:8000/workbench.html`

**Production (GitHub Pages)**:
- Old: `https://evcatalyst.github.io/ChartSpec/`
- New: `https://evcatalyst.github.io/ChartSpec/workbench.html`
- Classic: `https://evcatalyst.github.io/ChartSpec/classic.html`

## User Communication

### Email/Announcement Template

```
Subject: Introducing ChartSpec Workbench 🚀

We're excited to announce ChartSpec Workbench - a completely redesigned 
visualization workspace!

What's New:
✅ Full-screen grid workspace
✅ Multiple charts simultaneously
✅ Drag & resize tiles
✅ Collapsible chat drawer
✅ Presentation mode
✅ Your data migrates automatically

Try it now: [Link to workbench.html]

The classic UI remains available as a fallback.

Questions? See our migration guide: [Link]
```

### In-App Notification

```javascript
// Show once per user
if (!localStorage.getItem('workbench_announcement_shown')) {
  showNotification({
    title: 'New Workbench UI Available!',
    message: 'Try our redesigned interface with multi-chart workspace.',
    actions: [
      { label: 'Try Now', url: './workbench.html' },
      { label: 'Later', dismiss: true }
    ]
  });
  localStorage.setItem('workbench_announcement_shown', 'true');
}
```

## Rollback Plan

If critical issues arise:

### Quick Rollback

**Step 1**: Swap URLs back
```bash
mv index.html workbench.html.new
mv classic.html index.html
```

**Step 2**: Communicate
- Post notice of temporary rollback
- Explain issue and timeline
- Reassure users data is safe

**Step 3**: Fix and redeploy
- Fix critical issues
- Test thoroughly
- Redeploy with more caution

### Data Rollback

If IndexedDB migration causes issues:

```javascript
// Restore from localStorage backup
async function rollbackMigration() {
  // Clear IndexedDB
  await idb.clearAllData();
  
  // Datasets still in localStorage
  // Old UI can use them immediately
  
  alert('Data restored. Please use classic UI.');
  window.location = './classic.html';
}
```

## Testing Checklist

### Before Launch

- [ ] Test migration with real user data
- [ ] Verify all features work in Workbench
- [ ] Test on all supported browsers
- [ ] Test on mobile (if applicable)
- [ ] Performance benchmarks meet targets
- [ ] Accessibility audit passes
- [ ] Documentation complete
- [ ] User guide/tutorial ready

### During Beta

- [ ] Monitor error logs
- [ ] Track user feedback
- [ ] Measure adoption rate
- [ ] Compare performance metrics
- [ ] Identify blocker issues
- [ ] Test edge cases reported

### Before Making Default

- [ ] No critical bugs remaining
- [ ] Performance acceptable
- [ ] Majority of users opted in
- [ ] Fallback plan tested
- [ ] Communication materials ready

## Success Metrics

### Adoption Metrics
- % users trying Workbench
- % users staying on Workbench
- Time to first tile creation
- Number of tiles created per session

### Performance Metrics
- Page load time
- Time to first interaction
- Frame rate during drag/resize
- IndexedDB query performance

### Quality Metrics
- Bug report rate
- User satisfaction score
- Feature completion rate
- Accessibility compliance

## FAQ

### Will my data be lost?
No. Data automatically migrates from localStorage to IndexedDB. The old UI remains functional as backup.

### Can I use both UIs?
Yes, during the transition period. Data is accessible from both.

### What if I don't like the new UI?
You can use the classic UI until it's sunset (3+ months notice).

### Will keyboard shortcuts change?
Some are new (Ctrl+B, Ctrl+P), but existing functionality remains accessible.

### How do I report bugs?
Open a GitHub issue with "[Workbench]" prefix, or use the feedback link.

### Can I export my workspace?
Yes, use the export feature (planned) to save workspace as JSON.

### What about mobile support?
Workbench is optimized for desktop. Mobile support is planned for future release.

## Timeline

| Week | Phase | Activities |
|------|-------|------------|
| 1-2 | Soft Launch | Deploy workbench.html, add link from old UI |
| 3-4 | Beta | Fix bugs, polish UX, update docs |
| 5 | Make Default | Swap URLs, add redirect, notify users |
| 6-8 | Stabilization | Monitor, fix issues, improve features |
| 9-16 | Deprecation Notice | Announce classic UI sunset |
| 17+ | Sunset | Remove classic UI, archive code |

## Support

### User Support
- Documentation: `/docs/`
- Video tutorial: (planned)
- GitHub Discussions: Community help
- GitHub Issues: Bug reports

### Developer Support
- Architecture docs: `/docs/ui-architecture.md`
- Storage docs: `/docs/storage-schema.md`
- Code comments: Inline documentation
- Examples: `/examples/` (planned)

## Conclusion

The migration to ChartSpec Workbench is designed to be smooth and low-risk:
- ✅ Automatic data migration
- ✅ Backward compatibility
- ✅ Gradual rollout
- ✅ Fallback options
- ✅ Clear communication

Users benefit from a modern, powerful interface while maintaining access to their data and the classic UI during transition.
