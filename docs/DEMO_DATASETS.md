# Demo Datasets - Quick Reference Guide

This guide provides quick reference information for all demo datasets available in ChartSpec Workbench.

---

## Dataset 1: Sample Sales

**File**: `datasets/sample-sales.csv`  
**Rows**: 20  
**Auto-loaded**: ✅ Yes

### Schema
| Column   | Type    | Description                    |
|----------|---------|--------------------------------|
| Date     | Date    | Transaction date               |
| Region   | String  | Sales region (North/South/East/West) |
| Product  | String  | Product name (Widget A/B/C)    |
| Quantity | Number  | Units sold                     |
| Revenue  | Number  | Total revenue                  |

### Sample Data
```csv
Date,Region,Product,Quantity,Revenue
2024-01-15,North,Widget A,120,2400
2024-01-15,South,Widget B,85,1700
```

### Visualization Ideas
- **Bar Chart**: Revenue by Region
- **Line Chart**: Revenue over time
- **Pie Chart**: Revenue by Product
- **Scatter**: Quantity vs Revenue
- **Grouped**: Sum of Revenue by Region and Product

---

## Dataset 2: Sample Weather

**File**: `datasets/sample-weather.csv`  
**Rows**: 20  
**Auto-loaded**: ✅ Yes

### Schema
| Column        | Type    | Description                    |
|---------------|---------|--------------------------------|
| Date          | Date    | Observation date               |
| City          | String  | City name                      |
| Temperature   | Number  | Temperature (°F)               |
| Humidity      | Number  | Humidity percentage            |
| Precipitation | Number  | Precipitation (inches)         |

### Sample Data
```csv
Date,City,Temperature,Humidity,Precipitation
2024-01-01,New York,32,65,0.1
2024-01-01,Los Angeles,58,45,0.0
```

### Visualization Ideas
- **Line Chart**: Temperature trends over time
- **Scatter**: Temperature vs Humidity (colored by City)
- **Bar Chart**: Average Temperature by City
- **Box Plot**: Temperature distribution by City
- **Heatmap**: City vs Month temperature patterns

---

## Dataset 3: Sample E-commerce ⭐ NEW

**File**: `datasets/sample-ecommerce.csv`  
**Rows**: 30  
**Auto-loaded**: ❌ Requires manual registration

### Schema
| Column        | Type    | Description                    |
|---------------|---------|--------------------------------|
| Date          | Date    | Purchase date                  |
| CustomerID    | String  | Customer identifier            |
| Product       | String  | Product name                   |
| Category      | String  | Product category               |
| Quantity      | Number  | Units purchased                |
| Price         | Number  | Unit price                     |
| Total         | Number  | Total amount                   |
| Region        | String  | Customer region                |
| PaymentMethod | String  | Payment method used            |

### Sample Data
```csv
Date,CustomerID,Product,Category,Quantity,Price,Total,Region,PaymentMethod
2024-01-05,C001,Laptop,Electronics,1,999.99,999.99,North,Credit Card
2024-01-05,C002,Mouse,Electronics,2,29.99,59.98,South,PayPal
```

### Categories
- Electronics
- Furniture
- Office Supplies
- Appliances

### Payment Methods
- Credit Card
- PayPal
- Debit Card
- Cash

### Visualization Ideas
- **Pie Chart**: Sales by Category
- **Bar Chart**: Total Revenue by Region
- **Stacked Bar**: Payment Method by Region
- **Line Chart**: Sales trend over time
- **Grouped**: Average order value by Category and Region
- **Table**: Top customers by Total spent

---

## Dataset 4: Sample Employees ⭐ NEW

**File**: `datasets/sample-employees.csv`  
**Rows**: 20  
**Auto-loaded**: ❌ Requires manual registration

### Schema
| Column            | Type    | Description                    |
|-------------------|---------|--------------------------------|
| EmployeeID        | String  | Employee identifier            |
| Name              | String  | Employee name                  |
| Department        | String  | Department name                |
| Position          | String  | Job title                      |
| Salary            | Number  | Annual salary                  |
| HireDate          | Date    | Date of hire                   |
| Age               | Number  | Employee age                   |
| YearsOfService    | Number  | Years at company               |
| PerformanceRating | Number  | Performance rating (0-5)       |

### Sample Data
```csv
EmployeeID,Name,Department,Position,Salary,HireDate,Age,YearsOfService,PerformanceRating
E001,Alice Johnson,Engineering,Senior Developer,95000,2018-03-15,32,6,4.5
E002,Bob Smith,Engineering,Junior Developer,65000,2021-06-01,26,3,4.0
```

### Departments
- Engineering
- Marketing
- Sales
- HR
- Finance

### Visualization Ideas
- **Bar Chart**: Average Salary by Department
- **Scatter**: Years of Service vs Salary (colored by Department)
- **Box Plot**: Salary distribution by Department
- **Histogram**: Age distribution
- **Grouped**: Count of employees by Department and Position
- **Table**: Top performers by Performance Rating

---

## Dataset 5: Sample Inventory ⭐ NEW

**File**: `datasets/sample-inventory.csv`  
**Rows**: 20  
**Auto-loaded**: ❌ Requires manual registration

### Schema
| Column        | Type    | Description                    |
|---------------|---------|--------------------------------|
| ProductID     | String  | Product identifier             |
| ProductName   | String  | Product name                   |
| Category      | String  | Product category               |
| Warehouse     | String  | Storage location               |
| Quantity      | Number  | Current stock level            |
| ReorderLevel  | Number  | Reorder threshold              |
| UnitCost      | Number  | Cost per unit                  |
| LastRestocked | Date    | Last restock date              |
| Supplier      | String  | Supplier name                  |

### Sample Data
```csv
ProductID,ProductName,Category,Warehouse,Quantity,ReorderLevel,UnitCost,LastRestocked,Supplier
P001,Widget A,Electronics,Warehouse A,450,100,12.50,2024-01-15,Supplier X
P002,Widget B,Electronics,Warehouse A,320,100,15.75,2024-01-20,Supplier X
```

### Categories
- Electronics
- Hardware
- Components
- Finished Goods
- Raw Materials
- Supplies

### Warehouses
- Warehouse A
- Warehouse B
- Warehouse C

### Suppliers
- Supplier X
- Supplier Y
- Supplier Z
- Internal

### Visualization Ideas
- **Bar Chart**: Stock Quantity by Warehouse
- **Pie Chart**: Inventory value by Category
- **Scatter**: Quantity vs Reorder Level (to identify low stock)
- **Grouped**: Total inventory cost by Supplier and Category
- **Table**: Products below reorder level
- **Heatmap**: Category vs Warehouse stock levels

---

## How to Register New Datasets

### Method 1: Using the UI (Recommended)
1. Click "Add Dataset" button
2. Enter dataset name (e.g., "Sample E-commerce")
3. Enter CSV URL: `./datasets/sample-ecommerce.csv`
4. Click "Register"

### Method 2: Using Developer Console
```javascript
// In browser console
const { registerDataset } = await import('./chartspec/datasetRegistry.js');

await registerDataset(
  'Sample E-commerce',
  './datasets/sample-ecommerce.csv'
);
```

### Method 3: Auto-registration (Code)
Edit `chartspec/datasetRegistry.js` to include new datasets in the auto-registration function.

---

## Common Queries for Each Dataset

### Sample Sales
```
- "Show bar chart of Revenue by Region"
- "Display line chart of Revenue over Date"
- "Show pie chart of Revenue by Product"
- "Show total Revenue by Region sorted descending"
- "Display top 5 products by Revenue"
```

### Sample Weather
```
- "Show line chart of Temperature by City over time"
- "Display scatter plot of Temperature vs Humidity colored by City"
- "Show average Temperature by City"
- "Display bar chart of total Precipitation by City"
- "Show cities where Temperature > 60"
```

### Sample E-commerce
```
- "Show pie chart of Total by Category"
- "Display bar chart of Total by Region"
- "Show line chart of Total over Date"
- "Display sales by PaymentMethod"
- "Show top 10 products by Total"
```

### Sample Employees
```
- "Show bar chart of average Salary by Department"
- "Display scatter plot of YearsOfService vs Salary colored by Department"
- "Show count of employees by Department"
- "Display top 5 employees by Salary"
- "Show employees with PerformanceRating > 4.5"
```

### Sample Inventory
```
- "Show bar chart of Quantity by Warehouse"
- "Display pie chart of inventory value by Category"
- "Show products where Quantity < ReorderLevel"
- "Display total inventory cost by Supplier"
- "Show inventory levels by Category and Warehouse"
```

---

## Testing Scenarios

### Beginner Testing
1. Load Sample Sales
2. Create simple bar chart
3. Create pie chart
4. View data in table

### Intermediate Testing
1. Load Sample Weather
2. Create multi-dimensional scatter plot
3. Apply filters
4. Create grouped aggregations

### Advanced Testing
1. Load all datasets
2. Create multiple visualizations
3. Switch between datasets
4. Compare data across datasets
5. Test workspace management

---

## Performance Notes

### Dataset Sizes
- **Small** (< 50 rows): Instant loading and rendering
- **Medium** (50-500 rows): Fast loading, smooth rendering
- **Large** (500-5000 rows): May need sampling, consider performance
- **Very Large** (> 5000 rows): May exceed localStorage, use IndexedDB

### Current Dataset Sizes
| Dataset           | Rows | Size (KB) | Performance |
|-------------------|------|-----------|-------------|
| Sample Sales      | 20   | ~1 KB     | Excellent   |
| Sample Weather    | 20   | ~1 KB     | Excellent   |
| Sample E-commerce | 30   | ~2 KB     | Excellent   |
| Sample Employees  | 20   | ~1.5 KB   | Excellent   |
| Sample Inventory  | 20   | ~1.5 KB   | Excellent   |

All demo datasets are optimized for fast loading and smooth rendering.

---

## Troubleshooting

### Dataset Not Loading
1. Check CSV file path is correct
2. Verify CSV format (comma-separated, headers in first row)
3. Check browser console for errors
4. Ensure file is accessible (relative path or public URL)

### Charts Not Rendering
1. Verify dataset is selected
2. Check column names match ChartSpec
3. Ensure data types are correct
4. Check for empty or null values

### Performance Issues
1. Check dataset size (< 1MB recommended)
2. Consider using data sampling
3. Reduce number of simultaneous tiles
4. Clear browser cache and localStorage

---

## Additional Resources

- **User Journeys Guide**: `docs/USER_JOURNEYS.md`
- **Testing Results**: `docs/TESTING_RESULTS.md`
- **Main README**: `README.md`
- **ChartSpec Schema**: `chartspec/chartSpec.js`

---

**Last Updated**: December 13, 2024
