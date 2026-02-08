// Router.tsx
import { createBrowserRouter, Navigate } from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import SelectCompanyPage from "./pages/SelectCompanyPage";

import AppShell from "./layouts/AppShell";
import HomePage from "./pages/HomePage";
import SheetPage from "./pages/SheetPage";

import AdminCompaniesPage from "./pages/admin/AdminCompaniesPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminCompanySettingsPage from "./pages/admin/AdminCompanySettingsPage";
import AdminCompanyCalendarPage from "./pages/admin/AdminCompanyCalendarPage";

import ModelSheetsPage from "./pages/model/ModelSheetsPage";
import ModelDimensionsPage from "./pages/model/ModelDimensionsPage";

import {
  RequireAuth,
  ForcePasswordChangeGate,
  RequireCompanyContext,
  RequireSysAdmin,
  RequireNoCompanyContext,
  RequireCompanyAdminOrSysAdmin,
} from "./guards";

export const router = createBrowserRouter([
  // Public
  { path: "/login", element: <LoginPage /> },

  // Auth-required
  {
    path: "/change-password",
    element: (
      <RequireAuth>
        <ChangePasswordPage />
      </RequireAuth>
    ),
  },

  // SYSADMIN can reach this even without a company selected
  {
    path: "/select-company",
    element: (
      <RequireAuth>
        <ForcePasswordChangeGate>
          <SelectCompanyPage />
        </ForcePasswordChangeGate>
      </RequireAuth>
    ),
  },

  // SYSADMIN onboarding (ONLY when no company is selected)
  {
    path: "/admin/companies",
    element: (
      <RequireAuth>
        <ForcePasswordChangeGate>
          <RequireSysAdmin>
            <RequireNoCompanyContext>
              <AdminCompaniesPage />
            </RequireNoCompanyContext>
          </RequireSysAdmin>
        </ForcePasswordChangeGate>
      </RequireAuth>
    ),
  },

  // Main app shell (requires company context)
  {
    path: "/",
    element: (
      <RequireAuth>
        <ForcePasswordChangeGate>
          <RequireCompanyContext>
            <AppShell />
          </RequireCompanyContext>
        </ForcePasswordChangeGate>
      </RequireAuth>
    ),
    children: [
      { index: true, element: <HomePage /> },
      { path: "sheet/:sheetKey", element: <SheetPage /> },

      // =========================
      // Company Administration
      // =========================
      {
        path: "admin/company-settings",
        element: (
          <RequireCompanyAdminOrSysAdmin>
            <AdminCompanySettingsPage />
          </RequireCompanyAdminOrSysAdmin>
        ),
      },
      {
        path: "admin/users",
        element: (
          <RequireCompanyAdminOrSysAdmin>
            <AdminUsersPage />
          </RequireCompanyAdminOrSysAdmin>
        ),
      },
      {
        path: "admin/company-calendar",
        element: (
          <RequireCompanyAdminOrSysAdmin>
            <AdminCompanyCalendarPage />
          </RequireCompanyAdminOrSysAdmin>
        ),
      },

      // =========================
      // Model
      // =========================
      {
        path: "model/sheets",
        element: (
          <RequireCompanyAdminOrSysAdmin>
            <ModelSheetsPage />
          </RequireCompanyAdminOrSysAdmin>
        ),
      },
      {
        path: "model/dimensions",
        element: (
          <RequireCompanyAdminOrSysAdmin>
            <ModelDimensionsPage />
          </RequireCompanyAdminOrSysAdmin>
        ),
      },
    ],
  },

  // Fallback
  { path: "*", element: <Navigate to="/" replace /> },
]);