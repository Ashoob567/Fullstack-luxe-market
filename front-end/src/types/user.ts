// front-end/src/types/user.ts

// Matches backend UserProfileSerializer exactly
export interface User {
  id: string;           // UUID string from backend
  email: string;
  first_name: string;   // snake_case — matches API
  last_name: string;
  phone: string | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

// Matches backend UserAddress model (apps/users/address_models.py)
// Fields use snake_case to match the DRF serializer output exactly.
export interface Address {
  id?: string;              // UUID string
  label: string;            // e.g. "Home", "Office"
  first_name: string;
  last_name: string;
  phone: string;
  street_address: string;   // was addressLine1 — now matches backend field
  city: string;
  province: 'Punjab' | 'Sindh' | 'KPK' | 'Balochistan' | 'Islamabad';
  postal_code: string;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

// Form data shape for creating/editing an address (used in forms)
export interface AddressFormData {
  label: string;
  first_name: string;
  last_name: string;
  phone: string;
  street_address: string;
  city: string;
  province: 'Punjab' | 'Sindh' | 'KPK' | 'Balochistan' | 'Islamabad';
  postal_code: string;
  is_default: boolean;
}
