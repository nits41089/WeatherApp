import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Card from "../components/Card";
import Button from "../components/Button";
import { apiFetch } from "../lib/api";

interface HabitDetail {
  id: string;
  name: string;
  type: string;
  targetType: string;
  scheduleType: string;
  notes?: string;
  difficulty: number;
  currentStreak: number;
}

interface Checkin {
  id: string;
  date: string;
  status: string;
  value?: number;
}

export default function HabitDetailPage() {
  const { habitId } = useParams();
  const [habit, setHabit] = useState<HabitDetail | null>(null);
  const [checkins, setCheckins] = useState<Checkin[]>([]);

  useEffect(() => {
    if (!habitId) return;
    apiFetch(`/api/habits/${habitId}`).then((data) => setHabit(data.habit)).catch(() => null);
    apiFetch(`/api/checkins?habitId=${habitId}&range=30`).then((data) => setCheckins(data.checkins)).catch(() => null);
  }, [habitId]);

  const handleQuickCheckin = async () => {
    if (!habitId) return;
    await apiFetch("/api/checkins", {
      method: "POST",
      body: JSON.stringify({ habitId, date: new Date().toISOString().slice(0, 10), status: "done" })
    });
    const data = await apiFetch(`/api/checkins?habitId=${habitId}&range=30`);
    setCheckins(data.checkins);
  };

  if (!habit) {
    return <p className="text-sm text-slate-500">Loading habit...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{habit.name}</h2>
          <p className="text-sm text-slate-500">{habit.type} · {habit.targetType} · {habit.scheduleType}</p>
        </div>
        <div className="flex gap-2">
          <Link to={`/habits/${habit.id}/edit`}>
            <Button variant="secondary">Edit</Button>
          </Link>
          <Button onClick={handleQuickCheckin}>Quick check-in</Button>
        </div>
      </div>

      <Card>
        <h3 className="text-sm font-semibold">Details</h3>
        <div className="mt-3 grid gap-2 text-sm text-slate-600 dark:text-slate-300">
          <p>Difficulty: {habit.difficulty}/5</p>
          <p>Current streak: {habit.currentStreak} days</p>
          <p>Notes: {habit.notes || "No notes yet."}</p>
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold">Recent check-ins</h3>
        <div className="mt-3 space-y-2 text-sm">
          {checkins.map((checkin) => (
            <div key={checkin.id} className="flex items-center justify-between border-b border-slate-200 pb-2 last:border-b-0 dark:border-slate-800">
              <span>{checkin.date}</span>
              <span className="text-slate-500">{checkin.status}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
