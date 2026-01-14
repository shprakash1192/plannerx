import { Box } from "@mui/material";
import { AgGridReact } from "ag-grid-react";
import type { ColDef } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

export default function SheetGrid<T extends object>({
  rows,
  cols,
}: {
  rows: T[];
  cols: ColDef<T>[];
}) {
  return (
    <Box className="ag-theme-quartz-dark" sx={{ height: "100%", width: "100%" }}>
      <AgGridReact<T>
        rowData={rows}
        columnDefs={cols}
        defaultColDef={{
          editable: true,
          sortable: true,
          filter: true,
          resizable: true,
        }}
        animateRows
      />
    </Box>
  );
}