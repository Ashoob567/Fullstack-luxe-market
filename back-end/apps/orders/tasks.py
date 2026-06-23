"""
apps/orders/tasks.py

Django Q async tasks for order processing.
"""
import logging
from decimal import Decimal
from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Sum, Count, Q

from apps.orders.models import Order, OrderItem
from apps.orders.utils import send_order_email

logger = logging.getLogger(__name__)


# ============================================================================
# USE CASE 1: ORDER CONFIRMATION EMAILS
# ============================================================================

def send_order_confirmation_email(order_id):
    """
    Send order confirmation email after successful checkout.

    Triggered: After payment is confirmed (COD or card)
    Frequency: Once per order
    Priority: HIGH - Customer expects immediate confirmation

    Args:
        order_id (str): UUID of the order

    Returns:
        str: Success/failure message
    """
    try:
        order = Order.objects.select_related('user').prefetch_related('items').get(id=order_id)

        # Determine recipient
        customer_email = order.user.email if order.user else order.guest_email
        customer_name = (
            order.user.get_full_name() if order.user
            else order.shipping_address.get('firstName', 'Valued Customer')
        )

        # Send email
        success = send_order_email(
            to_email=customer_email,
            subject=f'Order Confirmation - {order.order_number}',
            template_name='emails/order_confirmation.html',
            context={
                'order': order,
                'customer_name': customer_name,
                'items': order.items.all(),
                'shipping_address': order.shipping_address,
            }
        )

        if success:
            logger.info(f"✅ Order confirmation email sent: {order.order_number}")
            return f"Order confirmation sent to {customer_email}"
        else:
            logger.error(f"❌ Failed to send order confirmation: {order.order_number}")
            return f"Failed to send email to {customer_email}"

    except Order.DoesNotExist:
        logger.error(f"❌ Order {order_id} not found for email confirmation")
        return f"Order {order_id} not found"
    except Exception as exc:
        logger.exception(f"❌ Error sending order confirmation for {order_id}: {exc}")
        raise  # Django Q will retry


# ============================================================================
# USE CASE 2: ORDER STATUS UPDATE NOTIFICATIONS
# ============================================================================

def send_order_status_update_email(order_id, old_status, new_status):
    """
    Send email when order status changes (shipped, delivered, cancelled).

    Triggered: When admin updates order status in Django admin
    Frequency: Multiple times per order (as it moves through statuses)
    Priority: HIGH - Customer expects tracking updates

    Args:
        order_id (str): UUID of the order
        old_status (str): Previous status
        new_status (str): New status

    Returns:
        str: Success/failure message
    """
    # Only send emails for specific status changes
    email_templates = {
        'shipped': {
            'subject': 'Your Order Has Been Shipped! 📦',
            'template': 'emails/order_shipped.html',
        },
        'delivered': {
            'subject': 'Your Order Has Been Delivered! 🎉',
            'template': 'emails/order_delivered.html',
        },
        'cancelled': {
            'subject': 'Order Cancelled',
            'template': 'emails/order_cancelled.html',
        },
    }

    if new_status not in email_templates:
        logger.info(f"No email template for status: {new_status}")
        return f"No email needed for status: {new_status}"

    try:
        order = Order.objects.select_related('user').get(id=order_id)

        customer_email = order.user.email if order.user else order.guest_email
        customer_name = (
            order.user.get_full_name() if order.user
            else order.shipping_address.get('firstName', 'Valued Customer')
        )

        email_config = email_templates[new_status]

        success = send_order_email(
            to_email=customer_email,
            subject=f"{email_config['subject']} - {order.order_number}",
            template_name=email_config['template'],
            context={
                'order': order,
                'customer_name': customer_name,
                'old_status': old_status,
                'new_status': new_status,
            }
        )

        if success:
            logger.info(f"✅ Status update email sent: {order.order_number} ({old_status} → {new_status})")
            return f"Status update email sent to {customer_email}"
        else:
            return f"Failed to send status update email"

    except Order.DoesNotExist:
        logger.error(f"❌ Order {order_id} not found")
        return f"Order {order_id} not found"
    except Exception as exc:
        logger.exception(f"❌ Error sending status update for {order_id}: {exc}")
        raise


# ============================================================================
# USE CASE 3: DAILY SALES REPORT
# ============================================================================

def generate_daily_sales_report():
    """
    Generate daily sales report and email to admins.

    Triggered: Scheduled task (runs daily at 9 AM)
    Frequency: Once per day
    Priority: LOW - Internal reporting

    Returns:
        str: Report summary
    """
    yesterday = timezone.now() - timedelta(days=1)
    start_date = yesterday.replace(hour=0, minute=0, second=0, microsecond=0)
    end_date = yesterday.replace(hour=23, minute=59, second=59, microsecond=999999)

    # Query orders from yesterday
    orders = Order.objects.filter(
        created_at__range=(start_date, end_date),
        payment_status='paid'
    )

    # Calculate metrics
    total_revenue = orders.aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
    total_orders = orders.count()
    cod_orders = orders.filter(payment_method='cod').count()
    card_orders = orders.filter(payment_method='mock_card').count()

    # Top products
    top_products = OrderItem.objects.filter(
        order__created_at__range=(start_date, end_date),
        order__payment_status='paid'
    ).values('product_name_snapshot').annotate(
        quantity_sold=Sum('quantity'),
        revenue=Sum('subtotal')
    ).order_by('-quantity_sold')[:10]

    report_data = {
        'date': yesterday.date(),
        'total_revenue': total_revenue,
        'total_orders': total_orders,
        'cod_orders': cod_orders,
        'card_orders': card_orders,
        'top_products': list(top_products),
    }

    logger.info(
        f"📊 Daily Sales Report - {yesterday.date()}: "
        f"PKR {total_revenue:,.2f} | {total_orders} orders"
    )

    # In production, send email to admins
    # send_order_email(
    #     to_email='admin@luxemarket.com',
    #     subject=f'Daily Sales Report - {yesterday.date()}',
    #     template_name='emails/daily_sales_report.html',
    #     context=report_data
    # )

    return f"Report generated: PKR {total_revenue:,.2f} from {total_orders} orders"


# ============================================================================
# USE CASE 4: SEND LOW STOCK ALERT
# ============================================================================

def send_low_stock_alert(variant_id):
    """
    Send alert to admins when product variant stock is low.

    Triggered: After stock reduction during checkout
    Frequency: Once when stock drops below threshold
    Priority: MEDIUM - Inventory management

    Args:
        variant_id (str): UUID of ProductSizeVariant

    Returns:
        str: Alert message
    """
    from apps.products.models import ProductSizeVariant

    try:
        variant = ProductSizeVariant.objects.select_related(
            'color_variant__product'
        ).get(id=variant_id)

        if variant.stock_quantity >= 5:
            return f"Stock sufficient: {variant.stock_quantity} units"

        logger.warning(
            f"⚠️ LOW STOCK ALERT: {variant.color_variant.product.name} "
            f"({variant.color_variant.color_name} - {variant.size_name}) "
            f"- Only {variant.stock_quantity} left!"
        )

        # In production, send email to inventory managers
        # send_order_email(
        #     to_email='inventory@luxemarket.com',
        #     subject=f'Low Stock Alert - {variant.sku}',
        #     template_name='emails/low_stock_alert.html',
        #     context={'variant': variant}
        # )

        return f"Low stock alert sent for {variant.sku}"

    except ProductSizeVariant.DoesNotExist:
        logger.error(f"❌ Variant {variant_id} not found")
        return f"Variant {variant_id} not found"
