import yahooFinance from 'yahoo-finance2';

export const getStockPrice = async (symbol: string): Promise<number | null> => {
  try {
    let yahooSymbol = symbol;
    if (symbol.includes('/')) {
      yahooSymbol = symbol.replace('/', '-'); // Convert forex/crypto symbols
    }

    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));

    // Fetch stock data
    const quote = await yahooFinance.quote(yahooSymbol);

    console.log(`Quote data for ${symbol}:`, quote); // Debugging: Check response fields

    if (quote?.regularMarketPrice) {
      return quote.regularMarketPrice;
    } 

    return null; // Fallback if price isn't available
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
    return null;
  }
};

export default yahooFinance;
