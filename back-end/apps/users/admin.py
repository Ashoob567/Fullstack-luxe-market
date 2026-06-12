from django.contrib import admin
from .address_models import UserAddress


@admin.register(UserAddress)
class UserAddressAdmin(admin.ModelAdmin):
    list_display = ('user', 'label', 'first_name', 'last_name', 'city', 'province', 'is_default', 'created_at')
    list_filter = ('province', 'is_default')
    search_fields = ('user__email', 'first_name', 'last_name', 'city')
    ordering = ('-created_at',)
