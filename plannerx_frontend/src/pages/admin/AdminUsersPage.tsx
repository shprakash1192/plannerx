import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import PageLayout from "../../components/PageLayout";
import Panel from "../../components/Panel";
import { useAppStore } from "../../store";

type UserRole = "SYSADMIN" | "COMPANY_ADMIN" | "CEO" | "CFO" | "KAM";

type UserPermissions = {
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

type NonSysRole = Exclude<UserRole, "SYSADMIN">;

const defaultPermsByRole: Record<NonSysRole, UserPermissions> = {
  COMPANY_ADMIN: {
    canCreateUsers: true,
    canResetPasswords: true,

    canCreateSheets: true,
    canViewSheets: true,
    canEditSheets: true,
    canLockSheets: true,

    canCreateVersions: true,
    canViewVersions: true,
    canEditVersions: true,
    canLockVersions: true,

    canCreateDimensions: true,
    canViewDimensions: true,
    canEditDimensions: true,

    canCreateDimensionValues: true,
    canViewDimensionValues: true,
    canEditDimensionValues: true,
  },
  CEO: {
    canCreateUsers: false,
    canResetPasswords: false,

    canCreateSheets: false,
    canViewSheets: true,
    canEditSheets: true,
    canLockSheets: true,

    canCreateVersions: true,
    canViewVersions: true,
    canEditVersions: true,
    canLockVersions: true,

    canCreateDimensions: false,
    canViewDimensions: true,
    canEditDimensions: false,

    canCreateDimensionValues: false,
    canViewDimensionValues: true,
    canEditDimensionValues: false,
  },
  CFO: {
    canCreateUsers: false,
    canResetPasswords: false,

    canCreateSheets: false,
    canViewSheets: true,
    canEditSheets: true,
    canLockSheets: true,

    canCreateVersions: true,
    canViewVersions: true,
    canEditVersions: true,
    canLockVersions: true,

    canCreateDimensions: false,
    canViewDimensions: true,
    canEditDimensions: true,

    canCreateDimensionValues: false,
    canViewDimensionValues: true,
    canEditDimensionValues: true,
  },
  KAM: {
    canCreateUsers: false,
    canResetPasswords: false,

    canCreateSheets: false,
    canViewSheets: true,
    canEditSheets: true,
    canLockSheets: false,

    canCreateVersions: false,
    canViewVersions: true,
    canEditVersions: false,
    canLockVersions: false,

    canCreateDimensions: false,
    canViewDimensions: true,
    canEditDimensions: false,

    canCreateDimensionValues: false,
    canViewDimensionValues: true,
    canEditDimensionValues: false,
  },
};

const NON_SYS_ROLES: NonSysRole[] = ["COMPANY_ADMIN", "CEO", "CFO", "KAM"];

function isNonSysRole(v: unknown): v is NonSysRole {
  return typeof v === "string" && (NON_SYS_ROLES as string[]).includes(v);
}

function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  if (typeof e === "object" && e !== null && "detail" in e) {
    const d = (e as { detail?: unknown }).detail;
    if (typeof d === "string") return d;
  }
  return "Request failed";
}

export default function AdminUsersPage() {
  const user = useAppStore((s) => s.user);
  const companies = useAppStore((s) => s.companies);
  const activeCompanyId = useAppStore((s) => s.activeCompanyId);

  const companyUsers = useAppStore((s) => s.companyUsers);
  const loadCompanyUsers = useAppStore((s) => s.loadCompanyUsers);
  const createUserForActiveCompany = useAppStore((s) => s.createUserForActiveCompany);

  const activeCompany = useMemo(
    () => companies.find((c) => c.id === activeCompanyId) ?? null,
    [companies, activeCompanyId]
  );

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<NonSysRole>("COMPANY_ADMIN");
  const [tempPassword, setTempPassword] = useState("Temp@12345");
  const [forceChange, setForceChange] = useState(true);

  const [perms, setPerms] = useState<UserPermissions>(defaultPermsByRole.COMPANY_ADMIN);

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const canUsePage = user?.role === "SYSADMIN" || user?.role === "COMPANY_ADMIN";

  const setPerm = (k: keyof UserPermissions) => setPerms((p) => ({ ...p, [k]: !p[k] }));

  // ✅ Always refresh users on page entry + when company changes
  useEffect(() => {
    if (!canUsePage) return;
    if (!activeCompanyId) return;

    let cancelled = false;

    (async () => {
      try {
        // clear messages when switching companies / re-entering
        setSuccessMsg(null);
        setErrorMsg(null);

        setLoadingUsers(true);
        await loadCompanyUsers(activeCompanyId);
      } catch (e: unknown) {
        if (!cancelled) setErrorMsg(getErrorMessage(e));
      } finally {
        if (!cancelled) setLoadingUsers(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeCompanyId, canUsePage, loadCompanyUsers]);

  return (
    <PageLayout
      title="Users"
      subtitle={
        activeCompany
          ? `Creating users for: ${activeCompany.name} (${activeCompany.domain})`
          : "Select a company first."
      }
    >
      <Panel>
        {!canUsePage && <Alert severity="error">You do not have access to manage users.</Alert>}

        {canUsePage && !activeCompany && (
          <Alert severity="warning">No active company selected. SYSADMIN must select a company first.</Alert>
        )}

        {canUsePage && activeCompany && (
          <Stack spacing={2.5} sx={{ maxWidth: 980 }}>
            {successMsg && <Alert severity="success">{successMsg}</Alert>}
            {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

            {/* Existing users */}
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" fontWeight={900}>
                  Existing users
                </Typography>

                <Button
                  size="small"
                  variant="outlined"
                  disabled={loadingUsers}
                  onClick={async () => {
                    if (!activeCompanyId) return;
                    try {
                      setErrorMsg(null);
                      setSuccessMsg(null);
                      setLoadingUsers(true);
                      await loadCompanyUsers(activeCompanyId);
                    } catch (e: unknown) {
                      setErrorMsg(getErrorMessage(e));
                    } finally {
                      setLoadingUsers(false);
                    }
                  }}
                >
                  {loadingUsers ? "Refreshing..." : "Refresh"}
                </Button>
              </Stack>

              {loadingUsers ? (
                <Typography color="text.secondary">Loading users...</Typography>
              ) : companyUsers.length === 0 ? (
                <Typography color="text.secondary">No users yet for this company.</Typography>
              ) : (
                <Stack spacing={0.5}>
                  {companyUsers.map((u) => (
                    <Stack
                      key={u.id}
                      direction={{ xs: "column", md: "row" }}
                      spacing={1}
                      sx={{
                        p: 1.25,
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 2,
                      }}
                    >
                      <Typography sx={{ minWidth: 280 }}>
                        <b>{u.email}</b>
                      </Typography>
                      <Typography sx={{ minWidth: 220 }}>{u.displayName}</Typography>
                      <Typography sx={{ minWidth: 140 }}>{u.role}</Typography>
                      <Typography color="text.secondary">
                        {u.forcePasswordChange ? "Force change: YES" : "Force change: NO"}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              )}
            </Stack>

            <Divider />

            <Typography variant="h6" fontWeight={900}>
              Create new user
            </Typography>

            <Typography variant="subtitle2" color="text.secondary">
              New user email will be:{" "}
              <b>
                {(username || "username").toLowerCase()}@{activeCompany.domain}
              </b>
            </Typography>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                fullWidth
                label="Username (no domain)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <TextField
                fullWidth
                label="Display Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </Stack>

            <ToggleButtonGroup
              color="primary"
              value={role}
              exclusive
              onChange={(_, v) => {
                if (!isNonSysRole(v)) return;
                setRole(v);
                setPerms(defaultPermsByRole[v]);
              }}
              size="small"
            >
              <ToggleButton value="COMPANY_ADMIN">COMPANY_ADMIN</ToggleButton>
              <ToggleButton value="CEO">CEO</ToggleButton>
              <ToggleButton value="CFO">CFO</ToggleButton>
              <ToggleButton value="KAM">KAM</ToggleButton>
            </ToggleButtonGroup>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                fullWidth
                label="Temporary Password"
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
                helperText="User will login using this temporary password."
              />

              <ToggleButtonGroup
                color="primary"
                value={forceChange ? "YES" : "NO"}
                exclusive
                onChange={(_, v) => setForceChange(v === "YES")}
                size="small"
                sx={{ alignSelf: "flex-start" }}
              >
                <ToggleButton value="YES">Force password change</ToggleButton>
                <ToggleButton value="NO">No</ToggleButton>
              </ToggleButtonGroup>
            </Stack>

            <Divider />

            <Typography variant="h6" fontWeight={900}>
              Permissions
            </Typography>

            <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
              <Stack>
                <Typography variant="subtitle2" color="text.secondary">
                  Users
                </Typography>
                <FormControlLabel
                  control={<Checkbox checked={perms.canCreateUsers} onChange={() => setPerm("canCreateUsers")} />}
                  label="Create users"
                />
                <FormControlLabel
                  control={<Checkbox checked={perms.canResetPasswords} onChange={() => setPerm("canResetPasswords")} />}
                  label="Reset passwords"
                />
              </Stack>

              <Stack>
                <Typography variant="subtitle2" color="text.secondary">
                  Sheets
                </Typography>
                <FormControlLabel
                  control={<Checkbox checked={perms.canCreateSheets} onChange={() => setPerm("canCreateSheets")} />}
                  label="Create sheets"
                />
                <FormControlLabel
                  control={<Checkbox checked={perms.canViewSheets} onChange={() => setPerm("canViewSheets")} />}
                  label="View sheets"
                />
                <FormControlLabel
                  control={<Checkbox checked={perms.canEditSheets} onChange={() => setPerm("canEditSheets")} />}
                  label="Edit sheets"
                />
                <FormControlLabel
                  control={<Checkbox checked={perms.canLockSheets} onChange={() => setPerm("canLockSheets")} />}
                  label="Lock sheets"
                />
              </Stack>

              <Stack>
                <Typography variant="subtitle2" color="text.secondary">
                  Versions
                </Typography>
                <FormControlLabel
                  control={<Checkbox checked={perms.canCreateVersions} onChange={() => setPerm("canCreateVersions")} />}
                  label="Create versions"
                />
                <FormControlLabel
                  control={<Checkbox checked={perms.canViewVersions} onChange={() => setPerm("canViewVersions")} />}
                  label="View versions"
                />
                <FormControlLabel
                  control={<Checkbox checked={perms.canEditVersions} onChange={() => setPerm("canEditVersions")} />}
                  label="Edit versions"
                />
                <FormControlLabel
                  control={<Checkbox checked={perms.canLockVersions} onChange={() => setPerm("canLockVersions")} />}
                  label="Lock versions"
                />
              </Stack>

              <Stack>
                <Typography variant="subtitle2" color="text.secondary">
                  Dimensions
                </Typography>
                <FormControlLabel
                  control={<Checkbox checked={perms.canCreateDimensions} onChange={() => setPerm("canCreateDimensions")} />}
                  label="Create dimensions"
                />
                <FormControlLabel
                  control={<Checkbox checked={perms.canViewDimensions} onChange={() => setPerm("canViewDimensions")} />}
                  label="View dimensions"
                />
                <FormControlLabel
                  control={<Checkbox checked={perms.canEditDimensions} onChange={() => setPerm("canEditDimensions")} />}
                  label="Edit dimensions"
                />

                <Divider sx={{ my: 1 }} />

                <Typography variant="subtitle2" color="text.secondary">
                  Dimension values
                </Typography>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={perms.canCreateDimensionValues}
                      onChange={() => setPerm("canCreateDimensionValues")}
                    />
                  }
                  label="Create values"
                />
                <FormControlLabel
                  control={<Checkbox checked={perms.canViewDimensionValues} onChange={() => setPerm("canViewDimensionValues")} />}
                  label="View values"
                />
                <FormControlLabel
                  control={<Checkbox checked={perms.canEditDimensionValues} onChange={() => setPerm("canEditDimensionValues")} />}
                  label="Edit values"
                />
              </Stack>
            </Stack>

            <Stack direction="row" spacing={1.5}>
              <Button
                variant="contained"
                disabled={saving || !username.trim() || !displayName.trim() || !tempPassword}
                onClick={async () => {
                  setSuccessMsg(null);
                  setErrorMsg(null);

                  try {
                    setSaving(true);

                    const created = await createUserForActiveCompany({
                      username: username.trim(),
                      displayName: displayName.trim(),
                      role,
                      forcePasswordChange: forceChange,
                      tempPassword,
                      permissions: perms,
                    });

                    setSuccessMsg(`Created user: ${created.email} (${created.role})`);
                    setUsername("");
                    setDisplayName("");

                    // ✅ after create, refresh server-truth list (recommended)
                    if (activeCompanyId) {
                      setLoadingUsers(true);
                      await loadCompanyUsers(activeCompanyId);
                      setLoadingUsers(false);
                    }
                  } catch (e: unknown) {
                    setErrorMsg(getErrorMessage(e));
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {saving ? "Creating..." : "Create User"}
              </Button>
            </Stack>
          </Stack>
        )}
      </Panel>
    </PageLayout>
  );
}