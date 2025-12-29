import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Card from "../components/Card";
import Button from "../components/Button";
import { apiFetch } from "../lib/api";

interface HabitSummary {
  id: string;
  name: string;
  type: string;
  targetType: string;
  scheduleType: string;
  currentStreak: number;
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<HabitSummary[]>([]);

  useEffect(() => {
    apiFetch("/api/habits").then((data) => setHabits(data.habits)).catch(() => null);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Habits</h2>
          <p className="text-sm text-slate-500">Design rituals you can keep.</p>
        </div>
        <Link to="/habits/new">
          <Button>Create habit</Button>
        </Link>
      </div>

      {habits.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-500">No habits yet. Start with one simple habit today.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {habits.map((habit) => (
            <Card key={habit.id}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{habit.name}</h3>
                  <p className="text-xs text-slate-500">
                    {habit.type} · {habit.targetType} · {habit.scheduleType}
                  </p>
                </div>
                <span className="badge bg-brand-100 text-brand-700">{habit.currentStreak} day streak</span>
              </div>
              <div className="mt-4 flex gap-3">
                <Link to={`/habits/${habit.id}`} className="text-sm text-brand-500">
                  View details
                </Link>
                <Link to={`/habits/${habit.id}/edit`} className="text-sm text-slate-500">
                  Edit
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
