import { Router } from "express";
import { z } from "zod";
import { LibraryService } from "../../services/library-service.js";
import { HttpError } from "../middleware/error-handler.js";

export const preferencesRouter = Router();
const library = new LibraryService();

const schema = z.object({
  defaultChildName: z.string().min(1).max(64).optional(),
  defaultChildAge: z.number().int().min(1).max(18).optional(),
});

preferencesRouter.get("/", async (req, res, next) => {
  try {
    const sessionId = req.header("x-session-id");
    if (!sessionId) {
      throw new HttpError(400, "missing_session", "Missing x-session-id header.");
    }
    const prefs = await library.getPreferences(sessionId);
    res.json(prefs);
  } catch (error) {
    next(error);
  }
});

preferencesRouter.post("/", async (req, res, next) => {
  try {
    const sessionId = req.header("x-session-id");
    if (!sessionId) {
      throw new HttpError(400, "missing_session", "Missing x-session-id header.");
    }
    const body = schema.parse(req.body);
    await library.savePreferences(sessionId, body);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
