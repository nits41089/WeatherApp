import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createApp } from "../server/app";
import { pool } from "../server/db/pool";

const shouldRun = Boolean(process.env.DATABASE_URL);
const describeFn = shouldRun ? describe : describe.skip;

async function runMigration() {
  const sql = await readFile(path.join(process.cwd(), "server", "db", "migrations", "001_init.sql"), "utf8");
  await pool.query(sql);
  await pool.query(
    `CREATE TABLE IF NOT EXISTS session (
      sid varchar NOT NULL COLLATE "default",
      sess json NOT NULL,
      expire timestamp(6) NOT NULL
    ) WITH (OIDS=FALSE);`
  );
}

describeFn("auth flow", () => {
  beforeAll(async () => {
    await runMigration();
  });

  beforeEach(async () => {
    await pool.query("TRUNCATE checkins, habit_schedules, habits, users RESTART IDENTITY CASCADE");
  });

  it("registers and logs in", async () => {
    const app = createApp();
    const agent = request.agent(app);

    const csrf = await agent.get("/api/csrf");
    const token = csrf.body.csrfToken;

    const register = await agent
      .post("/api/auth/register")
      .set("X-CSRF-Token", token)
      .send({ name: "Test", email: "test@example.com", password: "password123" });

    expect(register.status).toBe(201);

    await agent.post("/api/auth/logout").set("X-CSRF-Token", token).send();

    const login = await agent
      .post("/api/auth/login")
      .set("X-CSRF-Token", token)
      .send({ email: "test@example.com", password: "password123" });

    expect(login.status).toBe(200);
    expect(login.body.user.email).toBe("test@example.com");
  });
});
