import dotenv from "dotenv";
import { pool } from "./db/pool";
import { createApp } from "./app";

dotenv.config();

const app = createApp();
const port = Number(process.env.PORT ?? 5173);

async function bootstrap() {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS session (
      sid varchar NOT NULL COLLATE "default",
      sess json NOT NULL,
      expire timestamp(6) NOT NULL
    ) WITH (OIDS=FALSE);`
  );

  app.listen(port, () => {
    console.log(`Server running on ${port}`);
  });
}

bootstrap();
