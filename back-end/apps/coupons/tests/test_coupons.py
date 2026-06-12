from decimal import Decimal
from django.test import TestCase
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from datetime import timedelta

from apps.coupons.models import Coupon, CouponUsage

User = get_user_model()


class CouponTestBase(TestCase):
    """Shared setup for all coupon tests."""

    def setUp(self):
        self.client = APIClient()

        self.user = User.objects.create_user(
            email="buyer@luxemarket.pk",
            password="TestPass123",
        )
        self.other_user = User.objects.create_user(
            email="other@luxemarket.pk",
            password="TestPass123",
        )
        self.admin = User.objects.create_superuser(
            email="admin@luxemarket.pk",
            password="AdminPass123",
        )

        now = timezone.now()

        # standard 20% off coupon
        self.coupon_pct = Coupon.objects.create(
            code="SAVE20",
            discount_type="percentage",
            discount_value=20,
            max_uses=10,
            min_order_value=0,
            valid_from=now - timedelta(days=1),
            valid_until=now + timedelta(days=30),
            is_active=True,
        )

        # fixed Rs. 500 off, min order Rs. 2000
        self.coupon_fixed = Coupon.objects.create(
            code="FLAT500",
            discount_type="fixed",
            discount_value=500,
            max_uses=0,      # unlimited
            min_order_value=2000,
            valid_from=now - timedelta(days=1),
            valid_until=now + timedelta(days=30),
            is_active=True,
        )

        # expired coupon
        self.coupon_expired = Coupon.objects.create(
            code="EXPIRED10",
            discount_type="percentage",
            discount_value=10,
            valid_from=now - timedelta(days=60),
            valid_until=now - timedelta(days=1),
            is_active=True,
        )

        # inactive coupon
        self.coupon_inactive = Coupon.objects.create(
            code="INACTIVE",
            discount_type="percentage",
            discount_value=15,
            valid_from=now - timedelta(days=1),
            valid_until=now + timedelta(days=30),
            is_active=False,
        )

        # max 1 use per user coupon
        self.coupon_once_per_user = Coupon.objects.create(
            code="ONCE",
            discount_type="fixed",
            discount_value=200,
            max_uses=100,
            max_uses_per_user=1,
            valid_from=now - timedelta(days=1),
            valid_until=now + timedelta(days=30),
            is_active=True,
        )

        self.client.force_authenticate(user=self.user)


# ─────────────────────────────────────────────────────────────────────────────
# MODEL TESTS
# ─────────────────────────────────────────────────────────────────────────────

class CouponModelTests(CouponTestBase):

    def test_percentage_discount_calculated_correctly(self):
        discount = self.coupon_pct.calculate_discount(Decimal("5000"))
        self.assertEqual(discount, Decimal("1000"))  # 20% of 5000

    def test_percentage_discount_capped_by_max_discount_amount(self):
        self.coupon_pct.max_discount_amount = Decimal("500")
        self.coupon_pct.save()
        discount = self.coupon_pct.calculate_discount(Decimal("5000"))
        self.assertEqual(discount, Decimal("500"))  # capped at 500, not 1000

    def test_fixed_discount_calculated_correctly(self):
        discount = self.coupon_fixed.calculate_discount(Decimal("5000"))
        self.assertEqual(discount, Decimal("500"))

    def test_discount_cannot_exceed_cart_total(self):
        # cart total is Rs 100, but fixed discount is Rs 500
        discount = self.coupon_fixed.calculate_discount(Decimal("100"))
        self.assertEqual(discount, Decimal("100"))  # capped at cart total

    def test_is_valid_returns_true_for_active_valid_coupon(self):
        self.assertTrue(self.coupon_pct.is_valid())

    def test_is_valid_returns_false_for_expired_coupon(self):
        self.assertFalse(self.coupon_expired.is_valid())

    def test_is_valid_returns_false_for_inactive_coupon(self):
        self.assertFalse(self.coupon_inactive.is_valid())

    def test_is_valid_returns_false_when_max_uses_reached(self):
        self.coupon_pct.used_count = 10  # equals max_uses
        self.coupon_pct.save()
        self.assertFalse(self.coupon_pct.is_valid())

    def test_str_percentage_coupon(self):
        self.assertIn("SAVE20", str(self.coupon_pct))
        self.assertIn("%", str(self.coupon_pct))

    def test_str_fixed_coupon(self):
        self.assertIn("FLAT500", str(self.coupon_fixed))
        self.assertIn("Rs.", str(self.coupon_fixed))


# ─────────────────────────────────────────────────────────────────────────────
# VALIDATE ENDPOINT
# ─────────────────────────────────────────────────────────────────────────────

class CouponValidateViewTests(CouponTestBase):
    URL = "/api/coupons/validate/"

    def _post(self, code, cart_total=5000):
        return self.client.post(
            self.URL,
            {"code": code, "cart_total": cart_total},
            format="json",
        )

    def test_valid_percentage_coupon_returns_200(self):
        res = self._post("SAVE20", 5000)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["code"], "SAVE20")
        self.assertEqual(Decimal(res.data["discount_amount"]), Decimal("1000"))
        self.assertEqual(Decimal(res.data["final_total"]), Decimal("4000"))

    def test_valid_fixed_coupon_returns_200(self):
        res = self._post("FLAT500", 5000)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(Decimal(res.data["discount_amount"]), Decimal("500"))

    def test_code_is_case_insensitive(self):
        res = self._post("save20", 5000)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_invalid_code_returns_400(self):
        res = self._post("DOESNOTEXIST")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Invalid", res.data["detail"])

    def test_expired_coupon_returns_400(self):
        res = self._post("EXPIRED10")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("expired", res.data["detail"].lower())

    def test_inactive_coupon_returns_400(self):
        res = self._post("INACTIVE")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_below_min_order_value_returns_400_with_helpful_message(self):
        res = self._post("FLAT500", cart_total=1000)  # min is 2000
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("minimum order", res.data["detail"].lower())
        self.assertIn("1,000", res.data["detail"])  # shortage amount shown

    def test_exhausted_coupon_returns_400(self):
        self.coupon_pct.used_count = 10  # equals max_uses=10
        self.coupon_pct.save()
        res = self._post("SAVE20")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_per_user_limit_enforced(self):
        # record that user already used this coupon once
        CouponUsage.objects.create(
            coupon=self.coupon_once_per_user,
            user=self.user,
            discount_applied=200,
        )
        res = self._post("ONCE")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("already used", res.data["detail"].lower())

    def test_per_user_limit_allows_other_user(self):
        # user already used it
        CouponUsage.objects.create(
            coupon=self.coupon_once_per_user,
            user=self.user,
            discount_applied=200,
        )
        # other_user should still be allowed
        self.client.force_authenticate(user=self.other_user)
        res = self._post("ONCE")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        res = self._post("SAVE20")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


# ─────────────────────────────────────────────────────────────────────────────
# ACTIVE LIST ENDPOINT
# ─────────────────────────────────────────────────────────────────────────────

class CouponActiveListTests(CouponTestBase):
    URL = "/api/coupons/active/"

    def test_returns_only_valid_coupons(self):
        res = self.client.get(self.URL)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        codes = [c["code"] for c in res.data]
        self.assertIn("SAVE20", codes)
        self.assertIn("FLAT500", codes)
        self.assertNotIn("EXPIRED10", codes)
        self.assertNotIn("INACTIVE", codes)

    def test_excludes_coupons_user_has_exhausted(self):
        # user has already used ONCE coupon
        CouponUsage.objects.create(
            coupon=self.coupon_once_per_user,
            user=self.user,
            discount_applied=200,
        )
        res = self.client.get(self.URL)
        codes = [c["code"] for c in res.data]
        self.assertNotIn("ONCE", codes)

    def test_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        res = self.client.get(self.URL)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


# ─────────────────────────────────────────────────────────────────────────────
# USAGE HISTORY ENDPOINT
# ─────────────────────────────────────────────────────────────────────────────

class CouponUsageHistoryTests(CouponTestBase):
    URL = "/api/coupons/my-usage/"

    def test_returns_only_current_users_usage(self):
        CouponUsage.objects.create(
            coupon=self.coupon_pct, user=self.user, discount_applied=1000
        )
        CouponUsage.objects.create(
            coupon=self.coupon_fixed, user=self.other_user, discount_applied=500
        )
        res = self.client.get(self.URL)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]["coupon_code"], "SAVE20")

    def test_empty_history_returns_200_with_empty_list(self):
        res = self.client.get(self.URL)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data, [])


# ─────────────────────────────────────────────────────────────────────────────
# ADMIN ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────

class AdminCouponTests(CouponTestBase):

    def test_admin_can_create_coupon(self):
        self.client.force_authenticate(user=self.admin)
        now = timezone.now()
        res = self.client.post(
            "/api/coupons/admin/create/",
            {
                "code": "newcode",        # lowercase — should be uppercased
                "description": "Test coupon",
                "discount_type": "percentage",
                "discount_value": "15.00",
                "max_uses": 50,
                "max_uses_per_user": 1,
                "min_order_value": "1000.00",
                "valid_from": (now - timedelta(days=1)).isoformat(),
                "valid_until": (now + timedelta(days=30)).isoformat(),
                "is_active": True,
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Coupon.objects.filter(code="NEWCODE").exists())  # uppercased

    def test_non_admin_cannot_create_coupon(self):
        self.client.force_authenticate(user=self.user)
        res = self.client.post("/api/coupons/admin/create/", {}, format="json")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_view_coupon_stats(self):
        self.client.force_authenticate(user=self.admin)
        CouponUsage.objects.create(
            coupon=self.coupon_pct, user=self.user, discount_applied=1000
        )
        res = self.client.get("/api/coupons/admin/stats/SAVE20/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["code"], "SAVE20")
        self.assertEqual(res.data["unique_users"], 1)

    def test_admin_stats_unknown_code_returns_404(self):
        self.client.force_authenticate(user=self.admin)
        res = self.client.get("/api/coupons/admin/stats/UNKNOWN/")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)