import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MarketDataService {
  private readonly logger = new Logger(MarketDataService.name);

  async getPrice(ticker: string, assetType: string): Promise<number | null> {
    if (!ticker) return null;

    const cleanTicker = ticker.trim().toUpperCase();

    try {
      if (assetType === 'CRYPTO') {
        // Binance price check
        // Handle tickers like "BTC" -> "BTCUSDT"
        const symbol = cleanTicker.endsWith('USDT') || cleanTicker.endsWith('BUSD') 
          ? cleanTicker 
          : `${cleanTicker}USDT`;

        const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
        if (!response.ok) {
          throw new Error(`Binance API returned status ${response.status}`);
        }
        const data = await response.json();
        if (data && data.price) {
          return Number(data.price);
        }
      } else if (
        assetType === 'STOCK' ||
        assetType === 'MUTUAL_FUND' ||
        assetType === 'BOND'
      ) {
        // Yahoo Finance price check
        let response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${cleanTicker}`);
        
        // Fallback for IDX / IHSG Indonesia stocks (e.g. "PTRO" -> "PTRO.JK")
        if (!response.ok && response.status === 404 && !cleanTicker.includes('.')) {
          this.logger.log(`Ticker ${cleanTicker} returned 404. Retrying with .JK suffix for Indonesian stock...`);
          response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${cleanTicker}.JK`);
        }

        if (!response.ok) {
          throw new Error(`Yahoo Finance API returned status ${response.status}`);
        }
        const data = await response.json();
        const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
        if (price !== undefined && price !== null) {
          return Number(price);
        }
      }
    } catch (err: any) {
      this.logger.warn(`Failed to fetch market price for ticker ${cleanTicker} (${assetType}): ${err.message}`);
    }

    return null;
  }
}
