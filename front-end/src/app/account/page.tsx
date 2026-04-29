'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Package, Heart, MapPin, Settings, LogOut, User } from 'lucide-react';
import { toast } from 'sonner';

const menuItems = [
  { href: '/account/orders', label: 'My Orders', icon: Package, description: 'Track and manage your orders' },
  { href: '/account/wishlist', label: 'Wishlist', icon: Heart, description: 'Your saved items' },
  { href: '/account/addresses', label: 'Addresses', icon: MapPin, description: 'Manage shipping addresses' },
  { href: '/account/settings', label: 'Settings', icon: Settings, description: 'Update your preferences' },
];

export default function AccountPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    toast.info('You have been logged out');
    router.push('/');
  };

  if (!user) {
    return (
      <div className="container py-16">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>Please sign in to view your account</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button className="flex-1" >
              <Link href="/login">Sign In</Link>
            </Button>
            <Button variant="outline" className="flex-1" >
              <Link href="/register">Create Account</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Account</h1>
          <p className="text-muted-foreground mt-1">{user.email}</p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Your personal information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">{user.firstName} {user.lastName}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{user.email}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.href} className="cursor-pointer transition-shadow hover:shadow-md">
              <Link href={item.href}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>{item.label}</CardTitle>
                      <CardDescription>{item.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Link>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
