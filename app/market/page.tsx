"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePortfolio } from '@/lib/portfolio-context';
import { toast } from 'sonner';
import { Search, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  lastUpdate: Date;
}

interface PriceHistory {
  timestamp: string;
  price: number;
}

// Define the 4 stocks we want to show initially
const INITIAL_STOCKS = ['AAPL', 'MSFT', 'TSLA', 'GOOGL'];

export default function MarketPage() {
  const router = useRouter();
  const { positions } = usePortfolio();
  const [searchQuery, setSearchQuery] = useState('');
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [priceHistory, setPriceHistory] = useState<Record<string, PriceHistory[]>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchResults, setSearchResults] = useState<Stock[]>([]);

  const fetchStockData = async (symbol: string) => {
    try {
      // Get current price and quote data from our API route
      const response = await fetch(`/api/stocks?symbol=${symbol}`);
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      const quoteData = await response.json();

      if (!quoteData.chart || !quoteData.chart.result || quoteData.chart.error) {
        console.error(`API Error for ${symbol}:`, quoteData);
        return null;
      }

      const result = quoteData.chart.result[0];
      const meta = result.meta;
      const timestamps = result.timestamp;
      const quotes = result.indicators.quote[0].close;

      // Get the latest price and calculate changes
      const currentPrice = quotes[quotes.length - 1];
      const previousPrice = quotes[quotes.length - 2];

      // Validate price values
      if (currentPrice === null || currentPrice === undefined || 
          previousPrice === null || previousPrice === undefined ||
          isNaN(currentPrice) || isNaN(previousPrice)) {
        console.error(`Invalid price values for ${symbol}`);
        return null;
      }

      const change = currentPrice - previousPrice;
      // Only calculate change percent if previous price is not zero
      const changePercent = previousPrice !== 0 ? (change / previousPrice) * 100 : 0;

      // Process historical data for the last 5 minutes
      const now = Math.floor(Date.now() / 1000);
      const fiveMinutesAgo = now - 300; // 5 minutes in seconds
      const history = timestamps
        .map((timestamp: number, index: number) => {
          const price = quotes[index];
          // Skip entries with null or undefined prices
          if (price === null || price === undefined) return null;
          
          return {
            timestamp: new Date(timestamp * 1000).toISOString(),
            price: price
          };
        })
        .filter((data: PriceHistory | null): data is PriceHistory => 
          data !== null && 
          new Date(data.timestamp).getTime() > fiveMinutesAgo * 1000
        );

      setPriceHistory(prev => ({
        ...prev,
        [symbol]: history
      }));

      return {
        symbol,
        name: meta.symbol,
        price: currentPrice,
        change,
        changePercent,
        lastUpdate: new Date()
      };
    } catch (error) {
      console.error(`Error fetching data for ${symbol}:`, error);
      return null;
    }
  };

  const fetchAllStocks = async () => {
    try {
      setIsRefreshing(true);
      setError(null);

      // Fetch data for initial stocks
      const stockData = await Promise.all(
        INITIAL_STOCKS.map(symbol => fetchStockData(symbol))
      );

      // Filter out any failed fetches and update state
      const validStocks = stockData.filter((stock): stock is Stock => stock !== null);
      
      if (validStocks.length === 0) {
        setError('No stock data available. Please try again later.');
        return;
      }

      setStocks(validStocks);
    } catch (error) {
      console.error('Error fetching stocks:', error);
      setError('Failed to fetch stock data. Please try again.');
      toast.error('Failed to fetch stock data');
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      // Search for stocks using Yahoo Finance API
      const searchResponse = await fetch(
        `https://query1.finance.yahoo.com/v1/finance/search?q=${query}&quotesCount=10&newsCount=0&enableFuzzyQuery=false&quotesQueryId=tss_match_phrase_query`
      );
      const searchData = await searchResponse.json();

      if (searchData.quotes && Array.isArray(searchData.quotes)) {
        // Fetch data for each search result
        const searchResultsData = await Promise.all(
          searchData.quotes
            .filter((quote: any) => quote.quoteType === 'EQUITY')
            .slice(0, 10)
            .map((quote: any) => fetchStockData(quote.symbol))
        );

        const validResults = searchResultsData.filter((stock): stock is Stock => stock !== null);
        setSearchResults(validResults);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching:', error);
      setSearchResults([]);
    }
  };

  useEffect(() => {
    fetchAllStocks();
    // Refresh data every 5 minutes
    const interval = setInterval(fetchAllStocks, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      handleSearch(searchQuery);
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const displayStocks = searchQuery ? searchResults : stocks;

  const handleTrade = (symbol: string, name: string, action: 'buy' | 'sell') => {
    router.push(`/checkout?symbol=${symbol}&name=${encodeURIComponent(name)}&action=${action}`);
  };

  const handleViewChart = (symbol: string) => {
    router.push(`/chart?symbol=${symbol}`);
  };

  return (
    <div className="container mx-auto px-4 pt-24">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Market</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search stocks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-64"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-t-2 border-b-2 border-primary rounded-full animate-spin mr-2"></div>
          <span>Loading market data...</span>
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-600">
          {error}
        </div>
      ) : displayStocks.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          {searchQuery ? 'No results found. Try a different search term.' : 'No stocks available.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayStocks.map((stock) => (
            <Card key={stock.symbol} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold">{stock.symbol}</h2>
                    <p className="text-sm text-muted-foreground">{stock.name}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">${stock.price.toFixed(2)}</div>
                    <div className={`flex items-center ${stock.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stock.change >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                      <span className="text-sm">
                        {Math.abs(stock.change).toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                </div>
                {stock.lastUpdate && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Last updated: {stock.lastUpdate.toLocaleTimeString()}
                    {isRefreshing && <span className="ml-2 text-blue-500">(Refreshing...)</span>}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                {priceHistory[stock.symbol] && priceHistory[stock.symbol].length > 0 && (
                  <div className="text-xs text-muted-foreground mb-4">
                    <div className="font-medium mb-1">Price History (Last 5 Minutes)</div>
                    {priceHistory[stock.symbol].map((data, index) => (
                      <div key={index} className="flex justify-between">
                        <span>{new Date(data.timestamp).toLocaleTimeString()}</span>
                        <span>${typeof data.price === 'number' ? data.price.toFixed(2) : 'N/A'}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    className="flex-1"
                    onClick={() => handleTrade(stock.symbol, stock.name, 'buy')}
                  >
                    Buy
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleTrade(stock.symbol, stock.name, 'sell')}
                  >
                    Sell
                  </Button>
                  <Button
                    variant="ghost"
                    className="flex-1"
                    onClick={() => handleViewChart(stock.symbol)}
                  >
                    View Chart
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
