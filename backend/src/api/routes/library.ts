import { Router } from "express";
import { LibraryService } from "../../services/library-service.js";
import { HttpError } from "../middleware/error-handler.js";

export const libraryRouter = Router();
const library = new LibraryService();

libraryRouter.post("/:storyId/save", async (req, res, next) => {
  try {
    const sessionId = req.header("x-session-id");
    if (!sessionId) {
      throw new HttpError(400, "missing_session", "Missing x-session-id header.");
    }
    const output = await library.saveStory(sessionId, req.params.storyId);
    res.status(201).json({ message: "Story saved", ...output });
  } catch (error) {
    next(error);
  }
});

libraryRouter.get("/", async (req, res, next) => {
  try {
    const sessionId = req.header("x-session-id");
    if (!sessionId) {
      throw new HttpError(400, "missing_session", "Missing x-session-id header.");
    }
    const output = await library.list(sessionId);
    res.json(output);
  } catch (error) {
    next(error);
  }
});

libraryRouter.get("/:libraryEntryId/resume", async (req, res, next) => {
  try {
    const sessionId = req.header("x-session-id");
    if (!sessionId) {
      throw new HttpError(400, "missing_session", "Missing x-session-id header.");
    }
    const output = await library.resume(sessionId, req.params.libraryEntryId);
    res.json(output);
  } catch (error) {
    next(error);
  }
});
