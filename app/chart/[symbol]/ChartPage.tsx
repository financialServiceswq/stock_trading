"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ArrowUp, ArrowDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePortfolio } from "@/lib/portfolio-context";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, ArrowDownRight } from "lucide-react";

const TWELVE_DATA_API_KEY = "a46f7f271f8f47a9a2c851429fede0b3";

interface ChartData {
  timestamp: string;
  price: number;
}

interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  lastUpdate: Date;
}

export function generateStaticParams() {
  return [
    { symbol: "AAPL" },
    { symbol: "GOOGL" },
    { symbol: "MSFT" },
    { symbol: "BTC/USD" },
    { symbol: "ETH/USD" },
    { symbol: "EUR/USD" },
    { symbol: "GBP/USD" },
  ];
}

export default function ChartPage({ params }: { params: { symbol: string } }) {
  const router = useRouter();
  const { positions } = usePortfolio();
  const [quantity, setQuantity] = useState<string>("1");
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const symbol = params.symbol as string;
  const position = positions.find(p => p.symbol === symbol);

  const fetchStockData = async () => {
    try {
      setIsRefreshing(true);
      setError(null);

      // Get current price
      const quoteResponse = await fetch(
        `https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${TWELVE_DATA_API_KEY}`
      );
      const quoteData = await quoteResponse.json();

      if (quoteData.code === 400 || quoteData.status === 'error') {
        throw new Error(quoteData.message || 'Failed to fetch price data');
      }

      if (!quoteData.price) {
        throw new Error('Price data not available for this symbol');
      }

      // Get historical data for the last 5 minutes
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 5 * 60 * 1000); // 5 minutes ago
      
      const timeSeriesResponse = await fetch(
        `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1min&start_date=${startTime.toISOString()}&end_date=${endTime.toISOString()}&apikey=${TWELVE_DATA_API_KEY}`
      );
      const timeSeriesData = await timeSeriesResponse.json();

      // Process historical data if available
      if (timeSeriesData.values && Array.isArray(timeSeriesData.values)) {
        const history = timeSeriesData.values.map((item: any) => ({
          timestamp: item.datetime,
          price: parseFloat(item.close)
        }));
        setChartData(prevData => {
          // Keep previous data if new data is not available
          return history.length > 0 ? history : prevData;
        });
      }

      // Update stock data
      setStockData(prevData => {
        const newData = {
          symbol,
          name: quoteData.name || symbol,
          price: parseFloat(quoteData.price),
          change: parseFloat(quoteData.change),
          changePercent: parseFloat(quoteData.percent_change),
          lastUpdate: new Date()
        };
        return newData;
      });
    } catch (error) {
      console.error('Error fetching stock data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch stock data');
      toast.error('Failed to fetch stock data');
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStockData();
    // Refresh data every 5 minutes
    const interval = setInterval(fetchStockData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [symbol]);

  const handleTrade = (action: 'buy' | 'sell') => {
    if (!stockData) return;
    router.push(`/checkout?symbol=${stockData.symbol}&name=${encodeURIComponent(stockData.name)}&action=${action}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 pt-24">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-t-2 border-b-2 border-primary rounded-full animate-spin mr-2"></div>
          <span>Loading chart data...</span>
        </div>
      </div>
    );
  }

  if (error || !stockData) {
    return (
      <div className="container mx-auto px-4 pt-24">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-red-600">
              {error || 'Failed to load stock data'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pt-24">
      <div className="max-w-4xl mx-auto">
        <Link href="/market" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-8">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Market
        </Link>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold">{stockData.symbol}</h1>
                <p className="text-muted-foreground">{stockData.name}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">${stockData.price.toFixed(2)}</div>
                <div className={`flex items-center ${stockData.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stockData.change >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                  <span className="text-sm">
                    {Math.abs(stockData.change).toFixed(2)} ({stockData.changePercent.toFixed(2)}%)
                  </span>
                </div>
                {stockData.lastUpdate && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Last updated: {stockData.lastUpdate.toLocaleTimeString()}
                    {isRefreshing && <span className="ml-2 text-blue-500">(Refreshing...)</span>}
                  </p>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] mb-8">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                  />
                  <YAxis
                    domain={['auto', 'auto']}
                    tickFormatter={(value) => `$${value.toFixed(2)}`}
                  />
                  <Tooltip
                    labelFormatter={(value) => new Date(value).toLocaleString()}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="quantity" className="text-sm font-medium">Quantity</label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    max={position?.quantity}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="text-lg font-semibold">
                  Total Value: ${(parseFloat(quantity) * stockData.price).toFixed(2)}
                </div>
              </div>
              <div className="flex gap-4">
                <Button
                  variant="default"
                  className="flex-1"
                  onClick={() => handleTrade('buy')}
                >
                  Buy
                </Button>
                {position && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleTrade('sell')}
                  >
                    Sell
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
