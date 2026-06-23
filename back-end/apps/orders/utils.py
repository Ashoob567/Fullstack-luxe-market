"""
apps/orders/utils.py

Email utility functions for order notifications.
"""
import logging
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings

logger = logging.getLogger(__name__)


def send_order_email(to_email, subject, template_name, context):
    """
    Generic email sending utility.

    Args:
        to_email (str): Recipient email address
        subject (str): Email subject
        template_name (str): Path to HTML template (e.g., 'emails/order_confirmation.html')
        context (dict): Template context variables

    Returns:
        bool: True if sent successfully, False otherwise
    """
    try:
        # Render HTML content
        html_content = render_to_string(template_name, context)

        # Plain text fallback
        text_content = f"{subject}\n\nPlease view this email in an HTML-compatible client."

        # Create email
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[to_email]
        )
        email.attach_alternative(html_content, "text/html")

        # Send
        email.send(fail_silently=False)

        logger.info(f"Email sent successfully to {to_email}: {subject}")
        return True

    except Exception as exc:
        logger.error(f"Failed to send email to {to_email}: {exc}")
        return False
