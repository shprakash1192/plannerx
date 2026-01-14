import { Box, Typography } from "@mui/material";
import PageLayout from "../components/PageLayout";
import Panel from "../components/Panel";

export default function HomePage() {
  return (
    <PageLayout
      title="Planner X"
      subtitle="Select a sheet from the left to begin planning."
    >
      <Panel>
        <Box
          sx={{
            height: "100%",
            display: "grid",
            placeItems: "center",
            textAlign: "center",
          }}
        >
          <Box>
            <Typography variant="h3" fontWeight={900}>
              Planner X
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              Revenue goals → Weekly curve → Region × Category allocation
            </Typography>
          </Box>
        </Box>
      </Panel>
    </PageLayout>
  );
}