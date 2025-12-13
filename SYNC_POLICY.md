# File Sync Policy

## Overview

The ChartSpec project maintains two copies of key files:
- **Root directory**: For local development
- **`/docs` directory**: For GitHub Pages deployment (https://evcatalyst.github.io/ChartSpec/)

These files **MUST** be kept in sync at all times.

## Files and Directories to Keep in Sync

### HTML Files
- `workbench.html` ↔ `docs/workbench.html`
- `index.html` ↔ `docs/index.html`

### CSS Files
- `styles.css` ↔ `docs/styles.css`

### Directories
- `workbench/` ↔ `docs/workbench/`
- `chartspec/` ↔ `docs/chartspec/`
- `components/` ↔ `docs/components/`
- `state/` ↔ `docs/state/`
- `styles/` ↔ `docs/styles/`

## Why This Matters

The `/docs` directory is deployed to GitHub Pages and serves as the live application. If files in the root directory diverge from the `/docs` directory:
- Users will see different behavior on the live site vs. local development
- Bug fixes or features may not be properly deployed
- Testing locally may not reflect production behavior

## Checking Sync Status

Run the sync check script before committing:

```bash
./check-sync.sh
```

**Note**: The script is already executable. If you encounter permission issues, run: `chmod +x check-sync.sh`

This script will:
- ✅ Verify all files and directories are in sync
- ❌ Report any discrepancies
- Provide commands to fix sync issues

## Best Practices

1. **Always edit both locations** when making changes
2. **Run `./check-sync.sh`** before committing
3. **Never commit** if sync check fails
4. **Document changes** in both locations if comments are added

## Fixing Sync Issues

If files are out of sync, determine which version is correct:

### Option A: Root is correct (update docs)
```bash
cp workbench.html docs/workbench.html
# or for directories:
rsync -av workbench/ docs/workbench/
```

### Option B: Docs is correct (update root)
```bash
cp docs/workbench.html workbench.html
# or for directories:
rsync -av docs/workbench/ workbench/
```

**Generally, the `/docs` version should be considered the source of truth** since it represents what users see on the live site.

## CI/CD Integration (Future)

Consider adding the sync check to:
- Pre-commit hooks
- GitHub Actions workflow
- Pull request checks

This will prevent sync issues from being merged.
