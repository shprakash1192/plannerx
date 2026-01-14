import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useAppStore } from "../store";

export default function LoginPage() {
  const login = useAppStore((s) => s.login);
  const authError = useAppStore((s) => s.authError);
  const clearAuthError = useAppStore((s) => s.clearAuthError);

  const navigate = useNavigate();
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        bgcolor: "background.default",
        p: 2,
      }}
    >
      <Card sx={{ width: 420 }}>
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="h4" fontWeight={900}>
                Planner X
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sign in to continue
              </Typography>
            </Box>

            <TextField
              label="Username"
              placeholder="cfo / ceo / kam"
              value={u}
              onChange={(e) => {
                setU(e.target.value);
                if (authError) clearAuthError();
              }}
              fullWidth
            />

            <TextField
              label="Password"
              placeholder="PlannerX@123"
              type="password"
              value={p}
              onChange={(e) => {
                setP(e.target.value);
                if (authError) clearAuthError();
              }}
              fullWidth
            />

            {authError ? <Alert severity="error">{authError}</Alert> : null}

            <Button
              variant="contained"
              size="large"
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                try {
                  await login(u, p);
                  navigate("/");
                } catch {
                  // authError is set in store; keep UI quiet here
                } finally {
                  setLoading(false);
                }
              }}
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>

            <Typography variant="caption" color="text.secondary">
              Demo: <b>cfo</b> / <b>PlannerX@123</b>
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}