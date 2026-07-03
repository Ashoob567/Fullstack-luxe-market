"""
Mock payment gateway for testing card payments.

Simulates a Stripe/Easypaisa-style flow:
  1. Create payment intent (reserves amount, returns intent ID)
  2. Confirm payment (processes card, returns success/failure)

Test card numbers:
  - 4242424242424242: Success
  - 4000000000000002: Declined (insufficient funds)
  - 4000000000009995: Declined (processing error)
  - Any other: Success (for testing)
"""

import uuid
import time
from typing import Dict


# In-memory storage for payment intents (use Redis in production)
_payment_intents = {}


def create_mock_payment_intent(
    amount_pkr: float,
    metadata: Dict = None,
) -> Dict:
    """
    Create a payment intent (reserve amount, generate intent ID).

    Args:
        amount_pkr: Amount in PKR
        metadata: Optional metadata (customer_id, order_id, etc.)

    Returns:
        {
            "id": "pi_xxx",
            "amount": 5000.00,
            "currency": "PKR",
            "status": "requires_confirmation",
            "metadata": {...}
        }
    """
    intent_id = f"pi_{uuid.uuid4().hex[:24]}"

    intent = {
        "id": intent_id,
        "amount": amount_pkr,
        "currency": "PKR",
        "status": "requires_confirmation",
        "metadata": metadata or {},
        "created_at": time.time(),
    }

    _payment_intents[intent_id] = intent
    return intent


def confirm_mock_payment(
    intent_id: str,
    card_number: str,
) -> Dict:
    """
    Confirm payment (process card).

    Args:
        intent_id: Payment intent ID from create_mock_payment_intent()
        card_number: Card number (test cards below)

    Returns:
        Success:
            {"status": "succeeded", "intent_id": "pi_xxx"}
        Failure:
            {"status": "failed", "error": "Declined: insufficient funds"}

    Test cards:
        - 4242424242424242: Success
        - 4000000000000002: Declined (insufficient funds)
        - 4000000000009995: Declined (processing error)
        - Any other: Success
    """
    intent = _payment_intents.get(intent_id)

    if not intent:
        return {
            "status": "failed",
            "error": "Invalid payment intent ID",
        }

    if intent["status"] != "requires_confirmation":
        return {
            "status": "failed",
            "error": f"Payment already {intent['status']}",
        }

    # Normalize card number (remove spaces/dashes)
    card = card_number.replace(" ", "").replace("-", "")

    # Test card logic
    if card == "4000000000000002":
        intent["status"] = "failed"
        intent["error"] = "Declined: insufficient funds"
        return {
            "status": "failed",
            "error": "Declined: insufficient funds",
            "intent_id": intent_id,
        }

    if card == "4000000000009995":
        intent["status"] = "failed"
        intent["error"] = "Declined: processing error"
        return {
            "status": "failed",
            "error": "Declined: processing error",
            "intent_id": intent_id,
        }

    # Success path (4242... or any other card)
    intent["status"] = "succeeded"
    intent["card_last_4"] = card[-4:]
    intent["confirmed_at"] = time.time()

    return {
        "status": "succeeded",
        "intent_id": intent_id,
        "card_last_4": card[-4:],
    }


def get_payment_intent(intent_id: str) -> Dict:
    """Retrieve payment intent by ID (for testing/debugging)."""
    return _payment_intents.get(intent_id)
