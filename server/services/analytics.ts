import { pool } from "../db/pool";

interface CheckinRow {
  date: Date;
  status: string;
}

export function computeStreakFromRows(rows: CheckinRow[]) {
  let current = 0;
  let longest = 0;
  let running = 0;
  let lastDate: Date | null = null;

  for (const row of rows) {
    if (row.status !== "done") {
      running = 0;
      lastDate = row.date;
      continue;
    }
    if (lastDate) {
      const diff = (lastDate.getTime() - row.date.getTime()) / (1000 * 60 * 60 * 24);
      if (diff > 1.5) {
        running = 0;
      }
    }
    running += 1;
    if (running > longest) longest = running;
    if (current === 0) current = running;
    lastDate = row.date;
  }

  return { current, longest };
}

export async function getCompletionRates(userId: string) {
  const habitsResult = await pool.query("SELECT id, name FROM habits WHERE user_id = $1 AND archived = FALSE", [userId]);
  const habits = habitsResult.rows;
  const rates = [];

  for (const habit of habits) {
    const rate7 = await getCompletionRate(userId, habit.id, 7);
    const rate30 = await getCompletionRate(userId, habit.id, 30);
    rates.push({ habitId: habit.id, name: habit.name, rate7, rate30 });
  }

  return rates;
}

async function getCompletionRate(userId: string, habitId: string, days: number) {
  const result = await pool.query(
    `SELECT COUNT(*) FILTER (WHERE status = 'done')::float AS done,
            COUNT(*)::float AS total
     FROM checkins
     WHERE user_id = $1 AND habit_id = $2 AND date >= CURRENT_DATE - $3::int`,
    [userId, habitId, days]
  );
  const row = result.rows[0];
  if (!row || row.total === 0) return 0;
  return Math.round((row.done / row.total) * 100);
}

export async function getStreaks(userId: string) {
  const habitsResult = await pool.query("SELECT id, name FROM habits WHERE user_id = $1 AND archived = FALSE", [userId]);
  const habits = habitsResult.rows;
  const streaks = [];

  for (const habit of habits) {
    const { current, longest } = await calculateStreak(userId, habit.id);
    streaks.push({ habitId: habit.id, name: habit.name, current, longest });
  }

  return streaks;
}

export async function calculateStreak(userId: string, habitId: string) {
  const result = await pool.query(
    `SELECT date, status FROM checkins
     WHERE user_id = $1 AND habit_id = $2
     ORDER BY date DESC`,
    [userId, habitId]
  );

  return computeStreakFromRows(result.rows as CheckinRow[]);
}

export async function getTrend(userId: string, days: number) {
  const result = await pool.query(
    `SELECT date, COUNT(*) AS count
     FROM checkins
     WHERE user_id = $1 AND date >= CURRENT_DATE - $2::int
     GROUP BY date
     ORDER BY date`,
    [userId, days]
  );
  return result.rows.map((row) => ({ date: row.date.toISOString().slice(0, 10), count: Number(row.count) }));
}

export async function getHeatmap(userId: string, days: number) {
  const result = await pool.query(
    `SELECT date, COUNT(*) AS count
     FROM checkins
     WHERE user_id = $1 AND date >= CURRENT_DATE - $2::int
     GROUP BY date`,
    [userId, days]
  );

  const map = new Map<string, number>();
  for (const row of result.rows) {
    map.set(row.date.toISOString().slice(0, 10), Number(row.count));
  }

  const today = new Date();
  const cells = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const key = date.toISOString().slice(0, 10);
    cells.push({ date: key, count: map.get(key) ?? 0 });
  }

  return cells;
}

export async function getWeeklyPattern(userId: string) {
  const result = await pool.query(
    `SELECT EXTRACT(DOW FROM date) AS dow,
            COUNT(*) FILTER (WHERE status = 'done')::float AS done,
            COUNT(*)::float AS total
     FROM checkins
     WHERE user_id = $1 AND date >= CURRENT_DATE - 60
     GROUP BY dow
     ORDER BY dow`,
    [userId]
  );

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days.map((day, index) => {
    const row = result.rows.find((r) => Number(r.dow) === index);
    if (!row || row.total === 0) {
      return { day, rate: 0 };
    }
    return { day, rate: Math.round((row.done / row.total) * 100) };
  });
}

export async function getCorrelations(userId: string) {
  const habitsResult = await pool.query("SELECT id, name FROM habits WHERE user_id = $1 AND archived = FALSE", [userId]);
  const habits = habitsResult.rows;
  const correlations = [];

  for (let i = 0; i < habits.length; i += 1) {
    for (let j = i + 1; j < habits.length; j += 1) {
      const habitA = habits[i];
      const habitB = habits[j];
      const score = await computeCorrelation(userId, habitA.id, habitB.id);
      correlations.push({ pair: `${habitA.name} & ${habitB.name}`, score });
    }
  }

  return correlations.slice(0, 3);
}

async function computeCorrelation(userId: string, habitA: string, habitB: string) {
  const result = await pool.query(
    `SELECT a.date,
            MAX(CASE WHEN a.status = 'done' THEN 1 ELSE 0 END) AS done_a,
            MAX(CASE WHEN b.status = 'done' THEN 1 ELSE 0 END) AS done_b
     FROM checkins a
     FULL OUTER JOIN checkins b
       ON a.date = b.date
       AND a.user_id = b.user_id
       AND b.habit_id = $3
     WHERE a.user_id = $1 AND a.habit_id = $2
     GROUP BY a.date`,
    [userId, habitA, habitB]
  );

  if (result.rows.length === 0) return 0;

  const matched = result.rows.filter((row) => row.done_a === 1 && row.done_b === 1).length;
  return Math.round((matched / result.rows.length) * 100);
}
