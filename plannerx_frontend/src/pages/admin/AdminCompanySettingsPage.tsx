// AdminCompanySettingsPage.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Divider,
  Stack,
  TextField,
  Typography,
  Chip,
  Box,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";

import PageLayout from "../../components/PageLayout";
import Panel from "../../components/Panel";
import { useAppStore } from "../../store";

function canManageCalendar(role?: string) {
  return role === "SYSADMIN" || role === "COMPANY_ADMIN";
}

export default function AdminCompanySettingsPage() {
  const companies = useAppStore((s) => s.companies);
  const activeCompanyId = useAppStore((s) => s.activeCompanyId);
  const user = useAppStore((s) => s.user);

  const loadCompany = useAppStore((s) => s.loadCompany);
  const updateCompany = useAppStore((s) => s.updateCompany);
  const importCalendar = useAppStore((s) => s.importCalendar);

  const company = useMemo(
    () => companies.find((c) => c.id === activeCompanyId) ?? null,
    [companies, activeCompanyId]
  );

  // Form state
  const [name, setName] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [industry, setIndustry] = useState("");

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Calendar upload state (single source of truth)
  const [calFile, setCalFile] = useState<File | null>(null);
  const [calUploading, setCalUploading] = useState(false);
  const [calErr, setCalErr] = useState<string | null>(null);
  const [calSuccess, setCalSuccess] = useState<string | null>(null);

  // ✅ ALWAYS pull fresh company data on page mount / company change
  useEffect(() => {
    const cid = activeCompanyId;
    if (!cid) return;

    // clear calendar messages when switching companies
    setCalFile(null);
    setCalErr(null);
    setCalSuccess(null);

    (async () => {
      try {
        setErr(null);
        setInfo("Refreshing company data...");
        await loadCompany(cid);
        setInfo(null);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Failed to refresh company";
        setErr(msg);
        setInfo(null);
      }
    })();
  }, [activeCompanyId, loadCompany]);

  // ✅ Whenever the store company changes, re-hydrate the form
  useEffect(() => {
    if (!company) return;

    setName(company.name ?? "");
    setAddress1(company.address1 ?? "");
    setAddress2(company.address2 ?? "");
    setCity(company.city ?? "");
    setState(company.state ?? "");
    setZip(company.zip ?? "");
    setIndustry(company.industry ?? "");
  }, [company]);

  if (!activeCompanyId) {
    return (
      <PageLayout title="Company Settings" subtitle="Select a company first.">
        <Panel>
          <Alert severity="warning">No active company selected.</Alert>
        </Panel>
      </PageLayout>
    );
  }

  if (!company) {
    return (
      <PageLayout title="Company Settings" subtitle="Loading company...">
        <Panel>
          {err ? (
            <Alert severity="error">{err}</Alert>
          ) : (
            <Alert severity="info">Loading…</Alert>
          )}
        </Panel>
      </PageLayout>
    );
  }

  const isAdmin = canManageCalendar(user?.role);
  const hasCalendar = !!company.calendarSheetId;

  return (
    <PageLayout
      title="Company Settings"
      subtitle={`Editing ${company.name} (${company.domain})`}
    >
      <Panel>
        <Stack spacing={2} sx={{ maxWidth: 900 }}>
          {info && <Alert severity="info">{info}</Alert>}
          {err && <Alert severity="error">{err}</Alert>}

          {/* Status */}
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap" }}>
            <Typography variant="subtitle2" color="text.secondary">
              Status:
            </Typography>

            <Chip
              label={company.isActive ? "ACTIVE" : "INACTIVE"}
              color={company.isActive ? "success" : "warning"}
              size="small"
            />

            <Chip
              label={
                hasCalendar
                  ? `Calendar tagged (Sheet #${company.calendarSheetId})`
                  : "No Calendar"
              }
              color={hasCalendar ? "info" : "default"}
              size="small"
            />
          </Stack>

          {!company.isActive && (
            <Alert severity="warning">
              This company is <b>inactive</b>. Upload a calendar to activate it.
            </Alert>
          )}

          <Divider />

          {/* Company fields */}
          <Typography variant="subtitle2" color="text.secondary">
            Domain is immutable in MVP.
          </Typography>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              fullWidth
              label="Company Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <TextField
              fullWidth
              label="Industry"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
            />
          </Stack>

          <TextField
            label="Address Line 1"
            value={address1}
            onChange={(e) => setAddress1(e.target.value)}
          />
          <TextField
            label="Address Line 2"
            value={address2}
            onChange={(e) => setAddress2(e.target.value)}
          />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField fullWidth label="City" value={city} onChange={(e) => setCity(e.target.value)} />
            <TextField fullWidth label="State" value={state} onChange={(e) => setState(e.target.value)} />
            <TextField fullWidth label="ZIP" value={zip} onChange={(e) => setZip(e.target.value)} />
          </Stack>

          <Button
            variant="contained"
            disabled={saving}
            onClick={async () => {
              try {
                setSaving(true);
                setErr(null);
                setInfo(null);

                await updateCompany(company.id, {
                  name,
                  address1,
                  address2,
                  city,
                  state,
                  zip,
                  industry,
                });

                await loadCompany(company.id);
                setInfo("Saved.");
              } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : "Save failed";
                setErr(msg);
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? "Saving..." : "Save"}
          </Button>

          <Divider sx={{ my: 1 }} />

          {/* Calendar upload section */}
          <Typography variant="h6" fontWeight={900}>
            Calendar
          </Typography>

          <Typography variant="body2" color="text.secondary">
            The calendar is the core sheet for fiscal & ISO logic. Only <b>SYSADMIN</b> or{" "}
            <b>COMPANY_ADMIN</b> can upload/replace it.
          </Typography>

          {calSuccess && <Alert severity="success">{calSuccess}</Alert>}
          {calErr && <Alert severity="error">{calErr}</Alert>}

          {!isAdmin && (
            <Alert severity="info">
              You are logged in as <b>{user?.role}</b>. Calendar upload is restricted to SYSADMIN / COMPANY_ADMIN.
            </Alert>
          )}

          <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadFileIcon />}
              disabled={!isAdmin || calUploading}
            >
              Choose Excel File
              <input
                hidden
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setCalFile(f);
                  setCalErr(null);
                  setCalSuccess(null);
                }}
              />
            </Button>

            <Typography variant="body2" color="text.secondary">
              {calFile ? calFile.name : "No file selected"}
            </Typography>
          </Box>

          <Button
            variant="contained"
            disabled={!isAdmin || !calFile || calUploading}
            onClick={async () => {
              if (!calFile) return;

              try {
                setCalUploading(true);
                setCalErr(null);
                setCalSuccess(null);

                const wasInactive = !company.isActive;

                await importCalendar(company.id, calFile);
                await loadCompany(company.id);

                setCalSuccess(
                  wasInactive
                    ? "Calendar uploaded successfully. Company is now ACTIVE."
                    : "Calendar uploaded successfully."
                );
                setCalFile(null);
              } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : "Calendar import failed";
                setCalErr(msg);
              } finally {
                setCalUploading(false);
              }
            }}
          >
            {calUploading ? "Uploading..." : hasCalendar ? "Replace Calendar" : "Upload Calendar & Activate"}
          </Button>

          <Typography variant="caption" color="text.secondary">
            Tip: Your Excel must include columns like <b>DateID</b>, Fiscal Year/Quarter/Week, ISO Year/Week,
            Day Name, etc (matching backend validation).
          </Typography>
        </Stack>
      </Panel>
    </PageLayout>
  );
}