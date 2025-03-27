import React, { createContext, useContext, useState } from "react";

type WalletContextType = {
  balance: number;
  deposit: (amount: number) => void;
  withdraw: (amount: number) => void;
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC = ({ children }) => {
  const [balance, setBalance] = useState(0);

  const deposit = (amount: number) => setBalance((prev) => prev + amount);
  const withdraw = (amount: number) => setBalance((prev) => prev - amount);

  return (
    <WalletContext.Provider value={{ balance, deposit, withdraw }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};
