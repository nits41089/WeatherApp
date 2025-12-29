import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { pool } from "../db/pool";

const router = Router();

const settingsSchema = z.object({
  timezone: z.string().min(1),
  weekStart: z.number().min(0).max(6),
  privacyMode: z.boolean(),
  enableOpenAI: z.boolean()
});

router.use(requireAuth);

router.get("/", async (req, res) => {
  const result = await pool.query(
    "SELECT timezone, week_start, privacy_mode, enable_openai FROM users WHERE id = $1",
    [req.session.userId]
  );
  const settings = result.rows[0];
  res.json({
    settings: {
      timezone: settings.timezone,
      weekStart: settings.week_start,
      privacyMode: settings.privacy_mode,
      enableOpenAI: settings.enable_openai
    }
  });
});

router.put("/", async (req, res) => {
  const parsed = settingsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid payload" });
  }

  const { timezone, weekStart, privacyMode, enableOpenAI } = parsed.data;
  const result = await pool.query(
    `UPDATE users
     SET timezone = $1, week_start = $2, privacy_mode = $3, enable_openai = $4, updated_at = NOW()
     WHERE id = $5
     RETURNING id, email, name, timezone, week_start`,
    [timezone, weekStart, privacyMode, enableOpenAI, req.session.userId]
  );

  const user = result.rows[0];
  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      timezone: user.timezone,
      weekStart: user.week_start
    }
  });
});

export default router;
