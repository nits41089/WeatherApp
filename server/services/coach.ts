import { pool } from "../db/pool";

interface CoachResponse {
  message: string;
  prompts: string[];
}

interface UserCoachPrefs {
  privacyMode: boolean;
  enableOpenAI: boolean;
}

async function getUserCoachPrefs(userId: string): Promise<UserCoachPrefs> {
  const result = await pool.query(
    "SELECT privacy_mode, enable_openai FROM users WHERE id = $1",
    [userId]
  );
  const row = result.rows[0];
  return { privacyMode: row?.privacy_mode ?? true, enableOpenAI: row?.enable_openai ?? false };
}

async function generateLocalDaily(userId: string): Promise<CoachResponse> {
  const habits = await pool.query("SELECT id, name FROM habits WHERE user_id = $1 AND archived = FALSE", [userId]);
  const checkins = await pool.query(
    "SELECT habit_id, status FROM checkins WHERE user_id = $1 AND date >= CURRENT_DATE - 7",
    [userId]
  );

  const doneCount = checkins.rows.filter((row) => row.status === "done").length;
  const total = checkins.rows.length;
  const rate = total === 0 ? 0 : Math.round((doneCount / total) * 100);

  const message =
    total === 0
      ? "Start your first streak today. One tiny action unlocks momentum."
      : `You're at ${rate}% completion over the last week. Protect your best rituals today.`;

  const prompts = habits.rows.slice(0, 3).map((habit) => `What is the smallest win for ${habit.name} today?`);

  return { message, prompts };
}

async function generateLocalIntervention(userId: string): Promise<CoachResponse> {
  const missed = await pool.query(
    `SELECT h.name, COUNT(*) AS misses
     FROM checkins c
     JOIN habits h ON h.id = c.habit_id
     WHERE c.user_id = $1 AND c.status = 'missed' AND c.date >= CURRENT_DATE - 30
     GROUP BY h.name
     ORDER BY misses DESC
     LIMIT 1`,
    [userId]
  );

  if (missed.rows.length === 0) {
    return { message: "You're steady. Consider adding a stretch goal to level up.", prompts: [] };
  }

  const habit = missed.rows[0].name;
  return {
    message: `Your biggest drop-off is ${habit}. Let's lower the barrier and protect the habit.`,
    prompts: [
      `Schedule ${habit} at your most consistent time of day.`,
      "Pair it with a reliable trigger like morning coffee.",
      "Try a two-minute version on busy days."
    ]
  };
}

async function generateOpenAI(prompt: string): Promise<CoachResponse> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6
    })
  });

  if (!response.ok) {
    throw new Error("OpenAI request failed");
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content ?? "";
  return {
    message: content.split("\n")[0] ?? "Here's your next step.",
    prompts: content.split("\n").slice(1).filter(Boolean)
  };
}

export async function generateDailyCoach(userId: string): Promise<CoachResponse> {
  const prefs = await getUserCoachPrefs(userId);
  const openAiEnabled = process.env.ENABLE_OPENAI === "true" && prefs.enableOpenAI && !prefs.privacyMode;

  if (!openAiEnabled) {
    return generateLocalDaily(userId);
  }

  const prompt = "Provide a compassionate, concise daily plan for habit adherence. Include 3 reflection prompts.";
  try {
    return await generateOpenAI(prompt);
  } catch {
    return generateLocalDaily(userId);
  }
}

export async function generateIntervention(userId: string): Promise<CoachResponse> {
  const prefs = await getUserCoachPrefs(userId);
  const openAiEnabled = process.env.ENABLE_OPENAI === "true" && prefs.enableOpenAI && !prefs.privacyMode;

  if (!openAiEnabled) {
    return generateLocalIntervention(userId);
  }

  const prompt = "Suggest a short intervention plan for a habit drop-off, with empathy and 3 tips.";
  try {
    return await generateOpenAI(prompt);
  } catch {
    return generateLocalIntervention(userId);
  }
}
