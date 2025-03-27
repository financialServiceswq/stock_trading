import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const interval = searchParams.get('interval') || '1day';
  const outputsize = searchParams.get('outputsize') || '100';

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  if (!process.env.TWELVEDATA_API_KEY) {
    console.error('TWELVEDATA_API_KEY is not set in environment variables');
    return NextResponse.json(
      { error: 'API key is not configured' },
      { status: 500 }
    );
  }

  try {
    const endpoint = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${interval}&outputsize=${outputsize}&apikey=${process.env.TWELVEDATA_API_KEY}`;

    console.log('Fetching from endpoint:', endpoint.replace(process.env.TWELVEDATA_API_KEY, 'REDACTED'));

    const response = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();

    console.log('API Response:', {
      status: response.status,
      statusText: response.statusText,
      hasData: !!data,
      hasValues: Array.isArray(data?.values),
      error: data?.error || null
    });

    if (!response.ok || data.status === 'error' || data.code === 400) {
      throw new Error(data.message || 'API returned an error');
    }

    if (!Array.isArray(data.values)) {
      console.error('Invalid data structure:', data);
      throw new Error('Invalid data format received from API');
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching stock data:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch stock data' },
      { status: 500 }
    );
  }
}
