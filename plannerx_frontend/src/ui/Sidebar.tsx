import { useNavigate } from "react-router-dom";
import { useAppStore } from "../store";

const SHEETS = [
  "REV_GOAL_PARENT_TOTAL",
  "REV_GOAL_PARENT_WEEK",
  "REV_GOAL_PARENT_REGION_CATEGORY_WEEK",
];

export default function Sidebar() {
  const navigate = useNavigate();
  const setSheet = useAppStore((s) => s.setSheet);
  const user = useAppStore((s) => s.user);

  const isAdmin =
    user?.role === "SYSADMIN" || user?.role === "COMPANY_ADMIN";

  return (
    <div className="w-72 bg-zinc-950 border-r border-zinc-900 p-4 space-y-6">
      {/* Home */}
      <div>
        <div className="text-lg font-semibold mb-2">Navigation</div>

        <button
          className="block w-full text-left px-3 py-2 rounded hover:bg-zinc-900"
          onClick={() => {
            setSheet(null);
            navigate("/");
          }}
        >
          Home
        </button>
      </div>

      {/* Sheets */}
      <div>
        <div className="text-sm uppercase tracking-wide text-zinc-400 mb-2">
          Sheets
        </div>

        {SHEETS.map((s) => (
          <button
            key={s}
            className="block w-full text-left px-3 py-2 rounded hover:bg-zinc-900"
            onClick={() => {
              setSheet(s);
              navigate(`/sheet/${s}`);
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Company Administration */}
      {isAdmin && (
        <div>
          <div className="text-sm uppercase tracking-wide text-zinc-400 mb-2">
            Company Administration
          </div>

          <button
            className="block w-full text-left px-3 py-2 rounded hover:bg-zinc-900"
            onClick={() => navigate("/admin/company-settings")}
          >
            Company Settings
          </button>

          <button
            className="block w-full text-left px-3 py-2 rounded hover:bg-zinc-900"
            onClick={() => navigate("/admin/users")}
          >
            Users
          </button>

          <button
            className="block w-full text-left px-3 py-2 rounded hover:bg-zinc-900"
            onClick={() => navigate("/admin/company-calendar")}
          >
            Company Calendar
          </button>
        </div>
      )}
    </div>
  );
}