"""
Management command to list all active carts in Redis.

Usage:
    python manage.py list_active_carts
    python manage.py list_active_carts --details
    python manage.py list_active_carts --user-id 123
"""

import json
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.cart.services import _get_redis

User = get_user_model()


class Command(BaseCommand):
    help = "List all active carts stored in Redis"

    def add_arguments(self, parser):
        parser.add_argument(
            "--details",
            action="store_true",
            help="Show full cart details (items, totals)",
        )
        parser.add_argument(
            "--user-id",
            type=str,
            help="Filter by specific user ID",
        )
        parser.add_argument(
            "--pattern",
            type=str,
            default="cart:*",
            help="Redis key pattern (default: 'cart:*')",
        )

    def handle(self, *args, **options):
        r = _get_redis()
        pattern = options["pattern"]
        show_details = options["details"]
        user_id_filter = options["user_id"]

        if user_id_filter:
            pattern = f"cart:{user_id_filter}"

        self.stdout.write(self.style.SUCCESS(f"\n🔍 Scanning Redis for pattern: {pattern}\n"))

        cart_keys = list(r.scan_iter(match=pattern, count=100))

        if not cart_keys:
            self.stdout.write(self.style.WARNING("No active carts found.\n"))
            return

        # Separate carts from reservations
        cart_keys = [k for k in cart_keys if not k.endswith(":reservation")]
        reservation_keys = [k for k in r.scan_iter(match=f"{pattern}:reservation", count=100)]

        self.stdout.write(self.style.SUCCESS(f"Found {len(cart_keys)} active cart(s)"))
        self.stdout.write(self.style.SUCCESS(f"Found {len(reservation_keys)} active reservation(s)\n"))

        # Display carts
        for idx, key in enumerate(cart_keys, start=1):
            ttl = r.ttl(key)
            raw = r.get(key)

            if not raw:
                continue

            try:
                cart_data = json.loads(raw)
            except json.JSONDecodeError:
                self.stdout.write(self.style.ERROR(f"[{idx}] {key} — Invalid JSON\n"))
                continue

            # Parse cart type
            if key.startswith("cart:guest:"):
                cart_type = "Guest"
                identifier = key.split(":", 2)[2]
            elif key.startswith("cart:"):
                cart_type = "User"
                identifier = key.split(":", 1)[1]
                # Try to get username
                try:
                    user = User.objects.get(id=int(identifier))
                    identifier = f"{user.email} (ID: {user.id})"
                except (User.DoesNotExist, ValueError):
                    pass
            else:
                cart_type = "Unknown"
                identifier = key

            items = cart_data.get("items", [])
            item_count = sum(item["quantity"] for item in items)
            coupon = cart_data.get("coupon_code")

            self.stdout.write(f"[{idx}] {self.style.HTTP_INFO(key)}")
            self.stdout.write(f"    Type: {cart_type}")
            self.stdout.write(f"    Identifier: {identifier}")
            self.stdout.write(f"    Items: {len(items)} (Total qty: {item_count})")
            if coupon:
                self.stdout.write(f"    Coupon: {coupon}")
            self.stdout.write(f"    TTL: {ttl}s ({ttl // 60} min)\n")

            if show_details:
                self.stdout.write("    Cart Details:")
                for item in items:
                    self.stdout.write(
                        f"      - {item.get('name', 'Unknown')} "
                        f"(qty: {item['quantity']}, price: {item.get('price', 'N/A')})"
                    )
                self.stdout.write("")

        # Display reservations
        if reservation_keys:
            self.stdout.write(self.style.SUCCESS("\n📦 Active Reservations:\n"))
            for idx, key in enumerate(reservation_keys, start=1):
                ttl = r.ttl(key)
                raw = r.get(key)

                if not raw:
                    continue

                try:
                    res_data = json.loads(raw)
                except json.JSONDecodeError:
                    continue

                items = res_data.get("items", [])
                self.stdout.write(f"[{idx}] {self.style.WARNING(key)}")
                self.stdout.write(f"    Reserved Items: {len(items)}")
                self.stdout.write(f"    Expires in: {ttl}s ({ttl // 60} min)\n")

                if show_details:
                    for item in items:
                        self.stdout.write(
                            f"      - Variant {item['variant_id']} (qty: {item['quantity']})"
                        )
                    self.stdout.write("")

        self.stdout.write(self.style.SUCCESS("✅ Scan complete.\n"))
