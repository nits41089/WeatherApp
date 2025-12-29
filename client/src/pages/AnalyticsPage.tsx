import { useEffect, useState } from "react";
import Card from "../components/Card";
import { apiFetch } from "../lib/api";
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip } from "recharts";

interface WeeklyPattern {
  day: string;
  rate: number;
}

interface Heatmap {
  date: string;
  count: number;
}

interface Correlation {
  pair: string;
  score: number;
}

export default function AnalyticsPage() {
  const [weekly, setWeekly] = useState<WeeklyPattern[]>([]);
  const [heatmap, setHeatmap] = useState<Heatmap[]>([]);
  const [correlations, setCorrelations] = useState<Correlation[]>([]);

  useEffect(() => {
    apiFetch("/api/analytics/summary")
      .then((data) => {
        setWeekly(data.weeklyPattern);
        setHeatmap(data.heatmap);
        setCorrelations(data.correlations);
      })
      .catch(() => null);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Analytics</h2>
        <p className="text-sm text-slate-500">Understand patterns and stay in control.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="text-sm font-semibold">Weekly pattern</h3>
          <div className="mt-4 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekly}>
                <XAxis dataKey="day" />
                <Tooltip />
                <Bar dataKey="rate" fill="#3f82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h3 className="text-sm font-semibold">Correlation cues</h3>
          <ul className="mt-4 space-y-3 text-sm">
            {correlations.map((item) => (
              <li key={item.pair} className="flex items-center justify-between">
                <span>{item.pair}</span>
                <span className="text-brand-500">{item.score}%</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <Card>
        <h3 className="text-sm font-semibold">Consistency heatmap (last 30 days)</h3>
        <div className="mt-4 grid grid-cols-10 gap-2">
          {heatmap.map((cell) => (
            <div
              key={cell.date}
              title={`${cell.date}: ${cell.count} check-ins`}
              className={`h-6 w-6 rounded ${
                cell.count === 0
                  ? "bg-slate-200 dark:bg-slate-800"
                  : cell.count < 2
                  ? "bg-brand-200"
                  : cell.count < 4
                  ? "bg-brand-400"
                  : "bg-brand-600"
              }`}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}
