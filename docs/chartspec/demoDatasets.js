// Configuration for NYS Open Data demo datasets
// Each entry defines metadata and query presets for the Socrata loader.
// The aggregate preset is the default to keep payloads small and responsive.

export const DEMO_DATASETS = [
  {
    id: 'food-service-inspections',
    domain: 'health.data.ny.gov',
    datasetId: '2hcc-shji',
    title: 'Food Service Establishment Inspections',
    description: 'Recent restaurant inspections with outcomes and scores across New York State.',
    tags: ['categorical', 'geo'],
    columnHints: {
      dateFields: ['inspection_date'],
      categoryFields: ['facility_name', 'county', 'inspection_type', 'critical_flag'],
      numericFields: ['score']
    },
    queryPresets: {
      quick: {
        label: 'Quick Sample',
        description: 'Recent inspections capped at 1,000 rows for a fast preview.',
        params: { $order: 'inspection_date DESC', $limit: 1000 }
      },
      aggregate: {
        label: 'Chart-Ready Aggregate',
        description: 'Count of inspections by date (<= 1,000 rows).',
        params: {
          $select: 'inspection_date, count(inspection_id) as inspections',
          $group: 'inspection_date',
          $order: 'inspection_date',
          $limit: 1000
        }
      },
      raw: {
        label: 'Raw Rows (paged)',
        description: 'Raw inspection rows with paging controls.',
        params: { $order: 'inspection_date DESC', $limit: 1000, $offset: 0 }
      }
    }
  },
  {
    id: 'statewide-solar-projects',
    domain: 'data.ny.gov',
    datasetId: 'wgsj-jt5f',
    title: 'Statewide Distributed Solar Projects',
    description: 'Solar project interconnections by county and year since 2000.',
    tags: ['time-series', 'geo', 'numeric'],
    columnHints: {
      dateFields: ['approval_date'],
      categoryFields: ['county', 'utility'],
      numericFields: ['project_size_dc_kw', 'expected_first_year_production_kwh'],
      latLong: ['latitude', 'longitude']
    },
    queryPresets: {
      quick: {
        label: 'Quick Sample',
        description: 'Most recent 1,000 projects.',
        params: { $order: 'approval_date DESC', $limit: 1000 }
      },
      aggregate: {
        label: 'Chart-Ready Aggregate',
        description: 'Total capacity by approval year (<= 1,000 rows).',
        params: {
          $select: 'date_extract_y(approval_date) as year, sum(project_size_dc_kw) as total_kw',
          $group: 'year',
          $order: 'year',
          $limit: 200
        }
      },
      raw: {
        label: 'Raw Rows (paged)',
        description: 'Raw project rows with paging controls.',
        params: { $order: 'approval_date DESC', $limit: 1000, $offset: 0 }
      }
    }
  },
  {
    id: 'utility-energy-registry',
    domain: 'data.ny.gov',
    datasetId: 'tzb9-c2c6',
    title: 'Utility Energy Registry Monthly ZIP Code Energy Use',
    description: 'Monthly electric and gas use by ZIP code starting 2021.',
    tags: ['time-series', 'geo', 'numeric', 'large-N'],
    columnHints: {
      dateFields: ['month'],
      categoryFields: ['zip_code', 'fuel_type', 'service_class'],
      numericFields: ['usage_mwh', 'customers']
    },
    queryPresets: {
      quick: {
        label: 'Quick Sample',
        description: 'Recent months limited to 1,000 rows.',
        params: { $order: 'month DESC', $limit: 1000 }
      },
      aggregate: {
        label: 'Chart-Ready Aggregate',
        description: 'Usage by month aggregated statewide (<= 1,000 rows).',
        params: {
          $select: 'month, sum(usage_mwh) as usage_mwh',
          $group: 'month',
          $order: 'month',
          $limit: 500
        }
      },
      raw: {
        label: 'Raw Rows (paged)',
        description: 'Raw usage rows with paging controls.',
        params: { $order: 'month DESC', $limit: 1000, $offset: 0 }
      }
    }
  },
  {
    id: 'motor-vehicle-crashes',
    domain: 'data.ny.gov',
    datasetId: 'e8ky-4vqe',
    title: 'Motor Vehicle Crashes – Case Information',
    description: 'Crash case details with contributing factors and locations.',
    tags: ['time-series', 'geo', 'categorical', 'large-N'],
    columnHints: {
      dateFields: ['crash_date'],
      categoryFields: ['county', 'municipality', 'police_report'],
      numericFields: ['number_of_persons', 'number_of_vehicles']
    },
    queryPresets: {
      quick: {
        label: 'Quick Sample',
        description: 'Recent crashes capped at 1,000 rows.',
        params: { $order: 'crash_date DESC', $limit: 1000 }
      },
      aggregate: {
        label: 'Chart-Ready Aggregate',
        description: 'Crashes per day (<= 1,000 rows).',
        params: {
          $select: 'crash_date, count(crash_date) as crashes',
          $group: 'crash_date',
          $order: 'crash_date DESC',
          $limit: 365
        }
      },
      raw: {
        label: 'Raw Rows (paged)',
        description: 'Raw crash rows with paging controls.',
        params: { $order: 'crash_date DESC', $limit: 1000, $offset: 0 }
      }
    }
  }
];

export const DEFAULT_TTL_MS = 15 * 60 * 1000;

export function findDemoDataset(id) {
  return DEMO_DATASETS.find(d => d.id === id);
}

export function listDemoDatasets() {
  return DEMO_DATASETS;
}
