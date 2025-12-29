import { Router } from "express";
import { z } from "zod";
import { pool } from "../db/pool";
import { requireAuth } from "../middleware/auth";

const router = Router();

const checkinSchema = z.object({
  habitId: z.string().uuid(),
  date: z.string(),
  status: z.enum(["done", "missed", "skipped"]),
  value: z.number().optional(),
  durationMinutes: z.number().optional(),
  note: z.string().optional(),
  mood: z.number().optional(),
  energy: z.number().optional(),
  contextTags: z.array(z.string()).optional()
});

router.use(requireAuth);

router.get("/", async (req, res) => {
  const { start, end, habitId, range } = req.query;
  let query = "SELECT id, habit_id, date, status, value FROM checkins WHERE user_id = $1";
  const values: Array<string | number> = [req.session.userId!];

  if (habitId) {
    values.push(String(habitId));
    query += ` AND habit_id = $${values.length}`;
  }

  if (start && end) {
    values.push(String(start));
    values.push(String(end));
    query += ` AND date BETWEEN $${values.length - 1} AND $${values.length}`;
  } else if (range) {
    values.push(Number(range));
    query += ` AND date >= CURRENT_DATE - $${values.length}::int`;
  }

  query += " ORDER BY date DESC";

  const result = await pool.query(query, values);
  res.json({ checkins: result.rows.map((row) => ({
    id: row.id,
    habitId: row.habit_id,
    date: row.date.toISOString().slice(0, 10),
    status: row.status,
    value: row.value
  })) });
});

router.get("/today", async (req, res) => {
  const habits = await pool.query(
    `SELECT h.id, h.name, h.target_type, h.target_unit, h.target_min, h.target_max, s.schedule_type
     FROM habits h
     LEFT JOIN habit_schedules s ON s.habit_id = h.id
     WHERE h.user_id = $1 AND h.archived = FALSE`,
    [req.session.userId]
  );

  res.json({
    habits: habits.rows.map((habit) => ({
      id: habit.id,
      name: habit.name,
      targetType: habit.target_type,
      targetUnit: habit.target_unit,
      targetMin: habit.target_min,
      targetMax: habit.target_max,
      scheduleType: habit.schedule_type
    }))
  });
});

router.post("/", async (req, res) => {
  const parsed = checkinSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid payload" });
  }

  const payload = parsed.data;
  const result = await pool.query(
    `INSERT INTO checkins (habit_id, user_id, date, status, value, duration_minutes, note, mood, energy, context_tags)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (habit_id, date)
     DO UPDATE SET status = EXCLUDED.status, value = EXCLUDED.value, duration_minutes = EXCLUDED.duration_minutes,
       note = EXCLUDED.note, mood = EXCLUDED.mood, energy = EXCLUDED.energy, context_tags = EXCLUDED.context_tags,
       updated_at = NOW()
     RETURNING id`,
    [
      payload.habitId,
      req.session.userId,
      payload.date,
      payload.status,
      payload.value,
      payload.durationMinutes,
      payload.note,
      payload.mood,
      payload.energy,
      payload.contextTags
    ]
  );

  res.status(201).json({ checkin: { id: result.rows[0].id } });
});

router.post("/bulk", async (req, res) => {
  const listSchema = z.object({ checkins: z.array(checkinSchema) });
  const parsed = listSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid payload" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const checkin of parsed.data.checkins) {
      await client.query(
        `INSERT INTO checkins (habit_id, user_id, date, status, value, duration_minutes, note, mood, energy, context_tags)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (habit_id, date)
         DO UPDATE SET status = EXCLUDED.status, value = EXCLUDED.value, duration_minutes = EXCLUDED.duration_minutes,
           note = EXCLUDED.note, mood = EXCLUDED.mood, energy = EXCLUDED.energy, context_tags = EXCLUDED.context_tags,
           updated_at = NOW()`,
        [
          checkin.habitId,
          req.session.userId,
          checkin.date,
          checkin.status,
          checkin.value,
          checkin.durationMinutes,
          checkin.note,
          checkin.mood,
          checkin.energy,
          checkin.contextTags
        ]
      );
    }
    await client.query("COMMIT");
    res.json({ count: parsed.data.checkins.length });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ message: "Bulk update failed" });
  } finally {
    client.release();
  }
});

router.put("/:id", async (req, res) => {
  const parsed = checkinSchema.partial({ habitId: true, date: true, status: true }).safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid payload" });
  }

  const payload = parsed.data;
  const result = await pool.query(
    `UPDATE checkins
     SET status = $1, value = $2, duration_minutes = $3, note = $4, mood = $5, energy = $6, context_tags = $7, updated_at = NOW()
     WHERE id = $8 AND user_id = $9
     RETURNING id`,
    [payload.status, payload.value, payload.durationMinutes, payload.note, payload.mood, payload.energy, payload.contextTags, req.params.id, req.session.userId]
  );

  if (!result.rows.length) {
    return res.status(404).json({ message: "Check-in not found" });
  }

  res.json({ checkin: { id: req.params.id } });
});

router.delete("/:id", async (req, res) => {
  await pool.query("DELETE FROM checkins WHERE id = $1 AND user_id = $2", [req.params.id, req.session.userId]);
  res.status(204).end();
});

export default router;
