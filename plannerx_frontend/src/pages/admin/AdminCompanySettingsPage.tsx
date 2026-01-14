import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Stack, TextField, Typography } from "@mui/material";
import PageLayout from "../../components/PageLayout";
import Panel from "../../components/Panel";
import { useAppStore } from "../../store";

export default function AdminCompanySettingsPage() {
  const companies = useAppStore((s) => s.companies);
  const activeCompanyId = useAppStore((s) => s.activeCompanyId);

  const loadCompany = useAppStore((s) => s.loadCompany);
  const updateCompany = useAppStore((s) => s.updateCompany);

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

  // ✅ ALWAYS pull fresh company data on page mount / company change
  useEffect(() => {
    const cid = activeCompanyId;
    if (!cid) return;

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

  // ✅ Whenever the store company changes, re-hydrate the form (prevents stale UI)
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
          {err ? <Alert severity="error">{err}</Alert> : <Alert severity="info">Loading…</Alert>}
        </Panel>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Company Settings" subtitle={`Editing ${company.name} (${company.domain})`}>
      <Panel>
        <Stack spacing={2} sx={{ maxWidth: 700 }}>
          {info && <Alert severity="info">{info}</Alert>}
          {err && <Alert severity="error">{err}</Alert>}

          <Typography variant="subtitle2" color="text.secondary">
            Domain is immutable in MVP.
          </Typography>

          <TextField label="Company Name" value={name} onChange={(e) => setName(e.target.value)} />
          <TextField label="Address Line 1" value={address1} onChange={(e) => setAddress1(e.target.value)} />
          <TextField label="Address Line 2" value={address2} onChange={(e) => setAddress2(e.target.value)} />
          <TextField label="City" value={city} onChange={(e) => setCity(e.target.value)} />
          <TextField label="State" value={state} onChange={(e) => setState(e.target.value)} />
          <TextField label="ZIP" value={zip} onChange={(e) => setZip(e.target.value)} />
          <TextField label="Industry" value={industry} onChange={(e) => setIndustry(e.target.value)} />

          <Button
            variant="contained"
            disabled={saving}
            onClick={async () => {
              try {
                setSaving(true);
                setErr(null);

                await updateCompany(company.id, {
                  name,
                  address1,
                  address2,
                  city,
                  state,
                  zip,
                  industry,
                });

                // ✅ After saving, refresh again (guarantees server truth)
                await loadCompany(company.id);
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
        </Stack>
      </Panel>
    </PageLayout>
  );
}