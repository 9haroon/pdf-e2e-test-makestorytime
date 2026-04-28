import { Router } from "express";
import { storiesRouter } from "./stories.js";
import { libraryRouter } from "./library.js";
import { preferencesRouter } from "./preferences.js";

export function createApiRouter(): Router {
  const router = Router();
  router.get("/health", (_req, res) => {
    res.json({ ok: true });
  });
  router.use("/stories", storiesRouter);
  router.use("/library", libraryRouter);
  router.use("/preferences", preferencesRouter);
  return router;
}
