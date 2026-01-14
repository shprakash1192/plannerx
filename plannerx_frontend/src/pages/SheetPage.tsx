import { useParams } from "react-router-dom";
import { Button, Stack } from "@mui/material";
import type { ColDef } from "ag-grid-community";
import PageLayout from "../components/PageLayout";
import Panel from "../components/Panel";
import SheetGrid from "../components/SheetGrid";

type Row = {
  parent_customer_id: string;
  goal_revenue: number;
  is_approved: boolean;
};

export default function SheetPage() {
  const { sheetKey } = useParams<{ sheetKey: string }>();

  // TODO: Replace with API data by sheetKey + company/version
  const rows: Row[] = [
    { parent_customer_id: "LOWES", goal_revenue: 178197829.02, is_approved: false },
    { parent_customer_id: "WALMART", goal_revenue: 139804730.25, is_approved: false },
    { parent_customer_id: "HDT", goal_revenue: 175919686.57, is_approved: false },
  ];

  const cols: ColDef<Row>[] = [
    { field: "parent_customer_id", headerName: "Parent Customer", editable: false },
    { field: "goal_revenue", headerName: "Goal Revenue" },
    { field: "is_approved", headerName: "Approved" },
  ];

  return (
    <PageLayout
      title={sheetKey ?? "Sheet"}
      subtitle="Edit values, save, and generate downstream allocations."
      actions={
        <Stack direction="row" spacing={1}>
          <Button variant="contained">Save</Button>
          <Button variant="outlined">Refresh</Button>
          <Button variant="outlined">Generate (AI)</Button>
        </Stack>
      }
    >
      <Panel>
        <SheetGrid rows={rows} cols={cols} />
      </Panel>
    </PageLayout>
  );
}