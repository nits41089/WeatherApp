import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { generateDailyCoach, generateIntervention } from "../services/coach";
import { pool } from "../db/pool";

const router = Router();

router.use(requireAuth);

router.post("/daily", async (req, res) => {
  const coach = await generateDailyCoach(req.session.userId!);
  await pool.query(
    "INSERT INTO ai_coaching_events (user_id, type, content) VALUES ($1, $2, $3)",
    [req.session.userId, "daily", coach]
  );
  res.json(coach);
});

router.post("/intervention", async (req, res) => {
  const coach = await generateIntervention(req.session.userId!);
  await pool.query(
    "INSERT INTO ai_coaching_events (user_id, type, content) VALUES ($1, $2, $3)",
    [req.session.userId, "intervention", coach]
  );
  res.json(coach);
});

router.post("/feedback", async (req, res) => {
  const { eventId, feedback } = req.body ?? {};
  if (!eventId) {
    return res.status(400).json({ message: "eventId required" });
  }
  await pool.query(
    "UPDATE ai_coaching_events SET feedback = $1 WHERE id = $2 AND user_id = $3",
    [feedback ?? null, eventId, req.session.userId]
  );
  res.status(204).end();
});

export default router;
