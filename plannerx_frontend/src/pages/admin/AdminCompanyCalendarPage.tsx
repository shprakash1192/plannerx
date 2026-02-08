import { useEffect, useMemo, useState } from "react";
import { Alert, Stack, Typography } from "@mui/material";
import { AgGridReact } from "ag-grid-react";
import type { ColDef } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

import PageLayout from "../../components/PageLayout";
import Panel from "../../components/Panel";
import { useAppStore } from "../../store";

export default function AdminCompanyCalendarPage() {
  const activeCompanyId = useAppStore((s) => s.activeCompanyId);
  const companies = useAppStore((s) => s.companies);
  const calendarRows = useAppStore((s) => s.calendarRows);
  const loadCalendar = useAppStore((s) => s.loadCalendar);

  const company = useMemo(
    () => companies.find((c) => c.id === activeCompanyId) ?? null,
    [companies, activeCompanyId]
  );

  const [err, setErr] = useState<string | null>(null);
  const [loadingMsg, setLoadingMsg] = useState<string | null>(null);

  useEffect(() => {
    const cid = activeCompanyId;
    if (!cid) return;

    (async () => {
      try {
        setErr(null);
        setLoadingMsg("Loading calendar…");
        await loadCalendar(cid);
        setLoadingMsg(null);
      } catch (e: unknown) {
        setLoadingMsg(null);
        setErr(e instanceof Error ? e.message : "Failed to load calendar");
      }
    })();
  }, [activeCompanyId, loadCalendar]);

  const colDefs = useMemo<ColDef[]>(
    () => [
      { headerName: "Date", field: "dateId", filter: true, pinned: "left", width: 130 },
      { headerName: "Day", field: "dayName", filter: true, pinned: "left", width: 130 },

      { headerName: "Fiscal Year", field: "fiscalYear", filter: true, width: 120 },
      { headerName: "Fiscal Qtr", field: "fiscalQuarter", filter: true, width: 110 },
      { headerName: "Fiscal Month", field: "fiscalMonth", filter: true, width: 120 },
      { headerName: "Fiscal Week", field: "fiscalWeek", filter: true, width: 120 },
      { headerName: "Fiscal YRWK", field: "fiscalYrwk", filter: true, width: 130 },
      { headerName: "Fiscal DOW", field: "fiscalDow", filter: true, width: 120 },
      { headerName: "Fiscal DOM", field: "fiscalDom", filter: true, width: 120 },

      { headerName: "ISO Year", field: "isoYear", filter: true, width: 110 },
      { headerName: "ISO Qtr", field: "isoQuarter", filter: true, width: 100 },
      { headerName: "ISO Month", field: "isoMonth", filter: true, width: 110 },
      { headerName: "ISO Week", field: "isoWeek", filter: true, width: 110 },
      { headerName: "ISO DOW", field: "isoDow", filter: true, width: 110 },
      { headerName: "ISO DOM", field: "isoDom", filter: true, width: 110 },
    ],
    []
  );

  if (!activeCompanyId) {
    return (
      <PageLayout title="Company Calendar" subtitle="Select a company first.">
        <Panel>
          <Alert severity="warning">No active company selected.</Alert>
        </Panel>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Company Calendar"
      subtitle={company ? `${company.name} (${company.domain})` : `Company #${activeCompanyId}`}
    >
      <Panel>
        <Stack spacing={2}>
          {loadingMsg && <Alert severity="info">{loadingMsg}</Alert>}
          {err && <Alert severity="error">{err}</Alert>}

          <Typography variant="body2" color="text.secondary">
            View-only. Calendar drives all fiscal and ISO logic across PlannerX.
          </Typography>

          <div className="ag-theme-quartz" style={{ height: 650, width: "100%" }}>
            <AgGridReact
              rowData={calendarRows}
              columnDefs={colDefs}
              defaultColDef={{
                sortable: true,
                resizable: true,
                filter: true,
                editable: false, // ✅ view-only
              }}
              animateRows
              pagination
              paginationPageSize={200}
            />
          </div>
        </Stack>
      </Panel>
    </PageLayout>
  );
}