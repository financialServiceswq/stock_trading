"use client"

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface UserProfile {
  name: string;
  email: string;
  watchlist: string[];
  portfolio: Array<{
    stockSymbol: string;
    quantity: number;
    averagePrice: number;
    totalInvestment: number;
    currentValue: number;
    transactions: Array<{
      type: 'BUY' | 'SELL';
      quantity: number;
      price: number;
      totalAmount: number;
      timestamp: string;
    }>;
  }>;
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/user/profile');
        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }
        const data = await response.json();
        setProfile(data.user);
      } catch (error) {
        toast.error('Error loading profile');
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchProfile();
    }
  }, [session]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Profile not found</h2>
          <p className="mt-2 text-gray-600">Please try again later</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile</h1>
          
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Personal Information</h2>
              <div className="mt-2 grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="mt-1 text-sm text-gray-900">{profile.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{profile.email}</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-medium text-gray-900">Watchlist</h2>
              {profile.watchlist && profile.watchlist.length > 0 ? (
                <div className="mt-2">
                  <ul className="divide-y divide-gray-200">
                    {profile.watchlist.map((symbol, index) => (
                      <li key={index} className="py-3">
                        <div className="flex justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{symbol}</p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="mt-2 text-sm text-gray-500">No stocks in watchlist</p>
              )}
            </div>

            <div>
              <h2 className="text-lg font-medium text-gray-900">Portfolio</h2>
              {profile.portfolio && profile.portfolio.length > 0 ? (
                <div className="mt-2">
                  <ul className="divide-y divide-gray-200">
                    {profile.portfolio.map((item, index) => (
                      <li key={index} className="py-3">
                        <div className="flex justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{item.stockSymbol}</p>
                            <p className="text-sm text-gray-500">{item.quantity} shares</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-900">${item.currentValue.toFixed(2)}</p>
                            <p className="text-sm text-gray-500">
                              Avg: ${item.averagePrice.toFixed(2)}
                            </p>
                            <p className="text-sm text-gray-500">
                              Total: ${item.totalInvestment.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="mt-2 text-sm text-gray-500">No stocks in portfolio</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}