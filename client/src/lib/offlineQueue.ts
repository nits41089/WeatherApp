import { apiFetch } from "./api";

const QUEUE_KEY = "habit-offline-queue";

export interface OfflineCheckin {
  habitId: string;
  date: string;
  status: string;
  value?: number;
  durationMinutes?: number;
  note?: string;
  mood?: number;
  energy?: number;
  contextTags?: string[];
}

export function enqueueCheckin(checkin: OfflineCheckin) {
  const queue = getQueue();
  queue.push({ ...checkin, queuedAt: new Date().toISOString() });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function getQueue() {
  const raw = localStorage.getItem(QUEUE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Array<OfflineCheckin & { queuedAt: string }>;
  } catch {
    return [];
  }
}

export async function flushQueue() {
  const queue = getQueue();
  if (queue.length === 0) return { flushed: 0 };

  try {
    await apiFetch("/api/checkins/bulk", {
      method: "POST",
      body: JSON.stringify({ checkins: queue })
    });
    localStorage.removeItem(QUEUE_KEY);
    return { flushed: queue.length };
  } catch {
    return { flushed: 0 };
  }
}
