"use client";

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  timestamps: string[];
  prices: number[];
  volumes: number[];
}

export default function ChartPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const symbol = searchParams.get('symbol');
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'1d' | '5d' | '3mo' | '1y'>('1d');

  useEffect(() => {
    const fetchStockData = async () => {
      if (!symbol) return;

      try {
        setIsLoading(true);
        setError(null);

        // Map time range to Twelve Data interval
        const intervalMap: { [key: string]: string } = {
          '1d': '5min',
          '5d': '15min',
          '3mo': '1day',
          '1y': '1day'
        };

        const interval = intervalMap[timeRange];
        const response = await fetch(`/api/twelvedata?symbol=${symbol}&interval=${interval}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `API error: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }

        // Process the data based on the API response structure
        let timestamps: string[] = [];
        let prices: number[] = [];
        let volumes: number[] = [];

        // Handle different response formats
        const timeSeriesData = data.values || data.time_series;
        
        if (timeSeriesData && Array.isArray(timeSeriesData)) {
          // Process the data
          timestamps = timeSeriesData.map((item: any) => item.datetime);
          prices = timeSeriesData.map((item: any) => parseFloat(item.close));
          volumes = timeSeriesData.map((item: any) => parseFloat(item.volume));
        } else {
          console.error('API Response:', data); // Log the response for debugging
          throw new Error('Invalid data format received from API');
        }

        // Filter out any invalid data points
        const validData = timestamps.map((timestamp, index) => ({
          timestamp,
          price: prices[index],
          volume: volumes[index]
        })).filter(item => 
          !isNaN(item.price) && 
          !isNaN(item.volume) && 
          item.timestamp && 
          item.price > 0
        );

        if (validData.length === 0) {
          throw new Error('No valid data points found');
        }

        // Sort data by timestamp in ascending order
        const sortedData = validData.sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        timestamps = sortedData.map(item => item.timestamp);
        prices = sortedData.map(item => item.price);
        volumes = sortedData.map(item => item.volume);

        // Calculate price changes
        const currentPrice = prices[prices.length - 1];
        const previousPrice = prices[prices.length - 2];
        const change = currentPrice - previousPrice;
        const changePercent = (change / previousPrice) * 100;

        setStockData({
          symbol,
          name: symbol,
          price: currentPrice,
          change,
          changePercent,
          timestamps,
          prices,
          volumes
        });
      } catch (error) {
        console.error('Error fetching stock data:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch stock data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStockData();
  }, [symbol, timeRange]);

  if (!symbol) {
    return (
      <div className="container mx-auto px-4 pt-24">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">No Stock Selected</h1>
          <Button onClick={() => router.push('/market')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Market
          </Button>
        </div>
      </div>
    );
  }

  const chartData = stockData ? {
    labels: stockData.timestamps,
    datasets: [
      {
        label: 'Price',
        data: stockData.prices,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.1,
      },
    ],
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `${symbol} Stock Price`,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
      },
    },
  };

  return (
    <div className="container mx-auto px-4 pt-24">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.push('/market')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Market
        </Button>
        <h1 className="text-3xl font-bold">{symbol} Chart</h1>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-t-2 border-b-2 border-primary rounded-full animate-spin mr-2"></div>
          <span>Loading chart data...</span>
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-600">
          {error}
        </div>
      ) : stockData && chartData ? (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-semibold">{stockData.symbol}</h2>
                <p className="text-lg font-bold">${stockData.price.toFixed(2)}</p>
                <p className={`text-sm ${stockData.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stockData.change >= 0 ? '+' : ''}{stockData.change.toFixed(2)} ({stockData.changePercent.toFixed(2)}%)
                </p>
              </div>
              <div className="flex gap-2">
                {(['1d', '5d', '3mo', '1y'] as const).map((range) => (
                  <Button
                    key={range}
                    variant={timeRange === range ? 'default' : 'outline'}
                    onClick={() => setTimeRange(range)}
                  >
                    {range}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] w-full">
              <Line options={chartOptions} data={chartData} />
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
} 