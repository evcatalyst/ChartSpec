# Deployment Guide

## What You'll Learn

This guide covers:
- Publishing ChartSpec to GitHub Pages
- Choosing between root and /docs deployment
- Link hygiene and relative URLs
- Verifying deployment
- Common deployment issues
- Custom domain setup

## GitHub Pages Overview

GitHub Pages is a free static site hosting service that serves files directly from a GitHub repository.

**Features:**
- Free hosting for public repositories
- HTTPS by default
- Custom domain support
- Deploy from root or /docs directory
- Automatic rebuilds on push

**Limitations:**
- Static files only (HTML, CSS, JS)
- No server-side processing
- 1GB soft limit on repository size
- 100GB/month bandwidth soft limit

## Deployment Options

### Option 1: Deploy from Root (Current Setup)

**Structure:**
```
ChartSpec/
├── index.html
├── workbench.html
├── styles.css
├── chartspec/
├── workbench/
├── datasets/
└── docs/
```

**Pages URL:** `https://yourusername.github.io/ChartSpec/`

**Pros:**
- Simple structure
- All files in one place
- Easy local development

**Cons:**
- Docs directory also deployed
- Larger deployment size

### Option 2: Deploy from /docs

**Structure:**
```
ChartSpec/
├── docs/
│   ├── index.html
│   ├── workbench.html
│   ├── styles.css
│   ├── chartspec/
│   ├── workbench/
│   └── datasets/
└── (development files in root)
```

**Pages URL:** `https://yourusername.github.io/ChartSpec/`

**Pros:**
- Separate docs from dev files
- Smaller deployment (only /docs deployed)
- Clear production/dev distinction

**Cons:**
- Must keep root and /docs in sync (see [SYNC_POLICY.md](../SYNC_POLICY.md))
- More complex file management

**Current Setup:** ChartSpec uses **Option 1** (root) but maintains `/docs` as a synchronized copy for Pages compatibility.

## Setup Instructions

### 1. Fork or Clone Repository

```bash
# Fork on GitHub, then clone your fork
git clone https://github.com/yourusername/ChartSpec.git
cd ChartSpec
```

### 2. Configure GitHub Pages

1. Go to repository on GitHub
2. Click **Settings** tab
3. Scroll to **Pages** section (left sidebar)
4. Under **Source**, select:
   - **Branch:** `main` (or your default branch)
   - **Folder:** `/ (root)` or `/docs`
5. Click **Save**

### 3. Wait for Deployment

GitHub Pages will build and deploy your site.

**Status indicators:**
- **Building:** Yellow dot
- **Success:** Green checkmark
- **Failed:** Red X

**Deployment time:** Usually 1-2 minutes

### 4. Verify Deployment

Visit your Pages URL:
```
https://yourusername.github.io/ChartSpec/
```

**Check:**
- ✅ Classic UI loads (`index.html`)
- ✅ Workbench UI loads (`workbench.html`)
- ✅ Styles applied correctly
- ✅ JavaScript modules load
- ✅ Demo datasets accessible
- ✅ Charts render properly

## Link Hygiene (Pages-Safe URLs)

For GitHub Pages compatibility, **always use relative URLs**.

### Why This Matters

GitHub Pages can deploy to:
- Root: `https://yourusername.github.io/` (custom domain)
- Subdirectory: `https://yourusername.github.io/ChartSpec/` (project page)

Absolute paths break in subdirectory deployments.

### Good: Relative URLs ✅

```html
<!-- HTML -->
<link rel="stylesheet" href="./styles.css">
<script src="./chartspec/main.js" type="module"></script>
<img src="./assets/logo.png">

<!-- Links -->
<a href="./workbench.html">Workbench</a>
<a href="./docs/schema.md">Schema Docs</a>
```

```javascript
// JavaScript
await fetch('./datasets/sample-sales.csv');
await import('./chartspec/dataEngine.js');
```

```markdown
<!-- Markdown -->
[Schema Guide](schema.md)
[Back to README](../README.md)
[Try Live](https://evcatalyst.github.io/ChartSpec/)
```

### Bad: Absolute URLs ❌

```html
<!-- HTML -->
<link rel="stylesheet" href="/styles.css">  <!-- ❌ Breaks in subdirectory -->
<script src="/chartspec/main.js"></script>   <!-- ❌ Breaks in subdirectory -->
```

```javascript
// JavaScript
await fetch('/datasets/sample-sales.csv');  // ❌ Breaks in subdirectory
```

```markdown
<!-- Markdown -->
[Schema](/docs/schema.md)  <!-- ❌ Breaks in subdirectory -->
```

### Edge Cases

#### Root Domain (Custom Domain)
If using a custom domain, both work:
```
https://chartspec.example.com/styles.css  (absolute)
https://chartspec.example.com/styles.css  (relative ./styles.css)
```

#### Subdirectory Deployment
Only relative works:
```
https://user.github.io/ChartSpec/styles.css  (relative ./styles.css ✅)
https://user.github.io/styles.css             (absolute /styles.css ❌)
```

### Testing Both Scenarios Locally

```bash
# Test as root domain
npm run serve
# Visit: http://localhost:4173/

# Test as subdirectory
npm run serve
# Visit: http://localhost:4173/docs/
```

## File Synchronization

ChartSpec maintains files in both root and `/docs` directories.

**Why:** GitHub Pages deploys from root, but `/docs` is a common convention.

**Important:** Keep both in sync using `check-sync.sh`:

```bash
# Before committing
./check-sync.sh

# If out of sync, sync files
cp index.html docs/index.html
cp workbench.html docs/workbench.html
cp styles.css docs/styles.css
rsync -av chartspec/ docs/chartspec/
# ... etc
```

See [SYNC_POLICY.md](../SYNC_POLICY.md) for complete list of synced files.

## Verifying Deployment

### 1. Visual Check

Visit your Pages URL and verify:

**Classic UI (`index.html`):**
- ✅ Page loads without errors
- ✅ Styles applied (not unstyled HTML)
- ✅ Dataset dropdown populated with demo datasets
- ✅ LLM settings panel functional
- ✅ Chart area visible

**Workbench UI (`workbench.html`):**
- ✅ Page loads without errors
- ✅ Grid layout renders
- ✅ Command bar visible
- ✅ Chat drawer opens/closes
- ✅ Demo datasets available

### 2. Console Check

Open browser DevTools (F12):

**Console tab:**
- ✅ No 404 errors (missing files)
- ✅ No CORS errors
- ✅ No module load errors
- ✅ Application initializes successfully

**Network tab:**
- ✅ All assets load (200 status)
- ✅ No failed requests
- ✅ CDN resources load (Plotly, D3, AVA)

### 3. Functionality Check

**Test core features:**
1. Select "Sample Sales" dataset
2. Switch to Smart Mode
3. Type: "show bar chart of Revenue by Region"
4. Click Send
5. ✅ Chart renders successfully

### 4. Mobile Check

Test on mobile device or use DevTools device emulation:
- ✅ Responsive layout works
- ✅ Touch interactions work
- ✅ No horizontal scrolling
- ✅ Charts render at appropriate size

## Common Deployment Issues

### Issue: 404 on All Pages

**Symptom:** GitHub Pages shows 404 error  
**Cause:** Pages not enabled or wrong branch/folder selected

**Solution:**
1. Go to Settings → Pages
2. Verify correct branch and folder selected
3. Save and wait for rebuild
4. Check repository visibility (must be public for free Pages)

### Issue: Styles Not Loading

**Symptom:** Unstyled HTML, layout broken  
**Cause:** Absolute paths to CSS files

**Solution:**
Change CSS links to relative:
```html
<!-- Before -->
<link rel="stylesheet" href="/styles.css">

<!-- After -->
<link rel="stylesheet" href="./styles.css">
```

### Issue: JavaScript Not Loading

**Symptom:** Blank page, console errors about missing modules  
**Cause:** Absolute paths to JS files or missing `type="module"`

**Solution:**
```html
<!-- Ensure type="module" -->
<script src="./chartspec/main.js" type="module"></script>

<!-- Check import paths -->
import { dataEngine } from './dataEngine.js';  // ✅
import { dataEngine } from '/dataEngine.js';   // ❌
```

### Issue: Charts Not Rendering

**Symptom:** Chart area empty, no errors  
**Cause:** CDN blocked or Plotly failed to load

**Solution:**
1. Check Network tab for failed CDN requests
2. Verify Plotly CDN URL is correct
3. Try different CDN or host locally
4. Check for Content Security Policy issues

### Issue: Datasets Not Loading

**Symptom:** "Failed to fetch" errors for datasets  
**Cause:** Wrong path to CSV files

**Solution:**
```javascript
// Use relative paths
const url = './datasets/sample-sales.csv';  // ✅
const url = '/datasets/sample-sales.csv';   // ❌

// Verify file exists in repository
ls datasets/sample-sales.csv
```

### Issue: Out of Sync Files

**Symptom:** Different behavior on Pages vs local  
**Cause:** Root and /docs directories out of sync

**Solution:**
```bash
# Check sync status
./check-sync.sh

# If out of sync, determine which is correct
# Then sync (example: root is correct)
cp index.html docs/index.html
# ... sync other files

# Commit and push
git add .
git commit -m "Sync root and docs directories"
git push
```

### Issue: Custom Domain Not Working

**Symptom:** Custom domain shows 404 or doesn't resolve  
**Cause:** DNS not configured or CNAME file missing

**Solution:**
1. Add CNAME record in DNS provider: `www.example.com` → `yourusername.github.io`
2. Add CNAME file to repository root:
   ```
   www.example.com
   ```
3. In Settings → Pages, enter custom domain
4. Wait for DNS propagation (up to 24 hours)
5. Enable "Enforce HTTPS"

## Custom Domain Setup

### 1. Configure DNS

In your DNS provider, add:

**Apex domain (example.com):**
```
A     @     185.199.108.153
A     @     185.199.109.153
A     @     185.199.110.153
A     @     185.199.111.153
```

**Subdomain (www.example.com):**
```
CNAME www   yourusername.github.io
```

### 2. Add CNAME File

Create `CNAME` in repository root:
```
www.example.com
```

Or add via Settings → Pages → Custom domain.

### 3. Enable HTTPS

After DNS propagates:
1. Go to Settings → Pages
2. Check "Enforce HTTPS"
3. Wait for SSL certificate provisioning

### 4. Verify

Visit `https://www.example.com` and verify:
- ✅ Site loads over HTTPS
- ✅ No certificate warnings
- ✅ All resources load correctly
- ✅ Redirects work (http → https, apex → www)

## Deployment Checklist

Before pushing to GitHub:

- [ ] Run tests: `npm test`
- [ ] Check sync: `./check-sync.sh`
- [ ] Verify relative URLs in HTML/JS/CSS
- [ ] Test locally: `npm run serve`
- [ ] Check console for errors (F12)
- [ ] Test both Classic and Workbench UIs
- [ ] Test on mobile/responsive view
- [ ] Commit and push changes
- [ ] Wait for Pages build
- [ ] Verify deployed site
- [ ] Check functionality (dataset, chart rendering)

## Continuous Deployment

### Automatic Deploys

GitHub Pages automatically rebuilds on push to configured branch.

**Workflow:**
1. Make changes locally
2. Test: `npm test`
3. Commit: `git commit -m "Your changes"`
4. Push: `git push origin main`
5. GitHub Pages rebuilds automatically
6. Verify deployment

### GitHub Actions (Optional)

Add automated checks before deployment:

**`.github/workflows/deploy.yml`:**
```yaml
name: Deploy to Pages

on:
  push:
    branches: [main]

jobs:
  test-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
      - run: ./check-sync.sh
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./
```

## Rolling Back

If deployment breaks:

### Option 1: Revert Commit

```bash
# Find commit to revert to
git log --oneline

# Revert to specific commit
git revert <commit-hash>
git push origin main
```

### Option 2: Force Push Previous Version

```bash
# Reset to previous commit
git reset --hard HEAD~1

# Force push (WARNING: rewrites history)
git push --force origin main
```

### Option 3: Use GitHub Interface

1. Go to repository → Code → Commits
2. Find working commit
3. Click "Browse files"
4. Click "..." → "Create new branch from this commit"
5. Configure Pages to deploy from new branch

## Tips and Best Practices

1. **Test locally first:** Always test with `npm run serve` before deploying
2. **Use relative paths:** Never use absolute paths for assets
3. **Keep in sync:** Run `./check-sync.sh` before every commit
4. **Test both UIs:** Verify Classic and Workbench both work
5. **Check mobile:** Test responsive layout before deploying
6. **Monitor console:** Watch for errors in browser DevTools
7. **Use HTTPS:** Always enable "Enforce HTTPS" for security
8. **Version assets:** Consider adding version query params for cache busting: `main.js?v=1.0.0`
9. **Document changes:** Keep CHANGELOG.md updated
10. **Automate checks:** Use GitHub Actions to prevent broken deployments

## Next Steps

- **[Testing Guide](testing.md)** - Test before deploying
- **[Architecture Guide](architecture.md)** - Understand what you're deploying
- **[SYNC_POLICY.md](../SYNC_POLICY.md)** - File synchronization requirements
- **[Back to Index](index.md)** - Documentation hub

---

**Navigation:** [← Back to Index](index.md) | [Testing →](testing.md) | [Schema →](schema.md)
