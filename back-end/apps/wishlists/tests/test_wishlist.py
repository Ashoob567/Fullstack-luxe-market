import uuid
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from apps.products.models import Product, Category
from apps.wishlists.models import Wishlist

User = get_user_model()



def _get_results(self, res):
    if isinstance(res.data, dict) and "results" in res.data:
        return res.data["results"]
    return res.data


class WishlistTestBase(TestCase):
    """Shared setup for all wishlist tests."""

    def setUp(self):
        self.client = APIClient()

        # create test user
        self.user = User.objects.create_user(
            email="test@luxemarket.pk",
            password="TestPass123",
        )

        # create a second user to verify isolation
        self.other_user = User.objects.create_user(
            email="other@luxemarket.pk",
            password="TestPass123",
        )

        # create category + products
        self.category = Category.objects.create(
            name="Watches",
            slug="watches",
        )
        self.product_a = Product.objects.create(
            name="Casio Edifice",
            slug="casio-edifice",
            base_price=12500,
            category=self.category,
            is_active=True,
        )
        self.product_b = Product.objects.create(
            name="Citizen Eco-Drive",
            slug="citizen-eco-drive",
            base_price=28000,
            category=self.category,
            is_active=True,
        )

        # authenticate main user
        self.client.force_authenticate(user=self.user)


# ─────────────────────────────────────────────────────────────────────────────
# LIST
# ─────────────────────────────────────────────────────────────────────────────

class WishlistListTests(WishlistTestBase):

    def test_empty_wishlist_returns_200_with_empty_list(self):
        res = self.client.get("/api/wishlist/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data, [])

    def test_returns_only_current_users_items(self):
        # add items for both users
        Wishlist.objects.create(user=self.user,       product=self.product_a)
        Wishlist.objects.create(user=self.other_user, product=self.product_b)

        res = self.client.get("/api/wishlist/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]["product"]["slug"], "casio-edifice")

    def test_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        res = self.client.get("/api/wishlist/")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


# ─────────────────────────────────────────────────────────────────────────────
# TOGGLE
# ─────────────────────────────────────────────────────────────────────────────

class WishlistToggleTests(WishlistTestBase):

    def test_toggle_adds_product_when_not_wishlisted(self):
        res = self.client.post(
            "/api/wishlist/toggle/",
            {"product_id": str(self.product_a.id)},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["action"], "added")
        self.assertTrue(
            Wishlist.objects.filter(user=self.user, product=self.product_a).exists()
        )

    def test_toggle_removes_product_when_already_wishlisted(self):
        Wishlist.objects.create(user=self.user, product=self.product_a)

        res = self.client.post(
            "/api/wishlist/toggle/",
            {"product_id": str(self.product_a.id)},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["action"], "removed")
        self.assertFalse(
            Wishlist.objects.filter(user=self.user, product=self.product_a).exists()
        )

    def test_toggle_with_invalid_product_id_returns_400(self):
        res = self.client.post(
            "/api/wishlist/toggle/",
            {"product_id": str(uuid.uuid4())},  # random non-existent UUID
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_toggle_with_inactive_product_returns_400(self):
        self.product_a.is_active = False
        self.product_a.save()

        res = self.client.post(
            "/api/wishlist/toggle/",
            {"product_id": str(self.product_a.id)},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_toggle_with_missing_product_id_returns_400(self):
        res = self.client.post("/api/wishlist/toggle/", {}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


# ─────────────────────────────────────────────────────────────────────────────
# STATUS
# ─────────────────────────────────────────────────────────────────────────────

class WishlistStatusTests(WishlistTestBase):

    def test_returns_true_when_product_is_wishlisted(self):
        Wishlist.objects.create(user=self.user, product=self.product_a)

        res = self.client.get(
            "/api/wishlist/status/",
            {"product_id": str(self.product_a.id)},
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data["is_wishlisted"])

    def test_returns_false_when_product_is_not_wishlisted(self):
        res = self.client.get(
            "/api/wishlist/status/",
            {"product_id": str(self.product_a.id)},
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertFalse(res.data["is_wishlisted"])

    def test_missing_product_id_returns_400(self):
        res = self.client.get("/api/wishlist/status/")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


# ─────────────────────────────────────────────────────────────────────────────
# BULK STATUS
# ─────────────────────────────────────────────────────────────────────────────

class WishlistBulkStatusTests(WishlistTestBase):

    def test_bulk_status_returns_correct_map(self):
        # only product_a is wishlisted
        Wishlist.objects.create(user=self.user, product=self.product_a)

        res = self.client.post(
            "/api/wishlist/bulk-status/",
            {"product_ids": [str(self.product_a.id), str(self.product_b.id)]},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data["wishlist_status"][str(self.product_a.id)])
        self.assertFalse(res.data["wishlist_status"][str(self.product_b.id)])

    def test_bulk_status_empty_list_returns_400(self):
        res = self.client.post(
            "/api/wishlist/bulk-status/",
            {"product_ids": []},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_bulk_status_does_not_leak_other_users_data(self):
        # other_user wishlists product_b
        Wishlist.objects.create(user=self.other_user, product=self.product_b)

        # main user queries both — product_b should be False for them
        res = self.client.post(
            "/api/wishlist/bulk-status/",
            {"product_ids": [str(self.product_a.id), str(self.product_b.id)]},
            format="json",
        )
        self.assertFalse(res.data["wishlist_status"][str(self.product_b.id)])


# ─────────────────────────────────────────────────────────────────────────────
# CLEAR
# ─────────────────────────────────────────────────────────────────────────────

class WishlistClearTests(WishlistTestBase):

    def test_clear_removes_all_items(self):
        Wishlist.objects.create(user=self.user, product=self.product_a)
        Wishlist.objects.create(user=self.user, product=self.product_b)

        res = self.client.delete("/api/wishlist/clear/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["deleted_count"], 2)
        self.assertEqual(Wishlist.objects.filter(user=self.user).count(), 0)

    def test_clear_does_not_affect_other_users_wishlist(self):
        Wishlist.objects.create(user=self.other_user, product=self.product_a)

        self.client.delete("/api/wishlist/clear/")  # clears main user's wishlist

        # other_user's item must still exist
        self.assertTrue(
            Wishlist.objects.filter(user=self.other_user, product=self.product_a).exists()
        )

    def test_clear_empty_wishlist_returns_200(self):
        res = self.client.delete("/api/wishlist/clear/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["deleted_count"], 0)
