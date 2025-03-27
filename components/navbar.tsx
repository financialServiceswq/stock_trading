"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LineChart, Wallet, BarChart3, BookOpen, Home, User, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession, signOut } from 'next-auth/react';
import { toast } from 'sonner';

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isActive = (path: string) => pathname === path;

  const handleLogout = async () => {
    try {
      await signOut({ 
        redirect: false,
        callbackUrl: pathname 
      });
      toast.success('Successfully signed out!');
    } catch (error) {
      toast.error('Error signing out');
    }
  };

  return (
    <nav className="fixed top-0 w-full bg-background border-b z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <BarChart3 className="h-6 w-6" />
              <span className="font-bold text-xl">TradePro</span>
            </Link>
          </div>
          
          {session && (
            <div className="hidden md:flex items-center space-x-4">
              <Link href="/home">
                <Button variant={isActive('/home') ? 'default' : 'ghost'}>
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </Link>
              <Link href="/market">
                <Button variant={isActive('/market') ? 'default' : 'ghost'}>
                  <LineChart className="h-4 w-4 mr-2" />
                  Market
                </Button>
              </Link>
              <Link href="/portfolio">
                <Button variant={isActive('/portfolio') ? 'default' : 'ghost'}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Portfolio
                </Button>
              </Link>
              <Link href="/wallet">
                <Button variant={isActive('/wallet') ? 'default' : 'ghost'}>
                  <Wallet className="h-4 w-4 mr-2" />
                  Wallet
                </Button>
              </Link>
            </div>
          )}

          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {session ? (
                  <>
                    <Link href="/profile">
                      <DropdownMenuItem>
                        <User className="h-4 w-4 mr-2" />
                        Profile
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <Link href="/auth/login">
                      <DropdownMenuItem>
                        <User className="h-4 w-4 mr-2" />
                        Sign in
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/auth/register">
                      <DropdownMenuItem>
                        <User className="h-4 w-4 mr-2" />
                        Create account
                      </DropdownMenuItem>
                    </Link>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}