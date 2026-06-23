"""
apps/cart/tasks.py

Django Q async tasks for cart management.
"""
import logging
import json
from datetime import timedelta
from django.utils import timezone
from django.core.cache import cache
from django.contrib.auth import get_user_model

from apps.orders.utils import send_order_email

User = get_user_model()
logger = logging.getLogger(__name__)


# ============================================================================
# USE CASE 1: CLEAR EXPIRED CARTS
# ============================================================================

def clear_expired_carts():
    """
    Remove expired carts from Redis to free memory.

    Triggered: Scheduled task (runs every 6 hours)
    Frequency: 4 times per day
    Priority: MEDIUM - Memory management

    Rules:
    - Guest carts: Delete after 7 days
    - User carts: Delete after 30 days
    - Recently updated carts: Keep (checked out within 1 hour)

    Returns:
        str: Number of carts cleared
    """
    try:
        redis_client = cache.client.get_client()

        # Get all cart keys
        guest_cart_keys = redis_client.keys('cart:guest:*')
        user_cart_keys = redis_client.keys('cart:[0-9]*')  # cart:1, cart:2, etc.

        cleared_guest = 0
        cleared_user = 0

        # Clear guest carts (older than 7 days)
        guest_expiry = timezone.now() - timedelta(days=7)

        for key in guest_cart_keys:
            try:
                cart_data = cache.get(key.decode() if isinstance(key, bytes) else key)
                if cart_data:
                    # Check if cart has timestamp
                    cart_dict = json.loads(cart_data) if isinstance(cart_data, str) else cart_data
                    last_updated = cart_dict.get('last_updated')

                    if last_updated:
                        cart_time = timezone.datetime.fromisoformat(last_updated)
                        if cart_time < guest_expiry:
                            cache.delete(key.decode() if isinstance(key, bytes) else key)
                            cleared_guest += 1
                    else:
                        # No timestamp = old cart, delete it
                        cache.delete(key.decode() if isinstance(key, bytes) else key)
                        cleared_guest += 1
            except Exception as e:
                logger.warning(f"Error processing guest cart {key}: {e}")

        # Clear user carts (older than 30 days)
        user_expiry = timezone.now() - timedelta(days=30)

        for key in user_cart_keys:
            try:
                cart_data = cache.get(key.decode() if isinstance(key, bytes) else key)
                if cart_data:
                    cart_dict = json.loads(cart_data) if isinstance(cart_data, str) else cart_data
                    last_updated = cart_dict.get('last_updated')

                    if last_updated:
                        cart_time = timezone.datetime.fromisoformat(last_updated)
                        if cart_time < user_expiry:
                            cache.delete(key.decode() if isinstance(key, bytes) else key)
                            cleared_user += 1
            except Exception as e:
                logger.warning(f"Error processing user cart {key}: {e}")

        total_cleared = cleared_guest + cleared_user

        logger.info(
            f"✅ Cleared {total_cleared} expired carts "
            f"({cleared_guest} guest, {cleared_user} user)"
        )

        return f"Cleared {total_cleared} expired carts"

    except Exception as exc:
        logger.exception(f"❌ Error clearing expired carts: {exc}")
        raise


# ============================================================================
# USE CASE 2: SEND ABANDONED CART REMINDER
# ============================================================================

def send_abandoned_cart_reminder(user_id, cart_key):
    """
    Send reminder email for abandoned carts (after 24 hours).

    Triggered: Scheduled 24 hours after cart creation
    Frequency: Once per cart (if still abandoned)
    Priority: HIGH - Increases conversion by 15-30%

    Args:
        user_id (int): User ID
        cart_key (str): Redis cart key

    Returns:
        str: Result message
    """
    try:
        # Check if cart still exists
        cart_data = cache.get(cart_key)

        if not cart_data:
            logger.info(f"Cart {cart_key} no longer exists (likely checked out)")
            return "Cart no longer exists"

        cart = json.loads(cart_data) if isinstance(cart_data, str) else cart_data

        if not cart.get('items'):
            logger.info(f"Cart {cart_key} is empty")
            return "Cart is empty"

        # Get user
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            logger.warning(f"User {user_id} not found")
            return "User not found"

        # Calculate cart total
        cart_total = sum(
            float(item.get('unit_price', 0)) * int(item.get('quantity', 1))
            for item in cart.get('items', [])
        )

        # Send reminder email
        success = send_order_email(
            to_email=user.email,
            subject='You left items in your cart! 🛒',
            template_name='emails/abandoned_cart.html',
            context={
                'customer_name': user.get_full_name() or user.email.split('@')[0],
                'cart_items': cart.get('items', []),
                'cart_total': f"{cart_total:,.2f}",
                'cart_count': len(cart.get('items', [])),
            }
        )

        if success:
            logger.info(
                f"✅ Abandoned cart reminder sent to {user.email} "
                f"({len(cart.get('items', []))} items, PKR {cart_total:,.2f})"
            )
            return f"Reminder sent to {user.email}"
        else:
            return "Failed to send reminder"

    except Exception as exc:
        logger.exception(f"❌ Error sending abandoned cart reminder: {exc}")
        raise


# ============================================================================
# USE CASE 3: SCHEDULE ABANDONED CART REMINDER
# ============================================================================

def schedule_abandoned_cart_reminder(user_id, cart_key):
    """
    Schedule an abandoned cart reminder for 24 hours later.

    Triggered: When user adds first item to cart
    Frequency: Once per cart session
    Priority: MEDIUM

    Args:
        user_id (int): User ID
        cart_key (str): Redis cart key

    Returns:
        str: Schedule confirmation
    """
    try:
        from django_q.tasks import schedule

        # Schedule task for 24 hours from now
        task_name = f"abandoned_cart_{user_id}_{timezone.now().timestamp()}"

        schedule(
            'apps.cart.tasks.send_abandoned_cart_reminder',
            user_id,
            cart_key,
            name=task_name,
            schedule_type='O',  # Once
            next_run=timezone.now() + timedelta(hours=24),
        )

        logger.info(
            f"✅ Scheduled abandoned cart reminder for user {user_id} in 24 hours"
        )

        return f"Reminder scheduled for {cart_key}"

    except Exception as exc:
        logger.exception(f"❌ Error scheduling abandoned cart reminder: {exc}")
        return f"Failed to schedule reminder: {str(exc)}"


# ============================================================================
# USE CASE 4: CART ANALYTICS REPORT
# ============================================================================

def generate_cart_analytics_report():
    """
    Generate weekly cart analytics report.

    Triggered: Scheduled task (runs weekly on Mondays at 9 AM)
    Frequency: Once per week
    Priority: LOW - Analytics

    Returns:
        str: Report summary
    """
    try:
        redis_client = cache.client.get_client()

        # Get all cart keys
        all_cart_keys = redis_client.keys('cart:*')

        total_carts = len(all_cart_keys)
        carts_with_items = 0
        total_items = 0
        total_value = 0

        for key in all_cart_keys:
            try:
                cart_data = cache.get(key.decode() if isinstance(key, bytes) else key)
                if cart_data:
                    cart = json.loads(cart_data) if isinstance(cart_data, str) else cart_data
                    items = cart.get('items', [])

                    if items:
                        carts_with_items += 1
                        total_items += len(items)

                        cart_value = sum(
                            float(item.get('unit_price', 0)) * int(item.get('quantity', 1))
                            for item in items
                        )
                        total_value += cart_value

            except Exception as e:
                logger.warning(f"Error processing cart {key}: {e}")

        avg_items_per_cart = total_items / carts_with_items if carts_with_items > 0 else 0
        avg_cart_value = total_value / carts_with_items if carts_with_items > 0 else 0

        logger.info(
            f"📊 Cart Analytics Report:\n"
            f"   Total carts: {total_carts}\n"
            f"   Carts with items: {carts_with_items}\n"
            f"   Total items: {total_items}\n"
            f"   Total value: PKR {total_value:,.2f}\n"
            f"   Avg items/cart: {avg_items_per_cart:.2f}\n"
            f"   Avg cart value: PKR {avg_cart_value:,.2f}"
        )

        return f"Report: {carts_with_items} active carts, PKR {total_value:,.2f}"

    except Exception as exc:
        logger.exception(f"❌ Error generating cart analytics: {exc}")
        raise
