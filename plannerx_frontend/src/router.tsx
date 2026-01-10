import { createBrowserRouter, Navigate } from "react-router-dom";
import { useAppStore } from "./store";
import LoginPage from "./pages/LoginPage";
import AppShell from "./layouts/AppShell";
import HomePage from "./pages/HomePage";
import SheetPage from "./pages/SheetPage";

function RequireAuth({ children }: { children: JSX.Element }) {
  const user = useAppStore(s => s.user);
  return user ? children : <Navigate to="/login" replace />;
}

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    path: "/",
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <HomePage /> },
      { path: "sheet/:sheetKey", element: <SheetPage /> },
    ],
  },
]);