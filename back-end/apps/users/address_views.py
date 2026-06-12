"""
apps/users/address_views.py
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
CRUD endpoints for saved user addresses.

Endpoints (all require JWT authentication):
  GET    /api/auth/addresses/          → list user's addresses
  POST   /api/auth/addresses/          → create a new address
  GET    /api/auth/addresses/<id>/     → retrieve a single address
  PUT    /api/auth/addresses/<id>/     → full update
  PATCH  /api/auth/addresses/<id>/     → partial update
  DELETE /api/auth/addresses/<id>/     → delete
  POST   /api/auth/addresses/<id>/set-default/  → mark as default
"""

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .address_models import UserAddress
from .address_serializers import UserAddressSerializer


class AddressListCreateView(APIView):
    """
    GET  /api/auth/addresses/   → list all addresses for the authenticated user
    POST /api/auth/addresses/   → create a new address
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        addresses = UserAddress.objects.filter(user=request.user)
        serializer = UserAddressSerializer(addresses, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = UserAddressSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AddressDetailView(APIView):
    """
    GET    /api/auth/addresses/<id>/  → retrieve
    PUT    /api/auth/addresses/<id>/  → full update
    PATCH  /api/auth/addresses/<id>/  → partial update
    DELETE /api/auth/addresses/<id>/  → delete
    """

    permission_classes = [IsAuthenticated]

    def _get_address(self, request, address_id: str):
        try:
            return UserAddress.objects.get(id=address_id, user=request.user)
        except (UserAddress.DoesNotExist, ValueError):
            return None

    def get(self, request, address_id: str):
        address = self._get_address(request, address_id)
        if address is None:
            return Response(
                {"detail": "Address not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(UserAddressSerializer(address).data)

    def put(self, request, address_id: str):
        address = self._get_address(request, address_id)
        if address is None:
            return Response(
                {"detail": "Address not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = UserAddressSerializer(address, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, address_id: str):
        address = self._get_address(request, address_id)
        if address is None:
            return Response(
                {"detail": "Address not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = UserAddressSerializer(address, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, address_id: str):
        address = self._get_address(request, address_id)
        if address is None:
            return Response(
                {"detail": "Address not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        address.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AddressSetDefaultView(APIView):
    """
    POST /api/auth/addresses/<id>/set-default/
    Marks the given address as the user's default; clears all others.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, address_id: str):
        try:
            address = UserAddress.objects.get(id=address_id, user=request.user)
        except (UserAddress.DoesNotExist, ValueError):
            return Response(
                {"detail": "Address not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        address.is_default = True
        address.save()  # UserAddress.save() clears other defaults automatically
        return Response(UserAddressSerializer(address).data)
