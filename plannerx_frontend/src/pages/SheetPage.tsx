import { useParams } from "react-router-dom";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

export default function SheetPage() {
  const { sheetKey } = useParams<{ sheetKey: string }>();

  const rows = [
    { customer: "LOWES", revenue: 178197829 },
    { customer: "WALMART", revenue: 139804730 },
  ];

  const cols = [
    { field: "customer", editable: false },
    { field: "revenue", editable: true },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 text-lg font-semibold border-b border-zinc-900">
        {sheetKey}
      </div>
      <div className="flex-1 p-4">
        <div className="ag-theme-quartz-dark h-full">
          <AgGridReact rowData={rows} columnDefs={cols} />
        </div>
      </div>
    </div>
  );
}
