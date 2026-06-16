"""
Management command to fix empty image URLs in database.
Cleans up records with empty string image_urls that should be NULL.

Usage:
    python manage.py fix_empty_image_urls
"""

from django.core.management.base import BaseCommand
from apps.products.models import Category, ProductColorVariant


class Command(BaseCommand):
    help = 'Fix empty string image_urls in database (set to empty string for consistency)'

    def handle(self, *args, **options):
        self.stdout.write('Starting image URL cleanup...\n')

        # Fix Categories
        categories_fixed = 0
        for cat in Category.objects.all():
            if cat.image and not cat.image.name:
                cat.image = None
                cat.save()
                categories_fixed += 1
                self.stdout.write(f'  Fixed Category: {cat.name}')

        # Fix ProductImages
        
        
        # Fix ProductColorVariant
        colors_fixed = 0
        for color in ProductColorVariant.objects.all():
            if color.image and not color.image.name:
                color.image = None
                color.save()
                colors_fixed += 1
                self.stdout.write(f'  Fixed ProductColorVariant: {color.color_name}')
            elif color.image_url and not color.image_url.strip():
                color.image_url = ""
                color.save()
                colors_fixed += 1
                self.stdout.write(f'  Cleared empty image_url: {color.color_name}')

        self.stdout.write(
            self.style.SUCCESS(
                f'\n✅ Cleanup complete!\n'
                f'   Categories fixed: {categories_fixed}\n'
                f'   Color variants fixed: {colors_fixed}\n'
            )
        )
