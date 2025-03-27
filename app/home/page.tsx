'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { TrendingUp, DollarSign, LineChart, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function Home() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Please sign in to continue</h2>
          <p className="mt-2 text-gray-600">You need to be logged in to access this page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pt-20">
      {/* Welcome Section */}
      <section className="py-10 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Welcome back, {session.user?.name || 'Trader'}!
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Continue your trading journey with us and make huge profits greater than ever with our data and advanced trading tools.
        </p>
      </section>

      {/* Quick Actions */}
      <section className="py-10">
        <div className="flex justify-center gap-4">
          <Link href="/market">
            <Button size="lg">
              Start Trading
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/portfolio">
            <Button variant="outline" size="lg">
              View Portfolio
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-10">
        <h2 className="text-3xl font-bold text-center mb-12">
          Your Trading Dashboard
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="p-6">
            <TrendingUp className="h-12 w-12 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Real-Time Data</h3>
            <p className="text-muted-foreground">
              We provide huge money to our clients using our high trading algorithms.
            </p>
          </Card>
          <Card className="p-6">
            <DollarSign className="h-12 w-12 mb-4" />
            <h3 className="text-xl font-semibold mb-2">MoneyMAKER</h3>
            <p className="text-muted-foreground">
             Make easy money with us do things as per our instructions and earn huge amount of money just in seconds.
            </p>
          </Card>
          <Card className="p-6">
            <LineChart className="h-12 w-12 mb-4" />
            <h3 className="text-xl font-semibold mb-2">GROWTH RATIO</h3>
            <p className="text-muted-foreground">
             Daily thousands of our users get benefited with our scheme.
            </p>
          </Card>
        </div>
      </section>
    </div>
  );
} 