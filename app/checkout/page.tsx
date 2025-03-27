"use client"

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePortfolio } from '@/lib/portfolio-context';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface PriceData {
  timestamp: string;
  price: number;
}

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addToPortfolio, removeFromPortfolio, positions, balance, getPosition } = usePortfolio();

  const [quantity, setQuantity] = useState('1');
  const [price, setPrice] = useState<number | null>(null);
  const [changePercent, setChangePercent] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceData[]>([]);
  const [error, setError] = useState<string | null>(null);

  const symbol = searchParams.get('symbol');
  const name = searchParams.get('name');
  const action = searchParams.get('action');

  const position = symbol ? getPosition(symbol) : null;

  useEffect(() => {
    const fetchPriceData = async () => {
      if (!symbol) return;

      try {
        setIsLoading(true);
        setError(null);
        
        // Get current price and quote data from our API route
        const response = await fetch(`/api/stocks?symbol=${symbol}`);
        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }
        const quoteData = await response.json();

        if (!quoteData.chart || !quoteData.chart.result || quoteData.chart.error) {
          throw new Error('Invalid API response');
        }

        const result = quoteData.chart.result[0];
        if (!result || !result.meta || !result.indicators?.quote?.[0]?.close) {
          throw new Error('Invalid data structure');
        }

        const quotes = result.indicators.quote[0].close;
        if (!Array.isArray(quotes) || quotes.length < 2) {
          throw new Error('Insufficient price data');
        }

        const currentPrice = quotes[quotes.length - 1];
        const previousPrice = quotes[quotes.length - 2];

        if (currentPrice === null || currentPrice === undefined || 
            previousPrice === null || previousPrice === undefined ||
            isNaN(currentPrice) || isNaN(previousPrice)) {
          throw new Error('Invalid price values');
        }

        const change = currentPrice - previousPrice;
        const changePercent = previousPrice !== 0 ? (change / previousPrice) * 100 : 0;

        // Update state with current price and change
        setPrice(currentPrice);
        setChangePercent(changePercent);
        setLastUpdate(new Date());

        // Process historical data
        const timestamps = result.timestamp;
        const now = Math.floor(Date.now() / 1000);
        const fiveMinutesAgo = now - 300; // 5 minutes in seconds
        
        const history = timestamps
          .map((timestamp: number, index: number) => {
            const price = quotes[index];
            if (price === null || price === undefined || isNaN(price)) return null;
            
            return {
              timestamp: new Date(timestamp * 1000).toISOString(),
              price: price
            };
          })
          .filter((data: PriceData | null): data is PriceData => 
            data !== null && 
            new Date(data.timestamp).getTime() > fiveMinutesAgo * 1000
          );

        setPriceHistory(history);
      } catch (error) {
        console.error('Error fetching price data:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch price data');
        toast.error('Failed to fetch price data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPriceData();
    // Refresh data every 5 minutes
    const interval = setInterval(fetchPriceData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [symbol]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !name || !price) {
      toast.error('Missing required information');
      return;
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    const totalCost = qty * price;

    // Check if user has enough balance for buy orders
    if (action === 'buy' && balance < totalCost) {
      toast.error('Insufficient funds for this purchase');
      return;
    }

    // Check if user has enough shares for sell orders
    if (action === 'sell' && (!position || position.quantity < qty)) {
      toast.error('Insufficient shares to sell');
      return;
    }

    setIsProcessing(true);

    try {
      if (action === 'buy') {
        addToPortfolio(symbol, name, qty, price, 'BUY');
        toast.success(`Successfully bought ${qty} shares of ${symbol}`);
      } else if (action === 'sell') {
        addToPortfolio(symbol, name, qty, price, 'SELL');
        toast.success(`Successfully sold ${qty} shares of ${symbol}`);
      }

      // Redirect to portfolio page after successful transaction
      router.push('/portfolio');
    } catch (error) {
      console.error('Transaction error:', error);
      toast.error(error instanceof Error ? error.message : 'Transaction failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!symbol || !name || !action) {
    return (
      <div className="container mx-auto px-4 pt-24">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Invalid checkout parameters</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pt-24">
      <div className="max-w-md mx-auto">
        <Link href="/market" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-8">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Market
        </Link>

        <Card>
          <CardHeader>
            <h1 className="text-2xl font-bold">{action === 'buy' ? 'Buy' : 'Sell'} {symbol}</h1>
            <p className="text-muted-foreground">{name}</p>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="w-5 h-5 border-t-2 border-b-2 border-primary rounded-full animate-spin mr-2"></div>
                  <span>Loading price data...</span>
                </div>
              ) : error ? (
                <div className="text-center py-4 text-red-600">
                  {error}
                </div>
              ) : price ? (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Current Price</label>
                    <div className="flex items-center gap-2">
                      <div className="text-2xl font-bold">${price.toFixed(2)}</div>
                      <span className={`text-sm ${changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
                      </span>
                    </div>
                    {lastUpdate && (
                      <p className="text-xs text-muted-foreground">
                        Last updated: {lastUpdate.toLocaleTimeString()}
                      </p>
                    )}
                  </div>

                  {priceHistory.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Price History (Last 5 Minutes)</label>
                      <div className="text-xs text-muted-foreground">
                        {priceHistory.map((data, index) => (
                          <div key={index} className="flex justify-between">
                            <span>{new Date(data.timestamp).toLocaleTimeString()}</span>
                            <span>${data.price.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label htmlFor="quantity" className="text-sm font-medium">Quantity</label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      max={action === 'sell' ? position?.quantity : undefined}
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Total Value</label>
                    <div className="text-xl font-bold">
                      ${(parseFloat(quantity) * price).toFixed(2)}
                    </div>
                  </div>

                  {action === 'sell' && position && (
                    <div className="text-sm text-muted-foreground">
                      Available: {position.quantity} shares
                    </div>
                  )}

                  {action === 'buy' && (
                    <div className="text-sm text-muted-foreground">
                      Available Balance: ${balance.toFixed(2)}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-4 text-red-600">
                  Failed to load price data. Please refresh the page.
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || isProcessing || !price || !!error}
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  `${action === 'buy' ? 'Buy' : 'Sell'} ${symbol}`
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}