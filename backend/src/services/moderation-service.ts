/**
 * Lightweight child-safety pre-checks for prompts and generated text snippets.
 * Replace or extend with a vendor API when product policy is finalized (FR-005).
 */

const BLOCKED = [
  "kill",
  "death",
  "blood",
  "terror",
  "weapon",
  "suicide",
  "porn",
  "sex",
];

function containsBlockedTerm(text: string): boolean {
  const lower = text.toLowerCase();
  return BLOCKED.some((term) => lower.includes(term));
}

export class ModerationService {
  /** Returns a user-safe reason code if content should be blocked */
  checkUserPrompt(input: string): string | null {
    if (input.trim().length < 2) {
      return "Please add a bit more detail for the story.";
    }
    if (containsBlockedTerm(input)) {
      return "That topic is not suitable for children. Please choose a gentle, positive theme.";
    }
    return null;
  }

  /** Check model output; return null when acceptable */
  checkGeneratedText(text: string): string | null {
    if (containsBlockedTerm(text)) {
      return "Generated text was filtered for child safety.";
    }
    return null;
  }
}
