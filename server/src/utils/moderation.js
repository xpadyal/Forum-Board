import { groq } from "../../config.js";
import { AppError } from "./appError.js";

/**
 * Moderate user-generated text using Groq's llama-guard-4-12b model.
 * Returns `true` if content is safe, throws AppError otherwise.
 * If Groq API key is not configured, moderation is skipped and returns true.
 */
export async function moderateText(content) {
  console.log("🔍 [Moderation] Starting content moderation check...");
  console.log("🔍 [Moderation] Content length:", content.length, "characters");
  
  // Skip moderation if Groq is not configured
  if (!groq) {
    console.warn("⚠️ [Moderation] Groq API key not configured. Skipping content moderation.");
    return true;
  }

  try {
    console.log("🔍 [Moderation] Calling Groq API with llama-guard-4-12b model...");
    
    // Llama Guard 4 is designed for content moderation
    // It analyzes content and returns whether it's safe or unsafe
    const completion = await groq.chat.completions.create({
      model: "meta-llama/llama-guard-4-12b",
      messages: [
        {
          role: "user",
          content: content,
        },
      ],
      temperature: 0,
      max_tokens: 20,
    });

    const response = completion.choices[0]?.message?.content?.trim().toUpperCase();
    console.log("🔍 [Moderation] Model response:", response);

    // Llama Guard returns structured responses indicating safety
    // Check for unsafe indicators in the response
    const unsafeIndicators = ["UNSAFE", "VIOLENCE", "HATE", "HARASSMENT", "SELF-HARM", "SEXUAL", "ILLEGAL"];
    const isUnsafe = unsafeIndicators.some(indicator => response.includes(indicator));

    if (isUnsafe) {
      console.warn("❌ [Moderation] Content flagged as UNSAFE by llama-guard-4-12b");
      console.warn("❌ [Moderation] Response details:", response);
      throw new AppError("Inappropriate or unsafe content detected", 400);
    }

    // If response indicates safe content or is unclear, allow it through (fail-open)
    console.log("✅ [Moderation] Content approved as SAFE");
    return true;
  } catch (error) {
    console.log("🔍 [Moderation] Error occurred during moderation");
    
    // If it's already an AppError (from flagged content), re-throw it to block the content
    if (error instanceof AppError) {
      console.warn("❌ [Moderation] Content blocked due to inappropriate content");
      throw error;
    }

    // Handle rate limit errors - check multiple possible error properties
    const isRateLimit =
      error.status === 429 ||
      error.code === "rate_limit_exceeded" ||
      error.type === "rate_limit_error" ||
      error.message?.includes("rate limit") ||
      error.message?.includes("Too Many Requests") ||
      (error.error?.type === "invalid_request_error" && error.status === 429);

    if (isRateLimit) {
      console.warn("⚠️ [Moderation] Groq rate limit exceeded. Allowing content through without moderation.");
      console.warn("⚠️ [Moderation] Rate limit details:", {
        status: error.status,
        code: error.code,
        type: error.type,
      });
      return true; // Fail-open: allow content when rate limited
    }

    // For other API/service errors (network issues, service down, etc.)
    // Fail-open: allow content through rather than blocking users
    console.warn("⚠️ [Moderation] Moderation service error occurred:");
    console.warn("⚠️ [Moderation] Error details:", {
      message: error.message,
      type: error.type,
      status: error.status,
      code: error.code,
    });
    console.warn("⚠️ [Moderation] Allowing content through due to moderation service unavailability.");
    return true; // Allow content through when moderation service is down
  }
}
