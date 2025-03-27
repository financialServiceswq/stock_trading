'use client';

import { ThemeProvider } from 'next-themes';
import { PortfolioProvider } from '@/lib/portfolio-context';
import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'sonner';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <PortfolioProvider>
          {children}
          <Toaster />
        </PortfolioProvider>
      </ThemeProvider>
    </SessionProvider>
  );
} 