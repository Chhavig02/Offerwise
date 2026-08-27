import { MarketDataProvider } from '../types';

/**
 * No live market-compensation source exists yet. Always returns null so the
 * compensation comparison rule degrades to an honest "insufficient
 * benchmark data" limitation instead of fabricating a salary range.
 * Swapping in a real provider later is a one-line change in
 * offerComparisonService.ts's constructor call.
 */
export class NullMarketDataProvider implements MarketDataProvider {
  async getCompensationBenchmark(): Promise<null> {
    return null;
  }
}

export const nullMarketDataProvider = new NullMarketDataProvider();
