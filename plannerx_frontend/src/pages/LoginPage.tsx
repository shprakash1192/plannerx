import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../store";

export default function LoginPage() {
  const login = useAppStore(s => s.login);
  const navigate = useNavigate();
  const [u, setU] = useState("");
  const [p, setP] = useState("");

  return (
    <div className="h-full flex items-center justify-center bg-zinc-950">
      <div className="w-96 bg-zinc-900 border border-zinc-800 rounded-xl p-8">
        <div className="text-3xl font-semibold mb-6">Planner X</div>

        <input
          className="w-full mb-3 px-3 py-2 rounded bg-zinc-950 border border-zinc-800"
          placeholder="Username"
          value={u}
          onChange={e => setU(e.target.value)}
        />
        <input
          type="password"
          className="w-full mb-4 px-3 py-2 rounded bg-zinc-950 border border-zinc-800"
          placeholder="Password"
          value={p}
          onChange={e => setP(e.target.value)}
        />

        <button
          onClick={async () => {
            await login(u, p);
            navigate("/");
          }}
          className="w-full bg-white text-black py-2 rounded font-medium"
        >
          Sign in
        </button>
      </div>
    </div>
  );
}