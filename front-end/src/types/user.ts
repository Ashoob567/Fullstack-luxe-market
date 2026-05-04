export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  is_active:boolean;
  is_Verified: boolean;
  created_at: string;
  updated_at:string;
}

export interface Address {
  id?: number;
  user?: number;
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
}
