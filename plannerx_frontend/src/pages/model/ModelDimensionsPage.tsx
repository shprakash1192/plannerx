import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Alert,
  Box,
  Button,
  Divider,
  Stack,
  TextField,
  Typography,
  MenuItem,
  Select,
  Switch,
  FormControlLabel,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import AddIcon from "@mui/icons-material/Add";

import { AgGridReact } from "ag-grid-react";
import type {
  ColDef,
  CellValueChangedEvent,
  GridReadyEvent,
  ICellRendererParams,
} from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

import PageLayout from "../../components/PageLayout";
import Panel from "../../components/Panel";
import { useAppStore } from "../../store";
import { Snackbar } from "@mui/material";

type DimensionDataType = "TEXT" | "NUMBER" | "DATE";

function canManage(role?: string) {
  return role === "SYSADMIN" || role === "COMPANY_ADMIN";
}

function normalizeKey(raw: string) {
  return (raw || "").trim().toLowerCase().replace(/\s+/g, "_");
}

function safeParseJsonObject(input: unknown): Record<string, unknown> | null {
  if (input == null) return {};
  if (typeof input === "object") return input as Record<string, unknown>;
  const s = String(input).trim();
  if (!s) return {};
  try {
    const parsed: unknown = JSON.parse(s);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

export default function ModelDimensionsPage() {
  const user = useAppStore((s) => s.user);
  const activeCompanyId = useAppStore((s) => s.activeCompanyId);

  const dimensions = useAppStore((s) => s.dimensions);
  const dimensionValues = useAppStore((s) => s.dimensionValues);
  const selectedDimensionId = useAppStore((s) => s.selectedDimensionId);

  const loadDimensions = useAppStore((s) => s.loadDimensions);
  const createDimension = useAppStore((s) => s.createDimension);
  const updateDimension = useAppStore((s) => s.updateDimension);
  const selectDimension = useAppStore((s) => s.selectDimension);

  const loadDimensionValues = useAppStore((s) => s.loadDimensionValues);
  const createDimensionValue = useAppStore((s) => s.createDimensionValue);
  const updateDimensionValue = useAppStore((s) => s.updateDimensionValue);

  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // create dimension form
  const [dKey, setDKey] = useState("");
  const [dName, setDName] = useState("");
  const [dType, setDType] = useState<DimensionDataType>("TEXT");
  const [dDesc, setDDesc] = useState("");

  // edit dimension (selected)
  const [editDimName, setEditDimName] = useState("");
  const [editDimType, setEditDimType] = useState<DimensionDataType>("TEXT");
  const [editDimDesc, setEditDimDesc] = useState<string>("");
  const [editDimActive, setEditDimActive] = useState<boolean>(true);
  const isExistingDimension = Boolean(selectedDimensionId);

  // create value form
  const [vKey, setVKey] = useState("");
  const [vName, setVName] = useState("");

  const canEdit = canManage(user?.role);
    
  const [toast, setToast] = useState<{ open: boolean; msg: string; sev: "success" | "error" | "info" }>(
  { open: false, msg: "", sev: "success" }
);



const showToast = (msg: string, sev: "success" | "error" | "info" = "success") =>
  setToast({ open: true, msg, sev });

type DirtyRowPatch = {
  name?: string;
  sortOrder?: number | null;
  attributes?: Record<string, unknown>;
  isActive?: boolean;
};

const [dirty, setDirty] = useState<Record<number, DirtyRowPatch>>({});
const dirtyCount = Object.keys(dirty).length;

const markDirty = useCallback((id: number, patch: DirtyRowPatch) => {
  setDirty((prev) => ({
    ...prev,
    [id]: { ...(prev[id] ?? {}), ...patch },
  }));
}, []);

const clearDirty = useCallback(() => setDirty({}), []);

  const selectedDimension = useMemo(
    () => dimensions.find((d) => d.id === selectedDimensionId) ?? null,
    [dimensions, selectedDimensionId]
 

  );

  // ===============================
  // Active toggle renderer (VALUES)
  // ===============================
const ActiveSwitchRenderer = useCallback(
  (p: ICellRendererParams) => {
    const checked = Boolean(p.value);

    return (
      <Switch
        size="small"
        checked={checked}
        disabled={!canEdit}
        onChange={(_e, next) => {
          // Update UI immediately
          p.node.setData({ ...p.data, isActive: next });

          // Mark row as dirty for batch save
          markDirty(p.data.id, { isActive: next });
        }}
      />
    );
  },
  [canEdit, markDirty]
);

  // keep edit panel in sync with selected dimension
  useEffect(() => {
    if (!selectedDimension) {
      setEditDimName("");
      setEditDimType("TEXT");
      setEditDimDesc("");
      setEditDimActive(true);
      return;
    }
    setEditDimName(selectedDimension.name ?? "");
    setEditDimType(selectedDimension.dataType ?? "TEXT");
    setEditDimDesc(selectedDimension.description ?? "");
    setEditDimActive(!!selectedDimension.isActive);
  }, [selectedDimension]);

  // Load dimensions on company change
  useEffect(() => {
    if (!activeCompanyId) return;

    (async () => {
      try {
        setErr(null);
        setInfo("Loading dimensions…");

        const ds = await loadDimensions(activeCompanyId);

        if (ds.length > 0) {
          selectDimension(ds[0].id);
        } else {
          selectDimension(null);
        }
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : "Failed to load dimensions");
      } finally {
        setInfo(null);
      }
    })();
  }, [activeCompanyId, loadDimensions, selectDimension]);

  // Load values when dimension changes
  useEffect(() => {
    if (!activeCompanyId || !selectedDimensionId) return;

    (async () => {
      try {
        setErr(null);
        setInfo("Loading values…");
        await loadDimensionValues(activeCompanyId, selectedDimensionId);
        setDirty({});
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : "Failed to load dimension values");
      } finally {
        setInfo(null);
      }
    })();
  }, [activeCompanyId, selectedDimensionId, loadDimensionValues]);
  

 const onChangeDimension = (e: SelectChangeEvent<string>) => {
  const v = e.target.value;

  if (dirtyCount > 0) {
    showToast(`You have ${dirtyCount} unsaved change${dirtyCount > 1 ? "s" : ""}`, "info");
  }

  if (!v) {
    selectDimension(null);
    clearDirty();
    return;
  }

  selectDimension(Number(v));
  clearDirty();
};

  const onChangeCreateDataType = (e: SelectChangeEvent<DimensionDataType>) => {
    setDType(e.target.value as DimensionDataType);
  };

  const onChangeEditDataType = (e: SelectChangeEvent<DimensionDataType>) => {
    setEditDimType(e.target.value as DimensionDataType);
  };

const onSaveDimension = async () => {
  if (!activeCompanyId || !selectedDimensionId) return;

  try {
    setErr(null);
    setInfo("Saving dimension…");

    const updated = await updateDimension(activeCompanyId, selectedDimensionId, {
      name: editDimName.trim(),
      description: editDimDesc.trim() ? editDimDesc.trim() : null,
      dataType: editDimType,
      isActive: editDimActive,
    });

    await loadDimensions(activeCompanyId);
    selectDimension(updated.id);
    clearDirty();

    showToast("Dimension saved ✅", "success");
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to save dimension";
    setErr(msg);
    showToast(msg, "error");
  } finally {
    setInfo(null);
  }
};

  // AG Grid columns (VALUES)
  const colDefs = useMemo<ColDef[]>(
    () => [
      { headerName: "Key", field: "key", width: 220, pinned: "left", editable: false },

      { headerName: "Name", field: "name", width: 280, editable: canEdit },

      {
        headerName: "Active",
        field: "isActive",
        width: 130,
        editable: false,
        cellRenderer: ActiveSwitchRenderer,
      },

      { headerName: "Sort", field: "sortOrder", width: 120, editable: canEdit },

      {
        headerName: "Attributes (JSON)",
        field: "attributes",
        flex: 1,
        editable: canEdit,
        valueFormatter: (p) => JSON.stringify(p.value ?? {}),
        valueParser: (p) => {
          const obj = safeParseJsonObject(p.newValue);
          return obj ?? p.oldValue;
        },
      },
    ],
    [canEdit, ActiveSwitchRenderer]
  );

const onValueChanged = useCallback(
  (e: CellValueChangedEvent) => {
    if (!canEdit) return;
    if (!activeCompanyId || !selectedDimensionId) return;
    if (e.newValue === e.oldValue) return;

    const row = e.data as {
      id: number;
      name: string;
      sortOrder?: number | null;
      attributes: Record<string, unknown>;
      isActive: boolean;
    };

    // Normalize sortOrder blank -> null
    const sortOrder =
      row.sortOrder === undefined ||
      row.sortOrder === null ||
      (row.sortOrder as unknown as string) === ""
        ? null
        : Number(row.sortOrder);

    const attrs = safeParseJsonObject(row.attributes);
    if (attrs === null) {
      setErr('Attributes must be a JSON object like {"color":"red"}');
      return;
    }

    markDirty(row.id, {
      name: row.name?.trim(),
      sortOrder,
      attributes: attrs,
      isActive: row.isActive,
    });
  },
  [canEdit, activeCompanyId, selectedDimensionId, markDirty]
);

  const onGridReady = useCallback((e: GridReadyEvent) => {
    e.api.sizeColumnsToFit();
  }, []);

  if (!activeCompanyId) {
    return (
      <PageLayout title="Dimensions" subtitle="Select a company first.">
        <Panel>
          <Alert severity="warning">No active company selected.</Alert>
        </Panel>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Dimensions" subtitle="Define dimensions and their values">
      <Panel>
        <Stack spacing={2}>
          {info && <Alert severity="info">{info}</Alert>}
          {err && <Alert severity="error">{err}</Alert>}

          {!canEdit && (
            <Alert severity="info">
              You are logged in as <b>{user?.role}</b>. Dimensions are editable only by SYSADMIN / COMPANY_ADMIN.
            </Alert>
          )}

          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="flex-start">
            {/* LEFT */}
            <Box sx={{ width: { xs: "100%", md: 380 } }}>
              <Typography variant="h6" fontWeight={900}>
                Dimensions
              </Typography>

              <Divider sx={{ my: 1 }} />

              <Select<string>
                fullWidth
                value={String(selectedDimensionId ?? "")}
                displayEmpty
                onChange={onChangeDimension}
              >
                <MenuItem value="">
                  <em>Select dimension…</em>
                </MenuItem>
                {dimensions.map((d) => (
                  <MenuItem key={d.id} value={String(d.id)}>
                    {d.name} ({d.key}) {d.isActive ? "" : "• inactive"}
                  </MenuItem>
                ))}
              </Select>

              {dimensions.length === 0 && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 1, display: "block" }}
                >
                  No dimensions yet. Create your first one below.
                </Typography>
              )}

              <Divider sx={{ my: 2 }} />

              {/* Edit selected dimension */}
              <Typography variant="subtitle2" color="text.secondary">
                Edit Selected Dimension
              </Typography>

              <Stack spacing={1.5} sx={{ mt: 1 }}>
                <TextField
                  label="Name"
                  value={editDimName}
                  onChange={(e) => setEditDimName(e.target.value)}
                  disabled={!canEdit || !selectedDimensionId}
                />

                <Select<DimensionDataType>
                  value={editDimType}
                  onChange={onChangeEditDataType}
                  disabled={!canEdit || !selectedDimensionId || isExistingDimension}
                >
                  <MenuItem value="TEXT">TEXT</MenuItem>
                  <MenuItem value="NUMBER">NUMBER</MenuItem>
                  <MenuItem value="DATE">DATE</MenuItem>
                </Select>

                <TextField
                  label="Description"
                  value={editDimDesc}
                  onChange={(e) => setEditDimDesc(e.target.value)}
                  disabled={!canEdit || !selectedDimensionId}
                  placeholder="Optional"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={editDimActive}
                      onChange={(e) => setEditDimActive(e.target.checked)}
                      disabled={!canEdit || !selectedDimensionId}
                    />
                  }
                  label={editDimActive ? "Active" : "Inactive"}
                />

                <Button
                  variant="outlined"
                  disabled={!canEdit || !selectedDimensionId || !editDimName.trim()}
                  onClick={onSaveDimension}
                >
                  Save Dimension
                </Button>
              </Stack>

              <Divider sx={{ my: 2 }} />

              {/* Create dimension */}
              <Typography variant="subtitle2" color="text.secondary">
                Create Dimension
              </Typography>
              <input
                type="file"
                accept=".xlsx,.xlsm"
                disabled={!canEdit}
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f || !activeCompanyId) return;
                  try {
                    setErr(null);
                    setInfo("Importing Excel…");
                    await useAppStore.getState().importDimensionsExcel(activeCompanyId, f);
                    showToast("Import complete ✅", "success");
                    await loadDimensions(activeCompanyId);
                    if (selectedDimensionId) {
                      await loadDimensionValues(activeCompanyId, selectedDimensionId);
                    }
                  } catch (ex: unknown) {
                    const msg = ex instanceof Error ? ex.message : "Import failed";
                    setErr(msg);
                    showToast(msg, "error");
                  } finally {
                    setInfo(null);
                    e.target.value = ""; // allow re-upload same file
                  }
                }}
              />

              <Stack spacing={1.5} sx={{ mt: 1 }}>
                <TextField
                  label="Dimension Key"
                  value={dKey}
                  onChange={(e) => setDKey(e.target.value)}
                  placeholder="e.g. region"
                  disabled={!canEdit}
                />
                <TextField
                  label="Dimension Name"
                  value={dName}
                  onChange={(e) => setDName(e.target.value)}
                  placeholder="e.g. Region"
                  disabled={!canEdit}
                />

                <TextField
                  label="Description"
                  value={dDesc}
                  onChange={(e) => setDDesc(e.target.value)}
                  placeholder="Optional description"
                  disabled={!canEdit}
                  multiline
                  minRows={2}
                />

                <Select<DimensionDataType>
                  value={dType}
                  onChange={onChangeCreateDataType}
                  disabled={!canEdit}
                >
                  <MenuItem value="TEXT">TEXT</MenuItem>
                  <MenuItem value="NUMBER">NUMBER</MenuItem>
                  <MenuItem value="DATE">DATE</MenuItem>
                </Select>

                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  disabled={!canEdit || !dKey.trim() || !dName.trim()}
                  onClick={async () => {
                    try {
                      setErr(null);

                      const created = await createDimension(activeCompanyId, {
                        key: normalizeKey(dKey),
                        name: dName.trim(),
                        description: dDesc.trim() ? dDesc.trim() : undefined,
                        dataType: dType,
                      });

                      setDKey("");
                      setDName("");
                      setDDesc("");
                      selectDimension(created.id);
                    } catch (e: unknown) {
                      setErr(e instanceof Error ? e.message : "Failed to create dimension");
                    }
                  }}
                >
                  Create
                </Button>
              </Stack>
            </Box>

            {/* RIGHT */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h6" fontWeight={900}>
                Values {selectedDimension ? `• ${selectedDimension.name}` : ""}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Edit Name / Sort / Attributes inline. Active toggle is in-grid.
              </Typography>

              <Divider sx={{ my: 1 }} />

              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ mb: 1 }}>
                <TextField
                  label="Value Key"
                  value={vKey}
                  onChange={(e) => setVKey(e.target.value)}
                  placeholder="e.g. southeast"
                  disabled={!canEdit || !selectedDimensionId}
                />
                <TextField
                  label="Value Name"
                  value={vName}
                  onChange={(e) => setVName(e.target.value)}
                  placeholder="e.g. South East"
                  disabled={!canEdit || !selectedDimensionId}
                />
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  disabled={!canEdit || !selectedDimensionId || !vKey.trim() || !vName.trim()}
                  onClick={async () => {
                    if (!selectedDimensionId) return;

                    try {
                      setErr(null);

                      await createDimensionValue(activeCompanyId, selectedDimensionId, {
                        key: normalizeKey(vKey),
                        name: vName.trim(),
                        attributes: {},
                      });

                      setVKey("");
                      setVName("");
                      await loadDimensionValues(activeCompanyId, selectedDimensionId);
                    } catch (e: unknown) {
                      setErr(e instanceof Error ? e.message : "Failed to create value");
                    }
                  }}
                >
                  Add Value
                </Button>
              </Stack>

              <Stack direction={{ xs: "column", md: "row" }} spacing={1} sx={{ mb: 1 }} alignItems="center">
                <Button
                  variant="contained"
                  disabled={!canEdit || !selectedDimensionId || dirtyCount === 0}
                  onClick={async () => {
                    if (!activeCompanyId || !selectedDimensionId) return;

                    try {
                      setErr(null);
                      setInfo(`Saving ${dirtyCount} change(s)…`);

                      const entries = Object.entries(dirty).map(([idStr, patch]) => ({
                        id: Number(idStr),
                        patch,
                      }));

                      const results = await Promise.allSettled(
                        entries.map(({ id, patch }) =>
                          updateDimensionValue(activeCompanyId, selectedDimensionId, id, patch)
                        )
                      );

                      const failures = results.filter((r) => r.status === "rejected");
                      if (failures.length > 0) {
                        setErr(`Some rows failed to save (${failures.length}).`);
                        showToast(`Saved with ${failures.length} error(s).`, "error");
                      } else {
                        showToast("All changes saved ✅", "success");
                      }

                      // Refresh truth from DB and clear dirty
                      await loadDimensionValues(activeCompanyId, selectedDimensionId);
                      setDirty({});
                    } catch (e: unknown) {
                      const msg = e instanceof Error ? e.message : "Failed to save changes";
                      setErr(msg);
                      showToast(msg, "error");
                    } finally {
                      setInfo(null);
                    }
                  }}
                >
                  Save Changes {dirtyCount ? `(${dirtyCount})` : ""}
                </Button>

                <Button
                  variant="text"
                  disabled={!canEdit || dirtyCount === 0}
                  onClick={async () => {
                    if (!activeCompanyId || !selectedDimensionId) return;
                    setDirty({});
                    await loadDimensionValues(activeCompanyId, selectedDimensionId);
                    showToast("Changes discarded", "info");
                  }}
                >
                  Discard
                </Button>

                {dirtyCount > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    {dirtyCount} unsaved change(s)
                  </Typography>
                )}
              </Stack>

              <div className="ag-theme-quartz" style={{ height: 620, width: "100%" }}>
                <AgGridReact
                  onGridReady={onGridReady}
                  rowData={selectedDimensionId ? dimensionValues : []}
                  columnDefs={colDefs}
                  defaultColDef={{
                    sortable: true,
                    resizable: true,
                    filter: true,
                    editable: false,
                  }}
                  onCellValueChanged={onValueChanged}
                  animateRows
                  pagination
                  paginationPageSize={200}
                />
              </div>

              {!selectedDimensionId && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 1, display: "block" }}
                >
                  Select a dimension to view/add values.
                </Typography>
              )}
            </Box>
          </Stack>
        </Stack>
      </Panel>
      <Snackbar
        open={toast.open}
        autoHideDuration={2500}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setToast((t) => ({ ...t, open: false }))}
          severity={toast.sev}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {toast.msg}
        </Alert>
      </Snackbar>
    </PageLayout>
  );
}