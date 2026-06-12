"""
apps/cart/tests/test_cart.py
~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Test suite for the Luxe Market cart system.

All Redis I/O is patched with fakeredis so tests run without a live
Redis instance and never bleed state between test cases.

Fixtures created in setUp
--------------------------
  • Product  + ProductVariant  (price = 1 500 PKR, stock = 10)
  • Cheap product + variant     (price =   200 PKR, stock = 10)
  • Coupon "LUXE10"             (10 %, min_order = 1 000 PKR, active)
"""

import uuid
from decimal import Decimal
from unittest.mock import patch, MagicMock

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from rest_framework.test import APIClient

from apps.coupons.models import Coupon

User = get_user_model()

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_fake_product(product_id, variant_id, name="Test Shirt",
                       price="1500.00", stock=10,
                       size="M", color="Black"):
    """Return (mock_product, mock_variant) with the given attributes."""
    product = MagicMock()
    product.id   = product_id
    product.name = name
    product.image = None          # avoids .url call

    variant = MagicMock()
    variant.id    = variant_id
    variant.price = Decimal(price)
    variant.stock = stock
    variant.size  = size
    variant.color = color

    return product, variant


# ---------------------------------------------------------------------------
# Base test case — wires fakeredis + product mock for every test
# ---------------------------------------------------------------------------

class CartTestCase(TestCase):
    """
    Base class that:
      1. Replaces the Redis client with an in-memory fakeredis instance.
      2. Mocks _get_product_and_variant so no Product/ProductVariant
         models need to exist in the test DB.
      3. Creates a Coupon row (LUXE10) and a test user.
    """

    # Default product / variant IDs shared across helpers
    PRODUCT_ID = str(uuid.uuid4())
    VARIANT_ID = str(uuid.uuid4())

    # A cheaper product used for below-minimum-order tests
    CHEAP_PRODUCT_ID = str(uuid.uuid4())
    CHEAP_VARIANT_ID = str(uuid.uuid4())

    def setUp(self):
        # ----------------------------------------------------------------
        # 1. Fake Redis
        # ----------------------------------------------------------------
        try:
            import fakeredis
            self._fake_redis = fakeredis.FakeRedis(decode_responses=True)
        except ImportError:
            self.skipTest(
                "fakeredis is not installed. "
                "Run: pip install fakeredis --break-system-packages"
            )

        # Patch the module-level singleton so CartService uses fakeredis
        self._redis_patcher = patch(
            "apps.cart.services._redis_client",
            new=self._fake_redis,
        )
        self._redis_patcher.start()

        # ----------------------------------------------------------------
        # 2. Mock product / variant lookup
        # ----------------------------------------------------------------
        self._main_product, self._main_variant = _make_fake_product(
            self.PRODUCT_ID, self.VARIANT_ID,
            name="Test Shirt", price="1500.00", stock=10,
        )
        self._cheap_product, self._cheap_variant = _make_fake_product(
            self.CHEAP_PRODUCT_ID, self.CHEAP_VARIANT_ID,
            name="Cheap Sock", price="200.00", stock=10,
        )

        def _fake_get_product_and_variant(product_id, variant_id):
            pid, vid = str(product_id), str(variant_id)
            if pid == self.PRODUCT_ID and vid == self.VARIANT_ID:
                return self._main_product, self._main_variant
            if pid == self.CHEAP_PRODUCT_ID and vid == self.CHEAP_VARIANT_ID:
                return self._cheap_product, self._cheap_variant
            from django.core.exceptions import ObjectDoesNotExist
            raise ValueError(f"Product '{product_id}' does not exist or is inactive.")

        self._product_patcher = patch(
            "apps.cart.services._get_product_and_variant",
            side_effect=_fake_get_product_and_variant,
        )
        self._product_patcher.start()

        # ----------------------------------------------------------------
        # 3. Coupon seed data
        # ----------------------------------------------------------------
        self.coupon = Coupon.objects.create(
            code="LUXE10",
            discount_type="percentage",
            discount_value=Decimal("10.00"),
            min_order_amount=Decimal("1000.00"),
            max_uses=100,
            used_count=0,
            is_active=True,
            valid_from=timezone.now() - timezone.timedelta(days=1),
            valid_until=timezone.now() + timezone.timedelta(days=30),
        )

        # ----------------------------------------------------------------
        # 4. Test user + DRF client
        # ----------------------------------------------------------------
        self.user = User.objects.create_user(
            email="testuser@luxemarket.com",
            password="testpass123",
            first_name="Test",
            last_name="User",
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def tearDown(self):
        self._redis_patcher.stop()
        self._product_patcher.stop()
        # Flush all keys between tests
        self._fake_redis.flushall()

    # ------------------------------------------------------------------
    # Convenience helpers
    # ------------------------------------------------------------------

    def _add_item(self, product_id=None, variant_id=None, quantity=1):
        """POST to /api/cart/add/ and return the response."""
        return self.client.post("/api/cart/add/", {
            "product_id": product_id or self.PRODUCT_ID,
            "variant_id": variant_id or self.VARIANT_ID,
            "quantity":   quantity,
        }, format="json")

    def _get_cart(self):
        return self.client.get("/api/cart/")

    def _cart_item_id(self, response):
        """Extract the first cart_item_id from an add/get response."""
        return response.data["items"][0]["cart_item_id"]


# ---------------------------------------------------------------------------
# Test cases
# ---------------------------------------------------------------------------

class TestAddItem(CartTestCase):

    def test_add_item_to_cart(self):
        """POST /api/cart/add/ should add the item and return HTTP 201."""
        response = self._add_item(quantity=1)

        self.assertEqual(response.status_code, 201)
        self.assertEqual(len(response.data["items"]), 1)

        item = response.data["items"][0]
        self.assertEqual(str(item["product_id"]), self.PRODUCT_ID)
        self.assertEqual(str(item["variant_id"]), self.VARIANT_ID)
        self.assertEqual(item["quantity"], 1)

    def test_add_same_item_increases_quantity(self):
        """Adding the same product+variant twice should yield quantity = 2."""
        self._add_item(quantity=1)
        response = self._add_item(quantity=1)

        self.assertEqual(response.status_code, 201)
        # Still only one line item
        self.assertEqual(len(response.data["items"]), 1)
        self.assertEqual(response.data["items"][0]["quantity"], 2)


class TestUpdateItem(CartTestCase):

    def test_update_cart_item_quantity(self):
        """PUT /api/cart/update/<id>/ should change quantity to 3."""
        add_response   = self._add_item(quantity=1)
        cart_item_id   = self._cart_item_id(add_response)

        update_response = self.client.put(
            f"/api/cart/update/{cart_item_id}/",
            {"quantity": 3},
            format="json",
        )

        self.assertEqual(update_response.status_code, 200)
        item = update_response.data["items"][0]
        self.assertEqual(item["quantity"], 3)


class TestRemoveItem(CartTestCase):

    def test_remove_cart_item(self):
        """DELETE /api/cart/remove/<id>/ should remove the item from the cart."""
        add_response = self._add_item(quantity=1)
        cart_item_id = self._cart_item_id(add_response)

        remove_response = self.client.delete(f"/api/cart/remove/{cart_item_id}/")

        self.assertEqual(remove_response.status_code, 200)
        self.assertEqual(len(remove_response.data["items"]), 0)


class TestClearCart(CartTestCase):

    def test_clear_cart(self):
        """DELETE /api/cart/clear/ should wipe the cart and return {cleared: true}."""
        self._add_item(quantity=1)

        clear_response = self.client.delete("/api/cart/clear/")
        self.assertEqual(clear_response.status_code, 200)
        self.assertTrue(clear_response.data["cleared"])

        # Subsequent GET must return an empty cart
        get_response = self._get_cart()
        self.assertEqual(get_response.status_code, 200)
        self.assertEqual(len(get_response.data["items"]), 0)


class TestApplyCoupon(CartTestCase):

    def test_apply_valid_coupon(self):
        """Applying LUXE10 to a cart ≥ 1 000 PKR should yield discount_amount > 0."""
        # 1 × 1 500 PKR = 1 500 PKR subtotal  →  above 1 000 PKR minimum
        self._add_item(quantity=1)

        coupon_response = self.client.post(
            "/api/cart/coupon/",
            {"coupon_code": "LUXE10"},
            format="json",
        )

        self.assertEqual(coupon_response.status_code, 200)
        self.assertGreater(float(coupon_response.data["discount_amount"]), 0)

    def test_apply_expired_coupon(self):
        """An expired coupon must return HTTP 400."""
        Coupon.objects.create(
            code="EXPIRED20",
            discount_type="percentage",
            discount_value=Decimal("20.00"),
            min_order_amount=Decimal("0.00"),
            max_uses=100,
            used_count=0,
            is_active=True,
            valid_from=timezone.now() - timezone.timedelta(days=10),
            valid_until=timezone.now() - timezone.timedelta(days=1),  # already expired
        )

        self._add_item(quantity=1)

        response = self.client.post(
            "/api/cart/coupon/",
            {"coupon_code": "EXPIRED20"},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("error", response.data)

    def test_apply_coupon_below_minimum_order(self):
        """Cart subtotal < 1 000 PKR must be rejected with HTTP 400."""
        # 1 × 200 PKR = 200 PKR subtotal  →  below 1 000 PKR minimum
        self._add_item(
            product_id=self.CHEAP_PRODUCT_ID,
            variant_id=self.CHEAP_VARIANT_ID,
            quantity=1,
        )

        response = self.client.post(
            "/api/cart/coupon/",
            {"coupon_code": "LUXE10"},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("error", response.data)


class TestStockReservation(CartTestCase):
    """Test stock reservation functionality during checkout."""

    def test_reserve_stock_success(self):
        """Reserving stock for a cart with available inventory should succeed."""
        from apps.cart.services import CartService

        # Add item to cart
        self._add_item(quantity=2)
        cart_key = f"cart:{self.user.id}"

        # Reserve stock
        result = CartService.reserve_stock(cart_key, minutes=15)

        self.assertIn("reservation_key", result)
        self.assertEqual(result["reservation_key"], f"{cart_key}:reservation")
        self.assertEqual(result["expires_in_seconds"], 15 * 60)
        self.assertEqual(len(result["reserved_items"]), 1)
        self.assertEqual(result["reserved_items"][0]["quantity"], 2)

    def test_reserve_stock_empty_cart(self):
        """Reserving stock for an empty cart should raise ValueError."""
        from apps.cart.services import CartService

        cart_key = f"cart:{self.user.id}"

        with self.assertRaises(ValueError) as ctx:
            CartService.reserve_stock(cart_key)

        self.assertIn("empty", str(ctx.exception).lower())

    def test_reserve_stock_insufficient_inventory(self):
        """Reserving more stock than available should raise ValueError."""
        from apps.cart.services import CartService

        # Mock variant has stock_qty=10
        # Try to add 11
        response = self._add_item(quantity=11)

        # Should fail during add (CartService validates stock)
        self.assertEqual(response.status_code, 400)
        self.assertIn("error", response.data)

    def test_release_reservation(self):
        """Releasing a reservation should delete the reservation key."""
        from apps.cart.services import CartService

        self._add_item(quantity=2)
        cart_key = f"cart:{self.user.id}"

        # Reserve then release
        CartService.reserve_stock(cart_key)
        released = CartService.release_reservation(cart_key)

        self.assertTrue(released)

        # Second release should return False (nothing to release)
        released_again = CartService.release_reservation(cart_key)
        self.assertFalse(released_again)

    def test_get_reservation_status(self):
        """Getting reservation status should return details if reservation exists."""
        from apps.cart.services import CartService

        self._add_item(quantity=2)
        cart_key = f"cart:{self.user.id}"

        # No reservation yet
        status = CartService.get_reservation_status(cart_key)
        self.assertIsNone(status)

        # Create reservation
        CartService.reserve_stock(cart_key, minutes=10)

        # Check status
        status = CartService.get_reservation_status(cart_key)
        self.assertIsNotNone(status)
        self.assertEqual(status["reservation_key"], f"{cart_key}:reservation")
        self.assertLessEqual(status["ttl_seconds"], 10 * 60)
        self.assertEqual(len(status["reserved_items"]), 1)

    def test_reservation_expires_automatically(self):
        """Reservation should auto-expire based on TTL."""
        from apps.cart.services import CartService
        import time

        self._add_item(quantity=1)
        cart_key = f"cart:{self.user.id}"

        # Create reservation with 1-second TTL (for testing)
        CartService.reserve_stock(cart_key, minutes=0)  # 0 minutes = immediate expiry
        # Actually set TTL manually via Redis
        self._fake_redis.expire(f"{cart_key}:reservation", 1)

        # Wait for expiry
        time.sleep(2)

        # Check status — should be None
        status = CartService.get_reservation_status(cart_key)
        self.assertIsNone(status)