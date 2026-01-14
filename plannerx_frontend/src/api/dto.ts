// api/dto.ts

export type CompanyOutDTO = {
  company_id: number;
  company_code: string | null;
  company_name: string;

  address1: string | null;
  address2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;

  domain: string | null;
  industry: string | null;

  is_active: boolean;
};

export type CompanyCreateDTO = {
  company_code?: string | null;   // optional for now
  company_name: string;

  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;

  domain?: string | null;
  industry?: string | null;
};

export type CompanyUpdateDTO = {
  company_name?: string | null;
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  domain?: string | null;
  industry?: string | null;
};


export type LoginResponseDTO = {
  access_token: string;
  token_type: "bearer";
  user: {
    id: number;
    email: string;
    displayName: string;
    role: "SYSADMIN" | "COMPANY_ADMIN" | "CEO" | "CFO" | "KAM";
    companyId: number | null;
    forcePasswordChange: boolean;
    permissions: Record<string, unknown>;
    isActive?: boolean;
  };
};

export type UserOutDTO = {
  id: number;
  email: string;
  display_name: string;
  role: "SYSADMIN" | "COMPANY_ADMIN" | "CEO" | "CFO" | "KAM";
  company_id: number | null;
  force_password_change: boolean;
  is_active: boolean;
  permissions: Record<string, unknown>;
};

export type UserCreateForCompanyDTO = {
  username: string;
  display_name: string;
  role: "COMPANY_ADMIN" | "CEO" | "CFO" | "KAM";
  temp_password: string;
  force_password_change?: boolean;
  permissions?: Record<string, unknown>;
};