// store.ts
import { create } from "zustand";
import { api } from "./api/client";
import type {
  CompanyCreateDTO,
  CompanyOutDTO,
  CompanyUpdateDTO,
  LoginResponseDTO,
  UserCreateForCompanyDTO,
  UserOutDTO,
  SheetOutDTO,
} from "./api/dto";

type CompanyOutWithCalendar = CompanyOutDTO & {
  calendar_sheet_id?: number | null;
};

type CompanyUpdatePayload = CompanyUpdateDTO & {
  is_active?: boolean;
  calendar_sheet_id?: number;
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

  // Auth
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearAuthError: () => void;

  // Company context
  selectCompany: (companyId: number) => void;
  clearCompanySelection: () => void;

  // Backend actions
  loadCompanies: () => Promise<void>;
  loadCompany: (companyId: number) => Promise<Company>;
  createCompany: (c: Omit<Company, "id" | "isActive">) => Promise<Company>;

  // ✅ FIX: allow isActive + calendarSheetId updates from UI
  updateCompany: (
    companyId: number,
    patch: Partial<Omit<Company, "id" | "domain">>
  ) => Promise<Company>;

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

  // Fresh-data helper
  refreshActiveCompany: () => Promise<void>;

  // Password
  changeMyPassword: (newPassword: string) => Promise<void>;

  // Misc
  setSheet: (k: string | null) => void;
  setVersion: (id: number) => void;
};

function mapCompanyDTO(c: CompanyOutDTO): Company {
  const cc = c as CompanyOutWithCalendar;

  return {
    id: cc.company_id,
    name: cc.company_name,
    address1: cc.address1 ?? "",
    address2: cc.address2 ?? undefined,
    city: cc.city ?? "",
    state: cc.state ?? "",
    zip: cc.zip ?? "",
    domain: cc.domain ?? "",
    industry: cc.industry ?? "",
    isActive: cc.is_active,
    calendarSheetId: cc.calendar_sheet_id ?? undefined,
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

const PATHS = {
  login: "/auth/login",
  me: "/auth/me",
  changePassword: "/auth/change-password",
  companies: "/companies",
  company: (companyId: number) => `/companies/${companyId}`,
  companyUsers: (companyId: number) => `/companies/${companyId}/users`,
  companySheets: (companyId: number) => `/companies/${companyId}/sheets`,
  companySheet: (companyId: number, sheetId: number) =>
    `/companies/${companyId}/sheets/${sheetId}`,

  // ✅ backend endpoint you added
  calendarImport: (companyId: number) => `/companies/${companyId}/calendar/import`,
};

// ✅ use same origin as your api client typically uses
const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ||
  "http://127.0.0.1:8000";

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
      });

      if (user.role === "SYSADMIN") {
        await get().loadCompanies();
      } else if (user.companyId) {
        await get().loadCompany(user.companyId);
        await get().loadCompanyUsers(user.companyId);
        await get().loadSheets(user.companyId);
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
    }),

  selectCompany: (companyId) =>
    set({
      activeCompanyId: companyId,
      companyUsers: [],
      sheets: [],
    }),

  clearCompanySelection: () =>
    set({
      activeCompanyId: null,
      companyUsers: [],
      sheets: [],
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

// ✅ only send when explicitly intended
if (typeof patch.isActive === "boolean") {
  payload.is_active = patch.isActive;
}

if (typeof patch.calendarSheetId === "number") {
  payload.calendar_sheet_id = patch.calendarSheetId;
}

    const updated = await api<CompanyOutDTO>(PATHS.company(companyId), {
      method: "PATCH",
      token,
      body: JSON.stringify(payload),
    });

    const ui = mapCompanyDTO(updated);
    set((s) => ({
      companies: s.companies.map((c) => (c.id === companyId ? ui : c)),
    }));

    return ui;
  },

  loadCompanyUsers: async (companyId) => {
    const token = get().token;
    if (!token) throw new Error("Not logged in");

    const rows = await api<UserOutDTO[]>(PATHS.companyUsers(companyId), { token });
    const mapped = rows.map(mapUserOutDTO);

    if (get().activeCompanyId === companyId) {
      set({ companyUsers: mapped });
    }

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
      companyUsers:
        s.activeCompanyId === companyId ? [created, ...s.companyUsers] : s.companyUsers,
    }));

    return created;
  },

  // ===== Sheets =====
  loadSheets: async (companyId) => {
    const token = get().token;
    if (!token) throw new Error("Not logged in");

    const rows = await api<SheetOutDTO[]>(PATHS.companySheets(companyId), { token });
    const mapped = rows.map(mapSheetDTO);

    // keep it simple: store the last loaded set
    if (get().activeCompanyId === companyId) {
      set({ sheets: mapped });
    } else {
      set({ sheets: mapped });
    }

    return mapped; // ✅ matches Promise<Sheet[]>
  },

  // ===== Calendar import (Excel upload) =====
  importCalendar: async (companyId, file) => {
    const token = get().token;
    if (!token) throw new Error("Not logged in");
    if (!file) throw new Error("File required");

    const fd = new FormData();
    // backend usually expects "file"
    fd.append("file", file);

    const resp = await fetch(`${API_BASE}${PATHS.calendarImport(companyId)}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        // NOTE: do NOT set Content-Type for multipart; browser sets boundary
      },
      body: fd,
    });

    if (!resp.ok) {
      let detail = `Calendar import failed (${resp.status})`;
      try {
        const j = await resp.json();
        if (typeof j?.detail === "string") detail = j.detail;
      } catch {
        // ignore
      }
      throw new Error(detail);
    }

    // After import, backend should have:
    // - created/updated calendar sheet
    // - set companies.calendar_sheet_id
    // - possibly activated the company
    await get().loadCompany(companyId);
    await get().loadSheets(companyId);
  },

  // ✅ One-call “always fresh”
  refreshActiveCompany: async () => {
    const token = get().token;
    const companyId = get().activeCompanyId;

    if (!token || !companyId) return;

    await get().loadCompany(companyId);
    await get().loadCompanyUsers(companyId);
    await get().loadSheets(companyId);
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
}));