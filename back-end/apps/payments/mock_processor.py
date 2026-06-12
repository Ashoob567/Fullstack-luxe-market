"""
apps/payments/mock_processor.py

Fake payment processor for development & testing.
Replaces Stripe entirely — no external API calls, no real charges.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TEST CARD RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Card Number              Result
─────────────────────────────────────────────────
4242 4242 4242 4242      Always succeeds
XXXX XXXX XXXX 0000      Always fails (declined)
Any other number         Succeeds 90% of the time
                         (controlled by MOCK_PAYMENT_FAIL_RATE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""

import uuid
import random
import time
import logging

from django.conf import settings

logger = logging.getLogger(__name__)


# ── Public API ────────────────────────────────────────────────────────────────

def create_mock_payment_intent(amount_pkr: int | float, metadata: dict) -> dict:
    """
    Simulate creating a payment intent.

    Args:
        amount_pkr:  Order total in Pakistani Rupees (will be converted to paisas).
        metadata:    Arbitrary dict stored on the intent (e.g. user_id, cart_key).

    Returns:
        dict with keys: id, client_secret, amount_paisas, currency,
                        status, metadata
    """
    intent_id     = f"mock_pi_{uuid.uuid4().hex}"
    client_secret = f"{intent_id}_secret_{uuid.uuid4().hex[:10]}"
    amount_paisas = int(amount_pkr * 100)

    logger.debug(
        "[MockPayment] Created intent %s | PKR %s (%s paisas) | metadata=%s",
        intent_id, amount_pkr, amount_paisas, metadata,
    )

    return {
        "id":            intent_id,
        "client_secret": client_secret,
        "amount_paisas": amount_paisas,
        "currency":      "pkr",
        "status":        "requires_confirmation",
        "metadata":      metadata,
    }


def confirm_mock_payment(intent_id: str, card_number: str = "") -> dict:
    """
    Simulate confirming / charging a payment intent.

    Rules (evaluated in order):
      1. Card ending in '0000'   → always declined.
      2. Card '4242424242424242' → always succeeds.
      3. Everything else         → succeeds unless random roll < MOCK_PAYMENT_FAIL_RATE.

    Args:
        intent_id:   The fake intent ID returned by create_mock_payment_intent().
        card_number: Raw card number string (spaces stripped internally).
                     Only the last 4 digits matter for routing; never store the full number.

    Returns:
        dict with keys: status ('succeeded' | 'failed'), intent_id, error (on failure)
    """
    # Strip spaces/dashes so "4242 4242 4242 4242" == "4242424242424242"
    clean = card_number.replace(" ", "").replace("-", "")

    # Simulate realistic network latency
    time.sleep(0.4)

    # ── Rule 1: force-fail card ───────────────────────────────────────────────
    if clean.endswith("0000"):
        logger.info("[MockPayment] Intent %s DECLINED (force-fail card).", intent_id)
        return {
            "status":    "failed",
            "intent_id": intent_id,
            "error":     "Your card was declined. Use a different card or choose Cash on Delivery.",
        }

    # ── Rule 2: force-success card ────────────────────────────────────────────
    if clean == "4242424242424242":
        logger.info("[MockPayment] Intent %s SUCCEEDED (force-success card).", intent_id)
        return {"status": "succeeded", "intent_id": intent_id}

    # ── Rule 3: random outcome based on MOCK_PAYMENT_FAIL_RATE ────────────────
    fail_rate = float(getattr(settings, "MOCK_PAYMENT_FAIL_RATE", 0.1))
    if random.random() < fail_rate:
        logger.info(
            "[MockPayment] Intent %s FAILED (random | fail_rate=%.0f%%).",
            intent_id, fail_rate * 100,
        )
        return {
            "status":    "failed",
            "intent_id": intent_id,
            "error":     "Payment could not be processed. Please try again.",
        }

    logger.info("[MockPayment] Intent %s SUCCEEDED.", intent_id)
    return {"status": "succeeded", "intent_id": intent_id}


def refund_mock_payment(intent_id: str) -> dict:
    """
    Simulate a refund for a previously confirmed payment intent.
    Always succeeds instantly in dev/test.

    Args:
        intent_id: The mock_payment_intent_id stored on the Order.

    Returns:
        dict with keys: status ('refunded'), intent_id, refund_id
    """
    refund_id = f"mock_re_{uuid.uuid4().hex}"
    logger.info(
        "[MockPayment] Refund %s issued for intent %s.", refund_id, intent_id
    )
    return {
        "status":    "refunded",
        "intent_id": intent_id,
        "refund_id": refund_id,
    }


def get_mock_intent_status(intent_id: str) -> dict:
    """
    Simulate fetching a payment intent's current status.
    Since we have no real state store, we derive status from the DB Order.

    Callers should look up the Order by mock_payment_intent_id instead;
    this helper exists purely for API-parity with real payment gateways.
    """
    return {
        "intent_id": intent_id,
        "note": (
            "Mock processor has no independent state. "
            "Query the Order model by mock_payment_intent_id for the real status."
        ),
    }