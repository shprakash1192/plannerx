// ChangePasswordPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Box, Button, Card, CardContent, Stack, TextField, Typography } from "@mui/material";
import { useAppStore } from "../store";

function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;

  if (typeof e === "object" && e !== null && "detail" in e) {
    const detail = (e as { detail?: unknown }).detail;
    if (typeof detail === "string") return detail;
  }

  return "Failed to update password";
}

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);
  const changeMyPassword = useAppStore((s) => s.changeMyPassword);

  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", bgcolor: "background.default", p: 2 }}>
      <Card sx={{ width: 460 }}>
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="h5" fontWeight={900}>
                Change Password
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.email}
              </Typography>
            </Box>

            {msg && <Alert severity="info">{msg}</Alert>}
            {err && <Alert severity="error">{err}</Alert>}

            <TextField
              label="New Password"
              type="password"
              value={p1}
              onChange={(e) => setP1(e.target.value)}
              disabled={saving}
              autoFocus
            />

            <TextField
              label="Confirm Password"
              type="password"
              value={p2}
              onChange={(e) => setP2(e.target.value)}
              disabled={saving}
            />

            <Button
              variant="contained"
              disabled={saving || !p1 || !p2}
              onClick={async () => {
                setErr(null);
                setMsg(null);

                if (!p1 || p1.length < 8) {
                  setErr("Password must be at least 8 characters.");
                  return;
                }
                if (p1 !== p2) {
                  setErr("Passwords do not match.");
                  return;
                }

                try {
                  setSaving(true);
                  setMsg("Saving...");

                  await changeMyPassword(p1);

                  setMsg("Password updated. Redirecting...");
                  navigate("/", { replace: true });
                } catch (e: unknown) {
                  setMsg(null);
                  setErr(getErrorMessage(e));
                } finally {
                  setSaving(false);
                }
              }}
            >
              {saving ? "Saving..." : "Save Password"}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}