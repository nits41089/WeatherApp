import { Route, Routes, Navigate } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import HabitsPage from "./pages/HabitsPage";
import HabitNewPage from "./pages/HabitNewPage";
import HabitDetailPage from "./pages/HabitDetailPage";
import HabitEditPage from "./pages/HabitEditPage";
import CheckinPage from "./pages/CheckinPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import SettingsPage from "./pages/SettingsPage";
import AppLayout from "./layouts/AppLayout";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { useTheme } from "./hooks/useTheme";

function AppRoutes() {
  const { user, initializing } = useAuth();
  useTheme();

  if (initializing) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg font-semibold">Loading Habit Atlas...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <RegisterPage />} />
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/habits" element={<HabitsPage />} />
        <Route path="/habits/new" element={<HabitNewPage />} />
        <Route path="/habits/:habitId" element={<HabitDetailPage />} />
        <Route path="/habits/:habitId/edit" element={<HabitEditPage />} />
        <Route path="/checkin" element={<CheckinPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
