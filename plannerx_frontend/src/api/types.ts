export type Role = "SYSADMIN" | "COMPANY_ADMIN" | "CEO" | "CFO" | "KAM";

export type Permissions = Record<string, boolean>;

export type CompanyOut = {
  company_id: number;
  name: string;
  address1: string;
  address2: string | null;
  city: string;
  state: string;
  zip: string;
  domain: string;
  industry: string;
  is_active: boolean;
};

export type CompanyCreate = {
  name: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  domain: string;
  industry: string;
};

export type UserOut = {
  id: number;
  email: string;
  display_name: string;
  role: Role;
  company_id: number | null;
  force_password_change: boolean;
  is_active: boolean;
  permissions: Record<string, unknown>;
};

export type UserCreateForCompany = {
  username: string;
  display_name: string;
  role: Exclude<Role, "SYSADMIN">;
  temp_password: string;
  force_password_change?: boolean;
  permissions?: Record<string, unknown>;
};

export type LoginRequest = { email: string; password: string };

export type LoginResponse = {
  access_token: string;
  token_type: "bearer";
  user: {
    id: number;
    email: string;
    displayName: string;
    role: Role;
    companyId: number | null;
    forcePasswordChange: boolean;
    permissions: Record<string, unknown>;
  };
};