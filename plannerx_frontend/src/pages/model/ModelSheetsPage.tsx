import PageLayout from "../../components/PageLayout";
import Panel from "../../components/Panel";
import { Typography } from "@mui/material";

export default function ModelSheetsPage() {
  return (
    <PageLayout
      title="Model · Sheets"
      subtitle="Planning sheets available for this company"
    >
      <Panel>
        <Typography variant="body2" color="text.secondary">
          This section will manage planning sheets (models).
          <br />
          For now, this will list and manage sheet definitions.
        </Typography>
      </Panel>
    </PageLayout>
  );
}