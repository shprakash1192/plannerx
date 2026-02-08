// store.ts
import { create } from "zustand";
import { api } from "./api/client";
import type {
  CalendarRowDTO,
  CompanyCreateDTO,
  CompanyOutDTO,
  CompanyUpdateDTO,
  LoginResponseDTO,
  SheetOutDTO,
  UserCreateForCompanyDTO,
  UserOutDTO,
  DimensionOutDTO,
  DimensionCreateDTO,
  DimensionValueOutDTO,
  DimensionValueCreateDTO,
  DimensionUpdateDTO,
  DimensionValueUpdateDTO,
  DimensionsImportResponse
} from "./api/dto";

type CompanyUpdatePayload = CompanyUpdateDTO & {
  is_active?: boolean;
  calendar_sheet_id?: number;
};

export type CalendarRow = {
  companyId: number;
  dateId: string;

  fiscalYear: number;
  fiscalQuarter: number;
  fiscalMonth: number;
  fiscalWeek: number;
  fiscalYrwk: string;

  fiscalDow: number;
  fiscalDom: number;

  isoYear: number;
  isoQuarter: number;
  isoMonth: number;
  isoWeek: number;
  isoDow: number;
  isoDom: number;

  dayName: string;
};

export type UserRole = "SYSADMIN" | "COMPANY_ADMIN" | "CEO" | "CFO" | "KAM";

export type UserPermissions = {
  canCreateUsers: boolean;
  canResetPasswords: boolean;

  canCreateSheets: boolean;
  canViewSheets: boolean;
  canEditSheets: boolean;
  canLockSheets: boolean;

  canCreateVersions: boolean;
  canViewVersions: boolean;
  canEditVersions: boolean;
  canLockVersions: boolean;

  canCreateDimensions: boolean;
  canViewDimensions: boolean;
  canEditDimensions: boolean;

  canCreateDimensionValues: boolean;
  canViewDimensionValues: boolean;
  canEditDimensionValues: boolean;
};

export type Company = {
  id: number;
  name: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  domain: string;
  industry: string;
  isActive: boolean;
  calendarSheetId?: number;
};

export type Sheet = {
  id: number;
  companyId: number;
  key: string;
  name: string;
  description?: string;
  model: Record<string, unknown>;
  isActive: boolean;
};

export type User = {
  id: number;
  email: string;
  displayName: string;
  role: UserRole;
  companyId?: number;
  forcePasswordChange: boolean;
  isActive: boolean;
  permissions?: UserPermissions;
};

export type DimensionDataType = "TEXT" | "NUMBER" | "DATE";

export type Dimension = {
  id: number;
  companyId: number;
  key: string;
  name: string;
  description?: string;
  dataType: DimensionDataType;
  isActive: boolean;
};

export type DimensionValue = {
  id: number;
  companyId: number;
  dimensionId: number;
  key: string;
  name: string;
  sortOrder?: number;
  attributes: Record<string, unknown>;
  isActive: boolean;
};

export type AppState = {
  token: string | null;

  user: User | null;
  authError: string | null;

  companies: Company[];
  activeCompanyId: number | null;

  companyUsers: User[];

  versions: { id: number; code: string; name: string }[];
  selectedVersionId: number;

  sheetKey: string | null;
  sheets: Sheet[];

  // Calendar
  calendarRows: CalendarRow[];

  // Dimensions
  dimensions: Dimension[];
  dimensionValues: DimensionValue[];
  selectedDimensionId: number | null;

  // Auth
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearAuthError: () => void;

  // Company context
  selectCompany: (companyId: number) => void;
  clearCompanySelection: () => void;

  // Companies
  loadCompanies: () => Promise<void>;
  loadCompany: (companyId: number) => Promise<Company>;
  createCompany: (c: Omit<Company, "id" | "isActive">) => Promise<Company>;
  updateCompany: (
    companyId: number,
    patch: Partial<Omit<Company, "id" | "domain">>
  ) => Promise<Company>;

  // Users
  loadCompanyUsers: (companyId: number) => Promise<User[]>;
  createUserForActiveCompany: (u: {
    username: string;
    displayName: string;
    role: Exclude<UserRole, "SYSADMIN">;
    forcePasswordChange: boolean;
    tempPassword: string;
    permissions: UserPermissions;
  }) => Promise<User>;

  // Sheets
  loadSheets: (companyId: number) => Promise<Sheet[]>;

  // Calendar
  importCalendar: (companyId: number, file: File) => Promise<void>;
  loadCalendar: (companyId: number) => Promise<CalendarRow[]>;

  // Dimensions
  loadDimensions: (companyId: number) => Promise<Dimension[]>;
  createDimension: (
    companyId: number,
    payload: {
      key: string;
      name: string;
      description?: string;
      dataType?: DimensionDataType;
    }
  ) => Promise<Dimension>;

  updateDimension: (
    companyId: number,
    dimensionId: number,
    patch: {
      name?: string;
      description?: string | null;
      dataType?: DimensionDataType;
      isActive?: boolean;
    }
  ) => Promise<Dimension>;

  loadDimensionValues: (companyId: number, dimensionId: number) => Promise<DimensionValue[]>;
  createDimensionValue: (
    companyId: number,
    dimensionId: number,
    payload: {
      key: string;
      name: string;
      sortOrder?: number;
      attributes?: Record<string, unknown>;
    }
  ) => Promise<DimensionValue>;

  updateDimensionValue: (
    companyId: number,
    dimensionId: number,
    valueId: number,
    patch: {
      name?: string;
      sortOrder?: number | null;
      attributes?: Record<string, unknown> | null;
      isActive?: boolean;
    }
  ) => Promise<DimensionValue>;

  selectDimension: (dimensionId: number | null) => void;

  // Fresh-data helper
  refreshActiveCompany: () => Promise<void>;

  // Password
  changeMyPassword: (newPassword: string) => Promise<void>;

  // Misc
  setSheet: (k: string | null) => void;
  setVersion: (id: number) => void;

  importDimensionsExcel: (companyId: number, file: File) => Promise<DimensionsImportResponse>;
};

function normalizeDimensionDataType(v: unknown): DimensionDataType {
  const s = String(v ?? "").trim().toUpperCase();
  if (s === "NUMBER") return "NUMBER";
  if (s === "DATE") return "DATE";
  return "TEXT";
}

function mapCompanyDTO(c: CompanyOutDTO): Company {
  return {
    id: c.company_id,
    name: c.company_name,
    address1: c.address1 ?? "",
    address2: c.address2 ?? undefined,
    city: c.city ?? "",
    state: c.state ?? "",
    zip: c.zip ?? "",
    domain: c.domain ?? "",
    industry: c.industry ?? "",
    isActive: c.is_active,
    calendarSheetId: c.calendar_sheet_id ?? undefined,
  };
}

function mapUserOutDTO(u: UserOutDTO): User {
  return {
    id: u.id,
    email: u.email,
    displayName: u.display_name,
    role: u.role,
    companyId: u.company_id ?? undefined,
    forcePasswordChange: u.force_password_change,
    isActive: u.is_active,
    permissions: (u.permissions ?? {}) as UserPermissions,
  };
}

function mapSheetDTO(s: SheetOutDTO): Sheet {
  return {
    id: s.sheet_id,
    companyId: s.company_id,
    key: s.sheet_key,
    name: s.sheet_name,
    description: s.description ?? undefined,
    model: s.model_json ?? {},
    isActive: s.is_active,
  };
}

function mapCalendarDTO(r: CalendarRowDTO): CalendarRow {
  return {
    companyId: r.company_id,
    dateId: r.date_id,

    fiscalYear: r.fiscal_year,
    fiscalQuarter: r.fiscal_quarter,
    fiscalMonth: r.fiscal_month,
    fiscalWeek: r.fiscal_week,
    fiscalYrwk: String(r.fiscal_yrwk ?? ""),

    fiscalDow: r.fiscal_dow,
    fiscalDom: r.fiscal_dom,

    isoYear: r.iso_year,
    isoQuarter: r.iso_quarter,
    isoMonth: r.iso_month,
    isoWeek: r.iso_week,
    isoDow: r.iso_dow,
    isoDom: r.iso_dom,

    dayName: r.day_name,
  };
}

function mapDimensionDTO(d: DimensionOutDTO): Dimension {
  return {
    id: d.dimension_id,
    companyId: d.company_id,
    key: d.dimension_key,
    name: d.dimension_name,
    description: d.description ?? undefined,
    dataType: normalizeDimensionDataType(d.data_type),
    isActive: d.is_active,
  };
}

function mapDimensionValueDTO(v: DimensionValueOutDTO): DimensionValue {
  return {
    id: v.dimension_value_id,
    companyId: v.company_id,
    dimensionId: v.dimension_id,
    key: v.value_key,
    name: v.value_name,
    sortOrder: v.sort_order ?? undefined,
    attributes: v.attributes_json ?? {},
    isActive: v.is_active,
  };
}

const PATHS = {
  login: "/auth/login",
  changePassword: "/auth/change-password",
  companies: "/companies",
  company: (companyId: number) => `/companies/${companyId}`,
  companyUsers: (companyId: number) => `/companies/${companyId}/users`,
  companySheets: (companyId: number) => `/companies/${companyId}/sheets`,

  calendarImport: (companyId: number) => `/companies/${companyId}/calendar/import`,
  companyCalendar: (companyId: number) => `/companies/${companyId}/calendar`,

  companyDimensions: (companyId: number) => `/companies/${companyId}/dimensions`,

  dimensionValues: (companyId: number, dimensionId: number) =>
    `/companies/${companyId}/dimensions/${dimensionId}/values`,

  dimension: (companyId: number, dimensionId: number) =>
    `/companies/${companyId}/dimensions/${dimensionId}`,

  dimensionValue: (companyId: number, dimensionId: number, valueId: number) =>
    `/companies/${companyId}/dimensions/${dimensionId}/values/${valueId}`,

  importDimensionsExcel: (companyId: number) => `/companies/${companyId}/dimensions/import`,

};

const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://127.0.0.1:8000";

function stripNulls<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== null && v !== undefined)
  ) as Partial<T>;
}
export const useAppStore = create<AppState>((set, get) => ({
  token: null,

  user: null,
  authError: null,

  companies: [],
  activeCompanyId: null,
  companyUsers: [],

  versions: [{ id: 1, code: "BUDGET_2026_V1", name: "Budget 2026 v1" }],
  selectedVersionId: 1,

  sheetKey: null,
  sheets: [],

  calendarRows: [],

  dimensions: [],
  dimensionValues: [],
  selectedDimensionId: null,

  clearAuthError: () => set({ authError: null }),

  login: async (emailRaw, password) => {
    const email = (emailRaw || "").trim().toLowerCase();

    try {
      const resp = await api<LoginResponseDTO>(PATHS.login, {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      const user: User = {
        id: resp.user.id,
        email: resp.user.email,
        displayName: resp.user.displayName,
        role: resp.user.role,
        companyId: resp.user.companyId ?? undefined,
        forcePasswordChange: resp.user.forcePasswordChange,
        isActive: resp.user.isActive ?? true,
        permissions: (resp.user.permissions ?? {}) as UserPermissions,
      };

      set({
        token: resp.access_token,
        user,
        authError: null,
        activeCompanyId: user.role === "SYSADMIN" ? null : user.companyId ?? null,
        companyUsers: [],
        sheets: [],
        calendarRows: [],
        dimensions: [],
        dimensionValues: [],
        selectedDimensionId: null,
      });

      if (user.role === "SYSADMIN") {
        await get().loadCompanies();
      } else if (user.companyId) {
        await get().loadCompany(user.companyId);
        await get().loadCompanyUsers(user.companyId);
        await get().loadSheets(user.companyId);
        await get().loadCalendar(user.companyId);
        await get().loadDimensions(user.companyId);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Login failed";
      set({ authError: msg });
      throw new Error(msg);
    }
  },

  logout: () =>
    set({
      token: null,
      user: null,
      authError: null,
      activeCompanyId: null,
      sheetKey: null,
      companies: [],
      companyUsers: [],
      sheets: [],
      calendarRows: [],
      dimensions: [],
      dimensionValues: [],
      selectedDimensionId: null,
    }),

  selectCompany: (companyId) =>
    set({
      activeCompanyId: companyId,
      companyUsers: [],
      sheets: [],
      calendarRows: [],
      dimensions: [],
      dimensionValues: [],
      selectedDimensionId: null,
    }),

  clearCompanySelection: () =>
    set({
      activeCompanyId: null,
      companyUsers: [],
      sheets: [],
      calendarRows: [],
      dimensions: [],
      dimensionValues: [],
      selectedDimensionId: null,
    }),

  loadCompanies: async () => {
    const token = get().token;
    if (!token) throw new Error("Not logged in");

    const rows = await api<CompanyOutDTO[]>(PATHS.companies, { token });
    set({ companies: rows.map(mapCompanyDTO) });
  },

  loadCompany: async (companyId) => {
    const token = get().token;
    if (!token) throw new Error("Not logged in");

    const row = await api<CompanyOutDTO>(PATHS.company(companyId), { token });
    const ui = mapCompanyDTO(row);

    set((s) => ({
      companies: s.companies.some((c) => c.id === companyId)
        ? s.companies.map((c) => (c.id === companyId ? ui : c))
        : [ui, ...s.companies],
    }));

    return ui;
  },

  createCompany: async (c) => {
    const token = get().token;
    if (!token) throw new Error("Not logged in");

    const derivedCode =
      (c.domain || "")
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 10) || "COMP";

    const payload: CompanyCreateDTO = {
      company_code: derivedCode,
      company_name: c.name,
      address1: c.address1?.trim() ? c.address1.trim() : null,
      address2: c.address2?.trim() ? c.address2.trim() : null,
      city: c.city?.trim() ? c.city.trim() : null,
      state: c.state?.trim() ? c.state.trim() : null,
      zip: c.zip?.trim() ? c.zip.trim() : null,
      domain: c.domain?.trim() ? c.domain.trim().toLowerCase() : null,
      industry: c.industry?.trim() ? c.industry.trim() : null,
    };

    const created = await api<CompanyOutDTO>(PATHS.companies, {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    });

    const ui = mapCompanyDTO(created);
    set((s) => ({ companies: [ui, ...s.companies] }));
    return ui;
  },

  updateCompany: async (companyId, patch) => {
    const token = get().token;
    if (!token) throw new Error("Not logged in");

    const current = await get().loadCompany(companyId);
    const raw = await api<CompanyOutDTO>(PATHS.company(companyId), { token });

    const payload: CompanyUpdatePayload = {
      company_name: patch.name ?? current.name,
      address1: patch.address1 ?? current.address1,
      address2:
        (patch.address2 ?? current.address2)?.trim()
          ? (patch.address2 ?? current.address2)!.trim()
          : null,
      city: patch.city ?? current.city,
      state: patch.state ?? current.state,
      zip: patch.zip ?? current.zip,
      domain: raw.domain ?? current.domain,
      industry: patch.industry ?? current.industry,
    };

    if (typeof patch.isActive === "boolean") payload.is_active = patch.isActive;
    if (typeof patch.calendarSheetId === "number") payload.calendar_sheet_id = patch.calendarSheetId;

    const updated = await api<CompanyOutDTO>(PATHS.company(companyId), {
      method: "PATCH",
      token,
      body: JSON.stringify(payload),
    });

    const ui = mapCompanyDTO(updated);
    set((s) => ({ companies: s.companies.map((c) => (c.id === companyId ? ui : c)) }));
    return ui;
  },

  loadCompanyUsers: async (companyId) => {
    const token = get().token;
    if (!token) throw new Error("Not logged in");

    const rows = await api<UserOutDTO[]>(PATHS.companyUsers(companyId), { token });
    const mapped = rows.map(mapUserOutDTO);

    if (get().activeCompanyId === companyId) set({ companyUsers: mapped });
    return mapped;
  },

  createUserForActiveCompany: async ({
    username,
    displayName,
    role,
    forcePasswordChange,
    tempPassword,
    permissions,
  }) => {
    const token = get().token;
    if (!token) throw new Error("Not logged in");

    const companyId = get().activeCompanyId;
    if (!companyId) throw new Error("No active company selected");

    const payload: UserCreateForCompanyDTO = {
      username: username.trim().toLowerCase(),
      display_name: displayName,
      role,
      temp_password: tempPassword,
      force_password_change: forcePasswordChange,
      permissions: permissions as unknown as Record<string, unknown>,
    };

    const row = await api<UserOutDTO>(PATHS.companyUsers(companyId), {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    });

    const created = mapUserOutDTO(row);
    set((s) => ({
      companyUsers: s.activeCompanyId === companyId ? [created, ...s.companyUsers] : s.companyUsers,
    }));

    return created;
  },

  loadSheets: async (companyId) => {
    const token = get().token;
    if (!token) throw new Error("Not logged in");

    const rows = await api<SheetOutDTO[]>(PATHS.companySheets(companyId), { token });
    const mapped = rows.map(mapSheetDTO);
    set({ sheets: mapped });
    return mapped;
  },

  importCalendar: async (companyId, file) => {
    const token = get().token;
    if (!token) throw new Error("Not logged in");
    if (!file) throw new Error("File required");

    const fd = new FormData();
    fd.append("file", file);

    const resp = await fetch(`${API_BASE}${PATHS.calendarImport(companyId)}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });

    if (!resp.ok) {
      let detail = `Calendar import failed (${resp.status})`;
      try {
        const j = await resp.json();
        if (typeof j?.detail === "string") detail = j.detail;
      } catch {
        try {
          const t = await resp.text();
          if (t) detail = t;
        } catch {
          // ignore
        }
      }
      throw new Error(detail);
    }

    await get().loadCompany(companyId);
    await get().loadSheets(companyId);
    await get().loadCalendar(companyId);
  },

  loadCalendar: async (companyId) => {
    const token = get().token;
    if (!token) throw new Error("Not logged in");

    const rows = await api<CalendarRowDTO[]>(
      `${PATHS.companyCalendar(companyId)}?limit=20000&offset=0`,
      { token }
    );

    const mapped = rows.map(mapCalendarDTO);
    set({ calendarRows: mapped });
    return mapped;
  },

  // ===== Dimensions =====
  loadDimensions: async (companyId) => {
    const token = get().token;
    if (!token) throw new Error("Not logged in");

    const rows = await api<DimensionOutDTO[]>(PATHS.companyDimensions(companyId), { token });
    const mapped = rows.map(mapDimensionDTO);
    set({ dimensions: mapped });
    return mapped;
  },

  createDimension: async (companyId, payload) => {
    const token = get().token;
    if (!token) throw new Error("Not logged in");

    const body: DimensionCreateDTO = {
      dimension_key: payload.key,
      dimension_name: payload.name,
      description: payload.description ?? null,
      data_type: payload.dataType ?? "TEXT",
    };

    const row = await api<DimensionOutDTO>(PATHS.companyDimensions(companyId), {
      method: "POST",
      token,
      body: JSON.stringify(body),
    });

    const created = mapDimensionDTO(row);
    set((s) => ({ dimensions: [created, ...s.dimensions] }));
    return created;
  },

  updateDimension: async (companyId, dimensionId, patch) => {
    const token = get().token;
    if (!token) throw new Error("Not logged in");

    const body: DimensionUpdateDTO = stripNulls({
      dimension_name: patch.name ?? null,
      description: patch.description ?? null,
      data_type: patch.dataType ?? null,
      is_active: typeof patch.isActive === "boolean" ? patch.isActive : null,
    });

    const row = await api<DimensionOutDTO>(PATHS.dimension(companyId, dimensionId), {
      method: "PATCH",
      token,
      body: JSON.stringify(body),
    });

    const updated = mapDimensionDTO(row);
    set((s) => ({
      dimensions: s.dimensions.map((d) => (d.id === updated.id ? updated : d)),
    }));
    return updated;
  },

  loadDimensionValues: async (companyId, dimensionId) => {
    const token = get().token;
    if (!token) throw new Error("Not logged in");

    const rows = await api<DimensionValueOutDTO[]>(
      PATHS.dimensionValues(companyId, dimensionId),
      { token }
    );

    const mapped = rows.map(mapDimensionValueDTO);
    set({ dimensionValues: mapped, selectedDimensionId: dimensionId });
    return mapped;
  },

  createDimensionValue: async (companyId, dimensionId, payload) => {
    const token = get().token;
    if (!token) throw new Error("Not logged in");

    const body: DimensionValueCreateDTO = {
      value_key: payload.key,
      value_name: payload.name,
      sort_order: payload.sortOrder ?? null,
      attributes_json: payload.attributes ?? {},
    };

    const row = await api<DimensionValueOutDTO>(PATHS.dimensionValues(companyId, dimensionId), {
      method: "POST",
      token,
      body: JSON.stringify(body),
    });

    const created = mapDimensionValueDTO(row);
    set((s) => ({ dimensionValues: [created, ...s.dimensionValues] }));
    return created;
  },

  updateDimensionValue: async (companyId, dimensionId, valueId, patch) => {
    const token = get().token;
    if (!token) throw new Error("Not logged in");

    const body: DimensionValueUpdateDTO = stripNulls({
      value_name: patch.name ?? null,
      sort_order: patch.sortOrder ?? null,
      attributes_json: patch.attributes ?? {},
      is_active: typeof patch.isActive === "boolean" ? patch.isActive : null,
    });

    const row = await api<DimensionValueOutDTO>(
      PATHS.dimensionValue(companyId, dimensionId, valueId),
      {
        method: "PATCH",
        token,
        body: JSON.stringify(body),
      }
    );

    const updated = mapDimensionValueDTO(row);
    set((s) => ({
      dimensionValues: s.dimensionValues.map((v) => (v.id === updated.id ? updated : v)),
    }));
    return updated;
  },

  selectDimension: (dimensionId) => set({ selectedDimensionId: dimensionId }),

  refreshActiveCompany: async () => {
    const token = get().token;
    const companyId = get().activeCompanyId;
    if (!token || !companyId) return;

    await get().loadCompany(companyId);
    await get().loadCompanyUsers(companyId);
    await get().loadSheets(companyId);
    await get().loadCalendar(companyId);
    await get().loadDimensions(companyId);

    const sel = get().selectedDimensionId;
    if (sel) await get().loadDimensionValues(companyId, sel);
  },

  changeMyPassword: async (newPassword) => {
    const token = get().token;
    if (!token) throw new Error("Not logged in");

    await api<{ ok: boolean }>(
      `${PATHS.changePassword}?new_password=${encodeURIComponent(newPassword)}`,
      { method: "POST", token }
    );

    const u = get().user;
    if (u) set({ user: { ...u, forcePasswordChange: false } });
  },

  setSheet: (k) => set({ sheetKey: k }),
  setVersion: (id) => set({ selectedVersionId: id }),

  importDimensionsExcel: async (companyId, file) => {
  const token = get().token;
  if (!token) throw new Error("Not logged in");
  if (!file) throw new Error("File required");

  const fd = new FormData();
  fd.append("file", file);

  const resp = await fetch(`${API_BASE}${PATHS.importDimensionsExcel(companyId)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });

if (!resp.ok) {
  let detail = `Import failed (${resp.status})`;
  try {
    const j = await resp.json();
    if (typeof j?.detail === "string") detail = j.detail;
  } catch  {
    // ignore JSON parse errors
  }
  throw new Error(detail);
}

  const data = (await resp.json()) as DimensionsImportResponse;
  return data;
},
}));