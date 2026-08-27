import { MarketCompensationData, MarketCompensationQuery, MarketDataProvider, MarketDataSource } from '../types';
import { AdzunaClient, realAdzunaClient } from './adzunaClient';

const MIN_TOTAL_VACANCIES = 5;
const MIN_NONZERO_BUCKETS = 2;
const HIGH_SAMPLE_SIZE = 20;

// Only currencies we can map to one unambiguous Adzuna country. Anything
// else returns null rather than guessing a country/dataset.
const CURRENCY_TO_ADZUNA_COUNTRY: Record<string, string> = {
  INR: 'in',
  GBP: 'gb',
  USD: 'us'
};

const SENIORITY_MODIFIERS = /\b(senior|sr\.?|junior|jr\.?|lead|principal|staff|entry[-\s]level|associate|trainee|intern|i{1,3}\b|\b[123]\b)\b/gi;

export function normalizeRole(role: string): { originalRole: string; normalizedRole: string } {
  const stripped = role
    .replace(SENIORITY_MODIFIERS, ' ')
    .replace(/[-–—]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return { originalRole: role, normalizedRole: stripped.length > 0 ? stripped : role };
}

const LOCATION_ALIASES: Record<string, string> = {
  bangalore: 'Bengaluru',
  bengaluru: 'Bengaluru',
  'bengaluru, karnataka': 'Bengaluru',
  bombay: 'Mumbai',
  mumbai: 'Mumbai',
  'new delhi': 'Delhi',
  delhi: 'Delhi',
  'delhi ncr': 'Delhi',
  gurgaon: 'Gurugram',
  gurugram: 'Gurugram'
};

export function normalizeLocation(location: string): { originalLocation: string; normalizedLocation: string } {
  const key = location.trim().toLowerCase();
  return { originalLocation: location, normalizedLocation: LOCATION_ALIASES[key] || location.trim() };
}

// "Remote", "Remote - India", etc. describe a work mode, not a real place --
// querying Adzuna's location filter with it would search for a nonsense
// place name rather than broaden or narrow anything usefully.
function isRemoteDescription(location: string): boolean {
  return /remote/i.test(location);
}

interface DerivedBenchmark {
  minimum: number;
  median: number;
  maximum: number;
  totalSample: number;
}

/**
 * Standard grouped-data (binned histogram) benchmark derivation -- not a
 * fabrication. Adzuna's histogram gives bucket lower-bounds with no fixed
 * width and no true upper edge, so:
 *  - a "0" (or negative) bucket is dropped before anything else -- observed
 *    in real Adzuna responses, almost certainly unspecified/placeholder
 *    salary listings rather than genuine zero-salary jobs, and including it
 *    would present a misleading "as low as ₹0" minimum
 *  - bucket width is inferred from the smallest gap between the remaining
 *    bucket keys
 *  - "maximum" is an estimated upper edge (top bucket's lower bound + width),
 *    not a literal ceiling Adzuna reported
 *  - "median" uses the standard interpolated-median-for-grouped-data formula
 * Returns null when there isn't enough data to make any of this meaningful.
 */
export function deriveBenchmarkFromHistogram(histogram: Record<string, number>): DerivedBenchmark | null {
  const buckets = Object.entries(histogram)
    .map(([key, count]) => ({ lowerBound: Number(key), count: Number(count) }))
    .filter(b => Number.isFinite(b.lowerBound) && Number.isFinite(b.count) && b.count > 0 && b.lowerBound > 0)
    .sort((a, b) => a.lowerBound - b.lowerBound);

  if (buckets.length < MIN_NONZERO_BUCKETS) return null;

  const totalSample = buckets.reduce((sum, b) => sum + b.count, 0);
  if (totalSample < MIN_TOTAL_VACANCIES) return null;

  let width = Infinity;
  for (let i = 1; i < buckets.length; i++) {
    width = Math.min(width, buckets[i].lowerBound - buckets[i - 1].lowerBound);
  }
  if (!Number.isFinite(width) || width <= 0) return null;

  const minimum = buckets[0].lowerBound;
  const maximum = buckets[buckets.length - 1].lowerBound + width;

  const half = totalSample / 2;
  let cumulative = 0;
  let median = minimum;
  for (const bucket of buckets) {
    const next = cumulative + bucket.count;
    if (next >= half) {
      const positionInBucket = (half - cumulative) / bucket.count;
      median = bucket.lowerBound + positionInBucket * width;
      break;
    }
    cumulative = next;
  }

  return { minimum, median: Math.round(median), maximum, totalSample };
}

function buildPublicSearchUrl(country: string, role: string, location?: string): string {
  const domain = country === 'in' ? 'adzuna.in' : country === 'gb' ? 'adzuna.co.uk' : `${country}.adzuna.com`;
  const params = new URLSearchParams({ q: role });
  if (location) params.set('loc', location);
  return `https://www.${domain}/search?${params.toString()}`;
}

export class RealMarketDataProvider implements MarketDataProvider {
  constructor(private readonly client: AdzunaClient) {}

  async getCompensationBenchmark(query: MarketCompensationQuery): Promise<MarketCompensationData | null> {
    try {
      if (!this.client.isConfigured()) {
        console.warn('[MarketData] Adzuna not configured, skipping benchmark lookup');
        return null;
      }

      const country = CURRENCY_TO_ADZUNA_COUNTRY[query.currency];
      if (!country) {
        console.warn(`[MarketData] No supported country mapping for currency "${query.currency}"`);
        return null;
      }

      const { normalizedRole } = normalizeRole(query.role);
      const normalizedLocation = query.location && !isRemoteDescription(query.location)
        ? normalizeLocation(query.location).normalizedLocation
        : undefined;

      console.log(`[MarketData] Querying Adzuna: role="${normalizedRole}" location="${normalizedLocation || 'none'}" country="${country}"`);
      const histogram = await this.client.getSalaryHistogram({ country, what: normalizedRole, location: normalizedLocation });
      if (!histogram) {
        console.warn('[MarketData] Adzuna returned no usable histogram data');
        return null;
      }

      const derived = deriveBenchmarkFromHistogram(histogram);
      if (!derived) {
        console.warn('[MarketData] Histogram sample too small/sparse to derive a defensible benchmark');
        return null;
      }

      const hasLocation = Boolean(normalizedLocation);
      const confidence = hasLocation && derived.totalSample >= HIGH_SAMPLE_SIZE ? 'medium' : 'low';

      const source: MarketDataSource = {
        title: `Adzuna salary distribution — ${normalizedRole}${normalizedLocation ? ` in ${normalizedLocation}` : ''}`,
        url: buildPublicSearchUrl(country, normalizedRole, normalizedLocation),
        publisher: 'Adzuna',
        sourceType: 'job_market'
      };

      console.log(`[MarketData] Benchmark derived from ${derived.totalSample} listings (confidence: ${confidence})`);

      return {
        role: normalizedRole,
        location: normalizedLocation,
        // Echoed for transparency only -- Adzuna's histogram has no real
        // experience segmentation, so this is never used to filter the
        // query. offerComparisonService discloses this explicitly whenever
        // experienceLevel was supplied.
        experienceLevel: query.experienceLevel,
        currency: query.currency,
        minimum: derived.minimum,
        median: derived.median,
        maximum: derived.maximum,
        source,
        retrievedAt: new Date().toISOString(),
        confidence
      };
    } catch (err) {
      console.error('[MarketData] Adzuna lookup failed:', err instanceof Error ? err.message : 'unknown error');
      return null;
    }
  }
}

export const realMarketDataProvider = new RealMarketDataProvider(realAdzunaClient);
