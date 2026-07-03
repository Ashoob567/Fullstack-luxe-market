"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  Mail,
  Phone,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  AlertCircle,
  Clock,
} from "lucide-react";
import { sendOTP, verifyAndCreateOrder } from "@/lib/otp-api";
import {
  loadPendingOrder,
  clearPendingOrder,
  clearCart,
  isAuthenticated,
  type PendingOrder,
  saveCooldownExpiry,
  loadCooldownRemaining,
  clearCooldown,
} from "@/lib/storage";

type VerificationMethod = "email" | "phone" | null;

interface OrderSummary {
  order_id: string;
  order_number: string;
  total: string;
  payment_method: string;
  order_status: string;
}

export default function VerificationPage() {
  const router = useRouter();

  // State
  const [orderData, setOrderData] = useState<PendingOrder | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<VerificationMethod>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [cardNumber, setCardNumber] = useState("");  // Re-entered here, never stored
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpExpirySeconds, setOtpExpirySeconds] = useState(600);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [otpError, setOtpError] = useState<string>("");
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [orderSummary, setOrderSummary] = useState<OrderSummary | null>(null);

  // Load pending order on mount
  useEffect(() => {
    try {
      const data = loadPendingOrder();
      if (!data) {
        toast.error("No order data found. Returning to checkout.");
        router.replace("/checkout");
        return;
      }
      setOrderData(data);

      // Restore cooldown from storage (survives page refresh)
      const remaining = loadCooldownRemaining();
      if (remaining > 0) {
        setResendCooldown(remaining);
      }
    } catch (err) {
      console.error("Failed to load pending order:", err);
      setLoadError(true);
    }
  }, [router]);

  // Cooldown countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Send OTP handler
  const handleSendOTP = useCallback(async () => {
    if (!selectedMethod || !orderData) return;

    const contact =
      selectedMethod === "email"
        ? orderData.shipping_address.email!
        : orderData.shipping_address.phone;

    setIsSending(true);
    try {
      const res = await sendOTP({ contact, contact_type: selectedMethod });

      setOtpSent(true);
      // Drive UI from server-returned values (never hardcode durations)
      setOtpExpirySeconds(res.otp_expires_in_seconds);
      setResendCooldown(res.resend_available_in_seconds);
      saveCooldownExpiry(res.resend_available_in_seconds);
      setAttemptsRemaining(null);

      toast.success(`Verification code sent to your ${selectedMethod}`);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to send code. Please try again.";
      toast.error(msg);
    } finally {
      setIsSending(false);
    }
  }, [selectedMethod, orderData]);

  // Verify OTP and create order handler
  const handleVerifyAndOrder = useCallback(async () => {
    if (!selectedMethod || otpCode.length !== 6 || !orderData) return;

    // Clear previous errors
    setOtpError("");

    // Card validation for card payments
    if (orderData.payment_method === "mock_card") {
      const cleanCard = cardNumber.replace(/\s|-/g, "");
      if (cleanCard.length < 12) {
        setOtpError("Please re-enter your card number to confirm payment.");
        return;
      }
    }

    const contact =
      selectedMethod === "email"
        ? orderData.shipping_address.email!
        : orderData.shipping_address.phone;

    setIsVerifying(true);
    try {
      const res = await verifyAndCreateOrder({
        contact,
        contact_type: selectedMethod,
        otp: otpCode,
        idempotency_key: orderData.idempotency_key,
        order_data: {
          ...orderData,
          card_number:
            orderData.payment_method === "mock_card"
              ? cardNumber.replace(/\s|-/g, "")
              : undefined,
        },
      });

      if (res.status === "success") {
        // Success - show confirmation card
        clearPendingOrder();
        clearCooldown();
        if (!isAuthenticated()) clearCart();

        setOrderConfirmed(true);
        setOrderSummary({
          order_id: res.order_id!,
          order_number: res.order_number!,
          total: res.order_summary?.total as string || "0",
          payment_method: res.order_summary?.payment_method as string || orderData.payment_method,
          order_status: res.order_summary?.order_status as string || "confirmed",
        });
        return;
      }

      if (res.status === "failed") {
        setOtpError(res.error || "Payment declined. Please try again.");
        return;
      }

      if (res.verified === false) {
        if (res.reason === "locked") {
          // Lockout - force new OTP
          setOtpError("Too many incorrect attempts. Please request a new code.");
          setOtpSent(false);
          setOtpCode("");
          clearCooldown();
        } else {
          // Invalid code - show inline error
          setAttemptsRemaining(res.attempts_remaining ?? null);
          setOtpError(
            res.attempts_remaining != null
              ? `Incorrect code. ${res.attempts_remaining} attempt(s) remaining.`
              : "Invalid or expired code."
          );
        }
        return;
      }

      setOtpError("Something went wrong. Please try again.");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Verification failed. Please try again.";
      setOtpError(msg);
    } finally {
      setIsVerifying(false);
    }
  }, [selectedMethod, otpCode, cardNumber, orderData]);

  // Error boundary fallback
  if (loadError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-muted-foreground">Something went wrong loading your order.</p>
        <Button onClick={() => router.replace("/checkout")}>Return to Checkout</Button>
      </div>
    );
  }

  // Loading state
  if (!orderData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const auth = isAuthenticated();
  const email = orderData.shipping_address.email;
  const phone = orderData.shipping_address.phone;
  const expiryMinutes = Math.ceil(otpExpirySeconds / 60);

  // If order confirmed, show success card
  if (orderConfirmed && orderSummary) {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Order Confirmed!</CardTitle>
                  <CardDescription>Your order has been successfully placed</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-secondary/50 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Order Number</p>
                  <p className="font-mono font-semibold text-lg">{orderSummary.order_number}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Amount</p>
                  <p className="font-semibold text-lg">PKR {parseFloat(orderSummary.total).toLocaleString('en-PK')}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Payment Method</p>
                  <p className="font-medium capitalize">{orderSummary.payment_method === 'cod' ? 'Cash on Delivery' : 'Card Payment'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="font-medium capitalize text-green-600 dark:text-green-400">{orderSummary.order_status}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  size="lg"
                  className="flex-1"
                  onClick={() => router.push("/")}
                >
                  Continue Shopping
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push(`/account/orders/${orderSummary.order_id}`)}
                >
                  Track Order
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Delivery address summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Delivery Address</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p className="font-medium">
                {orderData.shipping_address.firstName} {orderData.shipping_address.lastName}
              </p>
              <p>{orderData.shipping_address.streetAddress}</p>
              <p>
                {orderData.shipping_address.city}, {orderData.shipping_address.province}{" "}
                {orderData.shipping_address.postalCode}
              </p>
              <p className="text-muted-foreground">Phone: {phone}</p>
              {email && <p className="text-muted-foreground">Email: {email}</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back button */}
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Checkout
        </Button>

        {/* Address summary */}
        <Card>
          <CardHeader>
            <CardTitle>Delivery Address</CardTitle>
            <CardDescription>Your order will be delivered to:</CardDescription>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <p className="font-medium">
              {orderData.shipping_address.firstName} {orderData.shipping_address.lastName}
            </p>
            <p>{orderData.shipping_address.streetAddress}</p>
            <p>
              {orderData.shipping_address.city}, {orderData.shipping_address.province}{" "}
              {orderData.shipping_address.postalCode}
            </p>
            <p className="text-muted-foreground">Phone: {phone}</p>
            {email && <p className="text-muted-foreground">Email: {email}</p>}
          </CardContent>
        </Card>

        {/* Card re-entry (for mock_card only) */}
        {orderData.payment_method === "mock_card" && (
          <Card>
            <CardHeader>
              <CardTitle>Confirm Card Number</CardTitle>
              <CardDescription>
                Re-enter your card number to authorize payment (we don&apos;t store it).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Label htmlFor="card-number">Card number</Label>
              <Input
                id="card-number"
                type="text"
                inputMode="numeric"
                maxLength={19}
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 16);
                  setCardNumber(v.replace(/(.{4})/g, "$1 ").trim());
                }}
              />
            </CardContent>
          </Card>
        )}

        {/* Verification section */}
        <Card>
          <CardHeader>
            <CardTitle>Verify Your Identity</CardTitle>
            <CardDescription>
              Choose how you&apos;d like to receive your verification code.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Method selection */}
            {!selectedMethod && (
              <div className="grid gap-4">
                {!auth && email && (
                  <Button
                    variant="outline"
                    className="h-auto p-6 justify-start text-left"
                    onClick={() => setSelectedMethod("email")}
                  >
                    <Mail className="h-6 w-6 mr-4 text-primary shrink-0" />
                    <div>
                      <p className="font-semibold">Verify via Email</p>
                      <p className="text-sm text-muted-foreground">{email}</p>
                    </div>
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="h-auto p-6 justify-start text-left"
                  onClick={() => setSelectedMethod("phone")}
                >
                  <Phone className="h-6 w-6 mr-4 text-primary shrink-0" />
                  <div>
                    <p className="font-semibold">Verify via Phone</p>
                    <p className="text-sm text-muted-foreground">{phone}</p>
                  </div>
                </Button>
              </div>
            )}

            {/* Selected method */}
            {selectedMethod && (
              <div className="space-y-4">
                {/* Selected method display */}
                <div className="flex items-center gap-3 p-4 bg-secondary rounded-lg">
                  {selectedMethod === "email" ? (
                    <Mail className="h-5 w-5 text-primary" />
                  ) : (
                    <Phone className="h-5 w-5 text-primary" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      Verifying via {selectedMethod === "email" ? "Email" : "Phone"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedMethod === "email" ? email : phone}
                    </p>
                  </div>
                  {!otpSent && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedMethod(null)}
                    >
                      Change
                    </Button>
                  )}
                </div>

                {/* Send OTP button */}
                {!otpSent && (
                  <Button
                    onClick={handleSendOTP}
                    disabled={isSending || resendCooldown > 0}
                    className="w-full"
                    size="lg"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : resendCooldown > 0 ? (
                      <>
                        <Clock className="h-4 w-4 mr-2" />
                        Wait {resendCooldown}s
                      </>
                    ) : (
                      "Send Verification Code"
                    )}
                  </Button>
                )}

                {/* OTP input & verification */}
                {otpSent && (
                  <div className="space-y-4">
                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription>
                        Code sent! It expires in {expiryMinutes} minute{expiryMinutes !== 1 && "s"}.
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                      <Label htmlFor="otp">Enter 6-digit code</Label>
                      <Input
                        id="otp"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="123456"
                        value={otpCode}
                        onChange={(e) => {
                          setOtpCode(e.target.value.replace(/\D/g, ""));
                          setOtpError(""); // Clear error when typing
                        }}
                        className="text-center text-2xl tracking-widest font-mono"
                      />
                      {otpError && (
                        <Alert variant="destructive" className="mt-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{otpError}</AlertDescription>
                        </Alert>
                      )}
                    </div>

                    <Button
                      onClick={handleVerifyAndOrder}
                      disabled={isVerifying || otpCode.length !== 6}
                      className="w-full"
                      size="lg"
                    >
                      {isVerifying ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Verifying & Placing Order...
                        </>
                      ) : (
                        "Verify & Place Order"
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      onClick={handleSendOTP}
                      disabled={isSending || resendCooldown > 0}
                      className="w-full"
                    >
                      {resendCooldown > 0
                        ? `Resend code in ${resendCooldown}s`
                        : "Resend code"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Help text */}
        <p className="text-xs text-center text-muted-foreground">
          Having trouble? Contact support at support@luxemarket.com
        </p>
      </div>
    </div>
  );
}
