import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const range = searchParams.get('range') || '1d';

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  // Define valid ranges with corresponding intervals and periods
  const rangeConfig: Record<string, { interval: string; period: string }> = {
    '1d': { interval: '5m', period: '1d' },
    '5d': { interval: '15m', period: '5d' },
    '1mo': { interval: '1h', period: '1mo' },
    '3mo': { interval: '1d', period: '3mo' },
    '1y': { interval: '1d', period: '1y' }
  };

  // Use the provided range or fall back to '1d' if invalid
  const { interval, period } = rangeConfig[range] || rangeConfig['1d'];

  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${period}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: `Yahoo Finance API error: ${response.status} - ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Ensure the API response contains expected data
    if (!data.chart || !data.chart.result) {
      return NextResponse.json({ error: 'Invalid stock data received' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching stock data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock data' },
      { status: 500 }
    );
  }
}
