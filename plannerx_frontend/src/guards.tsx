import React from "react";
import { Navigate } from "react-router-dom";
import { useAppStore } from "./store";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = useAppStore((s) => s.user);
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

export function ForcePasswordChangeGate({ children }: { children: React.ReactNode }) {
  const user = useAppStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  return user.forcePasswordChange ? <Navigate to="/change-password" replace /> : <>{children}</>;
}

/**
 * Only gate company-scoped pages (sheets + company admin).
 * SYSADMIN can access /select-company and /admin/companies without a selected company.
 */
export function RequireCompanyContext({ children }: { children: React.ReactNode }) {
  const user = useAppStore((s) => s.user);
  const activeCompanyId = useAppStore((s) => s.activeCompanyId);

  if (!user) return <Navigate to="/login" replace />;

  if (user.role === "SYSADMIN" && !activeCompanyId) {
    return <Navigate to="/select-company" replace />;
  }

  return <>{children}</>;
}

/**
 * SYSADMIN only.
 */
export function RequireSysAdmin({ children }: { children: React.ReactNode }) {
  const user = useAppStore((s) => s.user);

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "SYSADMIN") return <Navigate to="/" replace />;

  return <>{children}</>;
}

/**
 * Only allow access when SYSADMIN is NOT tunneled into a company.
 * If tunneled, redirect to Company Settings.
 */
export function RequireNoCompanyContext({ children }: { children: React.ReactNode }) {
  const activeCompanyId = useAppStore((s) => s.activeCompanyId);

  if (activeCompanyId != null) return <Navigate to="/admin/company" replace />;

  return <>{children}</>;
}

/**
 * SYSADMIN or COMPANY_ADMIN.
 * Use this for company-scoped admin pages like /admin/company, /admin/users.
 */
export function RequireCompanyAdminOrSysAdmin({ children }: { children: React.ReactNode }) {
  const user = useAppStore((s) => s.user);

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "SYSADMIN" && user.role !== "COMPANY_ADMIN") return <Navigate to="/" replace />;

  return <>{children}</>;
}