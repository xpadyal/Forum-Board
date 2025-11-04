import { openai } from "../../config.js";
import { AppError } from "./appError.js";

/**
 * Moderate user-generated text using OpenAI's free omni-moderation-latest model.
 * Returns `true` if content is safe, throws AppError otherwise.
 * If OpenAI API key is not configured, moderation is skipped and returns true.
 */
export async function moderateText(content) {
  // Skip moderation if OpenAI is not configured
  if (!openai) {
    console.warn("OpenAI API key not configured. Skipping content moderation.");
    return true;
  }

  try {
    const res = await openai.moderations.create({
      model: "omni-moderation-latest",
      input: content,
    });

    const [result] = res.results;

    if (result.flagged) {
      console.warn(" Comment flagged for moderation:", result.categories);
      throw new AppError("Inappropriate or unsafe content detected", 400);
    }

    return true;
  } catch (error) {
    // If it's already an AppError (from flagged content), re-throw it
    if (error instanceof AppError) {
      throw error;
    }
    
    // Otherwise, it's an API/service error
    console.error("Moderation failed:", error);
    throw new AppError("Moderation service unavailable", 503);
  }
}
