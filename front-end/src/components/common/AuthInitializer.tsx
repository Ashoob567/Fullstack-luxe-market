// front-end/src/components/common/AuthInitializer.tsx
'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

export function AuthInitializer() {
  const initializeFromStorage = useAuthStore(
    (state) => state.initializeFromStorage
  );

  useEffect(() => {
    initializeFromStorage();
  }, [initializeFromStorage]);

  return null;
}