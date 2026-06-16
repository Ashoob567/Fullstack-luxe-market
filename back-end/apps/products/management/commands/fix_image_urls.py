"""
Management command to fix mismatched image URLs in the database.

Usage:
    python manage.py fix_image_urls --dry-run  # Preview changes
    python manage.py fix_image_urls             # Apply fixes
"""
from django.core.management.base import BaseCommand
from apps.products.models import  ProductColorVariant


class Command(BaseCommand):
    help = 'Fix mismatched image URLs (wrong path or extension)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be fixed without making changes',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        fixed_count = 0

        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No changes will be made\n'))

        # Fix ProductImage URLs
        

        # Fix ProductColorVariant URLs
        self.stdout.write('\n=== Checking ProductColorVariant ===')
        for variant in ProductColorVariant.objects.all():
            if variant.image_url:
                original = variant.image_url
                fixed = self.fix_url_for_color_variant(original)
                if fixed != original:
                    self.stdout.write(f'  {variant.id}: {variant.color_name}')
                    self.stdout.write(f'    OLD: {original}')
                    self.stdout.write(self.style.SUCCESS(f'    NEW: {fixed}'))
                    if not dry_run:
                        variant.image_url = fixed
                        variant.save(update_fields=['image_url'])
                    fixed_count += 1

        # Fix ProductVariantV2 URLs
        

        # Summary
        self.stdout.write('\n' + '='*60)
        if dry_run:
            self.stdout.write(self.style.WARNING(f'Would fix {fixed_count} image URLs'))
            self.stdout.write('Run without --dry-run to apply changes')
        else:
            self.stdout.write(self.style.SUCCESS(f'Fixed {fixed_count} image URLs'))

    def fix_url(self, url):
        """
        Fix common URL issues:
        Missing subdirectory paths based on actual Supabase storage structure

        Storage structure:
        - products/images/categories/  -> Category images
        - products/images/products/    -> Product images (ProductImage model)
        - products/images/products/colors/  -> Color variant images (ProductColorVariant)
        - products/images/products/variants/ -> Unified variant images (ProductVariantV2)
        """
        if not url:
            return url

        # Fix missing subdirectory paths
        base_path = 'products/images/'
        if base_path in url:
            parts = url.split(base_path, 1)
            if len(parts) == 2:
                base_url = parts[0] + base_path
                remaining_path = parts[1]

                # Skip if already has proper subdirectory structure
                if remaining_path.startswith(('categories/', 'products/')):
                    return url

                # Direct filename without subdirectory - needs fixing
                # Default to products/ subdirectory (will be refined by model type check)
                url = base_url + 'products/' + remaining_path

        return url

    def fix_url_for_color_variant(self, url):
        """Specific fix for color variant images - should be in products/colors/"""
        if not url:
            return url

        # First apply general fixes
        url = self.fix_url(url)

        # Then ensure it's in the colors subdirectory
        base_path = 'products/images/products/'
        if base_path in url and '/colors/' not in url:
            parts = url.split(base_path, 1)
            if len(parts) == 2 and '/' not in parts[1]:  # Direct filename
                url = parts[0] + base_path + 'colors/' + parts[1]

        return url
