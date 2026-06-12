"""
Management command to manually clear expired or abandoned carts from Redis.

While Redis automatically handles TTL expiration, this command can be used for:
- Manual cleanup of specific cart patterns
- Clearing test/dev carts
- Auditing cart storage usage

Usage:
    python manage.py clear_expired_carts --dry-run
    python manage.py clear_expired_carts --pattern "cart:guest:*"
    python manage.py clear_expired_carts --force
"""

from django.core.management.base import BaseCommand
from apps.cart.services import _get_redis


class Command(BaseCommand):
    help = "Clear expired or abandoned carts from Redis"

    def add_arguments(self, parser):
        parser.add_argument(
            "--pattern",
            type=str,
            default="cart:*",
            help="Redis key pattern to clear (default: 'cart:*')",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would be deleted without actually deleting",
        )
        parser.add_argument(
            "--force",
            action="store_true",
            help="Skip confirmation prompt",
        )
        parser.add_argument(
            "--ttl-below",
            type=int,
            help="Only delete keys with TTL below N seconds (e.g., 3600 for 1 hour)",
        )

    def handle(self, *args, **options):
        r = _get_redis()
        pattern = options["pattern"]
        dry_run = options["dry_run"]
        force = options["force"]
        ttl_below = options["ttl_below"]

        self.stdout.write(self.style.WARNING(f"\n🔍 Scanning Redis for pattern: {pattern}\n"))

        keys_to_delete = []
        for key in r.scan_iter(match=pattern, count=100):
            ttl = r.ttl(key)

            # Filter by TTL if specified
            if ttl_below is not None:
                if ttl < 0 or ttl > ttl_below:
                    continue

            keys_to_delete.append((key, ttl))

        if not keys_to_delete:
            self.stdout.write(self.style.SUCCESS("No keys found matching criteria.\n"))
            return

        self.stdout.write(self.style.WARNING(f"Found {len(keys_to_delete)} key(s) to delete:\n"))
        for key, ttl in keys_to_delete[:10]:  # Show first 10
            self.stdout.write(f"  - {key} (TTL: {ttl}s)")

        if len(keys_to_delete) > 10:
            self.stdout.write(f"  ... and {len(keys_to_delete) - 10} more")

        self.stdout.write("")

        if dry_run:
            self.stdout.write(self.style.SUCCESS("✅ Dry run complete. No keys were deleted.\n"))
            return

        # Confirmation prompt
        if not force:
            confirm = input(f"\n⚠️  Delete {len(keys_to_delete)} key(s)? [y/N]: ")
            if confirm.lower() not in ("y", "yes"):
                self.stdout.write(self.style.WARNING("❌ Aborted.\n"))
                return

        # Delete keys
        deleted_count = 0
        for key, _ in keys_to_delete:
            try:
                r.delete(key)
                deleted_count += 1
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Failed to delete {key}: {e}"))

        self.stdout.write(
            self.style.SUCCESS(f"\n✅ Successfully deleted {deleted_count} key(s).\n")
        )
