"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PieChart, History } from "lucide-react";
import { usePortfolio } from "@/lib/portfolio-context";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Define the PortfolioPosition type if not imported
type PortfolioPosition = {
  symbol: string;
  name: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  pnl?: number;
  pnlPercentage?: number;
};

export default function PortfolioPage() {
  const {
    positions,
    updatePrices,
    balance,
    getTransactionHistory,
    isLoading: isPortfolioLoading,
    addToPortfolio,
  } = usePortfolio();

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("positions");
  const [sellingStock, setSellingStock] = useState<string | null>(null);

  useEffect(() => {
    const updatePortfolioPrices = async () => {
      try {
        if (!positions || positions.length === 0) {
          setIsLoading(false);
          return;
        }

        const updates: { [key: string]: number } = {};

        for (const position of positions) {
          try {
            const response = await fetch(`/api/stocks?symbol=${position.symbol}`);
            if (!response.ok) {
              throw new Error(`API error: ${response.statusText}`);
            }
            const quoteData = await response.json();

            if (!quoteData.chart || !quoteData.chart.result) {
              console.warn(`API Error for ${position.symbol}:`, quoteData);
              continue;
            }

            const result = quoteData.chart.result[0];
            if (!result || !result.meta || !result.indicators?.quote?.[0]?.close) {
              console.warn(`Invalid data structure for ${position.symbol}`);
              continue;
            }

            const quotes = result.indicators.quote[0].close;
            if (!Array.isArray(quotes) || quotes.length === 0) {
              console.warn(`No price data for ${position.symbol}`);
              continue;
            }

            const currentPrice = quotes[quotes.length - 1];
            if (currentPrice !== null && currentPrice !== undefined && !isNaN(currentPrice)) {
              updates[position.symbol] = currentPrice;
            }

            await new Promise((resolve) => setTimeout(resolve, 100));
          } catch (error) {
            console.warn(`Failed to fetch price for ${position.symbol}:`, error);
          }
        }

        if (Object.keys(updates).length > 0) {
          updatePrices(updates);
        }
      } catch (error) {
        console.error("Error updating portfolio prices:", error);
      }
      setIsLoading(false);
    };

    if (!isPortfolioLoading) {
      updatePortfolioPrices();
      const interval = setInterval(updatePortfolioPrices, 10000);
      return () => clearInterval(interval);
    }
  }, [positions, updatePrices, isPortfolioLoading]);

  const totalValue = positions.reduce((sum, position) => sum + position.quantity * (position.currentPrice || 0), 0);
  const totalPnL = positions.reduce((sum, position) => sum + (position.pnl || 0), 0);
  const totalPnLPercentage = totalValue > 0 ? (totalPnL / (totalValue - totalPnL)) * 100 : 0;
  const transactions = getTransactionHistory();

  const handleSell = async (position: PortfolioPosition) => {
    try {
      setSellingStock(position.symbol);
      await addToPortfolio(position.symbol, position.name, position.quantity, position.currentPrice, "SELL");
      toast.success(`Successfully sold ${position.quantity} shares of ${position.symbol}`);
    } catch (error) {
      console.error("Error selling stock:", error);
      toast.error("Failed to sell stock");
    } finally {
      setSellingStock(null);
    }
  };

  if (isPortfolioLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 pt-24">
        <div className="max-w-6xl mx-auto flex items-center justify-center h-64 text-lg text-muted-foreground">
          Loading portfolio...
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pt-24">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: "Portfolio Value", value: `$${totalValue.toFixed(2)}` },
            { label: "Available Balance", value: `$${balance.toFixed(2)}` },
            {
              label: "Total P&L",
              value: `$${totalPnL.toFixed(2)}`,
              className: totalPnL >= 0 ? "text-green-600" : "text-red-600",
            },
            {
              label: "P&L %",
              value: `${totalPnLPercentage.toFixed(2)}%`,
              className: totalPnLPercentage >= 0 ? "text-green-600" : "text-red-600",
            },
          ].map(({ label, value, className = "" }) => (
            <Card key={label}>
              <CardContent className="pt-6">
                <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
                <p className={`text-2xl font-bold ${className}`}>{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="positions" value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="positions" className="flex items-center gap-2">
              <PieChart className="h-4 w-4" /> Positions
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" /> Trade History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="positions" className="mt-6">
            <Card>
              <CardContent className="p-0">
                {positions.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">No positions in your portfolio</div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        {["Symbol", "Name", "Quantity", "Avg Price", "Current Price", "P&L", "P&L %", "Actions"].map(
                          (heading) => (
                            <th key={heading} className="text-left p-4">
                              {heading}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {positions.map((position) => (
                        <tr key={position.symbol} className="border-b hover:bg-muted/50">
                          <td className="p-4">{position.symbol}</td>
                          <td className="p-4 text-muted-foreground">{position.name}</td>
                          <td className="p-4 text-right">{position.quantity}</td>
                          <td className="p-4 text-right">${position.avgPrice.toFixed(2)}</td>
                          <td className="p-4 text-right">${position.currentPrice.toFixed(2)}</td>
                          <td className="p-4 text-right">{position.pnl?.toFixed(2) || "--"}</td>
                          <td className="p-4 text-right">{position.pnlPercentage?.toFixed(2) || "--"}%</td>
                          <td className="p-4 text-right">
                            <Button variant="destructive" size="sm" onClick={() => handleSell(position)} disabled={sellingStock === position.symbol}>
                              {sellingStock === position.symbol ? "Selling..." : "Sell All"}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
