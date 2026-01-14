import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Snackbar, Stack, TextField } from "@mui/material";
import PageLayout from "../../components/PageLayout";
import Panel from "../../components/Panel";
import { useAppStore } from "../../store";

function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;

  if (typeof e === "object" && e !== null && "detail" in e) {
    const detail = (e as { detail?: unknown }).detail;
    if (typeof detail === "string") return detail;
  }

  return "Failed to create company";
}

export default function AdminCompaniesPage() {
  const navigate = useNavigate();

  const createCompany = useAppStore((s) => s.createCompany);
  const loadCompanies = useAppStore((s) => s.loadCompanies);

  // ✅ Refresh on page entry
  useEffect(() => {
    void loadCompanies();
  }, [loadCompanies]);

  const [name, setName] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [domain, setDomain] = useState("");
  const [industry, setIndustry] = useState("");

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canSubmit =
    !!name.trim() &&
    !!address1.trim() &&
    !!city.trim() &&
    !!state.trim() &&
    !!zip.trim() &&
    !!domain.trim() &&
    !!industry.trim();

  const handleCloseError = () => setErr(null);

  return (
    <PageLayout
      title="Onboard a New Company"
      subtitle="Create a company record. Then select it and create users (including COMPANY_ADMIN)."
      actions={
        <Button variant="outlined" onClick={() => navigate("/select-company")}>
          Back to Company Selector
        </Button>
      }
    >
      <Panel>
        <Stack spacing={2} sx={{ maxWidth: 700 }}>
          <TextField label="Company Name" value={name} onChange={(e) => setName(e.target.value)} />
          <TextField label="Address Line 1" value={address1} onChange={(e) => setAddress1(e.target.value)} />
          <TextField label="Address Line 2" value={address2} onChange={(e) => setAddress2(e.target.value)} />

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField fullWidth label="City" value={city} onChange={(e) => setCity(e.target.value)} />
            <TextField fullWidth label="State" value={state} onChange={(e) => setState(e.target.value)} />
            <TextField fullWidth label="ZIP Code" value={zip} onChange={(e) => setZip(e.target.value)} />
          </Stack>

          <TextField
            label="Domain Name"
            placeholder="metrolinagreenhouses.com"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            helperText="Company users will login as username@domain"
          />

          <TextField label="Industry" value={industry} onChange={(e) => setIndustry(e.target.value)} />

          <Stack direction="row" spacing={1.5}>
            <Button
              variant="contained"
              disabled={saving || !canSubmit}
              onClick={async () => {
                try {
                  setSaving(true);
                  setErr(null);

                  await createCompany({
                    name: name.trim(),
                    address1: address1.trim(),
                    address2: address2.trim() ? address2.trim() : undefined,
                    city: city.trim(),
                    state: state.trim(),
                    zip: zip.trim(),
                    domain: domain.trim().toLowerCase(),
                    industry: industry.trim(),
                  });

                  // ✅ If you stay on this page after creation, refresh:
                  // await loadCompanies();

                  navigate("/select-company");
                } catch (e: unknown) {
                  setErr(getErrorMessage(e));
                } finally {
                  setSaving(false);
                }
              }}
            >
              {saving ? "Creating..." : "Create Company"}
            </Button>
          </Stack>
        </Stack>
      </Panel>

      <Snackbar open={err !== null} autoHideDuration={6000} onClose={handleCloseError}>
        <Alert severity="error" onClose={handleCloseError} sx={{ width: "100%" }}>
          {err ?? ""}
        </Alert>
      </Snackbar>
    </PageLayout>
  );
}