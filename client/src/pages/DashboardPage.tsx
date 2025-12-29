import { useEffect, useState } from "react";
import Card from "../components/Card";
import Button from "../components/Button";
import { apiFetch } from "../lib/api";
import { LineChart, Line, ResponsiveContainer, XAxis, Tooltip } from "recharts";

interface DashboardSummary {
  completionRates: Array<{ habitId: string; name: string; rate7: number; rate30: number }>;
  streaks: Array<{ habitId: string; name: string; current: number; longest: number }>;
  trend: Array<{ date: string; count: number }>;
}

interface CoachInsight {
  message: string;
  prompts: string[];
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [coach, setCoach] = useState<CoachInsight | null>(null);

  useEffect(() => {
    apiFetch("/api/analytics/dashboard?range=30").then(setSummary).catch(() => null);
    apiFetch("/api/coach/daily", { method: "POST" }).then(setCoach).catch(() => null);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Your habit pulse</h2>
          <p className="text-sm text-slate-500">Track momentum and celebrate your streaks.</p>
        </div>
        <Button variant="secondary">Start focus session</Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <h3 className="text-sm font-semibold">Coach insight</h3>
          <p className="mt-2 text-sm text-slate-500">{coach?.message ?? "Loading daily coaching..."}</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            {coach?.prompts?.map((prompt) => (
              <li key={prompt} className="rounded-xl bg-slate-100 px-3 py-2 dark:bg-slate-800">
                {prompt}
              </li>
            ))}
          </ul>
        </Card>
        <Card className="lg:col-span-2">
          <h3 className="text-sm font-semibold">Last 30 days momentum</h3>
          <div className="mt-4 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={summary?.trend ?? []}>
                <XAxis dataKey="date" hide />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#3f82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="text-sm font-semibold">Completion rates</h3>
          <div className="mt-4 space-y-3">
            {summary?.completionRates?.map((habit) => (
              <div key={habit.habitId} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{habit.name}</p>
                  <p className="text-xs text-slate-500">7-day: {habit.rate7}% · 30-day: {habit.rate30}%</p>
                </div>
                <span className="badge bg-brand-100 text-brand-700">Active</span>
              </div>
            )) ?? <p className="text-sm text-slate-500">No habits yet.</p>}
          </div>
        </Card>
        <Card>
          <h3 className="text-sm font-semibold">Streak highlights</h3>
          <div className="mt-4 space-y-3">
            {summary?.streaks?.map((habit) => (
              <div key={habit.habitId} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{habit.name}</p>
                  <p className="text-xs text-slate-500">Current: {habit.current} · Longest: {habit.longest}</p>
                </div>
                <span className="badge bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  Streak
                </span>
              </div>
            )) ?? <p className="text-sm text-slate-500">No streaks tracked.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
