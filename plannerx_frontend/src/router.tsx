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

import {
  RequireAuth,
  ForcePasswordChangeGate,
  RequireCompanyContext,
  RequireSysAdmin,
  RequireNoCompanyContext,
  RequireCompanyAdminOrSysAdmin,
} from "./guards";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },

  {
    path: "/change-password",
    element: (
      <RequireAuth>
        <ChangePasswordPage />
      </RequireAuth>
    ),
  },

  // SYSADMIN can reach this without company selected
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

  // SYSADMIN can onboard companies only when NOT inside a company
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

  // Company Settings: SYSADMIN (when tunneled) OR COMPANY_ADMIN
  {
    path: "/admin/company",
    element: (
      <RequireAuth>
        <ForcePasswordChangeGate>
          <RequireCompanyContext>
            <RequireCompanyAdminOrSysAdmin>
              <AppShell />
            </RequireCompanyAdminOrSysAdmin>
          </RequireCompanyContext>
        </ForcePasswordChangeGate>
      </RequireAuth>
    ),
    children: [{ index: true, element: <AdminCompanySettingsPage /> }],
  },

  // Normal app shell (company-context gated)
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

      // Company-scoped admin
      { path: "admin/users", element: <AdminUsersPage /> },
    ],
  },

  { path: "*", element: <Navigate to="/" replace /> },
]);