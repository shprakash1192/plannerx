import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Card, CardContent, Stack, TextField, Typography } from "@mui/material";
import PageLayout from "../components/PageLayout";
import Panel from "../components/Panel";
import { useAppStore } from "../store";

export default function SelectCompanyPage() {
  const navigate = useNavigate();
  const companies = useAppStore((s) => s.companies);
  const selectCompany = useAppStore((s) => s.selectCompany);

  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return companies;
    return companies.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.domain.toLowerCase().includes(term) ||
        c.industry.toLowerCase().includes(term)
    );
  }, [q, companies]);

  return (
    <PageLayout
      title="Select a Company"
      subtitle="System Admins must choose a company context to operate under."
      actions={
        <Button variant="contained" onClick={() => navigate("/admin/companies")}>
          Create Company
        </Button>
      }
    >
      <Panel>
        <Stack spacing={2} sx={{ height: "100%" }}>
          <TextField
            label="Search"
            placeholder="Search by name, domain, or industry"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              overflow: "auto",
              flex: 1,
              minHeight: 0,
              p: 0.5,
            }}
          >
            {filtered.map((c) => (
              <Card key={c.id} sx={{ cursor: "pointer" }}>
                <CardContent>
                  <Typography fontWeight={800}>{c.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {c.domain} • {c.industry}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }} color="text.secondary">
                    {c.city}, {c.state} {c.zip}
                  </Typography>

                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        selectCompany(c.id);
                        navigate("/");
                      }}
                    >
                      Select
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            ))}

            {filtered.length === 0 && (
              <Box sx={{ p: 3 }}>
                <Typography color="text.secondary">No companies found.</Typography>
              </Box>
            )}
          </Box>
        </Stack>
      </Panel>
    </PageLayout>
  );
}