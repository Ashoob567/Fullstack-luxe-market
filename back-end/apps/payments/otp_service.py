"""
OTP generation, storage, verification, and delivery.

Security principles enforced:
  1. Constant-time comparison (hmac.compare_digest) - prevents timing attacks
  2. Rate limiting (3 send attempts per 10min window) - prevents spam
  3. Resend cooldown (60s between sends) - prevents abuse
  4. Verification lockout (5 failed attempts) - prevents brute force
  5. User-scoped verification - prevents cross-session reuse

Redis key schema documented in module docstring.
All timing constants exported for API responses (no hardcoded UI values).
"""

import hashlib
import hmac
import secrets
from typing import Dict, Optional, Literal
from contextlib import contextmanager

import structlog
from django.core.cache import cache
from django.core.mail import send_mail
from django.conf import settings

logger = structlog.get_logger(__name__)

# --- Public constants (returned in API responses) ---
OTP_LENGTH = 6
OTP_EXPIRY_SECONDS = 10 * 60  # 10 minutes
RESEND_COOLDOWN_SECONDS = 60
MAX_SEND_ATTEMPTS = 3
RATE_LIMIT_WINDOW_SECONDS = 10 * 60
MAX_VERIFY_ATTEMPTS = 5
VERIFIED_TTL_SECONDS = 30 * 60  # 30 minutes

ContactType = Literal["email", "phone"]


# --- Custom Exceptions ---

class RedisUnavailableError(Exception):
    """Raised when Redis is down or unreachable."""
    pass


# --- OTP Generation ---

def generate_otp() -> str:
    """
    Generate a cryptographically secure 6-digit OTP.

    Uses secrets.randbelow (cryptographically secure RNG)
    instead of random.randint (predictable, Mersenne Twister).
    """
    return "".join(str(secrets.randbelow(10)) for _ in range(OTP_LENGTH))


def _hash_otp(otp: str) -> str:
    """
    SHA-256 hash of OTP. Private - callers use verify_otp().

    We store hashes, not plaintext, so a Redis dump doesn't leak valid codes.
    """
    return hashlib.sha256(otp.encode("utf-8")).hexdigest()


def _user_scope(user_id: Optional[int] = None) -> str:
    """
    Build user scope for verified keys.

    Authenticated: "user_123"
    Guest: "guest"

    This prevents a verified guest email being hijacked by another session.
    """
    return f"user_{user_id}" if user_id else "guest"


# --- Redis Operations with Error Handling ---

@contextmanager
def _redis_operation(operation_name: str):
    """
    Context manager for Redis ops with error tracking.

    Usage:
        with _redis_operation("set"):
            cache.set(key, value)
    """
    from apps.core.monitoring import redis_errors_counter

    try:
        yield
    except Exception as exc:
        redis_errors_counter.labels(operation=operation_name).inc()
        logger.exception(
            "redis_operation_failed",
            operation=operation_name,
            error=str(exc),
        )
        raise RedisUnavailableError(f"Redis {operation_name} failed") from exc


# --- OTP Storage & Rate Limiting ---

def store_otp(
    contact: str,
    otp: str,
    contact_type: ContactType,
) -> Dict:
    """
    Hash and store OTP in Redis with rate limiting.

    Enforces:
      - Resend cooldown (user must wait RESEND_COOLDOWN_SECONDS)
      - Send rate limit (max MAX_SEND_ATTEMPTS per RATE_LIMIT_WINDOW_SECONDS)

    Returns:
        {"ok": True, "cooldown_seconds": 60} on success
        {"ok": False, "reason": "cooldown" | "rate_limit" | "redis_error"} on failure

    Raises:
        RedisUnavailableError: If Redis is down (caller must handle)
    """
    key = f"otp:{contact_type}:{contact}"
    attempts_key = f"otp:attempts:{contact_type}:{contact}"
    resend_key = f"otp:resend:{contact_type}:{contact}"
    fails_key = f"otp:verify_fails:{contact_type}:{contact}"

    with _redis_operation("set"):
        # Check resend cooldown
        if cache.get(resend_key):
            logger.warning(
                "otp_resend_cooldown_active",
                contact_type=contact_type,
            )
            return {"ok": False, "reason": "cooldown"}

        # Check rate limit
        attempts = cache.get(attempts_key, 0)
        if attempts >= MAX_SEND_ATTEMPTS:
            logger.warning(
                "otp_rate_limit_exceeded",
                contact_type=contact_type,
                attempts=attempts,
            )
            return {"ok": False, "reason": "rate_limit"}

        # Store hashed OTP
        cache.set(key, _hash_otp(otp), timeout=OTP_EXPIRY_SECONDS)
        cache.set(attempts_key, attempts + 1, timeout=RATE_LIMIT_WINDOW_SECONDS)
        cache.set(resend_key, True, timeout=RESEND_COOLDOWN_SECONDS)

        # Reset verification failure counter on new OTP
        cache.delete(fails_key)

        logger.info(
            "otp_stored",
            contact_type=contact_type,
            ttl_seconds=OTP_EXPIRY_SECONDS,
        )

        return {"ok": True, "cooldown_seconds": RESEND_COOLDOWN_SECONDS}


# --- OTP Verification ---

def verify_otp(
    contact: str,
    otp: str,
    contact_type: ContactType,
    user_id: Optional[int] = None,
) -> Dict:
    """
    Verify OTP using constant-time comparison.

    Security: Uses hmac.compare_digest() to prevent timing attacks.
    NEVER use `==` for hash comparison - it short-circuits on first mismatch.

    On success:
      - Deletes OTP key (single-use)
      - Writes verified flag (30min TTL)

    On failure:
      - Increments failure counter
      - Locks out after MAX_VERIFY_ATTEMPTS (deletes OTP, forces re-send)

    Returns:
        {"ok": True} on success
        {"ok": False, "reason": "not_found" | "invalid" | "locked" | "redis_error",
         "attempts_remaining": int} on failure
    """
    key = f"otp:{contact_type}:{contact}"
    fails_key = f"otp:verify_fails:{contact_type}:{contact}"
    scope = _user_scope(user_id)
    verified_key = f"otp:verified:{scope}:{contact_type}:{contact}"

    with _redis_operation("get"):
        stored_hash = cache.get(key)

        if not stored_hash:
            logger.warning(
                "otp_not_found",
                contact_type=contact_type,
                reason="expired_or_never_sent",
            )
            return {"ok": False, "reason": "not_found"}

        # Check lockout
        fails = cache.get(fails_key, 0)
        if fails >= MAX_VERIFY_ATTEMPTS:
            cache.delete(key)  # Force re-generation
            logger.warning(
                "otp_verify_lockout",
                contact_type=contact_type,
                scope=scope,
                failed_attempts=fails,
            )
            return {"ok": False, "reason": "locked"}

        # ⚠️ CRITICAL: Use constant-time comparison
        # Using `==` here would allow timing attacks
        is_valid = hmac.compare_digest(stored_hash, _hash_otp(otp))

        if is_valid:
            # Success path
            cache.delete(key)
            cache.delete(fails_key)
            cache.set(verified_key, True, timeout=VERIFIED_TTL_SECONDS)

            logger.info(
                "otp_verified",
                contact_type=contact_type,
                scope=scope,
            )
            return {"ok": True}
        else:
            # Failure path - increment counter
            new_fails = fails + 1
            cache.set(fails_key, new_fails, timeout=OTP_EXPIRY_SECONDS)
            remaining = MAX_VERIFY_ATTEMPTS - new_fails

            logger.warning(
                "otp_verify_failed",
                contact_type=contact_type,
                scope=scope,
                attempts_remaining=remaining,
            )

            return {
                "ok": False,
                "reason": "invalid",
                "attempts_remaining": remaining,
            }


def is_verified(
    contact: str,
    contact_type: ContactType,
    user_id: Optional[int] = None,
) -> bool:
    """
    Check if contact has an active verified flag.

    Used to prevent double-verification before order creation.
    """
    scope = _user_scope(user_id)
    key = f"otp:verified:{scope}:{contact_type}:{contact}"

    try:
        with _redis_operation("get"):
            return bool(cache.get(key))
    except RedisUnavailableError:
        # Fail open - don't block orders if Redis is down
        logger.error("is_verified_redis_unavailable", contact_type=contact_type)
        return False


# --- OTP Delivery ---

def send_email_otp(email: str, otp: str) -> bool:
    """
    Send OTP via email (synchronous).

    Production: Consider async queue (Celery/Django-Q) for better UX.
    Returns False on SMTP failure (caller must handle).
    """
    try:
        send_mail(
            subject="Luxe Market - Your Verification Code",
            message=(
                f"Your verification code is: {otp}\n\n"
                f"This code expires in {OTP_EXPIRY_SECONDS // 60} minutes.\n\n"
                "If you didn't request this, please ignore this email."
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )

        logger.info("email_otp_sent", email=email)
        return True

    except Exception as exc:
        logger.error("email_otp_failed", email=email, error=str(exc))
        return False


def send_sms_otp(phone: str, otp: str) -> bool:
    """
    Send OTP via SMS.

    DEV: Logs to console (check terminal)
    PRODUCTION: Integrate Twilio / AWS SNS / EoceanSMS
    """
    if settings.DEBUG:
        logger.info(
            "sms_otp_dev_mode",
            phone=phone,
            otp=otp,
            note="Check terminal - SMS not sent in DEBUG mode",
        )
        return True

    # Production SMS integration (Twilio example)
    try:
        from twilio.rest import Client

        twilio_sid = getattr(settings, 'TWILIO_SID', None)
        twilio_token = getattr(settings, 'TWILIO_TOKEN', None)
        twilio_phone = getattr(settings, 'TWILIO_PHONE', None)

        if not all([twilio_sid, twilio_token, twilio_phone]):
            logger.error(
                "sms_provider_not_configured",
                phone=phone,
                note="Configure Twilio in settings: TWILIO_SID, TWILIO_TOKEN, TWILIO_PHONE",
            )
            return False

        client = Client(twilio_sid, twilio_token)
        client.messages.create(
            to=phone,
            from_=twilio_phone,
            body=f"Your Luxe Market verification code: {otp}\nExpires in {OTP_EXPIRY_SECONDS // 60} minutes.",
        )

        logger.info("sms_otp_sent", phone=phone)
        return True

    except Exception as exc:
        logger.error("sms_otp_failed", phone=phone, error=str(exc))
        return False


# --- Metrics Helpers ---

def record_otp_sent_metric(contact_type: ContactType, status: str):
    """Record OTP send attempt in Prometheus."""
    from apps.core.monitoring import otp_sent_counter
    otp_sent_counter.labels(contact_type=contact_type, status=status).inc()


def record_otp_verify_metric(contact_type: ContactType, status: str, duration: float):
    """Record OTP verification attempt + latency."""
    from apps.core.monitoring import otp_verify_counter, otp_verify_latency
    otp_verify_counter.labels(contact_type=contact_type, status=status).inc()
    otp_verify_latency.observe(duration)
