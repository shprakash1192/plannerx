import { useNavigate } from "react-router-dom";
import { useAppStore } from "../store";

const SHEETS = [
  "REV_GOAL_PARENT_TOTAL",
  "REV_GOAL_PARENT_WEEK",
  "REV_GOAL_PARENT_REGION_CATEGORY_WEEK",
];

export default function Sidebar() {
  const navigate = useNavigate();
  const setSheet = useAppStore(s => s.setSheet);

  return (
    <div className="w-72 bg-zinc-950 border-r border-zinc-900 p-4">
      <div className="text-lg font-semibold mb-4">Sheets</div>

      <button
        className="block w-full text-left px-3 py-2 rounded hover:bg-zinc-900"
        onClick={() => {
          setSheet(null);
          navigate("/");
        }}
      >
        Home
      </button>

      {SHEETS.map(s => (
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
  );
}
