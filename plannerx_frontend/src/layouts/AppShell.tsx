import { Outlet, useNavigate } from "react-router-dom";
import {
  AppBar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";

import HomeIcon from "@mui/icons-material/Home";
import TableChartIcon from "@mui/icons-material/TableChart";
import LogoutIcon from "@mui/icons-material/Logout";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import BusinessIcon from "@mui/icons-material/Business";
import PeopleIcon from "@mui/icons-material/People";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import SettingsIcon from "@mui/icons-material/Settings";

import { useAppStore } from "../store";

const drawerWidth = 300;

const SHEETS = [
  { key: "REV_GOAL_PARENT_TOTAL", label: "Revenue Goal (Parent Total)" },
  { key: "REV_GOAL_PARENT_WEEK", label: "Revenue Goal (Parent Weekly)" },
  { key: "REV_GOAL_PARENT_REGION_CATEGORY_WEEK", label: "Rev Goal (Region × Category)" },
];

export default function AppShell() {
  const navigate = useNavigate();

  const user = useAppStore((s) => s.user);
  const logout = useAppStore((s) => s.logout);

  // Company context (SYSADMIN selects; company users are tunneled)
  const companies = useAppStore((s) => s.companies);
  const activeCompanyId = useAppStore((s) => s.activeCompanyId);
  const selectCompany = useAppStore((s) => s.selectCompany);

  // Version context
  const versions = useAppStore((s) => s.versions);
  const selectedVersionId = useAppStore((s) => s.selectedVersionId);
  const setVersion = useAppStore((s) => s.setVersion);

  // Navigation state
  const sheetKey = useAppStore((s) => s.sheetKey);
  const setSheet = useAppStore((s) => s.setSheet);

  const isSysAdmin = user?.role === "SYSADMIN";
  const isCompanyAdmin = user?.role === "COMPANY_ADMIN";

  const canSeeAdmin = isSysAdmin || isCompanyAdmin;
  const hasActiveCompany = activeCompanyId != null;

  // Show “Companies” ONLY when SYSADMIN has not selected a company yet
  const showCompaniesList = isSysAdmin && !hasActiveCompany;

  // Show “Company Settings” when inside a company (SYSADMIN tunneled OR COMPANY_ADMIN)
  const showCompanySettings = (isSysAdmin || isCompanyAdmin) && hasActiveCompany;

  const activeCompany =
    hasActiveCompany ? companies.find((c) => c.id === activeCompanyId) ?? null : null;

  const goHome = () => {
    setSheet(null);
    // If SYSADMIN has no company, send to select-company
    if (isSysAdmin && !hasActiveCompany) navigate("/select-company");
    else navigate("/");
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      {/* LEFT DRAWER */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: "border-box",
            bgcolor: "background.paper",
            borderRight: "1px solid rgba(255,255,255,0.08)",
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" fontWeight={900}>
            Planner X
          </Typography>

          {activeCompany ? (
            <Typography variant="caption" color="text.secondary">
              {activeCompany.name} • {activeCompany.domain}
            </Typography>
          ) : (
            <Typography variant="caption" color="text.secondary">
              {isSysAdmin ? "No company selected" : "Company"}
            </Typography>
          )}
        </Box>

        <Divider />

        <List sx={{ px: 1 }}>
          {/* Home */}
          <ListItemButton
            selected={!sheetKey}
            onClick={goHome}
            sx={{ borderRadius: 2, mx: 1, my: 0.5 }}
          >
            <ListItemIcon>
              <HomeIcon />
            </ListItemIcon>
            <ListItemText primary="Home" />
          </ListItemButton>

          {/* Sheets */}
          {SHEETS.map((s) => (
            <ListItemButton
              key={s.key}
              selected={sheetKey === s.key}
              onClick={() => {
                // SYSADMIN without company shouldn't open sheets
                if (isSysAdmin && !hasActiveCompany) {
                  navigate("/select-company");
                  return;
                }
                setSheet(s.key);
                navigate(`/sheet/${s.key}`);
              }}
              sx={{ borderRadius: 2, mx: 1, my: 0.5 }}
            >
              <ListItemIcon>
                <TableChartIcon />
              </ListItemIcon>
              <ListItemText primary={s.label} secondary={s.key} />
            </ListItemButton>
          ))}
        </List>

        {/* Administration */}
        {canSeeAdmin && (
          <>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ px: 2, pb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Administration
              </Typography>
            </Box>

            <List sx={{ px: 1 }}>
              {/* SYSADMIN: Companies list only BEFORE selecting a company */}
              {showCompaniesList && (
                <ListItemButton
                  onClick={() => navigate("/admin/companies")}
                  sx={{ borderRadius: 2, mx: 1, my: 0.5 }}
                >
                  <ListItemIcon>
                    <BusinessIcon />
                  </ListItemIcon>
                  <ListItemText primary="Companies" />
                </ListItemButton>
              )}

              {/* SYSADMIN (in company) OR COMPANY_ADMIN: Company Settings */}
              {showCompanySettings && (
                <ListItemButton
                  onClick={() => navigate("/admin/company")}
                  sx={{ borderRadius: 2, mx: 1, my: 0.5 }}
                >
                  <ListItemIcon>
                    <SettingsIcon />
                  </ListItemIcon>
                  <ListItemText primary="Company Settings" />
                </ListItemButton>
              )}

              {/* Users (both SYSADMIN + COMPANY_ADMIN) */}
              <ListItemButton
                onClick={() => navigate("/admin/users")}
                sx={{ borderRadius: 2, mx: 1, my: 0.5 }}
              >
                <ListItemIcon>
                  <PeopleIcon />
                </ListItemIcon>
                <ListItemText primary="Users" />
              </ListItemButton>
            </List>
          </>
        )}

        <Box sx={{ flex: 1 }} />

        {/* Footer */}
        <Box sx={{ p: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Logged in as
          </Typography>
          <Typography variant="body2" fontWeight={700}>
            {user?.displayName ?? user?.email ?? "Unknown"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user?.role ?? ""}
          </Typography>
        </Box>
      </Drawer>

      {/* MAIN */}
      <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {/* TOP BAR */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: "background.default",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Toolbar sx={{ gap: 2 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle1" fontWeight={800} noWrap>
                {user?.displayName ?? user?.email ?? "User"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.role}
              </Typography>
            </Box>

            <Box sx={{ flex: 1 }} />

            <Stack direction="row" spacing={1.5} alignItems="center">
              {/* SYSADMIN: always allow “switch company” button */}
              {isSysAdmin && (
                <Tooltip title="Switch company">
                  <IconButton onClick={() => navigate("/select-company")}>
                    <SwapHorizIcon />
                  </IconButton>
                </Tooltip>
              )}

              {/* SYSADMIN: company dropdown ONLY when not in a company yet */}
              {isSysAdmin && !hasActiveCompany && (
                <Select<string>
                  value={String(activeCompanyId ?? "")}
                  onChange={(e) => {
                    const v = e.target.value; // string
                    if (v === "") return;
                    selectCompany(Number(v));
                    navigate("/"); // will enter the AppShell company context
                  }}
                  displayEmpty
                  sx={{ minWidth: 240 }}
                >
                  <MenuItem value="">
                    <em>Select company…</em>
                  </MenuItem>
                  {companies.map((c) => (
                    <MenuItem key={c.id} value={String(c.id)}>
                      {c.name} ({c.domain})
                    </MenuItem>
                  ))}
                </Select>
              )}

              {/* Admin icon: route based on context */}
              {canSeeAdmin && (
                <Tooltip title="Administration">
                  <IconButton
                    onClick={() => {
                      if (showCompaniesList) navigate("/admin/companies");
                      else if (showCompanySettings) navigate("/admin/company");
                      else navigate("/admin/users");
                    }}
                  >
                    <AdminPanelSettingsIcon />
                  </IconButton>
                </Tooltip>
              )}

              {/* Planning version selector */}
              <Select<number>
                value={selectedVersionId}
                onChange={(e) => setVersion(Number(e.target.value))}
                sx={{ minWidth: 200 }}
              >
                {versions.map((v) => (
                  <MenuItem key={v.id} value={v.id}>
                    {v.code}
                  </MenuItem>
                ))}
              </Select>

              <Tooltip title="Logout">
                <IconButton onClick={logout}>
                  <LogoutIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Toolbar>
        </AppBar>

        {/* CONTENT */}
        <Box
          component="main"
          sx={{
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
            p: 3,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}