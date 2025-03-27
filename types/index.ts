export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  wallet: {
    balance: number;
    currency: string;
  };
  portfolio: Portfolio[];
  watchlist: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Portfolio {
  id: string;
  userId: string;
  stockSymbol: string;
  quantity: number;
  averagePrice: number;
  totalInvestment: number;
  currentValue: number;
  transactions: Transaction[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  portfolioId: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  totalAmount: number;
  timestamp: Date;
}

export interface Stock {
  symbol: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  marketCap: number;
  volume: number;
  dayHigh: number;
  dayLow: number;
  open: number;
  previousClose: number;
  lastUpdated: Date;
} 