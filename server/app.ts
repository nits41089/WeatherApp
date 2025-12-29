import express from "express";
import session from "express-session";
import pg from "pg";
import connectPg from "connect-pg-simple";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import csrf from "csurf";
import path from "node:path";
import authRoutes from "./routes/auth";
import habitRoutes from "./routes/habits";
import checkinRoutes from "./routes/checkins";
import analyticsRoutes from "./routes/analytics";
import coachRoutes from "./routes/coach";
import settingsRoutes from "./routes/settings";
import { pool } from "./db/pool";

export function createApp() {
  const app = express();
  const PgSession = connectPg(session);

  app.use(helmet());
  app.use(morgan("dev"));
  app.use(cookieParser());
  app.use(express.json({ limit: "2mb" }));

  app.use(
    session({
      store: new PgSession({
        pool: pool as unknown as pg.Pool,
        tableName: "session"
      }),
      secret: process.env.SESSION_SECRET ?? "dev_secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 1000 * 60 * 60 * 24 * 7
      }
    })
  );

  const csrfProtection = csrf({ cookie: true });

  app.get("/api/csrf", csrfProtection, (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
  });

  app.use("/api/auth", csrfProtection, authRoutes);
  app.use("/api/habits", csrfProtection, habitRoutes);
  app.use("/api/checkins", csrfProtection, checkinRoutes);
  app.use("/api/analytics", csrfProtection, analyticsRoutes);
  app.use("/api/coach", csrfProtection, coachRoutes);
  app.use("/api/settings", csrfProtection, settingsRoutes);

  const clientDist = path.join(process.cwd(), "client", "dist");
  app.use(express.static(clientDist));
  app.get("*", (req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });

  return app;
}
