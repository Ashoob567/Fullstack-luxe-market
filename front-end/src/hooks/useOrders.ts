// ============================================================
// hooks/useOrders.ts
// ============================================================

import { useState, useEffect } from "react";
import {
  getOrders, getOrderDetail,
  placeOrder, cancelOrder, trackGuestOrder,
  PlaceOrderPayload,
} from "@/services/orderService";
import { parseApiError } from "@/lib/utils";
import { Order, OrderSummary, GuestOrderTrack, PaginatedResponse } from "@/types";

// ----------------------------------------------------------
// useOrders — order history list
// ----------------------------------------------------------

export const useOrders = () => {
  const [data, setData]           = useState<PaginatedResponse<OrderSummary> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        setIsLoading(true);
        const result = await getOrders();
        setData(result);
      } catch (err) {
        setError(parseApiError(err));
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, []);

  return { data, isLoading, error };
};

// ----------------------------------------------------------
// useOrderDetail — single order
// ----------------------------------------------------------

export const useOrderDetail = (id: string) => {
  const [order, setOrder]         = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      try {
        setIsLoading(true);
        const result = await getOrderDetail(id);
        setOrder(result);
      } catch (err) {
        setError(parseApiError(err));
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, [id]);

  return { order, isLoading, error };
};

// ----------------------------------------------------------
// usePlaceOrder — checkout form submit
// ----------------------------------------------------------

export const usePlaceOrder = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [order, setOrder]         = useState<Order | null>(null);

  const handlePlace = async (payload: PlaceOrderPayload) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await placeOrder(payload);
      setOrder(result);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return { handlePlace, isLoading, error, order };
};

// ----------------------------------------------------------
// useCancelOrder
// ----------------------------------------------------------

export const useCancelOrder = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const handleCancel = async (id: string, onSuccess?: () => void) => {
    try {
      setIsLoading(true);
      setError(null);
      await cancelOrder(id);
      onSuccess?.();
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return { handleCancel, isLoading, error };
};

// ----------------------------------------------------------
// useTrackOrder — guest tracking
// ----------------------------------------------------------

export const useTrackOrder = () => {
  const [tracking, setTracking]   = useState<GuestOrderTrack | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const handleTrack = async (orderNumber: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await trackGuestOrder(orderNumber);
      setTracking(result);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return { tracking, isLoading, error, handleTrack };
};