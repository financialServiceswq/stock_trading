import yahooFinance from 'yahoo-finance2';

// Configure Yahoo Finance client
yahooFinance.setGlobalConfig({
  validateResult: false, // Disable validation to handle more symbol types
  timeout: 10000, // 10 second timeout
});

export const getStockPrice = async (symbol: string): Promise<number | null> => {
  try {
    // Handle different symbol formats
    let yahooSymbol = symbol;
    if (symbol.includes('/')) {
      // For crypto and forex, use the Yahoo Finance format
      yahooSymbol = symbol.replace('/', '-');
    }

    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));

    const quote = await yahooFinance.quote(yahooSymbol);
    
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