import { Router } from "express";
import { z } from "zod";
import { StoryGenerationService } from "../../services/story-generation-service.js";
import { StoryInteractionService } from "../../services/story-interaction-service.js";
import { HttpError } from "../middleware/error-handler.js";
import PDFDocument from "pdfkit";
import { prisma } from "../../db/prisma.js";
import { parseStoryContent } from "../../models/story-content-codec.js";

export const storiesRouter = Router();

const generateSchema = z.object({
  childName: z.string().min(1),
  childAge: z.number().int().min(1).max(18),
  theme: z.string().min(2),
  mood: z.string().optional(),
  regenerate: z.boolean().optional(),
  interactive: z.boolean().optional(),
});

const interactSchema = z.object({
  choiceId: z.string().uuid(),
});

const generation = new StoryGenerationService();
const interaction = new StoryInteractionService();

storiesRouter.post("/generate", async (req, res, next) => {
  try {
    const sessionId = req.header("x-session-id");
    if (!sessionId) {
      throw new HttpError(400, "missing_session", "Missing x-session-id header.");
    }
    const body = generateSchema.parse(req.body);
    const output = await generation.generate({
      sessionId,
      childName: body.childName,
      childAge: body.childAge,
      theme: body.theme,
      mood: body.mood,
      regenerate: body.regenerate,
      interactive: body.interactive,
    });
    res.status(201).json(output);
  } catch (error) {
    next(error);
  }
});

storiesRouter.post("/:storyId/interact", async (req, res, next) => {
  try {
    const body = interactSchema.parse(req.body);
    const output = await interaction.advance(req.params.storyId, body.choiceId);
    res.json(output);
  } catch (error) {
    next(error);
  }
});

storiesRouter.get("/:storyId/export", async (req, res, next) => {
  try {
    const format = z.enum(["pdf", "text", "images_only"]).parse(req.query.format);
    const story = await prisma.story.findUnique({
      where: { id: req.params.storyId },
      include: { illustrations: { orderBy: { sceneIndex: "asc" } } },
    });
    if (!story) {
      throw new HttpError(404, "story_not_found", "Story not found.");
    }

    const scenes = parseStoryContent(story.storyContent);
    if (format === "text") {
      const text = scenes.map((scene, idx) => `Scene ${String(idx + 1)}\n${scene.text}`).join("\n\n");
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${sanitize(story.title)}.txt"`);
      res.send(text);
      return;
    }

    if (format === "images_only") {
      res.json({
        title: story.title,
        images: story.illustrations.map((illustration) => ({
          sceneIndex: illustration.sceneIndex,
          imageUrl: illustration.imageUrl,
        })),
      });
      return;
    }

    const doc = new PDFDocument({ margin: 36 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${sanitize(story.title)}.pdf"`);
    doc.pipe(res);
    doc.fontSize(20).text(story.title, { underline: true });
    doc.moveDown();
    scenes.forEach((scene, index) => {
      doc.fontSize(14).text(`Scene ${String(index + 1)}`);
      doc.fontSize(11).text(scene.text);
      const found = story.illustrations.find((it) => it.id === scene.illustrationId);
      if (found) {
        doc.fontSize(10).fillColor("blue").text(found.imageUrl, { link: found.imageUrl, underline: true });
        doc.fillColor("black");
      }
      doc.moveDown();
    });
    doc.end();
  } catch (error) {
    next(error);
  }
});

function sanitize(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "story";
}
