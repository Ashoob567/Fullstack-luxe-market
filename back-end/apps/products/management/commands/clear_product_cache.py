# apps/products/management/commands/clear_product_cache.py
from django.core.management.base import BaseCommand
from django.core.cache import cache
from apps.products.signals import trigger_nextjs_revalidation


class Command(BaseCommand):
    help = 'Clear all product-related caches (Django + Next.js)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--nextjs',
            action='store_true',
            help='Also trigger Next.js revalidation',
        )

    def handle(self, *args, **options):
        # Clear Django cache
        cache_keys = [
            'featured_products_list',
            'new_arrivals_list',
            'bestsellers_list',
        ]

        self.stdout.write('Clearing Django caches...')
        for key in cache_keys:
            cache.delete(key)
            self.stdout.write(f'  ✓ Cleared: {key}')

        # Optionally trigger Next.js revalidation
        if options['nextjs']:
            self.stdout.write('\nTriggering Next.js revalidation...')
            trigger_nextjs_revalidation()

        self.stdout.write(self.style.SUCCESS('\n✓ All caches cleared!'))
