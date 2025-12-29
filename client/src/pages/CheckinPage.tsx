import { useEffect, useState } from "react";
import Card from "../components/Card";
import Button from "../components/Button";
import { apiFetch } from "../lib/api";
import { enqueueCheckin, flushQueue, getQueue } from "../lib/offlineQueue";

interface TodayHabit {
  id: string;
  name: string;
  targetType: string;
  targetUnit?: string;
  targetMin?: number;
  targetMax?: number;
  scheduleType: string;
}

export default function CheckinPage() {
  const [habits, setHabits] = useState<TodayHabit[]>([]);
  const [offlineCount, setOfflineCount] = useState(0);

  const load = async () => {
    const data = await apiFetch("/api/checkins/today");
    setHabits(data.habits);
  };

  useEffect(() => {
    load().catch(() => null);
    setOfflineCount(getQueue().length);
    const handleOnline = async () => {
      await flushQueue();
      setOfflineCount(getQueue().length);
      load().catch(() => null);
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  const handleCheckin = async (habit: TodayHabit) => {
    const payload = {
      habitId: habit.id,
      date: new Date().toISOString().slice(0, 10),
      status: "done"
    };
    if (!navigator.onLine) {
      enqueueCheckin(payload);
      setOfflineCount(getQueue().length);
      return;
    }
    await apiFetch("/api/checkins", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    await load();
  };

  const handleSync = async () => {
    await flushQueue();
    setOfflineCount(getQueue().length);
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Today</h2>
          <p className="text-sm text-slate-500">Tap to log your progress. Offline queue: {offlineCount}</p>
        </div>
        <Button variant="secondary" onClick={handleSync}>Sync offline</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {habits.map((habit) => (
          <Card key={habit.id}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{habit.name}</h3>
                <p className="text-xs text-slate-500">{habit.targetType}</p>
              </div>
              <Button onClick={() => handleCheckin(habit)}>Check in</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
