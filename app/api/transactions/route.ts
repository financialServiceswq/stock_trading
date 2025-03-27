import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import { authOptions } from '@/lib/auth';

interface PortfolioEntry {
  stockSymbol: string;
  quantity: number;
  averagePrice: number;
  totalInvestment: number;
  currentValue: number;
}

interface Transaction {
  stockSymbol: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  totalAmount: number;
  timestamp: Date;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requestData = await request.json();

    if (!requestData || typeof requestData !== 'object') {
      return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
    }

    const { stockSymbol, type, quantity, price } = requestData as Partial<Transaction>;

    if (!stockSymbol || !type || !quantity || !price) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (
      typeof stockSymbol !== 'string' ||
      (type !== 'BUY' && type !== 'SELL') ||
      typeof quantity !== 'number' ||
      typeof price !== 'number' ||
      quantity <= 0 ||
      price <= 0
    ) {
      return NextResponse.json({ error: 'Invalid data format or values' }, { status: 400 });
    }

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const totalAmount = quantity * price;

    if (type === 'BUY' && user.wallet.balance < totalAmount) {
      return NextResponse.json(
        { error: 'Insufficient funds', required: totalAmount, available: user.wallet.balance },
        { status: 400 }
      );
    }

    let portfolioEntry = user.portfolio.find((p: PortfolioEntry) => p.stockSymbol === stockSymbol);

    if (!portfolioEntry) {
      portfolioEntry = {
        stockSymbol,
        quantity: 0,
        averagePrice: 0,
        totalInvestment: 0,
        currentValue: 0
      };
      user.portfolio.push(portfolioEntry);
    }

    if (type === 'SELL' && portfolioEntry.quantity < quantity) {
      return NextResponse.json(
        { error: 'Insufficient stocks', required: quantity, available: portfolioEntry.quantity },
        { status: 400 }
      );
    }

    try {
      if (type === 'BUY') {
        portfolioEntry.totalInvestment += totalAmount;
        portfolioEntry.quantity += quantity;
        portfolioEntry.averagePrice = portfolioEntry.totalInvestment / portfolioEntry.quantity;
        user.wallet.balance -= totalAmount;
      } else {
        portfolioEntry.quantity -= quantity;
        portfolioEntry.totalInvestment = portfolioEntry.quantity * portfolioEntry.averagePrice;
        user.wallet.balance += totalAmount;
      }

      const newTransaction: Transaction = {
        stockSymbol,
        type,
        quantity,
        price,
        totalAmount,
        timestamp: new Date()
      };

      user.transactions.push(newTransaction);
      portfolioEntry.currentValue = portfolioEntry.quantity * price;

      // Remove stocks with zero quantity from the portfolio
      user.portfolio = user.portfolio.filter((p: PortfolioEntry) => p.quantity > 0);

      const savedUser = await user.save();

      return NextResponse.json({
        message: `${type} transaction successful`,
        portfolio: savedUser.portfolio,
        transactions: savedUser.transactions,
        wallet: savedUser.wallet
      });
    } catch (saveError) {
      return NextResponse.json(
        { error: 'Failed to save transaction', details: saveError instanceof Error ? saveError.message : 'Unknown error' },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
