"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export type Transaction = {
  id: string;
  symbol: string;
  name: string;
  type: "BUY" | "SELL";
  quantity: number;
  price: number;
  total: number;
  timestamp: string;
};

export type PortfolioPosition = {
  symbol: string;
  name: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercentage: number;
  transactions: Transaction[];
};

type APIResponse = {
  wallet?: { balance: number };
  portfolio?: {
    stockSymbol: string;
    quantity: number;
    averagePrice: number;
    currentValue: number;
    totalInvestment: number;
  }[];
  transactions?: {
    _id?: string;
    stockSymbol: string;
    type: "BUY" | "SELL";
    quantity: number;
    price: number;
    totalAmount: number;
    timestamp: string;
  }[];
  error?: string;
};

type PortfolioContextType = {
  positions: PortfolioPosition[];
  balance: number;
  addToPortfolio: (
    symbol: string,
    name: string,
    quantity: number,
    price: number,
    type: "BUY" | "SELL"
  ) => Promise<void>;
  removeFromPortfolio: (symbol: string) => Promise<void>;
  updatePrices: (updates: { [key: string]: number }) => void;
  getPosition: (symbol: string) => PortfolioPosition | undefined;
  getTransactionHistory: () => Transaction[];
  isLoading: boolean;
};

const INITIAL_BALANCE = 100000;
const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [positions, setPositions] = useState<PortfolioPosition[]>([]);
  const [balance, setBalance] = useState(INITIAL_BALANCE);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch portfolio only when authenticated
  useEffect(() => {
    if (status === "loading") return;
    if (!session) return;

    const fetchPortfolio = async () => {
      try {
        const response = await fetch("/api/portfolio", {
          headers: {
            Authorization: `Bearer ${session?.user?.email}`,
          },
        });

        if (!response.ok) throw new Error("Failed to fetch portfolio");

        const data: APIResponse = await response.json();

        if (!data.portfolio) throw new Error("Invalid portfolio data");

        setPositions(
          data.portfolio.map((item) => ({
            symbol: item.stockSymbol,
            name: item.stockSymbol,
            quantity: item.quantity,
            avgPrice: item.averagePrice,
            currentPrice: item.currentValue / Math.max(1, item.quantity),
            pnl: item.currentValue - item.totalInvestment,
            pnlPercentage:
              item.totalInvestment > 0
                ? ((item.currentValue - item.totalInvestment) / item.totalInvestment) * 100
                : 0,
            transactions: (data.transactions || []).map((t) => ({
              id: t._id || Date.now().toString(),
              symbol: t.stockSymbol,
              name: t.stockSymbol,
              type: t.type,
              quantity: t.quantity,
              price: t.price,
              total: t.totalAmount,
              timestamp: new Date(t.timestamp).toISOString(),
            })),
          }))
        );

        setBalance(data.wallet?.balance ?? INITIAL_BALANCE);
      } catch (error) {
        console.error("Error fetching portfolio:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPortfolio();
  }, [session, status]);

  const addToPortfolio = async (
    symbol: string,
    name: string,
    quantity: number,
    price: number,
    type: "BUY" | "SELL"
  ) => {
    try {
      if (status === "loading") {
        console.warn("Session is still loading...");
        return;
      }
      if (!session) {
        throw new Error("Unauthorized: Please log in");
      }

      console.log("Adding to portfolio:", { symbol, name, quantity, price, type });

      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({
          stockSymbol: symbol,
          type,
          quantity: Number(quantity),
          price: Number(price),
        }),
      });

      const data: APIResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Transaction failed");
      }

      console.log("Transaction response:", data);

      if (!data.portfolio || !data.wallet) {
        throw new Error("Invalid portfolio response");
      }

      setPositions(
        data.portfolio.map((item) => ({
          symbol: item.stockSymbol,
          name: item.stockSymbol,
          quantity: item.quantity,
          avgPrice: item.averagePrice,
          currentPrice: item.currentValue / Math.max(1, item.quantity),
          pnl: item.currentValue - item.totalInvestment,
          pnlPercentage:
            item.totalInvestment > 0
              ? ((item.currentValue - item.totalInvestment) / item.totalInvestment) * 100
              : 0,
          transactions: (data.transactions || []).map((t) => ({
            id: t._id || Date.now().toString(),
            symbol: t.stockSymbol,
            name: t.stockSymbol,
            type: t.type,
            quantity: t.quantity,
            price: t.price,
            total: t.totalAmount,
            timestamp: new Date(t.timestamp).toISOString(),
          })),
        }))
      );

      setBalance(data.wallet.balance);
    } catch (error) {
      console.error("Error adding to portfolio:", error);
      throw error;
    }
  };

  const removeFromPortfolio = async (symbol: string) => {
    try {
      const position = positions.find((p) => p.symbol === symbol);
      if (!position || position.quantity <= 0) return;

      await addToPortfolio(symbol, position.name, position.quantity, position.currentPrice, "SELL");
    } catch (error) {
      console.error("Error removing from portfolio:", error);
    }
  };

  const updatePrices = (updates: { [key: string]: number }) => {
    setPositions((prev) =>
      prev.map((position) => {
        const newPrice = updates[position.symbol];
        if (newPrice) {
          const pnl = (newPrice - position.avgPrice) * position.quantity;
          const pnlPercentage =
            position.avgPrice > 0 ? ((newPrice - position.avgPrice) / position.avgPrice) * 100 : 0;

          return { ...position, currentPrice: newPrice, pnl, pnlPercentage };
        }
        return position;
      })
    );
  };

  const getPosition = (symbol: string) => positions.find((p) => p.symbol === symbol);

  const getTransactionHistory = () =>
    positions.flatMap((p) => p.transactions).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <PortfolioContext.Provider
      value={{
        positions,
        balance,
        addToPortfolio,
        removeFromPortfolio,
        updatePrices,
        getPosition,
        getTransactionHistory,
        isLoading,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (!context) throw new Error("usePortfolio must be used within a PortfolioProvider");
  return context;
}
