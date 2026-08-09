import { Router } from "express";
import { listIcons } from "../../lib/icons";

export const iconsRouter = Router();

/** Manifest of every custom SVG icon the API exposes, in place of emoji. */
iconsRouter.get("/", (_req, res) => {
  res.json({ icons: listIcons() });
});
