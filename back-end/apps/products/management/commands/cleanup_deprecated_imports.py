"""
Management command stub - deprecated models removed.
This file exists to prevent import errors during cleanup.
"""
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Deprecated - models have been cleaned up'

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS(
                'Deprecated models have been removed. '
                'Use ProductColorVariant + ProductSizeVariant instead.'
            )
        )
