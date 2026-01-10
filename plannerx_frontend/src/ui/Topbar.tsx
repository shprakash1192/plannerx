import { useAppStore } from "../store";

export default function Topbar() {
  const user = useAppStore(s => s.user);
  const logout = useAppStore(s => s.logout);

  return (
    <div className="h-14 border-b border-zinc-900 bg-zinc-950 flex items-center justify-between px-4">
      <div>
        {user?.name} <span className="text-zinc-500">({user?.role})</span>
      </div>
      <button onClick={logout} className="text-sm">
        Logout
      </button>
    </div>
  );
}
