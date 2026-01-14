import { Paper } from "@mui/material";
import type { ReactNode } from "react";

export default function Panel({ children }: { children: ReactNode }) {
  return (
    <Paper
      elevation={0}
      sx={{
        height: "100%",
        p: 1.5,
        borderRadius: 3,
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {children}
    </Paper>
  );
}