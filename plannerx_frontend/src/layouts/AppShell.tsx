import { Outlet } from "react-router-dom";
import Sidebar from "../ui/Sidebar";
import Topbar from "../ui/Topbar";

export default function AppShell() {
  return (
    <div className="h-full flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <div className="flex-1 overflow-hidden">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
