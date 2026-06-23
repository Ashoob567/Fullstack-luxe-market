"""
apps/coupons/tasks.py

Django Q async tasks for coupon management.
"""
import logging
from datetime import timedelta
from django.utils import timezone

from apps.coupons.models import Coupon

logger = logging.getLogger(__name__)


# ============================================================================
# USE CASE 1: EXPIRE OLD COUPONS
# ============================================================================

def expire_old_coupons():
    """
    Automatically deactivate expired coupons.

    Triggered: Scheduled task (runs daily at 2 AM)
    Frequency: Once per day
    Priority: MEDIUM - Coupon management

    Returns:
        str: Number of expired coupons
    """
    try:
        # Find expired coupons
        expired_coupons = Coupon.objects.filter(
            valid_until__lt=timezone.now(),
            is_active=True
        )

        count = expired_coupons.count()

        if count == 0:
            logger.info("✅ No coupons to expire")
            return "No coupons to expire"

        # Deactivate them
        expired_coupons.update(is_active=False)

        logger.info(f"✅ Expired {count} coupons")

        # Log first 10 expired coupons
        for coupon in expired_coupons[:10]:
            logger.info(f"   - {coupon.code} (expired: {coupon.valid_until})")

        return f"Expired {count} coupons"

    except Exception as exc:
        logger.exception(f"❌ Error expiring coupons: {exc}")
        raise


# ============================================================================
# USE CASE 2: SEND EXPIRING COUPON ALERTS
# ============================================================================

def send_expiring_coupon_alerts():
    """
    Notify admins about coupons expiring in the next 3 days.

    Triggered: Scheduled task (runs daily at 9 AM)
    Frequency: Once per day
    Priority: LOW - Admin notification

    Returns:
        str: Number of expiring coupons
    """
    try:
        # Find coupons expiring in next 3 days
        three_days_from_now = timezone.now() + timedelta(days=3)

        expiring_soon = Coupon.objects.filter(
            valid_until__lte=three_days_from_now,
            valid_until__gte=timezone.now(),
            is_active=True
        ).order_by('valid_until')

        count = expiring_soon.count()

        if count == 0:
            logger.info("✅ No coupons expiring soon")
            return "No coupons expiring soon"

        logger.warning(f"⚠️ {count} coupons expiring in the next 3 days:")

        for coupon in expiring_soon:
            days_left = (coupon.valid_until - timezone.now()).days
            logger.warning(
                f"   - {coupon.code}: {days_left} days left "
                f"(expires: {coupon.valid_until.strftime('%Y-%m-%d')})"
            )

        # In production: Send email to admins
        # from apps.orders.utils import send_order_email
        # send_order_email(
        #     to_email='admin@luxemarket.com',
        #     subject=f'⚠️ {count} Coupons Expiring Soon',
        #     template_name='emails/expiring_coupons.html',
        #     context={'coupons': expiring_soon}
        # )

        return f"{count} coupons expiring soon"

    except Exception as exc:
        logger.exception(f"❌ Error checking expiring coupons: {exc}")
        raise


# ============================================================================
# USE CASE 3: COUPON USAGE REPORT
# ============================================================================

def generate_coupon_usage_report():
    """
    Generate weekly coupon usage report.

    Triggered: Scheduled task (runs weekly on Mondays at 9 AM)
    Frequency: Once per week
    Priority: LOW - Analytics

    Returns:
        str: Report summary
    """
    try:
        from django.db.models import Count, Sum
        from apps.orders.models import Order

        # Get date range (last 7 days)
        week_ago = timezone.now() - timedelta(days=7)

        # Find orders with coupons
        orders_with_coupons = Order.objects.filter(
            created_at__gte=week_ago,
            coupon_code__isnull=False
        )

        total_orders_with_coupons = orders_with_coupons.count()
        total_discount_given = orders_with_coupons.aggregate(
            total=Sum('discount_amount')
        )['total'] or 0

        # Top coupons
        top_coupons = orders_with_coupons.values('coupon_code').annotate(
            usage_count=Count('id'),
            total_discount=Sum('discount_amount')
        ).order_by('-usage_count')[:10]

        logger.info(
            f"📊 Coupon Usage Report (Last 7 Days):\n"
            f"   Orders with coupons: {total_orders_with_coupons}\n"
            f"   Total discount given: PKR {total_discount_given:,.2f}"
        )

        for coupon_data in top_coupons:
            logger.info(
                f"   - {coupon_data['coupon_code']}: "
                f"{coupon_data['usage_count']} uses, "
                f"PKR {coupon_data['total_discount']:,.2f} discount"
            )

        return f"{total_orders_with_coupons} orders used coupons"

    except Exception as exc:
        logger.exception(f"❌ Error generating coupon usage report: {exc}")
        raise


# ============================================================================
# USE CASE 4: AUTO-DEACTIVATE USED-UP COUPONS
# ============================================================================

def deactivate_used_up_coupons():
    """
    Deactivate coupons that have reached their usage limit.

    Triggered: Scheduled task (runs every hour)
    Frequency: 24 times per day
    Priority: MEDIUM - Prevents over-usage

    Returns:
        str: Number of deactivated coupons
    """
    try:
        from django.db.models import Count

        # Find active coupons with usage limits
        active_coupons = Coupon.objects.filter(
            is_active=True,
            max_uses__isnull=False
        )

        deactivated_count = 0

        for coupon in active_coupons:
            # Count how many times this coupon has been used
            from apps.orders.models import Order
            usage_count = Order.objects.filter(
                coupon_code=coupon.code,
                payment_status='paid'
            ).count()

            # Check if max uses reached
            if usage_count >= coupon.max_uses:
                coupon.is_active = False
                coupon.save(update_fields=['is_active'])
                deactivated_count += 1

                logger.info(
                    f"✅ Deactivated coupon {coupon.code} "
                    f"(reached max uses: {coupon.max_uses})"
                )

        if deactivated_count > 0:
            logger.info(f"✅ Deactivated {deactivated_count} used-up coupons")
            return f"Deactivated {deactivated_count} coupons"
        else:
            logger.info("✅ No coupons reached usage limit")
            return "No coupons to deactivate"

    except Exception as exc:
        logger.exception(f"❌ Error deactivating used-up coupons: {exc}")
        raise
