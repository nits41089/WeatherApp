import bcrypt from "bcryptjs";
import { pool } from "./pool";

async function seed() {
  const passwordHash = await bcrypt.hash("password123", 10);
  const userResult = await pool.query(
    `INSERT INTO users (email, password_hash, name, timezone, week_start, privacy_mode, enable_openai)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    ["demo@habitatlas.app", passwordHash, "Demo User", "UTC", 1, true, false]
  );

  const userId = userResult.rows[0].id;

  const habitResult = await pool.query(
    `INSERT INTO habits (user_id, name, type, target_type, target_unit, target_min, target_max, target_step, difficulty, notes)
     VALUES
      ($1, $2, 'build', 'binary', NULL, NULL, NULL, NULL, 3, 'Morning reset'),
      ($1, $3, 'build', 'quantitative', 'glasses', 1, 8, 1, 2, 'Hydration boost'),
      ($1, $4, 'quit', 'timed', 'minutes', 10, 60, 5, 4, 'Evening screen curfew')
     RETURNING id`,
    [userId, "Meditate", "Drink Water", "No Screen After 9PM"]
  );

  await pool.query(
    `INSERT INTO habit_schedules (habit_id, schedule_type)
     VALUES ($1, 'daily'), ($2, 'daily'), ($3, 'weekly_days')`,
    [habitResult.rows[0].id, habitResult.rows[1].id, habitResult.rows[2].id]
  );

  await pool.query(
    `INSERT INTO checkins (habit_id, user_id, date, status, value, mood, energy)
     VALUES
      ($1, $4, CURRENT_DATE - 1, 'done', NULL, 4, 4),
      ($1, $4, CURRENT_DATE - 2, 'done', NULL, 3, 4),
      ($2, $4, CURRENT_DATE - 1, 'done', 6, 4, 5),
      ($3, $4, CURRENT_DATE - 3, 'missed', NULL, 2, 2)`,
    [habitResult.rows[0].id, habitResult.rows[1].id, habitResult.rows[2].id, userId]
  );

  console.log("Seed data inserted");
}

seed()
  .then(() => pool.end())
  .catch((error) => {
    console.error(error);
    pool.end();
    process.exit(1);
  });
