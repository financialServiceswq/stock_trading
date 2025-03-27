import yahooFinance from 'yahoo-finance2';

export const getStockPrice = async (symbol: string): Promise<number | null> => {
  try {
    let yahooSymbol = symbol;
    if (symbol.includes('/')) {
      yahooSymbol = symbol.replace('/', '-');
    }

    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));

    const quote = await yahooFinance.quote(yahooSymbol, {}, { timeout: 10000 });

    if (quote?.regularMarketPrice) {
      return quote.regularMarketPrice;
    } else if (quote?.chartPreviousClose) {
      return quote.chartPreviousClose;
    }

    return null;
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
    return null;
  }
};

export default yahooFinance;
