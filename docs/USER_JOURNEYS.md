# ChartSpec Workbench - User Journeys & Testing Guide

## Overview
This document provides comprehensive user journeys for testing the ChartSpec Workbench. Each journey tests specific functionality and helps identify potential issues.

## Demo Datasets

The following demo datasets are available for testing:

### 1. Sample Sales (datasets/sample-sales.csv)
- **Columns**: Date, Region, Product, Quantity, Revenue
- **Rows**: 20
- **Use Cases**: Regional analysis, product comparisons, time-series analysis

### 2. Sample Weather (datasets/sample-weather.csv)
- **Columns**: Date, City, Temperature, Humidity, Precipitation
- **Rows**: 20
- **Use Cases**: Weather trends, city comparisons, correlation analysis

### 3. Sample E-commerce (datasets/sample-ecommerce.csv) - NEW
- **Columns**: Date, CustomerID, Product, Category, Quantity, Price, Total, Region, PaymentMethod
- **Rows**: 30
- **Use Cases**: E-commerce analytics, payment analysis, customer behavior

### 4. Sample Employees (datasets/sample-employees.csv) - NEW
- **Columns**: EmployeeID, Name, Department, Position, Salary, HireDate, Age, YearsOfService, PerformanceRating
- **Rows**: 20
- **Use Cases**: HR analytics, department comparisons, salary analysis

### 5. Sample Inventory (datasets/sample-inventory.csv) - NEW
- **Columns**: ProductID, ProductName, Category, Warehouse, Quantity, ReorderLevel, UnitCost, LastRestocked, Supplier
- **Rows**: 20
- **Use Cases**: Inventory management, warehouse analysis, supplier comparison

## User Journey 1: First-Time User Experience

**Goal**: Test the initial user experience and basic chart creation

### Steps:
1. Open `workbench.html` in a browser
2. Observe the initial landing page and UI layout
3. Check if demo datasets are automatically loaded
4. Select "Sample Sales" dataset
5. In Smart Mode (if available), type: "show bar chart of Revenue by Region"
6. Verify that a chart is generated
7. Check that the chart tile appears in the workspace
8. Try to resize the chart tile
9. Try to move the chart tile

### Expected Results:
- [ ] Page loads without errors
- [ ] UI is responsive and properly laid out
- [ ] Demo datasets appear in dataset selector
- [ ] Chart generates successfully
- [ ] Chart tile is interactive (can resize/move)
- [ ] No freezing or hanging

### Screenshots to Capture:
- Initial landing page
- Dataset selection
- Chart generation
- Chart tile interaction

## User Journey 2: Import Custom Dataset

**Goal**: Test the dataset import functionality

### Steps:
1. Click "Add Dataset" or equivalent button
2. Enter dataset name: "Sample E-commerce"
3. Enter CSV URL: `./datasets/sample-ecommerce.csv`
4. Click "Register" or "Add"
5. Verify dataset appears in the list
6. Select the newly imported dataset
7. View the data in a table or inspector
8. Create a chart: "show pie chart of Total by Category"

### Expected Results:
- [ ] Dataset registration UI works correctly
- [ ] CSV file is loaded successfully
- [ ] Dataset appears in selector
- [ ] Data is correctly parsed
- [ ] Charts can be created from imported data
- [ ] No errors during import process

### Screenshots to Capture:
- Dataset registration form
- Dataset list with new dataset
- Data table view
- Chart from imported data

## User Journey 3: Multiple Chart Types

**Goal**: Test all available chart types

### Steps:
1. Select "Sample Sales" dataset
2. Create a bar chart: "show bar chart of Revenue by Region"
3. Create a line chart: "show line chart of Revenue over Date"
4. Create a pie chart: "show pie chart of Revenue by Product"
5. Create a scatter plot: "show scatter plot of Quantity vs Revenue"
6. Create a table view: "show table of all data"
7. Verify all charts render correctly
8. Check that multiple charts can coexist in the workspace

### Expected Results:
- [ ] Bar chart renders correctly
- [ ] Line chart renders correctly
- [ ] Pie chart renders correctly
- [ ] Scatter plot renders correctly
- [ ] Table view displays data correctly
- [ ] Multiple tiles can be displayed simultaneously
- [ ] No performance degradation with multiple charts

### Screenshots to Capture:
- Each chart type
- Multiple charts in workspace
- Grid layout with various chart types

## User Journey 4: Data Filtering and Aggregation

**Goal**: Test data transformation capabilities

### Steps:
1. Select "Sample Weather" dataset
2. Create chart with filter: "show bar chart of Temperature by City where Temperature > 50"
3. Create aggregated view: "show total Precipitation by City"
4. Create sorted view: "show top 5 cities by Temperature"
5. Create grouped data: "show average Temperature by City"
6. Verify all transformations work correctly

### Expected Results:
- [ ] Filters are applied correctly
- [ ] Aggregations calculate properly
- [ ] Sorting works as expected
- [ ] Group by operations work correctly
- [ ] Data transformations don't cause errors
- [ ] Results match expected values

### Screenshots to Capture:
- Filtered chart
- Aggregated chart
- Sorted data view
- Grouped data visualization

## User Journey 5: Smart Mode (AVA-Powered)

**Goal**: Test the Smart Mode functionality without API keys

### Steps:
1. Enable Smart Mode in settings
2. Select "Sample E-commerce" dataset
3. Type: "show bar chart of Total by Category"
4. Verify chart recommendation appears
5. Try command: "display line chart of Price over Date"
6. Try command: "show pie chart grouped by PaymentMethod"
7. View command suggestions as you type
8. Check AVA recommendations

### Expected Results:
- [ ] Smart Mode can be enabled
- [ ] Commands are parsed correctly
- [ ] Chart recommendations appear
- [ ] Charts generate without API key
- [ ] Command suggestions are helpful
- [ ] AVA integration works smoothly
- [ ] No errors in console

### Screenshots to Capture:
- Smart Mode settings
- Command input with suggestions
- AVA recommendations
- Generated charts in Smart Mode

## User Journey 6: LLM Mode (API-Based)

**Goal**: Test LLM integration (requires API key)

### Steps:
1. Open settings/NL settings panel (look for settings icon or gear icon in UI)
2. Uncheck "Smart Mode (AVA-Powered)" checkbox if checked
3. Uncheck "Local Mode (No LLM)" checkbox if checked
4. Select LLM provider (OpenAI or Grok)
5. Enter API key in the API key field
6. Select "Sample Employees" dataset from dataset dropdown
7. Chat: "Create a bar chart showing average salary by department"
8. Chat: "Show me the distribution of performance ratings"
9. Chat: "Which department has the highest average salary?"
10. Verify LLM generates correct ChartSpecs
11. Check token usage display

**Note**: Smart Mode and LLM Mode are mutually exclusive. When Smart Mode is enabled, the workbench uses local AVA-powered parsing. When disabled, it uses the selected LLM provider.

### Expected Results:
- [ ] API key can be configured
- [ ] LLM processes natural language correctly
- [ ] ChartSpecs are generated accurately
- [ ] Charts render from LLM output
- [ ] Token usage is displayed
- [ ] Multiple iterations work
- [ ] Error handling for invalid API keys

### Screenshots to Capture:
- LLM settings panel
- Chat interaction
- Token usage display
- Generated charts from LLM

## User Journey 7: Workspace Management

**Goal**: Test workspace layout and organization features

### Steps:
1. Create 4-5 different charts
2. Rearrange tiles by dragging
3. Resize tiles to different dimensions
4. Try layout presets (if available): single, 2-up, dashboard
5. Toggle chat drawer (Ctrl+B)
6. Try presentation mode (Ctrl+P)
7. Close some tiles
8. Save workspace state
9. Refresh page and verify state persists

### Expected Results:
- [ ] Tiles can be dragged smoothly
- [ ] Tiles resize properly
- [ ] Layout presets work correctly
- [ ] Keyboard shortcuts function
- [ ] Chat drawer toggles smoothly
- [ ] Presentation mode activates
- [ ] Tiles can be closed
- [ ] Workspace state persists
- [ ] No memory leaks or slowdowns

### Screenshots to Capture:
- Various tile arrangements
- Layout presets
- Presentation mode
- Chat drawer toggle

## User Journey 8: Data Inspection and Analysis

**Goal**: Test data inspection capabilities

### Steps:
1. Select "Sample Inventory" dataset
2. Create a chart
3. Open inspector tile
4. View ChartSpec JSON
5. Check data summary statistics
6. View token estimation (if in LLM mode)
7. Identify any warnings or errors
8. Manually edit ChartSpec in inspector
9. Apply edited spec

### Expected Results:
- [ ] Inspector tile displays correctly
- [ ] ChartSpec JSON is properly formatted
- [ ] Data statistics are accurate
- [ ] Token estimation is reasonable
- [ ] Warnings are helpful
- [ ] Manual spec editing works
- [ ] Changes apply to chart
- [ ] No crashes during inspection

### Screenshots to Capture:
- Inspector tile view
- ChartSpec JSON
- Data statistics
- Manual spec editing

## User Journey 9: Error Handling and Edge Cases

**Goal**: Test error handling and robustness

### Steps:
1. Try to create chart without selecting dataset
2. Enter invalid command in Smart Mode (e.g., "xyz abc 123" or "show invalid chart type")
3. Use LLM mode with invalid API key (e.g., "invalid-key-12345")
4. Try to load non-existent CSV file (URL: `./datasets/does-not-exist.csv`)
5. Import CSV with malformed data (missing commas, unmatched quotes, inconsistent column counts)
6. Create very complex chart spec (e.g., 10+ filters, deeply nested aggregations, faceting with 20+ groups)
7. Add many tiles to test performance limits (try creating 15-20 chart tiles)
8. Try rapid clicking/interaction (quickly toggle chat drawer, switch datasets, create/delete tiles)
9. Test with browser dev tools open (check for memory leaks, console errors)

### Expected Results:
- [ ] Helpful error messages appear
- [ ] App doesn't crash on invalid input
- [ ] API errors are handled gracefully
- [ ] File loading errors are reported
- [ ] Malformed data is handled
- [ ] Complex specs render or fail gracefully
- [ ] Performance remains acceptable
- [ ] No freezing under stress
- [ ] Console errors are minimal and informative

### Screenshots to Capture:
- Error message examples
- Invalid input handling
- Performance under load

## User Journey 10: Multi-Dataset Workflow

**Goal**: Test working with multiple datasets

### Steps:
1. Import all demo datasets
2. Switch between datasets
3. Create chart from Dataset A
4. Switch to Dataset B
5. Create another chart from Dataset B
6. Verify both charts remain visible
7. Switch back to Dataset A
8. Create additional visualization
9. Organize workspace with charts from multiple sources

### Expected Results:
- [ ] Multiple datasets can be loaded
- [ ] Switching datasets works smoothly
- [ ] Charts from different datasets coexist
- [ ] No data mixing between datasets
- [ ] Dataset selection is clear
- [ ] Performance is acceptable
- [ ] No confusion about data source

### Screenshots to Capture:
- Multiple datasets loaded
- Charts from different datasets
- Dataset switching
- Multi-source workspace

## Common Issues to Watch For

### Performance Issues:
- [ ] Page loading time excessive (>5 seconds)
- [ ] Chart rendering slow (>3 seconds)
- [ ] UI freezing or hanging
- [ ] Memory leaks over extended use
- [ ] Slow response to user input

### UI/UX Issues:
- [ ] Layout breaking on resize
- [ ] Overlapping elements
- [ ] Unresponsive buttons
- [ ] Drag and drop not working
- [ ] Tiles not snapping to grid
- [ ] Chat drawer stuttering
- [ ] Modal dialogs not closing

### Data Issues:
- [ ] CSV parsing errors
- [ ] Data type mismatches
- [ ] Missing or undefined values
- [ ] Incorrect aggregations
- [ ] Filter not applying
- [ ] Data not refreshing

### Functionality Issues:
- [ ] Charts not rendering
- [ ] Commands not parsing
- [ ] LLM not responding
- [ ] Smart Mode failures
- [ ] Dataset registration failing
- [ ] State not persisting
- [ ] Keyboard shortcuts not working

## Testing Checklist

### Pre-Testing Setup:
- [ ] Clear browser cache
- [ ] Clear localStorage
- [ ] Open browser dev tools console
- [ ] Enable network throttling (optional)
- [ ] Prepare screenshot tool
- [ ] Note browser version and OS

### During Testing:
- [ ] Monitor console for errors
- [ ] Watch network tab for failed requests
- [ ] Note any performance issues
- [ ] Document unexpected behavior
- [ ] Capture screenshots at each step
- [ ] Test keyboard shortcuts
- [ ] Try different viewport sizes

### Post-Testing:
- [ ] Review all screenshots
- [ ] Document all issues found
- [ ] Categorize issues by severity
- [ ] Verify fixes for critical issues
- [ ] Create issue tickets for bugs
- [ ] Update documentation if needed

## Known Limitations

1. **Browser Storage**: 
   - LocalStorage has ~5MB total limit across all sites (browser-dependent)
   - The workbench uses IndexedDB for better performance and larger storage
   - Datasets are automatically migrated to IndexedDB
   - Very large datasets (>10MB) may still cause performance issues
2. **Large Datasets**: Files over 1MB may cause performance issues during initial load and rendering
3. **Browser Compatibility**: Requires modern browser with ES6 modules, IndexedDB, and Fetch API
4. **API Costs**: LLM mode requires paid API keys (OpenAI or Grok)
5. **Offline Mode**: LLM mode and CDN resources require internet connection; Smart Mode works offline after initial load

## Recommended Testing Environments

- **Chrome/Edge**: Version 90+
- **Firefox**: Version 88+
- **Safari**: Version 14+
- **Screen Resolutions**: 1920x1080, 1366x768, mobile (375x667)
- **Network Conditions**: Fast 3G, Slow 3G, Offline

## Success Criteria

A successful test session should demonstrate:
- [ ] All user journeys complete without critical errors
- [ ] No UI freezing or hanging
- [ ] All chart types render correctly
- [ ] Data import works reliably
- [ ] Smart Mode and LLM Mode both function
- [ ] Workspace state persists
- [ ] Performance is acceptable for typical use
- [ ] Error messages are helpful and clear
- [ ] Documentation is accurate

## Next Steps After Testing

1. Document all issues found
2. Prioritize fixes (critical, high, medium, low)
3. Create bug tickets with reproduction steps
4. Update user documentation
5. Add automated tests for critical paths
6. Share findings with development team
7. Plan follow-up testing after fixes
