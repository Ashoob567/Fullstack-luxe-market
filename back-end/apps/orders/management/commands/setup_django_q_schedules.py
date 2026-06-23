"""
Management command to set up Django Q scheduled tasks.

Usage:
    python manage.py setup_django_q_schedules
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from django_q.models import Schedule


class Command(BaseCommand):
    help = 'Set up Django Q scheduled tasks for Luxe Market'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('Setting up Django Q scheduled tasks...'))

        # Clear existing schedules (optional - comment out in production)
        # Schedule.objects.all().delete()
        # self.stdout.write(self.style.WARNING('Cleared existing schedules'))

        schedules_created = 0

        # ====================================================================
        # PRODUCT TASKS
        # ====================================================================

        # Expire flash sales (every 5 minutes)
        schedule, created = Schedule.objects.get_or_create(
            func='apps.products.tasks.expire_flash_sales',
            name='Expire Flash Sales',
            defaults={
                'schedule_type': Schedule.MINUTES,
                'minutes': 5,
            }
        )
        if created:
            schedules_created += 1
            self.stdout.write(self.style.SUCCESS('✅ Created: Expire Flash Sales (every 5 min)'))

        # ====================================================================
        # CART TASKS
        # ====================================================================

        # Clear expired carts (every 6 hours)
        schedule, created = Schedule.objects.get_or_create(
            func='apps.cart.tasks.clear_expired_carts',
            name='Clear Expired Carts',
            defaults={
                'schedule_type': Schedule.CRON,
                'cron': '0 */6 * * *',  # Every 6 hours
            }
        )
        if created:
            schedules_created += 1
            self.stdout.write(self.style.SUCCESS('✅ Created: Clear Expired Carts (every 6 hours)'))

        # Cart analytics report (weekly on Mondays at 9 AM)
        schedule, created = Schedule.objects.get_or_create(
            func='apps.cart.tasks.generate_cart_analytics_report',
            name='Cart Analytics Report',
            defaults={
                'schedule_type': Schedule.CRON,
                'cron': '0 9 * * 1',  # Monday at 9 AM
            }
        )
        if created:
            schedules_created += 1
            self.stdout.write(self.style.SUCCESS('✅ Created: Cart Analytics Report (Mon 9 AM)'))

        # ====================================================================
        # COUPON TASKS
        # ====================================================================

        # Expire old coupons (daily at 2 AM)
        schedule, created = Schedule.objects.get_or_create(
            func='apps.coupons.tasks.expire_old_coupons',
            name='Expire Old Coupons',
            defaults={
                'schedule_type': Schedule.CRON,
                'cron': '0 2 * * *',  # Daily at 2 AM
            }
        )
        if created:
            schedules_created += 1
            self.stdout.write(self.style.SUCCESS('✅ Created: Expire Old Coupons (daily 2 AM)'))

        # Send expiring coupon alerts (daily at 9 AM)
        schedule, created = Schedule.objects.get_or_create(
            func='apps.coupons.tasks.send_expiring_coupon_alerts',
            name='Expiring Coupon Alerts',
            defaults={
                'schedule_type': Schedule.CRON,
                'cron': '0 9 * * *',  # Daily at 9 AM
            }
        )
        if created:
            schedules_created += 1
            self.stdout.write(self.style.SUCCESS('✅ Created: Expiring Coupon Alerts (daily 9 AM)'))

        # Coupon usage report (weekly on Mondays at 9 AM)
        schedule, created = Schedule.objects.get_or_create(
            func='apps.coupons.tasks.generate_coupon_usage_report',
            name='Coupon Usage Report',
            defaults={
                'schedule_type': Schedule.CRON,
                'cron': '0 9 * * 1',  # Monday at 9 AM
            }
        )
        if created:
            schedules_created += 1
            self.stdout.write(self.style.SUCCESS('✅ Created: Coupon Usage Report (Mon 9 AM)'))

        # Deactivate used-up coupons (every hour)
        schedule, created = Schedule.objects.get_or_create(
            func='apps.coupons.tasks.deactivate_used_up_coupons',
            name='Deactivate Used-Up Coupons',
            defaults={
                'schedule_type': Schedule.HOURLY,
            }
        )
        if created:
            schedules_created += 1
            self.stdout.write(self.style.SUCCESS('✅ Created: Deactivate Used-Up Coupons (hourly)'))

        # ====================================================================
        # ORDER TASKS
        # ====================================================================

        # Daily sales report (daily at 9 AM)
        schedule, created = Schedule.objects.get_or_create(
            func='apps.orders.tasks.generate_daily_sales_report',
            name='Daily Sales Report',
            defaults={
                'schedule_type': Schedule.CRON,
                'cron': '0 9 * * *',  # Daily at 9 AM
            }
        )
        if created:
            schedules_created += 1
            self.stdout.write(self.style.SUCCESS('✅ Created: Daily Sales Report (daily 9 AM)'))

        # ====================================================================
        # SUMMARY
        # ====================================================================

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(f'✅ Created {schedules_created} new scheduled tasks'))
        self.stdout.write(self.style.SUCCESS(f'📊 Total scheduled tasks: {Schedule.objects.count()}'))
        self.stdout.write('')
        self.stdout.write(self.style.WARNING('To view scheduled tasks, visit:'))
        self.stdout.write(self.style.WARNING('  http://localhost:8000/admin/django_q/schedule/'))
        self.stdout.write('')
        self.stdout.write(self.style.WARNING('To start the Django Q worker:'))
        self.stdout.write(self.style.WARNING('  python manage.py qcluster'))
