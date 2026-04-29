import Link from 'next/link';
import { Clock, Shirt } from 'lucide-react';

const categories = [
  {
    name: 'Watches',
    slug: 'watches',
    description: 'Luxury timepieces for every occasion',
    icon: Clock,
  },
  {
    name: 'Undergarments',
    slug: 'undergarments',
    description: 'Elegant comfort for everyday wear',
    icon: Shirt,
  },
];

export function CategoryGrid() {
  return (
    <section className="container py-16">
      <h2 className="text-3xl font-bold tracking-tight mb-8">Shop by Category</h2>
      <div className="grid md:grid-cols-2 gap-6">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <Link
              key={category.slug}
              href={`/category/${category.slug}`}
              className="group relative overflow-hidden rounded-lg border bg-card p-8 transition-all hover:shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <Icon className="h-10 w-10 text-primary" />
                  <h3 className="text-2xl font-semibold group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-muted-foreground">{category.description}</p>
                </div>
                <div className="rounded-full bg-muted p-3 transition-transform group-hover:scale-110">
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
