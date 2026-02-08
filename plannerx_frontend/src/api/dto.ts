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

  calendar_sheet_id: number | null;   // ✅ ADD
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

  calendar_sheet_id?: number | null;  // ✅ ADD
  is_active?: boolean | null;         // ✅ ADD if not already present in backend
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

export type SheetOutDTO = {
  sheet_id: number;
  company_id: number;
  sheet_key: string;
  sheet_name: string;
  description: string | null;
  model_json: Record<string, unknown>;
  is_active: boolean;
};

export type SheetCreateDTO = {
  sheet_key: string;
  sheet_name: string;
  description?: string | null;
  model_json?: Record<string, unknown> | null;
};

export type SheetUpdateDTO = {
  sheet_name?: string | null;
  description?: string | null;
  model_json?: Record<string, unknown> | null;
  is_active?: boolean | null;
};

export type ChangePasswordDTO = {
  new_password: string;
};

export type CalendarRowDTO = {
  company_id: number;
  date_id: string; // backend returns ISO date string
  fiscal_year: number;
  fiscal_quarter: number;
  fiscal_month: number;
  fiscal_week: number;
  fiscal_yrwk: string | number;

  fiscal_dow: number;
  fiscal_dom: number;

  iso_year: number;
  iso_quarter: number;
  iso_month: number;
  iso_week: number;
  iso_dow: number;
  iso_dom: number;

  day_name: string;
};

export type DimensionOutDTO = {
  dimension_id: number;
  company_id: number;
  dimension_key: string;
  dimension_name: string;
  description?: string | null;
  data_type: string;
  is_active: boolean;
};

export type DimensionCreateDTO = {
  dimension_key: string;
  dimension_name: string;
  description?: string | null;
  data_type?: "TEXT" | "NUMBER" | "DATE";
};

export type DimensionUpdateDTO = {
  dimension_name?: string | null;
  description?: string | null;
  data_type?: "TEXT" | "NUMBER" | "DATE" | null;
  is_active?: boolean | null;
};

export type DimensionValueOutDTO = {
  dimension_value_id: number;
  company_id: number;
  dimension_id: number;
  value_key: string;
  value_name: string;
  sort_order?: number | null;
  attributes_json: Record<string, unknown>;
  is_active: boolean;
};

export type DimensionValueCreateDTO = {
  value_key: string;
  value_name: string;
  sort_order?: number | null;
  attributes_json?: Record<string, unknown> | null;
};

export type DimensionValueUpdateDTO = {
  value_name?: string | null;
  sort_order?: number | null;
  attributes_json?: Record<string, unknown> | null;
  is_active?: boolean | null;
};

export type ImportRowError = {
  row: number;
  error: string;
};

export type ImportBucketSummary = {
  created: number;
  updated: number;
  skipped: number;
  errors: ImportRowError[];
};

export type DimensionsImportSummary = {
  dimensions: ImportBucketSummary;
  values: ImportBucketSummary;
};

export type DimensionsImportResponse = {
  ok: boolean;
  summary: DimensionsImportSummary;
};