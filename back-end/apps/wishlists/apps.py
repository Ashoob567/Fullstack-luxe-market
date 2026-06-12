from django.apps import AppConfig


class WishlistsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.wishlists"
    verbose_name = "Wishlists"

    def ready(self):
        pass  # signal imports here if needed later
