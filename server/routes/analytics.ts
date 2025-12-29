import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getCompletionRates, getStreaks, getTrend, getHeatmap, getWeeklyPattern, getCorrelations } from "../services/analytics";
import { pool } from "../db/pool";

const router = Router();

router.use(requireAuth);

router.get("/dashboard", async (req, res) => {
  const range = Number(req.query.range ?? 30);
  const completionRates = await getCompletionRates(req.session.userId!);
  const streaks = await getStreaks(req.session.userId!);
  const trend = await getTrend(req.session.userId!, range);

  res.json({ completionRates, streaks, trend });
});

router.get("/summary", async (req, res) => {
  const heatmap = await getHeatmap(req.session.userId!, 30);
  const weeklyPattern = await getWeeklyPattern(req.session.userId!);
  const correlations = await getCorrelations(req.session.userId!);

  res.json({ heatmap, weeklyPattern, correlations });
});

router.get("/export/csv", async (req, res) => {
  const result = await pool.query(
    `SELECT h.name, c.date, c.status, c.value, c.note
     FROM checkins c
     JOIN habits h ON h.id = c.habit_id
     WHERE c.user_id = $1
     ORDER BY c.date DESC`,
    [req.session.userId]
  );

  const header = "habit,date,status,value,note";
  const rows = result.rows.map((row) => [row.name, row.date.toISOString().slice(0, 10), row.status, row.value ?? "", row.note ?? ""].join(","));
  const csv = [header, ...rows].join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=habit-export.csv");
  res.send(csv);
});

router.get("/export/json", async (req, res) => {
  const habits = await pool.query("SELECT * FROM habits WHERE user_id = $1", [req.session.userId]);
  const checkins = await pool.query("SELECT * FROM checkins WHERE user_id = $1", [req.session.userId]);
  res.json({ habits: habits.rows, checkins: checkins.rows });
});

export default router;
