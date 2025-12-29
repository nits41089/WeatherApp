import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Button from "../components/Button";
import { apiFetch } from "../lib/api";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/habits", label: "Habits" },
  { to: "/checkin", label: "Check-In" },
  { to: "/analytics", label: "Analytics" },
  { to: "/settings", label: "Settings" }
];

export default function AppLayout() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await apiFetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-xl font-semibold">Habit Atlas</h1>
            <p className="text-xs text-slate-500">Welcome back, {user?.name}</p>
          </div>
          <Button variant="ghost" onClick={handleLogout}>
            Log out
          </Button>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-6 px-4 pb-20 pt-6 lg:pb-6">
        <aside className="hidden w-56 flex-col gap-2 lg:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-xl px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-100"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </aside>
        <main className="flex-1">
          <Outlet />
        </main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 lg:hidden">
        <div className="grid grid-cols-5 text-xs">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-2 py-3 ${
                  isActive ? "text-brand-500" : "text-slate-500"
                }`
              }
            >
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
