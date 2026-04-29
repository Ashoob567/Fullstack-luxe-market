import { Shield, Truck, RefreshCcw, Headphones } from 'lucide-react';

const trustItems = [
  {
    icon: Shield,
    title: 'Authentic Products',
    description: '100% genuine luxury items',
  },
  {
    icon: Truck,
    title: 'Free Shipping',
    description: 'On orders over PKR 5,000',
  },
  {
    icon: RefreshCcw,
    title: 'Easy Returns',
    description: '30-day hassle-free returns',
  },
  {
    icon: Headphones,
    title: '24/7 Support',
    description: 'Dedicated customer support',
  },
];

export function TrustBadges() {
  return (
    <section className="container py-16">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {trustItems.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="flex flex-col items-center text-center gap-3">
              <div className="rounded-full bg-primary/10 p-4">
                <Icon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
