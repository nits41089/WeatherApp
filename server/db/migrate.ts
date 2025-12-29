import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pool } from "./pool";

const migrationsDir = path.join(process.cwd(), "server", "db", "migrations");

async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      run_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function getApplied() {
  const result = await pool.query("SELECT name FROM migrations");
  return new Set(result.rows.map((row) => row.name));
}

async function runMigration(name: string, sql: string) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("INSERT INTO migrations (name) VALUES ($1)", [name]);
    await client.query("COMMIT");
    console.log(`Applied ${name}`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function migrate() {
  await ensureMigrationsTable();
  const applied = await getApplied();
  const files = (await readdir(migrationsDir)).filter((file) => file.endsWith(".sql")).sort();

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = await readFile(path.join(migrationsDir, file), "utf8");
    await runMigration(file, sql);
  }
}

migrate()
  .then(() => {
    console.log("Migrations complete");
    pool.end();
  })
  .catch((error) => {
    console.error(error);
    pool.end();
    process.exit(1);
  });
