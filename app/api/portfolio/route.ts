import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import { authOptions } from '@/lib/auth';

// Define TypeScript interface for portfolio items
interface PortfolioItem {
  symbol: string;
  name: string;
  quantity: number;
  currentPrice: number;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Debug logging
    console.log('User data:', {
      portfolio: user.portfolio,
      transactions: user.transactions,
      wallet: user.wallet,
      email: user.email
    });

    // Ensure portfolio is always an array and filter out positions with zero quantity
    const filteredPortfolio = (user.portfolio || []).filter(
      (position: PortfolioItem) => position.quantity > 0
    );

    return NextResponse.json({
      portfolio: filteredPortfolio,
      transactions: user.transactions || [], // Ensure transactions is always an array
      wallet: user.wallet ?? 0 // Default wallet to 0 if undefined
    });
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
