import path from "path";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { authRouter } from "./modules/auth/auth.routes";
import { usersRouter } from "./modules/users/users.routes";
import { activitiesRouter } from "./modules/activities/activities.routes";
import { feedRouter } from "./modules/feed/feed.routes";
import { commentsRouter } from "./modules/social/social.routes";
import { iconsRouter } from "./modules/icons/icons.routes";
import { notificationsRouter } from "./modules/notifications/notifications.routes";
import { errorHandler, notFoundHandler } from "./middleware/error";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: "8mb" })); // profile photos are sent as base64 data URLs
  app.use(morgan("dev"));

  app.use("/assets/icons", express.static(path.join(__dirname, "..", "assets", "icons")));

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  app.use("/api/icons", iconsRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/activities", activitiesRouter);
  app.use("/api/feed", feedRouter);
  app.use("/api/comments", commentsRouter);
  app.use("/api/notifications", notificationsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
