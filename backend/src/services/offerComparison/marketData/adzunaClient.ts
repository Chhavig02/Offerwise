import axios from 'axios';

const REQUEST_TIMEOUT_MS = 10000;

export interface AdzunaClient {
  isConfigured(): boolean;
  getSalaryHistogram(params: { country: string; what: string; location?: string }): Promise<Record<string, number> | null>;
}

interface AdzunaHistogramResponse {
  histogram?: Record<string, number>;
}

/**
 * The only file in this codebase that knows Adzuna exists. Everything else
 * (realMarketDataProvider.ts, offerComparisonService.ts) depends on the
 * AdzunaClient interface, mirroring how tavilySearchProvider.ts is isolated
 * behind SearchClient.
 */
export class RealAdzunaClient implements AdzunaClient {
  isConfigured(): boolean {
    return Boolean(process.env.ADZUNA_APP_ID) && Boolean(process.env.ADZUNA_APP_KEY);
  }

  async getSalaryHistogram(params: { country: string; what: string; location?: string }): Promise<Record<string, number> | null> {
    const appId = process.env.ADZUNA_APP_ID;
    const appKey = process.env.ADZUNA_APP_KEY;
    if (!appId || !appKey) {
      throw new Error('ADZUNA_APP_ID/ADZUNA_APP_KEY are not set');
    }

    const url = `https://api.adzuna.com/v1/api/jobs/${params.country}/histogram`;
    const response = await axios.get<AdzunaHistogramResponse>(url, {
      timeout: REQUEST_TIMEOUT_MS,
      params: {
        app_id: appId,
        app_key: appKey,
        what: params.what,
        // Confirmed against the live API: the histogram endpoint uses the
        // same free-text `where` parameter as Adzuna's search endpoint, NOT
        // `location0` (which returns HTTP 400 despite appearing in some
        // histogram docs pages).
        ...(params.location ? { where: params.location } : {}),
        'content-type': 'application/json'
      }
    });

    if (!response.data || typeof response.data.histogram !== 'object' || response.data.histogram === null) {
      return null;
    }

    return response.data.histogram;
  }
}

export const realAdzunaClient = new RealAdzunaClient();
