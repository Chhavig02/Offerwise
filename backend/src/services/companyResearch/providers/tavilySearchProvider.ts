import axios from 'axios';
import { RawSearchResult, SearchClient } from '../types';

const TAVILY_ENDPOINT = 'https://api.tavily.com/search';
const REQUEST_TIMEOUT_MS = 10000;

interface TavilyResultItem {
  title?: string;
  url?: string;
  content?: string;
  published_date?: string;
}

interface TavilyResponse {
  results?: TavilyResultItem[];
}

/**
 * The only file in this codebase that knows Tavily exists. Everything else
 * (companyResearchService, pipeline.ts) depends on the SearchClient interface.
 */
export class TavilySearchProvider implements SearchClient {
  isConfigured(): boolean {
    return Boolean(process.env.TAVILY_API_KEY);
  }

  async search(query: string): Promise<RawSearchResult[]> {
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
      throw new Error('TAVILY_API_KEY is not set');
    }

    const response = await axios.post<TavilyResponse>(
      TAVILY_ENDPOINT,
      {
        api_key: apiKey,
        query,
        search_depth: 'basic',
        max_results: 5
      },
      { timeout: REQUEST_TIMEOUT_MS }
    );

    const results = response.data?.results || [];
    return results
      .filter((r): r is Required<Pick<TavilyResultItem, 'title' | 'url' | 'content'>> & TavilyResultItem =>
        Boolean(r.title && r.url && r.content)
      )
      .map(r => ({
        title: r.title!,
        url: r.url!,
        content: r.content!,
        publishedAt: r.published_date || undefined
      }));
  }
}

export const tavilySearchProvider = new TavilySearchProvider();
