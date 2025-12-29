import { Router } from "express";
import { z } from "zod";
import { pool } from "../db/pool";
import { requireAuth } from "../middleware/auth";
import { calculateStreak } from "../services/analytics";

const router = Router();

const habitSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["build", "quit"]),
  scheduleType: z.enum(["daily", "weekly_days", "times_per_week", "interval", "range"]),
  targetType: z.enum(["binary", "quantitative", "timed"]),
  targetUnit: z.string().optional(),
  targetMin: z.number().optional(),
  targetMax: z.number().optional(),
  targetStep: z.number().optional(),
  difficulty: z.number().min(1).max(5),
  notes: z.string().optional()
});

router.use(requireAuth);

router.get("/", async (req, res) => {
  const result = await pool.query(
    `SELECT h.id, h.name, h.type, h.target_type, s.schedule_type
     FROM habits h
     LEFT JOIN habit_schedules s ON s.habit_id = h.id
     WHERE h.user_id = $1 AND h.archived = FALSE`,
    [req.session.userId]
  );

  const habits = await Promise.all(
    result.rows.map(async (habit) => {
      const streak = await calculateStreak(req.session.userId!, habit.id);
      return {
        id: habit.id,
        name: habit.name,
        type: habit.type,
        targetType: habit.target_type,
        scheduleType: habit.schedule_type ?? "daily",
        currentStreak: streak.current
      };
    })
  );

  res.json({ habits });
});

router.post("/", async (req, res) => {
  const parsed = habitSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid payload" });
  }

  const {
    name,
    type,
    scheduleType,
    targetType,
    targetUnit,
    targetMin,
    targetMax,
    targetStep,
    difficulty,
    notes
  } = parsed.data;

  const habitResult = await pool.query(
    `INSERT INTO habits (user_id, name, type, target_type, target_unit, target_min, target_max, target_step, difficulty, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING id, name, type, target_type, target_unit, target_min, target_max, target_step, difficulty, notes`,
    [req.session.userId, name, type, targetType, targetUnit, targetMin, targetMax, targetStep, difficulty, notes]
  );

  const habit = habitResult.rows[0];

  await pool.query(
    `INSERT INTO habit_schedules (habit_id, schedule_type)
     VALUES ($1, $2)`,
    [habit.id, scheduleType]
  );

  res.status(201).json({
    habit: {
      id: habit.id,
      name: habit.name,
      type: habit.type,
      targetType: habit.target_type,
      scheduleType
    }
  });
});

router.get("/:id", async (req, res) => {
  const habitResult = await pool.query(
    `SELECT h.*, s.schedule_type
     FROM habits h
     LEFT JOIN habit_schedules s ON s.habit_id = h.id
     WHERE h.id = $1 AND h.user_id = $2`,
    [req.params.id, req.session.userId]
  );

  if (!habitResult.rows.length) {
    return res.status(404).json({ message: "Habit not found" });
  }

  const habit = habitResult.rows[0];
  const streak = await calculateStreak(req.session.userId!, habit.id);

  res.json({
    habit: {
      id: habit.id,
      name: habit.name,
      type: habit.type,
      targetType: habit.target_type,
      targetUnit: habit.target_unit,
      targetMin: habit.target_min,
      targetMax: habit.target_max,
      targetStep: habit.target_step,
      difficulty: habit.difficulty,
      notes: habit.notes,
      scheduleType: habit.schedule_type ?? "daily",
      currentStreak: streak.current
    }
  });
});

router.put("/:id", async (req, res) => {
  const parsed = habitSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid payload" });
  }

  const {
    name,
    type,
    scheduleType,
    targetType,
    targetUnit,
    targetMin,
    targetMax,
    targetStep,
    difficulty,
    notes
  } = parsed.data;

  const habitResult = await pool.query(
    `UPDATE habits
     SET name = $1, type = $2, target_type = $3, target_unit = $4, target_min = $5, target_max = $6, target_step = $7, difficulty = $8, notes = $9, updated_at = NOW()
     WHERE id = $10 AND user_id = $11
     RETURNING id`,
    [name, type, targetType, targetUnit, targetMin, targetMax, targetStep, difficulty, notes, req.params.id, req.session.userId]
  );

  if (!habitResult.rows.length) {
    return res.status(404).json({ message: "Habit not found" });
  }

  await pool.query("UPDATE habit_schedules SET schedule_type = $1 WHERE habit_id = $2", [scheduleType, req.params.id]);

  res.json({ habit: { id: req.params.id } });
});

router.delete("/:id", async (req, res) => {
  await pool.query("UPDATE habits SET archived = TRUE WHERE id = $1 AND user_id = $2", [req.params.id, req.session.userId]);
  res.status(204).end();
});

router.post("/:id/restore", async (req, res) => {
  await pool.query("UPDATE habits SET archived = FALSE WHERE id = $1 AND user_id = $2", [req.params.id, req.session.userId]);
  res.json({ restored: true });
});

router.post("/:id/clone", async (req, res) => {
  const result = await pool.query(
    `INSERT INTO habits (user_id, name, type, target_type, target_unit, target_min, target_max, target_step, difficulty, notes)
     SELECT user_id, name || ' (Copy)', type, target_type, target_unit, target_min, target_max, target_step, difficulty, notes
     FROM habits WHERE id = $1 AND user_id = $2
     RETURNING id`,
    [req.params.id, req.session.userId]
  );

  if (!result.rows.length) {
    return res.status(404).json({ message: "Habit not found" });
  }

  res.status(201).json({ habit: { id: result.rows[0].id } });
});

export default router;
