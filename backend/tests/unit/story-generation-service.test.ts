import assert from "node:assert/strict";
import test from "node:test";
import { ModerationService } from "../../src/services/moderation-service.js";

const moderation = new ModerationService();

test("blocks unsafe prompt terms", () => {
  const result = moderation.checkUserPrompt("I want a story about blood and weapons");
  assert.ok(result);
});

test("accepts gentle theme", () => {
  const result = moderation.checkUserPrompt("friendly forest picnic");
  assert.equal(result, null);
});

test("flags unsafe generated text", () => {
  const result = moderation.checkGeneratedText("The scary terror monster appeared");
  assert.ok(result);
});
